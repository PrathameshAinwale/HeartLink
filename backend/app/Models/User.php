<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'display_name',
        'email',
        'country_code',
        'password',
        'age',
        'dob',
        'gender',
        'bio',
        'job',
        'avatar',
        'video_intro_url',
        'city',
        'state',
        'country',
        'pincode',
        'mother_tongue',
        'languages_spoken',
        'religion',
        'marital_status',
        'education',
        'occupation',
        'diet',
        'zodiac_sign',
        'drinking',
        'smoking',
        'clubbing',
        'exercise',
        'relationship_type',
        'age_min',
        'age_max',
        'latitude',
        'longitude',
        'is_online',
        'compatibility_score',
        'interests',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_online' => 'boolean',
            'interests' => 'array',
            'languages_spoken' => 'array',
        ];
    }

    public function photos()
    {
        return $this->hasMany(ProfilePhoto::class)->orderBy('sort_order', 'asc');
    }

    public function swipes()
    {
        return $this->hasMany(Swipe::class, 'swiper_id');
    }

    public function matches()
    {
        return $this->hasMany(UserMatch::class, 'user_1_id')
            ->orWhere('user_2_id', $this->id);
    }

    public function messagesSent()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    public function messagesReceived()
    {
        return $this->hasMany(Message::class, 'receiver_id');
    }

    public function activeSubscription()
    {
        return $this->hasOne(UserSubscription::class)->where('status', 'active')->latestOfMany();
    }
}
