// Pre-generates every phrase's audio on the server so the learner never waits for a voice.
// Run after deploying new lesson content:  node tools/warm-cache.mjs [base-url]
// The base URL defaults to SITE_URL in .env.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { profileFromEnv, readEnv } from './env.mjs';

const base = (process.argv[2] || readEnv().SITE_URL || '').replace(/\/$/, '');
if (!base) { console.error('Pass the site URL or set SITE_URL in .env'); process.exit(1); }
const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'spanish');
const profile = profileFromEnv();
const ctx = vm.createContext({ PROFILE: profile });
vm.runInContext(readFileSync(join(dir, 'data.js'), 'utf8') + ';this.CHAPTERS = CHAPTERS; this.ME = ME;', ctx);

// The praise lines live in app.js; pull out the string constants it speaks.
const appJs = readFileSync(join(dir, 'app.js'), 'utf8');
const NAME = ctx.ME;
const praiseSrc = appJs.match(/const PRAISE = \[([\s\S]*?)\];/)[1];
const praise = [...praiseSrc.matchAll(/\['((?:[^'\\]|\\.)*)'( \+ NAME \+ '((?:[^'\\]|\\.)*)')?/g)].map(m => (m[1] + (m[2] ? NAME + m[3] : '')).replace(/\\'/g, "'"));
const resultLines = [...appJs.matchAll(/(?:\? |: )'([^']*), ' \+ NAME \+ '!([^']*)'/g)].map(m => m[1] + ', ' + NAME + '!' + m[2]);

const jobs = new Map();
const add = (text, mode) => jobs.set(mode + '|' + text, { text, mode });
praise.forEach(t => add(t, 'praise'));
resultLines.forEach(t => add(t, 'praise'));
for (const c of ctx.CHAPTERS) {
  c.learn.forEach(card => card.items.forEach(i => add(i[3] || i[0], 'es')));
  c.vocab.forEach(v => add(v[0], 'es'));
  c.speak.forEach(p => add(p[0], 'es'));
  c.extra.forEach(q => {
    if (q.t === 'gap') add(q.s.replace('___', q.a), 'es');
    if (q.t === 'build') add(q.w.join(' '), 'es');
  });
}

const list = [...jobs.values()];
console.log(list.length + ' phrases -> ' + base);
let done = 0, failed = 0, next = 0, limited = false;
async function worker() {
  while (next < list.length) {
    const job = list[next++];
    for (let attempt = 1; ; attempt++) {
      const r = await fetch(base + '/api.php?action=tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(job) }).catch(() => null);
      if (r && r.ok) { await r.arrayBuffer(); break; }
      // Once the day's quota is gone, don't retry: just see which of the rest are already cached.
      const msg = r ? await r.text().catch(() => '') : '';
      if (/rate limit/i.test(msg)) { if (!limited) console.log('Daily Gemini quota reached: ' + msg); limited = true; }
      if (limited) { failed++; break; }
      if (attempt === 3) { failed++; console.log('FAILED: ' + job.mode + ' | ' + job.text + ' (' + (r ? r.status : 'network') + ')'); break; }
      await new Promise(res => setTimeout(res, 4000 * attempt));
    }
    if (++done % 25 === 0) console.log(done + ' / ' + list.length);
  }
}
await Promise.all(Array.from({ length: 3 }, worker));
console.log('done: ' + (list.length - failed) + ' ok, ' + failed + ' failed');
