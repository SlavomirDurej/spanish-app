<?php
// Serves the learner's personal details from .env as a script (PROFILE), so that names,
// birthday, home town and family never live in the source code. Anything not set in .env
// falls back to the sample values in data.js.
require __DIR__ . '/env.php';

const PROFILE_KEYS = [
    'CHILD_NAME' => 'name', 'CHILD_BIRTHDAY' => 'birthday', 'CHILD_CITY' => 'city', 'CHILD_HERO' => 'hero',
    'PET_NAME' => 'petName', 'PET_AGE' => 'petAge', 'STEPBROTHER_NAME' => 'broName', 'STEPBROTHER_AGE' => 'broAge',
    'COUSIN_NAME' => 'cousinName', 'COUSIN_AGE' => 'cousinAge', 'FRIEND_NAME' => 'friendName', 'FRIEND_AGE' => 'friendAge',
    'STORAGE_KEY' => 'storageKey',
];

$env     = read_env();
$profile = [];
foreach (PROFILE_KEYS as $key => $field) {
    if (isset($env[$key])) $profile[$field] = $env[$key];
}
if (isset($profile['birthday']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $profile['birthday'])) unset($profile['birthday']);

header('Content-Type: application/javascript; charset=utf-8');
header('Cache-Control: no-cache');
header('X-Robots-Tag: noindex');
echo 'var PROFILE = ' . json_encode((object) $profile, JSON_UNESCAPED_UNICODE) . ';';
