<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Requests\Api\V1\Configurations\UpdateOrgRequest;
use App\Http\Resources\V1\Configurations\OrgResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrgController extends ApiController
{
    public function branding(Request $request): JsonResponse
    {
        $org = $request->user()->org;

        if (!$org) {
            return $this->respondError('Organization not found.', 404);
        }

        return $this->respond([
            'name'            => $org->name,
            'full_name'       => $org->full_name,
            'logo_url'        => $org->logo_path ? url(\Illuminate\Support\Facades\Storage::url($org->logo_path)) : null,
            'primary_color'   => $org->primary_color,
            'secondary_color' => $org->secondary_color,
            'email'           => $org->email,
            'phone'           => $org->phone,
            'website'         => $org->website,
            'address'         => $org->address,
            'town'            => $org->town,
            'country_code'    => $org->country_code,
        ]);
    }

    public function show(Request $request): JsonResponse
    {
        $org = $request->user()->org;

        if (!$org) {
            return $this->respondError('Organization not found.', 404);
        }

        return $this->respond(new OrgResource($org), 'Organization retrieved successfully.');
    }

    public function update(UpdateOrgRequest $request): JsonResponse
    {
        $org = $request->user()->org;

        if (!$org) {
            return $this->respondError('Organization not found.', 404);
        }

        $org->update($request->validated());

        return $this->respond(new OrgResource($org), 'Organization updated successfully.');
    }

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => ['required', 'image', 'max:2048'], // 2MB max
        ]);

        $org = $request->user()->org;

        if (!$org) {
            return $this->respondError('Organization not found.', 404);
        }

        $path = $request->file('logo')->store('orgs/logos', 'public');

        $org->update(['logo_path' => $path]);

        return $this->respond(new OrgResource($org), 'Logo uploaded successfully.');
    }
}
