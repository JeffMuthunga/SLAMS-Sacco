<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class IssueCommentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'issue_id'   => $this->issue_id,
            'user_id'    => $this->user_id,
            'body'       => $this->body,
            'user'       => $this->whenLoaded('user', fn () => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
