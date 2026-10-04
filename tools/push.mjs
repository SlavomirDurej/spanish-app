// Uploads individual files to the live site without a full redeploy (keeps the audio cache).
//   node tools/push.mjs <tus-url> <auth_key> <rest_auth_key> spanish/app.js spanish/api.php .env ...
// The three credentials come from Hostinger's "generate upload URL" (MCP hosting_files_generate-upload-url)
// and expire after a short while. Paths are relative to site/; ".env" is taken
// from the project root.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [url, auth, rest, ...files] = process.argv.slice(2);
if (!url || !auth || !rest || !files.length) { console.error('usage: node tools/push.mjs <url> <auth> <rest> <files...>'); process.exit(1); }

const headers = { 'X-Auth': auth, 'X-Auth-Rest': rest, 'Tus-Resumable': '1.0.0' };
let failed = 0;
for (const f of files) {
  const data = readFileSync(f === '.env' ? join(root, '.env') : join(root, 'site', f));
  const target = `${url}/${f}?override=true`;
  const create = await fetch(target, { method: 'POST', headers: { ...headers, 'Upload-Length': String(data.length), 'Upload-Offset': '0' } });
  const patch = await fetch(target, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/offset+octet-stream', 'Upload-Offset': '0' }, body: data });
  const ok = create.status === 201 && patch.status === 204;
  if (!ok) failed++;
  console.log(`${ok ? 'ok    ' : 'FAILED'} ${f} (${data.length} bytes, create=${create.status} patch=${patch.status})`);
}
process.exit(failed ? 1 : 0);
