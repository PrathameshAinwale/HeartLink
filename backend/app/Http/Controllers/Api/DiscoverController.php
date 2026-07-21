<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Swipe;
use App\Models\UserMatch;
use Illuminate\Http\Request;

class DiscoverController extends Controller
{
    public function feed(Request $request)
    {
        $user = $request->user();

        // 1. Exclude ALL profiles that the CURRENT USER actively swiped on (whether like, pass, or super_like)
        // so that once you swipe on a profile, they never appear again in Discover feed!
        $swipedByMeIds = Swipe::where('swiper_id', $user->id)
            ->pluck('swiped_user_id');

        // 2. Exclude users already matched with
        $matchedIds = \App\Models\UserMatch::where('user_1_id', $user->id)
            ->orWhere('user_2_id', $user->id)
            ->get()
            ->flatMap(fn($m) => [$m->user_1_id, $m->user_2_id])
            ->filter(fn($id) => $id !== $user->id)
            ->unique();

        // 3. Exclude ONLY explicitly blocked users (from UserBlock table)
        $blockedIds = \App\Models\UserBlock::where('blocker_id', $user->id)
            ->pluck('blocked_user_id');

        $excludeIds = $swipedByMeIds->merge($matchedIds)->merge($blockedIds)->unique();

        $query = User::where('id', '!=', $user->id)
            ->whereNotIn('id', $excludeIds);

        // Enforce strict opposite gender filtering:
        // Male/Man -> Female/Woman only
        // Female/Woman -> Male/Man only
        $userGender = strtolower($user->gender ?? 'male');
        if (in_array($userGender, ['male', 'man'])) {
            $query->whereIn(\Illuminate\Support\Facades\DB::raw('LOWER(gender)'), ['female', 'woman']);
        } elseif (in_array($userGender, ['female', 'woman'])) {
            $query->whereIn(\Illuminate\Support\Facades\DB::raw('LOWER(gender)'), ['male', 'man']);
        }

        $profiles = $query->with('photos')->orderBy('id', 'desc')->get();

        return response()->json([
            'profiles' => $profiles,
        ]);
    }

    public function swipe(Request $request)
    {
        $request->validate([
            'swiped_user_id' => 'required|exists:users,id',
            'type'           => 'required|in:like,pass,super_like',
        ]);

        $swiperId = $request->user()->id;
        $targetId = $request->input('swiped_user_id');
        $type     = $request->input('type');

        // Record or update swipe
        $swipe = Swipe::updateOrCreate(
            ['swiper_id' => $swiperId, 'swiped_user_id' => $targetId],
            ['type' => $type]
        );

        $isMatch = false;
        $matchRecord = null;

        // Check if mutual like or super_like exists
        if (in_array($type, ['like', 'super_like'])) {
            $reciprocalSwipe = Swipe::where('swiper_id', $targetId)
                ->where('swiped_user_id', $swiperId)
                ->whereIn('type', ['like', 'super_like'])
                ->first();

            if ($reciprocalSwipe) {
                $isMatch = true;

                // Create match record if not existing
                $matchRecord = UserMatch::firstOrCreate([
                    'user_1_id' => min($swiperId, $targetId),
                    'user_2_id' => max($swiperId, $targetId),
                ], [
                    'matched_at' => now(),
                ]);
            }
        }

        return response()->json([
            'message'   => 'Swipe recorded',
            'is_match'  => $isMatch,
            'match'     => $matchRecord,
        ]);
    }
}
