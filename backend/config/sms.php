<?php

return [
    'enabled'  => env('SMS_ENABLED', false),
    'provider' => env('SMS_PROVIDER', 'africas_talking'),

    'africas_talking' => [
        'api_key'   => env('AT_API_KEY', ''),
        'username'  => env('AT_USERNAME', 'sandbox'),
        'sender_id' => env('AT_SENDER_ID', ''),
    ],
];
