<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends ApiController
{
    public function index(Request $request): JsonResponse
    {
        $orgId = $request->user()->org_id;

        $query = AuditLog::where('org_id', $orgId)
            ->with('user:id,name,email')
            ->orderByDesc('created_at');

        if ($request->filled('event')) {
            $query->where('event', 'like', $request->event . '%');
        }

        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->filled('subject_type')) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $query->where('description', 'ilike', '%' . $request->search . '%');
        }

        $logs = $query->paginate($request->integer('per_page', 50));

        $meta = [
            'current_page' => $logs->currentPage(),
            'last_page'    => $logs->lastPage(),
            'per_page'     => $logs->perPage(),
            'total'        => $logs->total(),
        ];

        return $this->respond(
            $logs->map(fn($l) => [
                'id'           => $l->id,
                'event'        => $l->event,
                'description'  => $l->description,
                'subject_type' => $l->subject_type,
                'subject_id'   => $l->subject_id,
                'properties'   => $l->properties,
                'ip_address'   => $l->ip_address,
                'created_at'   => $l->created_at,
                'user'         => $l->user ? [
                    'id'    => $l->user->id,
                    'name'  => $l->user->name,
                    'email' => $l->user->email,
                ] : null,
            ]),
            'Audit logs retrieved.',
            200,
            $meta,
        );
    }
}
