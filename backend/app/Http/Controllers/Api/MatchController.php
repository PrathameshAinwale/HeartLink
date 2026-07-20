<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserMatch;
use App\Models\Swipe;
use App\Models\User;
use Illuminate\Http\Request;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $userId = $request->user()->id;

        $matches = UserMatch::where('user_1_id', $userId)
            ->orWhere('user_2_id', $userId)
            ->with(['user1.photos', 'user2.photos'])
            ->get()
            ->map(function ($match) use ($userId) {
                $otherUser = $match->user_1_id === $userId ? $match->user2 : $match->user1;
                return [
                    'id'          => $match->id,
                    'matched_at'  => $match->matched_at,
                    'user'        => $otherUser,
                ];
            });

        return response()->json([
            'matches' => $matches,
        ]);
    }

    public function requests(Request $request)
    {
        $userId = $request->user()->id;

        // Admirers who liked the user but:
        //  1. Haven't been swiped back yet
        //  2. Haven't been explicitly declined (is_declined_by_receiver = false)
        $admirerIds = Swipe::where('swiped_user_id', $userId)
            ->whereIn('type', ['like', 'super_like'])
            ->where('is_declined_by_receiver', false)
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
