<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\MemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:5,1')->group(function () {  // Rate-limited per spec: max 5 attempts per minute
            Route::post('login', [AuthController::class, 'login']);
            Route::post('register', [AuthController::class, 'register']);
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        // archived + action routes BEFORE apiResource so "archived" is never treated as a UUID
        Route::get('members/archived', [MemberController::class, 'archived']);
        Route::post('members/{member}/restore', [MemberController::class, 'restore']);
        Route::post('members/{member}/photo', [MemberController::class, 'uploadPhoto']);
        Route::post('members/{member}/approve', [MemberController::class, 'approve']);
        Route::post('members/{member}/reject', [MemberController::class, 'reject']);
        Route::apiResource('members', MemberController::class);
    });
});
