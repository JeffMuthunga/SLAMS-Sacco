<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\MemberController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:5,1')->group(function () {
            Route::post('login',    [AuthController::class, 'login']);
            Route::post('register', [AuthController::class, 'register']);
        });

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('me',      [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    Route::middleware(['auth:sanctum', 'permission:manage_members'])->group(function () {
        // archived + action routes BEFORE apiResource so "archived" is never treated as a UUID
        Route::get('members/archived',          [MemberController::class, 'archived']);
        Route::post('members/{member}/restore', [MemberController::class, 'restore']);
        Route::post('members/{member}/photo',   [MemberController::class, 'uploadPhoto']);
        Route::post('members/{member}/approve', [MemberController::class, 'approve']);
        Route::post('members/{member}/reject',  [MemberController::class, 'reject']);
        Route::apiResource('members', MemberController::class);
    });

    Route::middleware(['auth:sanctum', 'permission:manage_configurations'])->prefix('configurations')->group(function () {
        Route::get('org', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'show']);
        Route::put('org', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'update']);
        Route::post('org/logo', [\App\Http\Controllers\Api\V1\Configurations\OrgController::class, 'uploadLogo']);

        Route::apiResource('currencies', \App\Http\Controllers\Api\V1\Configurations\CurrencyController::class)->except(['show']);

        Route::post('fiscal-years/{fiscal_year}/close', [\App\Http\Controllers\Api\V1\Configurations\FiscalYearController::class, 'close']);
        Route::apiResource('fiscal-years', \App\Http\Controllers\Api\V1\Configurations\FiscalYearController::class)->except(['show', 'destroy']);

        Route::patch('periods/{period}/status', [\App\Http\Controllers\Api\V1\Configurations\PeriodController::class, 'updateStatus']);

        Route::apiResource('collateral-types', \App\Http\Controllers\Api\V1\Configurations\CollateralTypeController::class);
        Route::apiResource('activity-types',   \App\Http\Controllers\Api\V1\Configurations\ActivityTypeController::class);
        Route::apiResource('banks',            \App\Http\Controllers\Api\V1\Configurations\BankController::class);
        Route::apiResource('departments',      \App\Http\Controllers\Api\V1\Configurations\DepartmentController::class);
    });
});
