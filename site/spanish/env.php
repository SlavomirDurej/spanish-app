<?php
// Reads the .env file that sits next to the "spanish" folder (the project root when running locally).
// Returns [NAME => value]; empty values and untouched "PASTE_YOUR_..." placeholders are left out.
function read_env() {
    static $env = null;
    if ($env !== null) return $env;
    $env = [];
    foreach ([dirname(__DIR__) . '/.env', dirname(__DIR__, 2) . '/.env'] as $f) {
        if (!is_file($f)) continue;
        foreach (file($f, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) continue;
            [$k, $v] = explode('=', $line, 2);
            $v = trim(trim($v), "\"'");
            if ($v !== '' && strpos($v, 'PASTE_YOUR_') !== 0) $env[trim($k)] = $v;
        }
        break;
    }
    return $env;
}
