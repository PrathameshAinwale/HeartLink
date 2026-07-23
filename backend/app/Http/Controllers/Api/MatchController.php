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

        $matchedIds = UserMatch::where('user_1_id', $userId)
            ->orWhere('user_2_id', $userId)
            ->get()
            ->flatMap(fn($m) => [$m->user_1_id, $m->user_2_id])
            ->filter(fn($id) => $id !== $userId)
            ->toArray();

        $swipes = Swipe::where('swiped_user_id', $userId)
            ->whereIn('type', ['like', 'super_like'])
            ->whereNotIn('swiper_id', $blockedIds)
            ->orderBy('id', 'desc')
            ->get()
            ->unique('swiper_id')
            ->keyBy('swiper_id');

        $requests = User::whereIn('id', $swipes->keys())
            ->with('photos')
            ->get()
            ->map(function ($u) use ($swipes, $matchedIds) {
                $swipe = $swipes->get($u->id);
                $isMatched = in_array($u->id, $matchedIds);
                $isDeclined = $swipe ? (bool) $swipe->is_declined_by_receiver : false;

                $status = 'pending';
                if ($isMatched) {
                    $status = 'accepted';
                } elseif ($isDeclined) {
                    $status = 'declined';
                }

                $u->request_status = $status;
                $u->is_boosted = ($swipe && $swipe->type === 'super_like') || (bool) ($u->is_boosted ?? false);
                $u->swipe_type = $swipe ? $swipe->type : 'like';
                $u->date_sent = $swipe ? $swipe->created_at->format('M d, Y') : now()->format('M d, Y');
                $u->timestamp = $swipe ? $swipe->created_at->timestamp : time();
                return $u;
            })
            ->sort(function ($a, $b) {
                if ($a->is_boosted !== $b->is_boosted) {
                    return $b->is_boosted ? 1 : -1;
                }
                $score = ['pending' => 3, 'accepted' => 2, 'declined' => 1];
                $scoreA = $score[$a->request_status] ?? 0;
                $scoreB = $score[$b->request_status] ?? 0;
                if ($scoreA !== $scoreB) {
                    return $scoreB - $scoreA;
                }
                return $b->timestamp - $a->timestamp;
            })
            ->values();

        return response()->json([
            'requests' => $requests,
        ]);
    }
}
