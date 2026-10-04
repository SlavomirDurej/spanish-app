// Shared .env reading for the tools (mirrors site/spanish/env.php and profile.php).
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const envFile = join(root, '.env');

export function readEnv() {
  const env = {};
  if (!existsSync(envFile)) return env;
  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const value = line.slice(i + 1).trim().replace(/^["']|["']$/g, '');
    if (value && !value.startsWith('PASTE_YOUR_')) env[line.slice(0, i).trim()] = value;
  }
  return env;
}

const PROFILE_KEYS = {
  CHILD_NAME: 'name', CHILD_BIRTHDAY: 'birthday', CHILD_CITY: 'city', CHILD_HERO: 'hero',
  PET_NAME: 'petName', PET_AGE: 'petAge', STEPBROTHER_NAME: 'broName', STEPBROTHER_AGE: 'broAge',
  COUSIN_NAME: 'cousinName', COUSIN_AGE: 'cousinAge', FRIEND_NAME: 'friendName', FRIEND_AGE: 'friendAge',
  STORAGE_KEY: 'storageKey'
};

// The same object profile.php serves to the browser.
export function profileFromEnv(env = readEnv()) {
  const profile = {};
  for (const [key, field] of Object.entries(PROFILE_KEYS)) if (env[key]) profile[field] = env[key];
  return profile;
}
