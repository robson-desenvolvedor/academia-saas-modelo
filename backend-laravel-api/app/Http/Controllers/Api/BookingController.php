<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\BookingConfirmedMail;
use App\Models\Booking;
use App\Models\ScheduleSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $query = Booking::query()
            ->with(['scheduleSlot.trainingClass', 'scheduleSlot.trainer.user:id,name', 'student:id,name,email'])
            ->where('gym_id', $request->user()->gym_id)
            ->latest();

        if ($request->user()->role === 'student') {
            $query->where('student_id', $request->user()->id);
        }

        return $query->paginate(50);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'schedule_slot_id' => ['required', 'exists:schedule_slots,id'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $booking = DB::transaction(function () use ($request, $data) {
            $slot = ScheduleSlot::query()
                ->where('gym_id', $request->user()->gym_id)
                ->lockForUpdate()
                ->findOrFail($data['schedule_slot_id']);

            abort_unless($slot->hasAvailability(), 422, 'Horário sem disponibilidade.');

            $alreadyBooked = Booking::query()
                ->where('schedule_slot_id', $slot->id)
                ->where('student_id', $request->user()->id)
                ->whereIn('status', ['pending', 'confirmed'])
                ->exists();

            abort_if($alreadyBooked, 422, 'Aluno já possui agendamento neste horário.');

            $booking = Booking::create([
                'gym_id' => $request->user()->gym_id,
                'schedule_slot_id' => $slot->id,
                'student_id' => $request->user()->id,
                'status' => 'confirmed',
                'notes' => $data['notes'] ?? null,
                'confirmed_at' => now(),
            ]);

            $slot->increment('booked_count');

            return $booking->load(['scheduleSlot.trainingClass', 'scheduleSlot.trainer.user', 'student']);
        });

        Mail::to($booking->student->email)->queue(new BookingConfirmedMail($booking));

        return response()->json($booking, 201);
    }

    public function confirm(Request $request, Booking $booking)
    {
        abort_if($booking->gym_id !== $request->user()->gym_id, 403);

        $booking->update([
            'status' => 'confirmed',
            'confirmed_at' => now(),
        ]);

        Mail::to($booking->student->email)->queue(new BookingConfirmedMail($booking->load(['student', 'scheduleSlot.trainingClass'])));

        return $booking;
    }

    public function cancel(Request $request, Booking $booking)
    {
        abort_if($booking->gym_id !== $request->user()->gym_id, 403);

        DB::transaction(function () use ($booking) {
            if ($booking->status !== 'cancelled') {
                $booking->scheduleSlot()->decrement('booked_count');
            }

            $booking->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);
        });

        return $booking->refresh();
    }
}
