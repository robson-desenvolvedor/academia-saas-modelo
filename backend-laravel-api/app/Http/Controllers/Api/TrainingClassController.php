<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainingClass;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TrainingClassController extends Controller
{
    public function index(Request $request)
    {
        return TrainingClass::query()
            ->with('trainer.user:id,name')
            ->where('gym_id', $request->user()->gym_id)
            ->latest()
            ->paginate(30);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'trainer_profile_id' => ['nullable', 'exists:trainer_profiles,id'],
            'title' => ['required', 'string', 'max:140'],
            'description' => ['nullable', 'string'],
            'type' => ['required', Rule::in(['group', 'personal', 'workout'])],
            'capacity' => ['required', 'integer', 'min:1', 'max:200'],
            'duration_minutes' => ['required', 'integer', 'min:15', 'max:240'],
            'status' => ['nullable', Rule::in(['active', 'inactive'])],
        ]);

        $class = TrainingClass::create([
            ...$data,
            'gym_id' => $request->user()->gym_id,
            'status' => $data['status'] ?? 'active',
        ]);

        return response()->json($class->load('trainer.user'), 201);
    }

    public function show(Request $request, TrainingClass $class)
    {
        abort_if($class->gym_id !== $request->user()->gym_id, 403);

        return $class->load(['trainer.user', 'slots.bookings.student']);
    }

    public function update(Request $request, TrainingClass $class)
    {
        abort_if($class->gym_id !== $request->user()->gym_id, 403);

        $data = $request->validate([
            'trainer_profile_id' => ['nullable', 'exists:trainer_profiles,id'],
            'title' => ['sometimes', 'string', 'max:140'],
            'description' => ['nullable', 'string'],
            'type' => ['sometimes', Rule::in(['group', 'personal', 'workout'])],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'duration_minutes' => ['sometimes', 'integer', 'min:15', 'max:240'],
            'status' => ['sometimes', Rule::in(['active', 'inactive'])],
        ]);

        $class->update($data);

        return $class->load('trainer.user');
    }

    public function destroy(Request $request, TrainingClass $class)
    {
        abort_if($class->gym_id !== $request->user()->gym_id, 403);

        $class->update(['status' => 'inactive']);

        return response()->noContent();
    }
}
