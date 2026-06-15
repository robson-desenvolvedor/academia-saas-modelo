<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Gym;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'gym_name' => ['required', 'string', 'max:120'],
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', Rule::in(['admin', 'trainer', 'student'])],
            'phone' => ['nullable', 'string', 'max:30'],
        ]);

        $gym = Gym::create([
            'name' => $data['gym_name'],
            'slug' => str($data['gym_name'])->slug(),
            'email' => $data['email'],
            'plan' => 'starter',
            'status' => 'active',
        ]);

        $user = User::create([
            'gym_id' => $gym->id,
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
            'phone' => $data['phone'] ?? null,
            'status' => 'active',
        ]);

        return response()->json([
            'token' => $user->createToken('fitagenda')->plainTextToken,
            'user' => $user,
            'gym' => $gym,
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Credenciais inválidas.'], 422);
        }

        return response()->json([
            'token' => $user->createToken('fitagenda')->plainTextToken,
            'user' => $user->load('gym'),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user()->load(['gym', 'trainerProfile']));
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Sessão encerrada.']);
    }
}
