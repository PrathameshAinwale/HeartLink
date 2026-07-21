<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\UserReport;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class ChatController extends Controller
{
    public function getMessages(Request $request, $otherUserId)
    {
        $authId = $request->user()->id;

        $isBlockedByMe = UserBlock::where('blocker_id', $authId)
            ->where('blocked_user_id', $otherUserId)
            ->exists();

        $isBlockedByOther = UserBlock::where('blocker_id', $otherUserId)
            ->where('blocked_user_id', $authId)
            ->exists();

        if ($isBlockedByOther) {
            return response()->json([
                'message'             => 'User is blocked',
                'messages'            => [],
                'is_blocked_by_me'    => false,
                'is_blocked_by_other' => true,
            ], 403);
        }

        $messages = Message::where(function ($query) use ($authId, $otherUserId) {
            $query->where('sender_id', $authId)->where('receiver_id', $otherUserId);
        })->orWhere(function ($query) use ($authId, $otherUserId) {
            $query->where('sender_id', $otherUserId)->where('receiver_id', $authId);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        // Mark incoming messages as read
        Message::where('sender_id', $otherUserId)
            ->where('receiver_id', $authId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'messages'         => $messages,
            'is_blocked_by_me' => $isBlockedByMe,
        ]);
    }

    public function conversations(Request $request)
    {
        $authId = $request->user()->id;

        $matches = \App\Models\UserMatch::where('user_1_id', $authId)
            ->orWhere('user_2_id', $authId)
            ->with(['user1.photos', 'user2.photos'])
            ->get();

        $conversations = $matches->map(function ($match) use ($authId) {
            $otherUser = $match->user_1_id === $authId ? $match->user2 : $match->user1;

            if (!$otherUser) return null;

            $lastMsg = Message::where(function ($q) use ($authId, $otherUser) {
                $q->where('sender_id', $authId)->where('receiver_id', $otherUser->id);
            })->orWhere(function ($q) use ($authId, $otherUser) {
                $q->where('sender_id', $otherUser->id)->where('receiver_id', $authId);
            })
            ->orderBy('created_at', 'desc')
            ->first();

            $unreadCount = Message::where('sender_id', $otherUser->id)
                ->where('receiver_id', $authId)
                ->where('is_read', false)
                ->count();

            $isMe = $lastMsg ? ($lastMsg->sender_id === $authId) : false;
            $msgText = $lastMsg ? ($isMe ? 'You: ' . $lastMsg->message : $lastMsg->message) : 'Matched! Start chatting now.';

            return [
                'id'             => $otherUser->id,
                'match_id'       => $match->id,
                'name'           => $otherUser->name,
                'avatar'         => $otherUser->avatar ?: ($otherUser->photos->first()->photo_url ?? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'),
                'online'         => (bool) $otherUser->is_online,
                'last_msg'       => $msgText,
                'last_time'      => $lastMsg ? $lastMsg->created_at->diffForHumans() : 'Just now',
                'last_timestamp' => $lastMsg ? $lastMsg->created_at->timestamp : ($match->created_at ? $match->created_at->timestamp : 0),
                'last_sender_id' => $lastMsg ? $lastMsg->sender_id : null,
                'is_me'          => $isMe,
                'unread_count'   => $unreadCount,
                'user'           => $otherUser,
            ];
        })->filter()->sortByDesc('last_timestamp')->values();

        return response()->json([
            'conversations' => $conversations,
        ]);
    }

    public function sendMessage(Request $request)
    {
        $validated = $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message'     => 'required|string',
        ]);

        $senderId = $request->user()->id;

        $message = Message::create([
            'sender_id'   => $senderId,
            'receiver_id' => $validated['receiver_id'],
            'message'     => $validated['message'],
        ]);

        return response()->json([
            'message' => 'Message sent successfully',
            'data'    => $message,
        ], 201);
    }

    public function blockUser(Request $request)
    {
        $validated = $request->validate([
            'blocked_user_id' => 'required|exists:users,id',
        ]);

        $blockerId = $request->user()->id;

        $block = UserBlock::firstOrCreate([
            'blocker_id'      => $blockerId,
            'blocked_user_id' => $validated['blocked_user_id'],
        ]);

        return response()->json([
            'message' => 'User blocked successfully',
            'block'   => $block,
        ]);
    }

    public function unblockUser(Request $request)
    {
        $validated = $request->validate([
            'blocked_user_id' => 'required|exists:users,id',
        ]);

        $blockerId = $request->user()->id;

        UserBlock::where('blocker_id', $blockerId)
            ->where('blocked_user_id', $validated['blocked_user_id'])
            ->delete();

        return response()->json([
            'message' => 'User unblocked successfully',
        ]);
    }

    public function reportUser(Request $request)
    {
        $validated = $request->validate([
            'reported_user_id' => 'required|exists:users,id',
            'reason'           => 'required|string|max:255',
        ]);

        $reporterId = $request->user()->id;

        $report = UserReport::create([
            'reporter_id'      => $reporterId,
            'reported_user_id' => $validated['reported_user_id'],
            'reason'           => $validated['reason'],
        ]);

        return response()->json([
            'message' => 'Report submitted successfully. Thank you!',
            'report'  => $report,
        ]);
    }
}
