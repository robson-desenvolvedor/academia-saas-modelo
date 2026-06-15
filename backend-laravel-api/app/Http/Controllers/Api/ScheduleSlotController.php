<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScheduleSlot;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ScheduleSlotController extends Controller
{
    public function index(Request $request)
    {
        $query = ScheduleSlot::query()
            ->with(['trainingClass', 'trainer.user:id,name', 'bookings.student:id,name,email'])
            ->where('gym_id', $request->user()->gym_id)
            ->orderBy('starts_at');

        if ($request->filled('from')) {
            $query->where('starts_at', '>=', $request->date('from'));
        }

        if ($request->filled('to')) {
            $query->where('starts_at', '<=', $request->date('to'));
        }

        return $query->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'training_class_id' => ['required', 'exists:training_classes,id'],
            'trainer_profile_id' => ['required', 'exists:trainer_profiles,id'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'capacity' => ['required', 'integer', 'min:1', 'max:200'],
            'status' => ['nullable', Rule::in(['open', 'closed', 'cancelled'])],
        ]);

        $slot = ScheduleSlot::create([
            ...$data,
            'gym_id' => $request->user()->gym_id,
            'booked_count' => 0,
            'status' => $data['status'] ?? 'open',
        ]);

        return response()->json($slot->load(['trainingClass', 'trainer.user']), 201);
    }

    public function show(Request $request, ScheduleSlot $scheduleSlot)
    {
        abort_if($scheduleSlot->gym_id !== $request->user()->gym_id, 403);

        return $scheduleSlot->load(['trainingClass', 'trainer.user', 'bookings.student']);
    }

    public function update(Request $request, ScheduleSlot $scheduleSlot)
    {
        abort_if($scheduleSlot->gym_id !== $request->user()->gym_id, 403);

        $data = $request->validate([
            'starts_at' => ['sometimes', 'date'],
            'ends_at' => ['sometimes', 'date', 'after:starts_at'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'status' => ['sometimes', Rule::in(['open', 'closed', 'cancelled'])],
        ]);

        $scheduleSlot->update($data);

        return $scheduleSlot->load(['trainingClass', 'trainer.user']);
    }

    public function destroy(Request $request, ScheduleSlot $scheduleSlot)
    {
        abort_if($scheduleSlot->gym_id !== $request->user()->gym_id, 403);

        $scheduleSlot->update(['status' => 'cancelled']);

        return response()->noContent();
    }
}
