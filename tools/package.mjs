// Builds the deploy zip: everything in site/ plus the root .env.
//   node tools/package.mjs           -> site_YYYYMMDD_HHMMSS.zip
//   node tools/package.mjs --sync    -> first refresh the API keys in .env from ProjectManager
// Upload the zip to your host's web root (on Hostinger: MCP hosting_deploy-static-website).
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { envFile, readEnv, root } from './env.mjs';

if (!existsSync(envFile)) copyFileSync(join(root, '.env.example'), envFile);

// Optional: pull the keys from a ProjectManager credential store. The ids are set in .env
// (PM_PROJECT_ID, PM_GEMINI_CREDENTIAL_ID, PM_OPENROUTER_CREDENTIAL_ID).
if (process.argv.includes('--sync')) {
  const cfg = readEnv();
  if (!cfg.PM_PROJECT_ID) throw new Error('Set PM_PROJECT_ID in .env to use --sync');
  const dataDir = process.env.PM_DATA_DIR || join(homedir(), 'Documents/Claude/Projects/ProjectManager/data');
  const store = JSON.parse(readFileSync(join(dataDir, 'credentials', cfg.PM_PROJECT_ID + '.json'), 'utf8'));
  let env = readFileSync(envFile, 'utf8');
  for (const [name, id] of [['GEMINI_API_KEY', cfg.PM_GEMINI_CREDENTIAL_ID], ['OPENROUTER_API_KEY', cfg.PM_OPENROUTER_CREDENTIAL_ID]]) {
    const cred = id && store.credentials.find(c => c.id === id);
    const key = cred && Object.values(cred.fields)[0];
    if (!key) { console.log('WARNING: ' + name + ' not found in ProjectManager'); continue; }
    const line = name + '=' + key, existing = new RegExp('^' + name + '=.*$', 'm');
    env = existing.test(env) ? env.replace(existing, () => line) : env.trimEnd() + '\n' + line + '\n';
    console.log(name + ' synced from ProjectManager');
  }
  writeFileSync(envFile, env);
}

const cfg = readEnv();
if (!cfg.OPENROUTER_API_KEY && !cfg.GEMINI_API_KEY) console.log('WARNING: .env has no API key - the app will use the browser voice');

for (const f of readdirSync(root)) if (/^site_\d+_\d+\.zip$/.test(f)) rmSync(join(root, f));
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '_').slice(0, 15);
const zip = join(root, `site_${stamp}.zip`);
const staged = join(root, 'site', '.env');
copyFileSync(envFile, staged);
try {
  // Windows' bsdtar writes zip entries with forward slashes (Compress-Archive does not).
  const tar = process.platform === 'win32' ? join(process.env.SystemRoot, 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-a', '-c', '-f', zip, '--exclude', 'spanish/cache', '-C', join(root, 'site'), '.env', '.htaccess', 'index.html', 'spanish']);
} finally {
  rmSync(staged);
}
console.log(zip);
