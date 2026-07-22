<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserMatch;
use App\Models\Swipe;
use App\Models\User;
use App\Models\UserBlock;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $blockedIds = UserBlock::where('blocker_id', $userId)
            ->pluck('blocked_user_id')
            ->merge(UserBlock::where('blocked_user_id', $userId)->pluck('blocker_id'))
            ->unique();

        $matches = UserMatch::where(function ($q) use ($userId) {
                $q->where('user_1_id', $userId)->orWhere('user_2_id', $userId);
            })
            ->whereNotIn('user_1_id', $blockedIds)
            ->whereNotIn('user_2_id', $blockedIds)
            ->with(['user1.photos', 'user2.photos'])
            ->get()
            ->map(function ($match) use ($userId) {
                $otherUser = $match->user_1_id === $userId ? $match->user2 : $match->user1;
                if (!$otherUser) return null;
                return [
                    'id'          => $match->id,
                    'matched_at'  => $match->matched_at,
                    'user'        => $otherUser,
                ];
            })
            ->filter()
            ->values();

        return response()->json([
            'matches' => $matches,
        ]);
    }

    public function unmatch(Request $request)
    {
        $validated = $request->validate([
            'matched_user_id' => 'required|exists:users,id',
        ]);

        $userId = $request->user()->id;
        $otherId = (int) $validated['matched_user_id'];

        UserMatch::where(function ($q) use ($userId, $otherId) {
            $q->where('user_1_id', $userId)->where('user_2_id', $otherId);
        })->orWhere(function ($q) use ($userId, $otherId) {
            $q->where('user_1_id', $otherId)->where('user_2_id', $userId);
        })->delete();

        return response()->json([
            'message' => 'Unmatched successfully',
        ]);
    }

    public function requests(Request $request)
    {
        $userId = $request->user()->id;

        $blockedIds = UserBlock::where('blocker_id', $userId)
            ->pluck('blocked_user_id')
            ->merge(UserBlock::where('blocked_user_id', $userId)->pluck('blocker_id'))
            ->unique();

        // Admirers who liked the user but:
        //  1. Haven't been swiped back yet
        //  2. Haven't been explicitly declined (is_declined_by_receiver = false)
        //  3. Are not blocked
        $admirerIds = Swipe::where('swiped_user_id', $userId)
            ->whereIn('type', ['like', 'super_like'])
            ->where('is_declined_by_receiver', false)
            ->whereNotIn('swiper_id', $blockedIds)
            ->whereNotIn('swiper_id', function ($query) use ($userId) {
                $query->select('swiped_user_id')
                    ->from('swipes')
                    ->where('swiper_id', $userId);
            })
            ->pluck('swiper_id');

        $requests = User::whereIn('id', $admirerIds)
            ->with('photos')
            ->get();

        return response()->json([
            'requests' => $requests,
        ]);
    }
}
