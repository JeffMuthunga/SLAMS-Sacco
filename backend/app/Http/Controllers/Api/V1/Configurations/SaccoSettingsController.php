<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\V1\Configurations\SaccoSettingResource;
use App\Models\SaccoSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaccoSettingsController extends ApiController
{
    public function show(Request $request): JsonResponse
    {
        $org = $request->user()->org;
        $settings = SaccoSetting::firstOrCreate(
            ['org_id' => $org->id],
            [
                'registration_fee'         => '0.00',
                'min_share_capital'        => '0.00',
                'min_monthly_contribution' => '0.00',
                'loan_limit_multiplier'    => '3.00',
            ]
        );

        return $this->respond(new SaccoSettingResource($settings), 'SACCO settings retrieved.');
    }

    public function update(Request $request): JsonResponse
    {
        $org = $request->user()->org;
        $settings = SaccoSetting::firstOrCreate(['org_id' => $org->id]);

        $data = $request->validate([
            'registration_fee'         => ['sometimes', 'numeric', 'min:0'],
            'min_share_capital'        => ['sometimes', 'numeric', 'min:0'],
            'min_monthly_contribution' => ['sometimes', 'numeric', 'min:0'],
            'loan_limit_multiplier'    => ['sometimes', 'numeric', 'min:1', 'max:10'],
        ]);

        $settings->update($data);

        return $this->respond(new SaccoSettingResource($settings), 'SACCO settings updated.');
    }
}
