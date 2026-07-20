<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserSubscription;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function subscribe(Request $request)
    {
        $validated = $request->validate([
            'plan_name' => 'required|string',
            'duration'  => 'required|string',
            'price'     => 'required|string',
        ]);

        $userId = $request->user()->id;

        // Cancel previous active subscriptions
        UserSubscription::where('user_id', $userId)
            ->where('status', 'active')
            ->update(['status' => 'cancelled']);

        $subscription = UserSubscription::create([
            'user_id'    => $userId,
            'plan_name'  => $validated['plan_name'],
            'duration'   => $validated['duration'],
            'price'      => $validated['price'],
            'starts_at'  => now(),
            'expires_at' => now()->addMonth(),
            'status'     => 'active',
        ]);

        return response()->json([
            'message'      => 'Subscription activated successfully! 🎉',
            'subscription' => $subscription,
        ], 201);
    }
}
