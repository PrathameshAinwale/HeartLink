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

        // Apply user preference filters from user_settings table
        $userSettings = \App\Models\UserSettings::where('user_id', $user->id)->first();

        if ($userSettings) {
            // Target Age Range Filter
            if ($userSettings->age_range_filter && $userSettings->age_range_filter !== 'Any') {
                $range = explode('-', str_replace(' ', '', $userSettings->age_range_filter));
                if (count($range) === 2) {
                    $query->whereBetween('age', [(int)$range[0], (int)$range[1]]);
                }
            }

            // Must Have Profile Bio Filter
            if ($userSettings->has_bio_only) {
                $query->whereNotNull('bio')->where('bio', '!=', '');
            }

            // Education Filter
            if ($userSettings->education_filter && $userSettings->education_filter !== 'Any') {
                $query->where('education', $userSettings->education_filter);
            }

            // Religion Filter
            if ($userSettings->religion_filter && $userSettings->religion_filter !== 'Any') {
                $query->where('religion', $userSettings->religion_filter);
            }

            // Language Filter
            if ($userSettings->language_filter && $userSettings->language_filter !== 'Any') {
                $lang = $userSettings->language_filter;
                $query->where(function ($q) use ($lang) {
                    $q->where('mother_tongue', 'LIKE', "%{$lang}%")
                      ->orWhere('languages_spoken', 'LIKE', "%{$lang}%");
                });
            }
        }

        $userLat = $user->latitude ?? 19.0760;
        $userLng = $user->longitude ?? 72.8777;

        $profiles = $query->with(['photos', 'settings'])->orderBy('id', 'desc')->get()->map(function ($p, $index) use ($userLat, $userLng) {
            $pLat = $p->latitude;
            $pLng = $p->longitude;

            if (empty($pLat) || empty($pLng)) {
                // Realistic nearby offsets around user location for demo profiles (1 to 15 km away)
                $offsetLat = (($index * 7 + 3) % 11 - 5) * 0.015;
                $offsetLng = (($index * 13 + 5) % 13 - 6) * 0.015;
                $pLat = $userLat + $offsetLat;
                $pLng = $userLng + $offsetLng;
            }

            $dist = $this->calculateDistanceInKm($userLat, $userLng, $pLat, $pLng);
            $distKm = max(1, (int)round($dist ?? (($index * 3 + 2) % 12 + 1)));
            $p->distance_km = $distKm;
            $p->distance = "{$distKm} km away";
            return $p;
        });

        return response()->json([
            'profiles' => $profiles,
        ]);
    }

    private function calculateDistanceInKm($lat1, $lon1, $lat2, $lon2)
    {
        if (empty($lat1) || empty($lon1) || empty($lat2) || empty($lon2)) {
            return null;
        }

        $earthRadius = 6371; // km
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return round($earthRadius * $c, 1);
    }

    public function reset(Request $request)
    {
        $user = $request->user();
        Swipe::where('swiper_id', $user->id)->where('type', 'pass')->delete();

        return response()->json([
            'message' => 'Pass swipes reset successfully',
        ]);
    }

    public function swipe(Request $request)
    {
        $request->validate([
            'swiped_user_id' => 'required|exists:users,id',
            'type'           => 'required|in:like,pass,super_like',
        ]);

        $swiperId = $request->user()->id;
        $targetId = (int) $request->input('swiped_user_id');
        $type     = $request->input('type');

        // Check if either user is blocked
        $isBlocked = \App\Models\UserBlock::where(function ($q) use ($swiperId, $targetId) {
            $q->where('blocker_id', $swiperId)->where('blocked_user_id', $targetId);
        })->orWhere(function ($q) use ($swiperId, $targetId) {
            $q->where('blocker_id', $targetId)->where('blocked_user_id', $swiperId);
        })->exists();

        if ($isBlocked) {
            return response()->json([
                'message' => 'Cannot interact with blocked user.',
            ], 403);
        }

        // Record or update swipe
        $swipe = Swipe::updateOrCreate(
            ['swiper_id' => $swiperId, 'swiped_user_id' => $targetId],
            ['type' => $type, 'is_declined_by_receiver' => false]
        );

        $isMatch = false;
        $matchRecord = null;

        // Check if mutual like or super_like exists and send notification
        if (in_array($type, ['like', 'super_like'])) {
            $userObj = $request->user();
            \App\Models\Notification::firstOrCreate([
                'user_id'      => $targetId,
                'from_user_id' => $swiperId,
                'type'         => 'like',
            ], [
                'message'      => "{$userObj->name} liked your profile!",
                'is_read'      => false,
            ]);

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
