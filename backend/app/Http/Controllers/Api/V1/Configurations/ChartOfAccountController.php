<?php

namespace App\Http\Controllers\Api\V1\Configurations;

use App\Http\Resources\V1\Configurations\ChartOfAccountResource;
use App\Models\ChartOfAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ChartOfAccountController extends BaseCrudController
{
    protected function modelClass(): string
    {
        return ChartOfAccount::class;
    }

    protected function resourceClass(): string
    {
        return ChartOfAccountResource::class;
    }

    protected function storeRules(string $orgId): array
    {
        return [
            'account_type_id' => ['required', 'uuid', Rule::exists('account_types', 'id')->where('org_id', $orgId)],
            'parent_id'       => ['nullable', 'uuid', Rule::exists('chart_of_accounts', 'id')->where('org_id', $orgId)],
            'code'            => ['required', 'string', 'max:20', Rule::unique('chart_of_accounts')->where('org_id', $orgId)],
            'name'            => ['required', 'string', 'max:150'],
            'is_header'       => ['sometimes', 'boolean'],
            'is_active'       => ['sometimes', 'boolean'],
        ];
    }

    protected function updateRules(string $id, string $orgId): array
    {
        return [
            'account_type_id' => ['required', 'uuid', Rule::exists('account_types', 'id')->where('org_id', $orgId)],
            'parent_id'       => ['nullable', 'uuid', Rule::exists('chart_of_accounts', 'id')->where('org_id', $orgId)],
            'code'            => ['required', 'string', 'max:20', Rule::unique('chart_of_accounts')->where('org_id', $orgId)->ignore($id)],
            'name'            => ['required', 'string', 'max:150'],
            'is_header'       => ['sometimes', 'boolean'],
            'is_active'       => ['sometimes', 'boolean'],
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $query = ChartOfAccount::where('org_id', $request->user()->org_id)
            ->with(['accountType', 'parent']);

        if ($accountTypeId = $request->query('account_type_id')) {
            $query->where('account_type_id', $accountTypeId);
        }

        if ($request->boolean('active_only')) {
            $query->where('is_active', true);
        }

        $items = $query->orderBy('code')->get();

        return $this->respond(ChartOfAccountResource::collection($items)->resolve());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $account = ChartOfAccount::where('org_id', $request->user()->org_id)->findOrFail($id);

        abort_if(
            $account->children()->exists(),
            422,
            'Cannot delete an account that has sub-accounts.'
        );

        $account->delete();

        return $this->respond(null, 'Account deleted.');
    }
}
