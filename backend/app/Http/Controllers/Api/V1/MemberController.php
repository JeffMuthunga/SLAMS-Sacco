<?php

namespace App\Http\Controllers\Api\V1;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function store(Request $request): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function update(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function archived(Request $request): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function restore(Request $request, string $member): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }

    public function uploadPhoto(Request $request, string $id): JsonResponse
    {
        return $this->respond(null, 'TODO');
    }
}
