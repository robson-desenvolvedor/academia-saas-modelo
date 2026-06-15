<?php

use Illuminate\Support\Facades\Route;

Route::get('/', fn () => response()->json([
    'name' => 'FitAgenda Pro API',
    'status' => 'online',
]));
