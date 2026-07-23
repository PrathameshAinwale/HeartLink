<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Restaurant;
use App\Models\DateBooking;
use Illuminate\Http\Request;

class DatePlannerController extends Controller
{
    public function getRestaurants()
    {
        $restaurants = Restaurant::all();

        return response()->json([
            'restaurants' => $restaurants,
        ]);
    }

    public function createProposal(Request $request)
    {
        $validated = $request->validate([
            'partner_id'    => 'required|exists:users,id',
            'restaurant_id' => 'required|exists:restaurants,id',
            'booking_date'  => 'required|date',
            'booking_time'  => 'required|string',
        ]);

        $proposerId = $request->user()->id;

        $booking = DateBooking::create([
            'proposer_id'   => $proposerId,
            'partner_id'    => $validated['partner_id'],
            'restaurant_id' => $validated['restaurant_id'],
            'booking_date'  => $validated['booking_date'],
            'booking_time'  => $validated['booking_time'],
            'status'        => 'pending',
        ]);

        return response()->json([
            'message' => 'Date proposal sent successfully! 🥂',
            'booking' => $booking->load('restaurant', 'partner'),
        ], 201);
    }

    public function respondProposal(Request $request)
    {
        $validated = $request->validate([
            'booking_id' => 'required|exists:date_bookings,id',
            'status'     => 'required|in:accepted,rejected,declined',
        ]);

        $userId = $request->user()->id;
        $booking = DateBooking::where('id', $validated['booking_id'])
            ->where('partner_id', $userId)
            ->first();

        if (!$booking) {
            return response()->json(['message' => 'Date proposal not found or access denied.'], 404);
        }

        $newStatus = in_array($validated['status'], ['rejected', 'declined']) ? 'declined' : 'accepted';
        $booking->update(['status' => $newStatus]);

        return response()->json([
            'message' => "Date proposal {$newStatus} successfully! 🥂",
            'booking' => $booking->load('restaurant', 'proposer', 'partner'),
        ]);
    }
}
