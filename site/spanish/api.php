<?php
// Voice proxy for the Spanish practice app. Keeps the API keys on the server.
//   GET  ?action=status                          -> { ok, ai, voices, listeners, voice, listen }
//   POST ?action=tts   {text, mode, lang, voice} -> audio   (mode: es | praise | en)
//   POST ?action=check {audio, mime, target, listen} -> { ok, heard, score, tip }

const GEMINI_URL     = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1';
const CACHE_DIR      = __DIR__ . '/cache';
const DEFAULTS       = [
    'GEMINI_API_KEY'      => '',
    'OPENROUTER_API_KEY'  => '',
    'GEMINI_TTS_MODEL'    => 'gemini-3.8-flash-lite-tts',
    'GEMINI_LISTEN_MODEL' => 'gemini-3.8-flash',
    'VOICE_SPANISH'       => 'Leda',
    'VOICE_PRAISE'        => 'Zephyr',
    'DEFAULT_VOICE'       => 'gemini-lite',
    'DEFAULT_LISTEN'      => 'gemini-flash',
    'DAILY_LIMIT'         => '3000', // total AI calls per day, across everyone
];

// Voices the Settings popup can pick. 'gemini' ones go through OpenRouter when that key
// is set (no daily cap) and fall back to Google directly; the rest need OpenRouter.
const VOICES = [
    'gemini-lite' => ['via' => 'gemini'],
    'gemini'      => ['via' => 'gemini', 'model' => 'gemini-3.8-flash-tts'],
    'mai'         => ['via' => 'openrouter', 'model' => 'microsoft/mai-voice-2.1-flash',
                      'es' => 'es-ES-Marta:MAI-Voice-2.1-Flash', 'en' => 'en-GB-Emily:MAI-Voice-2.1-Flash'],
    'grok'        => ['via' => 'openrouter', 'model' => 'x-ai/grok-voice-tts-1.0', 'es' => 'Eve', 'en' => 'Eve'],
    'kokoro'      => ['via' => 'openrouter', 'model' => 'hexgrad/kokoro-82m', 'es' => 'ef_dora', 'en' => 'bf_emma'],
];
// Models that listen to the learner. 'lang' is sent as a hint where it helps.
const LISTENERS = [
    'gemini-flash'      => ['via' => 'gemini'],
    'gpt-mini'          => ['via' => 'openrouter', 'model' => 'openai/gpt-4o-mini-transcribe', 'lang' => 'es'],
    'gemini-transcribe' => ['via' => 'openrouter', 'model' => 'google/gemini-3.5-transcribe', 'lang' => 'es'],
    'whisper'           => ['via' => 'openrouter', 'model' => 'openai/whisper-large-v3-turbo'],
];

header('X-Content-Type-Options: nosniff');

require __DIR__ . '/env.php';

// A setting from .env, or its default.
function cfg($name) {
    return read_env()[$name] ?? DEFAULTS[$name];
}

function fail($code, $msg) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

function usable($entry) {
    if ($entry['via'] === 'openrouter') return cfg('OPENROUTER_API_KEY') !== '';
    return cfg('OPENROUTER_API_KEY') !== '' || cfg('GEMINI_API_KEY') !== '';
}

function ensure_cache() {
    if (!is_dir(CACHE_DIR)) {
        @mkdir(CACHE_DIR, 0755, true);
        @file_put_contents(CACHE_DIR . '/.htaccess', "Require all denied\n");
    }
}

function count_call() {
    ensure_cache();
    $f = CACHE_DIR . '/calls_' . gmdate('Ymd') . '.txt';
    $n = (int) @file_get_contents($f);
    if ($n >= (int) cfg('DAILY_LIMIT')) fail(429, 'Daily limit reached');
    @file_put_contents($f, (string) ($n + 1), LOCK_EX);
}

// POST JSON; returns [body, contentType] on HTTP 200, otherwise null with the reason in $err.
function post_json($url, $headers, $body, &$err) {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 40,
        CURLOPT_HTTPHEADER     => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_POSTFIELDS     => json_encode($body),
    ]);
    $raw  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $type = (string) curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    if ($raw === false) error_log('Voice proxy curl error: ' . curl_error($ch));
    curl_close($ch);
    if ($code === 200 && $raw !== false) return [$raw, $type];
    $json = json_decode((string) $raw, true);
    $err  = is_array($json) && isset($json['error']['message']) ? $json['error']['message'] : 'Request failed';
    return null;
}

function gemini($body, &$err) {
    $res = post_json(GEMINI_URL, ['x-goog-api-key: ' . cfg('GEMINI_API_KEY')], $body, $err);
    return $res ? json_decode($res[0], true) : null;
}

function openrouter($path, $body, &$err) {
    return post_json(OPENROUTER_URL . $path, ['Authorization: Bearer ' . cfg('OPENROUTER_API_KEY')], $body, $err);
}

// Last content block of the given type in a Gemini response.
function last_output($json, $type, $field) {
    $found = null;
    foreach ($json['steps'] ?? [] as $step) {
        if (($step['type'] ?? '') !== 'model_output') continue;
        foreach ($step['content'] ?? [] as $c) {
            if (($c['type'] ?? '') === $type && isset($c[$field])) $found = $c[$field];
        }
    }
    return $found;
}

// Wrap raw 24 kHz mono 16-bit PCM in a WAV header so browsers can play it.
function pcm_to_wav($pcm) {
    $n = strlen($pcm);
    return 'RIFF' . pack('V', 36 + $n) . 'WAVEfmt ' . pack('VvvVVvv', 16, 1, 1, 24000, 48000, 2, 16) . 'data' . pack('V', $n) . $pcm;
}

function gemini_speech($model, $voice, $style, $text, &$err) {
    if (cfg('OPENROUTER_API_KEY') !== '') {
        $res = openrouter('/audio/speech', [
            'model' => 'google/' . $model, 'input' => $text, 'voice' => $voice, 'response_format' => 'pcm',
            'provider' => ['options' => ['google-ai-studio' => ['speech_metadata' => ['style' => $style]]]],
        ], $err);
        if ($res && strlen($res[0]) > 1000) return pcm_to_wav($res[0]);
    }
    if (cfg('GEMINI_API_KEY') === '') return null;
    $json = gemini([
        'model' => $model,
        'input' => [[
            'type'    => 'user_input',
            'content' => [['type' => 'text', 'text' => $text, 'annotations' => [['type' => 'speech_metadata', 'style' => $style]]]],
        ]],
        'response_format'   => ['type' => 'audio', 'mime_type' => 'audio/wav'],
        'generation_config' => ['speech_config' => [['voice' => $voice]]],
    ], $err);
    $b64 = $json ? last_output($json, 'audio', 'data') : null;
    $wav = $b64 ? base64_decode($b64) : '';
    return $wav ?: null;
}

$action = $_GET['action'] ?? '';

if ($action === 'status') {
    $voices    = array_keys(array_filter(VOICES, 'usable'));
    $listeners = array_keys(array_filter(LISTENERS, 'usable'));
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode([
        'ok' => true, 'ai' => (bool) $voices, 'voices' => $voices, 'listeners' => $listeners,
        'voice' => cfg('DEFAULT_VOICE'), 'listen' => cfg('DEFAULT_LISTEN'),
    ]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'POST only');

// Only our own pages may call this.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin && parse_url($origin, PHP_URL_HOST) !== explode(':', $_SERVER['HTTP_HOST'])[0]) fail(403, 'Forbidden');

$in = json_decode(file_get_contents('php://input'), true);
if (!is_array($in)) fail(400, 'Bad JSON');

if ($action === 'tts') {
    $text = trim((string) ($in['text'] ?? ''));
    $mode = (string) ($in['mode'] ?? 'es');
    $id   = (string) ($in['voice'] ?? '');
    if (!isset(VOICES[$id])) $id = cfg('DEFAULT_VOICE');
    if ($text === '' || mb_strlen($text) > 240) fail(400, 'Bad text');

    $styles = [
        'es'     => [cfg('VOICE_SPANISH'), 'a warm, friendly Spanish teacher from Spain speaking clearly and a little slowly to a beginner'],
        'praise' => [cfg('VOICE_PRAISE'), 'super excited, joyful and proud, cheering on a child who just got the answer right'],
        'en'     => [cfg('VOICE_PRAISE'), 'cheerful, kind and encouraging'],
    ];
    if (!isset($styles[$mode])) fail(400, 'Bad mode');
    $v = VOICES[$id];
    if (!usable($v)) fail(503, 'That voice is not set up yet');
    $lang = $mode === 'es' ? 'es' : ((($in['lang'] ?? 'en') === 'es') ? 'es' : 'en');

    ensure_cache();
    if ($v['via'] === 'gemini') {
        [$voice, $style] = $styles[$mode];
        $model = $v['model'] ?? cfg('GEMINI_TTS_MODEL');
        $file  = CACHE_DIR . '/tts_' . sha1($model . '|' . $voice . '|' . $mode . '|' . $text) . '.wav';
        if (!is_file($file)) {
            count_call();
            $audio = gemini_speech($model, $voice, $style, $text, $err);
            if (!$audio) fail(502, $err ?: 'No audio returned');
            file_put_contents($file, $audio, LOCK_EX);
        }
    } else {
        $file = CACHE_DIR . '/tts_' . sha1($v['model'] . '|' . $v[$lang] . '|' . $text) . '.mp3';
        if (!is_file($file)) {
            count_call();
            $res = openrouter('/audio/speech', ['model' => $v['model'], 'input' => $text, 'voice' => $v[$lang], 'response_format' => 'mp3'], $err);
            if (!$res || strlen($res[0]) < 500) fail(502, $err ?: 'No audio returned');
            file_put_contents($file, $res[0], LOCK_EX);
        }
    }
    header('Content-Type: ' . (substr($file, -4) === '.wav' ? 'audio/wav' : 'audio/mpeg'));
    header('Content-Length: ' . filesize($file));
    readfile($file);
    exit;
}

if ($action === 'check') {
    $audio  = (string) ($in['audio'] ?? '');
    $mime   = strtolower(trim(explode(';', (string) ($in['mime'] ?? 'audio/webm'))[0]));
    $target = trim((string) ($in['target'] ?? ''));
    $id     = (string) ($in['listen'] ?? '');
    if (!isset(LISTENERS[$id])) $id = cfg('DEFAULT_LISTEN');
    if ($audio === '' || strlen($audio) > 2500000) fail(400, 'Bad audio');
    if ($target === '' || mb_strlen($target) > 240) fail(400, 'Bad target');
    if (!preg_match('#^audio/[a-z0-9.+-]+$#', $mime)) fail(400, 'Bad mime');
    if ($mime === 'audio/mp4' || $mime === 'audio/x-m4a') $mime = 'audio/m4a';
    $l = LISTENERS[$id];
    if (!usable($l)) fail(503, 'That listener is not set up yet');
    if ($l['via'] === 'gemini' && cfg('GEMINI_API_KEY') === '') fail(503, 'That listener is not set up yet');

    count_call();
    $clarity = null;
    $tip     = '';
    // Neither kind of model is told the target phrase: when a model knows what to expect it
    // "hears" it even in silence. It only transcribes; the comparison happens below.
    if ($l['via'] === 'openrouter') {
        $formats = ['audio/webm' => 'webm', 'audio/ogg' => 'ogg', 'audio/wav' => 'wav', 'audio/x-wav' => 'wav', 'audio/m4a' => 'm4a',
                    'audio/mpeg' => 'mp3', 'audio/mp3' => 'mp3', 'audio/aac' => 'aac', 'audio/flac' => 'flac'];
        if (!isset($formats[$mime])) fail(400, 'Unsupported audio type');
        $body = ['model' => $l['model'], 'input_audio' => ['data' => $audio, 'format' => $formats[$mime]]];
        if (isset($l['lang'])) $body['language'] = $l['lang'];
        $res = openrouter('/audio/transcriptions', $body, $err);
        $out = $res ? json_decode($res[0], true) : null;
        if (!is_array($out) || !isset($out['text'])) fail(502, $err ?: 'Could not read the answer');
        $heard = trim((string) $out['text']);
    } else {
        $prompt = 'This is a short recording of a 12-year-old English-speaking beginner practising Spanish. '
            . 'Transcribe ONLY the words that are actually audible. Never guess, invent or complete a phrase. '
            . 'heard: the verbatim transcript, with numbers written as Spanish words and spelled-out letters written as '
            . 'Spanish letter names (e.g. "eme", "ele"); use an empty string if there is silence, only noise, or speech too unclear to make out. '
            . 'clarity: 0-100 for how clear and correct the Spanish pronunciation sounds, generous about a beginner accent; 0 if there is no Spanish speech. '
            . 'tip: one short, warm tip in English (max 16 words) about one specific sound she could improve, or praise if it was great; empty string if no speech.';
        $json = gemini([
            'model' => cfg('GEMINI_LISTEN_MODEL'),
            'input' => [
                ['type' => 'text', 'text' => $prompt],
                ['type' => 'audio', 'data' => $audio, 'mime_type' => $mime],
            ],
            'response_format' => [
                'type'      => 'text',
                'mime_type' => 'application/json',
                'schema'    => [
                    'type'       => 'object',
                    'properties' => ['heard' => ['type' => 'string'], 'clarity' => ['type' => 'integer'], 'tip' => ['type' => 'string']],
                    'required'   => ['heard', 'clarity', 'tip'],
                ],
            ],
        ], $err);
        if (!$json) fail(502, $err ?: 'Could not read the answer');
        $text = (string) last_output($json, 'text', 'text');
        if (!preg_match('/\{.*\}/s', $text, $m)) fail(502, 'Could not read the answer');
        $out = json_decode($m[0], true);
        if (!is_array($out)) fail(502, 'Could not read the answer');
        $heard   = trim((string) ($out['heard'] ?? ''));
        $clarity = max(0, min(100, (int) ($out['clarity'] ?? 0)));
        $tip     = (string) ($out['tip'] ?? '');
    }

    // How close are her words to the target? (letters only, accents and punctuation ignored)
    $plain = function ($s) {
        $s = strtr(mb_strtolower($s), ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n']);
        return trim(preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9 ]/', ' ', $s)));
    };
    $a = $plain($heard);
    $b = $plain($target);
    $match = ($a === '' || $b === '') ? 0 : (int) round(100 * (1 - levenshtein($a, $b) / max(strlen($a), strlen($b))));

    if ($a === '') {
        $score = 0;
        $tip   = 'I couldn\'t hear any words. Hold the device closer and say it nice and loud!';
    } elseif ($match < 60) {
        $score = min(40, $match);
        $tip   = 'That wasn\'t quite the phrase. Tap the speaker, listen again, and copy it slowly.';
    } elseif ($clarity === null) {
        $score = $match;
        $tip   = $match >= 90 ? 'I understood every word. ¡Muy bien!' : 'Nearly all of it! Listen once more for the bit that\'s different.';
    } else {
        $score = (int) round(0.65 * $match + 0.35 * $clarity);
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'heard' => $heard, 'score' => $score, 'tip' => $tip]);
    exit;
}

fail(400, 'Unknown action');
