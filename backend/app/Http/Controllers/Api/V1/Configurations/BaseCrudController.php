<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

abstract class BaseCrudController extends ApiController
{
    abstract protected function modelClass(): string;
    abstract protected function resourceClass(): string;
    abstract protected function storeRules(string $orgId): array;
    abstract protected function updateRules(string $id, string $orgId): array;

    public function index(Request $request): JsonResponse
    {
        $items = ($this->modelClass())::where('org_id', $request->user()->org_id)->get();
        $resourceClass = $this->resourceClass();
        return $this->respond($resourceClass::collection($items), 'Retrieved successfully.');
    }

    public function store(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $data = $request->validate($this->storeRules($orgId));
        $data['org_id'] = $orgId;
        $item = ($this->modelClass())::create($data);
        $resourceClass = $this->resourceClass();
        return $this->respondCreated(new $resourceClass($item), 'Created successfully.');
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $item = ($this->modelClass())::where('org_id', $request->user()->org_id)->findOrFail($id);
        $resourceClass = $this->resourceClass();
        return $this->respond(new $resourceClass($item));
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $orgId = $request->user()->org_id;
        $item = ($this->modelClass())::where('org_id', $orgId)->findOrFail($id);
        $data = $request->validate($this->updateRules($id, $orgId));
        $item->update($data);
        $resourceClass = $this->resourceClass();
        return $this->respond(new $resourceClass($item), 'Updated successfully.');
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $item = ($this->modelClass())::where('org_id', $request->user()->org_id)->findOrFail($id);
        $item->delete(); // soft delete
        return $this->respond(null, 'Deleted successfully.');
    }
}
