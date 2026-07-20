<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Swipe;
use App\Models\UserMatch;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;

class RequestController extends Controller
{
    /**
     * Accept an incoming like request.
     * - Creates a mutual like (swipe) from current user → requester
     * - Creates or finds the match record
     * - Notifies the requester that their like was accepted
     */
    public function accept(Request $request, $fromUserId)
    {
        $currentUser = $request->user();
        $currentId   = $currentUser->id;

        // Verify the incoming like actually exists
        $incomingSwipe = Swipe::where('swiper_id', $fromUserId)
            ->where('swiped_user_id', $currentId)
            ->whereIn('type', ['like', 'super_like'])
            ->first();

        if (!$incomingSwipe) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        // Create/update reciprocal like swipe
        Swipe::updateOrCreate(
            ['swiper_id' => $currentId, 'swiped_user_id' => $fromUserId],
            ['type' => 'like', 'is_declined_by_receiver' => false]
        );

        // Create match record
        $match = UserMatch::firstOrCreate([
            'user_1_id' => min($currentId, $fromUserId),
            'user_2_id' => max($currentId, $fromUserId),
        ], [
            'matched_at' => now(),
        ]);

        // Notify the requester: "your request was accepted!"
        Notification::create([
            'user_id'      => $fromUserId,
            'from_user_id' => $currentId,
            'type'         => 'request_accepted',
            'message'      => "{$currentUser->name} accepted your like! You're now matched.",
            'is_read'      => false,
        ]);

        return response()->json([
            'message'  => 'Request accepted',
            'is_match' => true,
            'match_id' => $match->id,
        ]);
    }

    /**
     * Decline an incoming like request.
     * - Marks the swipe as declined (does NOT create a new pass-swipe so
     *   the decliner can still potentially see the requester on Discover later)
     * - Notifies the requester that their like was declined
     */
    public function decline(Request $request, $fromUserId)
    {
        $currentUser = $request->user();
        $currentId   = $currentUser->id;

        // Mark the existing swipe as declined by receiver
        $updated = Swipe::where('swiper_id', $fromUserId)
            ->where('swiped_user_id', $currentId)
            ->whereIn('type', ['like', 'super_like'])
            ->update(['is_declined_by_receiver' => true]);

        if (!$updated) {
            return response()->json(['message' => 'Request not found'], 404);
        }

        // Notify the requester: "your request was declined"
        Notification::create([
            'user_id'      => $fromUserId,
            'from_user_id' => $currentId,
            'type'         => 'request_declined',
            'message'      => "{$currentUser->name} passed on your request.",
            'is_read'      => false,
        ]);

        return response()->json(['message' => 'Request declined']);
    }

    /**
     * Get all notifications for the current user.
     */
    public function notifications(Request $request)
    {
        $userId = $request->user()->id;

        $notifications = Notification::where('user_id', $userId)
            ->with(['fromUser:id,name,avatar'])
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(function ($n) {
                return [
                    'id'           => $n->id,
                    'type'         => $n->type,
                    'message'      => $n->message,
                    'is_read'      => $n->is_read,
                    'created_at'   => $n->created_at,
                    'from_user'    => $n->fromUser ? [
                        'id'     => $n->fromUser->id,
                        'name'   => $n->fromUser->name,
                        'avatar' => $n->fromUser->avatar,
                    ] : null,
                ];
            });

        $unreadCount = Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markRead(Request $request)
    {
        $userId = $request->user()->id;

        Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
