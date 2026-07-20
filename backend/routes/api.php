<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DiscoverController;
use App\Http\Controllers\Api\MatchController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\DatePlannerController;
use App\Http\Controllers\Api\SubscriptionController;
use App\Http\Controllers\Api\RequestController;

// API v1 Routes
Route::prefix('v1')->group(function () {
    // Public Auth Routes
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login',    [AuthController::class, 'login']);

    // Protected API Routes (Sanctum Auth)
    Route::middleware('auth:sanctum')->group(function () {
        // Auth & Profile
        Route::get('/user/profile',    [AuthController::class, 'profile']);
        Route::post('/user/profile',   [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout',    [AuthController::class, 'logout']);

        // Discovery & Swiping
        Route::get('/discover',        [DiscoverController::class, 'feed']);
        Route::post('/discover/swipe', [DiscoverController::class, 'swipe']);

        // Matches & Requests
        Route::get('/matches',                         [MatchController::class, 'index']);
        Route::get('/requests',                        [MatchController::class, 'requests']);
        Route::post('/requests/{userId}/accept',       [RequestController::class, 'accept']);
        Route::post('/requests/{userId}/decline',      [RequestController::class, 'decline']);

        // Notifications
        Route::get('/notifications',                   [RequestController::class, 'notifications']);
        Route::post('/notifications/mark-read',        [RequestController::class, 'markRead']);


        // Messaging & Safety
        Route::get('/chats',               [ChatController::class, 'conversations']);
        Route::get('/chats/{otherUserId}', [ChatController::class, 'getMessages']);
        Route::post('/chats/send',         [ChatController::class, 'sendMessage']);
        Route::post('/users/block',        [ChatController::class, 'blockUser']);
        Route::post('/users/unblock',      [ChatController::class, 'unblockUser']);
        Route::post('/users/report',       [ChatController::class, 'reportUser']);

        // Date Planner
        Route::get('/restaurants',         [DatePlannerController::class, 'getRestaurants']);
        Route::post('/date-bookings',      [DatePlannerController::class, 'createProposal']);

        // Subscriptions
        Route::post('/subscriptions/subscribe', [SubscriptionController::class, 'subscribe']);
    });
});
