<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60;

    public function __construct(
        private readonly string $to,
        private readonly string $toName,
        private readonly string $subject,
        private readonly string $body,
    ) {}

    public function handle(): void
    {
        Mail::send([], [], function ($message) {
            $message->to($this->to, $this->toName)
                    ->subject($this->subject)
                    ->html($this->body);
        });
    }
}
