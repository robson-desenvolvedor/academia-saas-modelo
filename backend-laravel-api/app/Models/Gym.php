<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Gym extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'document',
        'email',
        'phone',
        'plan',
        'status',
        'opening_hours',
    ];

    protected function casts(): array
    {
        return [
            'opening_hours' => 'array',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function trainers()
    {
        return $this->hasMany(TrainerProfile::class);
    }

    public function classes()
    {
        return $this->hasMany(TrainingClass::class);
    }
}
