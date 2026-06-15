<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'gym_id',
        'trainer_profile_id',
        'title',
        'description',
        'type',
        'capacity',
        'duration_minutes',
        'status',
    ];

    public function gym()
    {
        return $this->belongsTo(Gym::class);
    }

    public function trainer()
    {
        return $this->belongsTo(TrainerProfile::class, 'trainer_profile_id');
    }

    public function slots()
    {
        return $this->hasMany(ScheduleSlot::class);
    }
}
