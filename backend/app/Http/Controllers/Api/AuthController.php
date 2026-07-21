<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ProfilePhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'email'             => 'required|string|email|max:255|unique:users',
            'password'          => 'required|string|min:6',
            'age'               => 'nullable|integer',
            'dob'               => 'nullable|date',
            'gender'            => 'nullable|string',
            'bio'               => 'nullable|string',
            'job'               => 'nullable|string',
            'avatar'            => 'nullable|string',
            'city'              => 'nullable|string',
            'state'             => 'nullable|string',
            'country'           => 'nullable|string',
            'relationship_type' => 'nullable|string',
            'interests'         => 'nullable|array',
            'photos'            => 'nullable|array',
        ]);

        $user = User::create([
            'name'              => $validated['name'],
            'email'             => $validated['email'],
            'password'          => Hash::make($validated['password']),
            'age'               => $validated['age'] ?? null,
            'dob'               => $validated['dob'] ?? null,
            'gender'            => $validated['gender'] ?? null,
            'bio'               => $validated['bio'] ?? null,
            'job'               => $validated['job'] ?? null,
            'avatar'            => $validated['avatar'] ?? null,
            'city'              => $validated['city'] ?? null,
            'state'             => $validated['state'] ?? null,
            'country'           => $validated['country'] ?? null,
            'relationship_type' => $validated['relationship_type'] ?? null,
            'interests'         => $validated['interests'] ?? [],
        ]);

        if (!empty($validated['photos'])) {
            foreach ($validated['photos'] as $idx => $photoUrl) {
                ProfilePhoto::create([
                    'user_id'    => $user->id,
                    'photo_url'  => $photoUrl,
                    'is_primary' => $idx === 0,
                    'sort_order' => $idx,
                ]);
            }
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'User registered successfully',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('photos'),
        ], 201);
    }

    public function login(Request $request)
    {
        $validated = $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid login credentials.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'      => 'Login successful',
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user->load('photos', 'activeSubscription'),
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'user' => $request->user()->load('photos', 'activeSubscription'),
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name'              => 'sometimes|string|max:255',
            'bio'               => 'sometimes|nullable|string',
            'job'               => 'sometimes|nullable|string',
            'avatar'            => 'sometimes|nullable|string',
            'city'              => 'sometimes|nullable|string',
            'state'             => 'sometimes|nullable|string',
            'country'           => 'sometimes|nullable|string',
            'relationship_type' => 'sometimes|nullable|string',
            'age_min'           => 'sometimes|integer',
            'age_max'           => 'sometimes|integer',
            'interests'         => 'sometimes|nullable|array',
            'photos'            => 'sometimes|nullable|array',
        ]);

        $user->update($validated);

        if ($request->has('avatar') && !empty($request->avatar)) {
            $photoExists = ProfilePhoto::where('user_id', $user->id)
                ->where('photo_url', $request->avatar)
                ->exists();

            if (!$photoExists) {
                // Set existing primary photos to false
                ProfilePhoto::where('user_id', $user->id)->update(['is_primary' => false]);
                ProfilePhoto::create([
                    'user_id'    => $user->id,
                    'photo_url'  => $request->avatar,
                    'is_primary' => true,
                    'sort_order' => 0,
                ]);
            }
        }

        if ($request->has('photos') && is_array($request->photos) && count($request->photos) > 0) {
            ProfilePhoto::where('user_id', $user->id)->delete();
            foreach ($request->photos as $idx => $photoUrl) {
                if (!empty($photoUrl)) {
                    ProfilePhoto::create([
                        'user_id'    => $user->id,
                        'photo_url'  => $photoUrl,
                        'is_primary' => $idx === 0,
                        'sort_order' => $idx,
                    ]);
                }
            }
        }

        return response()->json([
            'message' => 'Profile updated successfully',
            'user'    => $user->load('photos'),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }
}
