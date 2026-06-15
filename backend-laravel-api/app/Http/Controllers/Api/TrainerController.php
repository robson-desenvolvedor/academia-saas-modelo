<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TrainerProfile;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TrainerController extends Controller
{
    public function index(Request $request)
    {
        return TrainerProfile::query()
            ->with('user:id,name,email,phone,role,status')
            ->where('gym_id', $request->user()->gym_id)
            ->latest()
            ->paginate(20);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialty' => ['required', 'string', 'max:160'],
            'bio' => ['nullable', 'string'],
            'hourly_rate' => ['nullable', 'numeric', 'min:0'],
        ]);

        $user = User::create([
            'gym_id' => $request->user()->gym_id,
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'role' => 'trainer',
            'status' => 'active',
            'password' => Hash::make(str()->password(12)),
        ]);

        $profile = TrainerProfile::create([
            'gym_id' => $request->user()->gym_id,
            'user_id' => $user->id,
            'specialty' => $data['specialty'],
            'bio' => $data['bio'] ?? null,
            'hourly_rate' => $data['hourly_rate'] ?? 0,
            'is_available' => true,
        ]);

        return response()->json($profile->load('user'), 201);
    }

    public function show(Request $request, TrainerProfile $trainer)
    {
        abort_if($trainer->gym_id !== $request->user()->gym_id, 403);

        return $trainer->load(['user', 'slots.trainingClass']);
    }

    public function update(Request $request, TrainerProfile $trainer)
    {
        abort_if($trainer->gym_id !== $request->user()->gym_id, 403);

        $data = $request->validate([
            'specialty' => ['sometimes', 'string', 'max:160'],
            'bio' => ['nullable', 'string'],
            'hourly_rate' => ['sometimes', 'numeric', 'min:0'],
            'is_available' => ['sometimes', 'boolean'],
        ]);

        $trainer->update($data);

        return $trainer->load('user');
    }

    public function destroy(Request $request, TrainerProfile $trainer)
    {
        abort_if($trainer->gym_id !== $request->user()->gym_id, 403);

        $trainer->update(['is_available' => false]);
        $trainer->user?->update(['status' => 'inactive']);

        return response()->noContent();
    }
}
