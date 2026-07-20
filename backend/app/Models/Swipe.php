<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Swipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'swiper_id',
        'swiped_user_id',
        'type',
    ];

    public function swiper()
    {
        return $this->belongsTo(User::class, 'swiper_id');
    }

    public function swipedUser()
    {
        return $this->belongsTo(User::class, 'swiped_user_id');
    }
}
