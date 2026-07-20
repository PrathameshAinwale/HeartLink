<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Restaurant extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'rating',
        'location',
        'image',
        'description',
        'price_range',
        'map_url',
    ];

    public function bookings()
    {
        return $this->hasMany(DateBooking::class);
    }
}
