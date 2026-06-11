<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

/**
 * Base controller for all /api/v1 endpoints. Every response uses the
 * envelope: { success, data, message, errors?, meta? }.
 */
abstract class ApiController extends Controller
{
    protected function respond(mixed $data = null, string $message = '', int $status = 200, ?array $meta = null): JsonResponse
    {
        $payload = [
            'success' => true,
            'data' => $data,
            'message' => $message,
        ];

        if ($meta !== null) {
            $payload['meta'] = $meta;
        }

        return response()->json($payload, $status);
    }

    protected function respondCreated(mixed $data = null, string $message = ''): JsonResponse
    {
        return $this->respond($data, $message, 201);
    }

    protected function respondError(string $message, int $status = 400, ?array $errors = null): JsonResponse
    {
        $payload = [
            'success' => false,
            'data' => null,
            'message' => $message,
        ];

        if ($errors !== null) {
            $payload['errors'] = $errors;
        }

        return response()->json($payload, $status);
    }
}
