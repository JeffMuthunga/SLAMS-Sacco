<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;

class AuditLogger
{
    public static function log(
        string $orgId,
        string $event,
        string $description,
        ?string $userId = null,
        ?Model $subject = null,
        array $properties = [],
        ?string $ipAddress = null,
    ): void {
        AuditLog::create([
            'org_id'       => $orgId,
            'user_id'      => $userId,
            'event'        => $event,
            'subject_type' => $subject ? class_basename($subject) : null,
            'subject_id'   => $subject?->getKey(),
            'description'  => $description,
            'properties'   => $properties ?: null,
            'ip_address'   => $ipAddress,
        ]);
    }
}
