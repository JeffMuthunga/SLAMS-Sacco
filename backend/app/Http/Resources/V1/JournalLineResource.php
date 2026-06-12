<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class JournalLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'account_id' => $this->account_id,
            'debit'      => $this->debit,
            'credit'     => $this->credit,
            'narration'  => $this->narration,
            'account'    => $this->whenLoaded('account', fn () => [
                'id'   => $this->account->id,
                'code' => $this->account->code,
                'name' => $this->account->name,
            ]),
        ];
    }
}
