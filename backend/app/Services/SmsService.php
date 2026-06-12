<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private string $provider;

    public function __construct()
    {
        $this->provider = config('sms.provider', 'africas_talking');
    }

    public function send(string $phone, string $message): bool
    {
        if (!config('sms.enabled', false)) {
            Log::info('SMS disabled. Would send to '.$phone.': '.$message);
            return true;
        }

        return match ($this->provider) {
            'africas_talking' => $this->sendAfricasTalking($phone, $message),
            default           => $this->sendAfricasTalking($phone, $message),
        };
    }

    private function sendAfricasTalking(string $phone, string $message): bool
    {
        try {
            $response = Http::withHeaders([
                'apiKey'       => config('sms.africas_talking.api_key'),
                'Accept'       => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded',
            ])->asForm()->post('https://api.africastalking.com/version1/messaging', [
                'username' => config('sms.africas_talking.username'),
                'to'       => $this->formatPhone($phone),
                'message'  => $message,
                'from'     => config('sms.africas_talking.sender_id'),
            ]);

            if ($response->successful()) {
                Log::info('SMS sent to '.$phone);
                return true;
            }

            Log::error('SMS failed for '.$phone.': '.$response->body());
            return false;
        } catch (\Throwable $e) {
            Log::error('SMS exception for '.$phone.': '.$e->getMessage());
            return false;
        }
    }

    private function formatPhone(string $phone): string
    {
        $phone = preg_replace('/\D/', '', $phone);
        if (str_starts_with($phone, '0') && strlen($phone) === 10) {
            return '+254' . substr($phone, 1);
        }
        if (str_starts_with($phone, '254') && strlen($phone) === 12) {
            return '+' . $phone;
        }
        if (str_starts_with($phone, '+')) {
            return $phone;
        }
        return '+254' . $phone;
    }
}
