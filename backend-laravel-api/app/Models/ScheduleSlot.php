<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScheduleSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'gym_id',
        'training_class_id',
        'trainer_profile_id',
        'starts_at',
        'ends_at',
        'capacity',
        'booked_count',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function trainingClass()
    {
        return $this->belongsTo(TrainingClass::class);
    }

    public function trainer()
    {
        return $this->belongsTo(TrainerProfile::class, 'trainer_profile_id');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function hasAvailability(): bool
    {
        return $this->status === 'open' && $this->booked_count < $this->capacity;
    }
}
