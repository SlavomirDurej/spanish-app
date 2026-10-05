// Spanish practice app — app logic (no build step, plain JS).
// The learner's name and other personal details come from data.js (P / ME), which reads them from .env.
const NAME = ME;
const KEY = P.storageKey || 'spanish-app-v1';
document.title = NAME + '\'s Spanish ✨';
const API = 'api.php';
const QUIZ_LEN = 10;
const PASS_SCORE = 70; // speaking score that earns a tick

// Mostly short cheers; only about one in three uses her name, so it stays special.
const PRAISE = [
  ['Great!', 'en'], ['Fantastic!', 'en'], ['Very good!', 'en'], ['Brilliant!', 'en'], ['Perfect!', 'en'], ['Spot on!', 'en'],
  ['Nice one!', 'en'], ['Amazing!', 'en'], ['¡Muy bien!', 'es'], ['¡Genial!', 'es'], ['¡Bravo!', 'es'], ['¡Fantástico!', 'es'],
  ['Great work, ' + NAME + '!', 'en'], ['Very good, ' + NAME + '!', 'en'], ['Well done, ' + NAME + '!', 'en'],
  ['Brilliant work, ' + NAME + '!', 'en'], ['You\'re a superstar, ' + NAME + '!', 'en'], ['¡Muy bien, ' + NAME + '!', 'es']
];
const NEARLY = ['Nearly!', 'So close!', 'Almost there!', 'Not quite!', 'Good try, ' + NAME + '!', 'Keep going, ' + NAME + '!'];
const LEVELS = ['Principiante', 'Exploradora', 'Estrella', 'Superestrella', 'Campeona', 'Reina del Español'];
const XP_PER_LEVEL = 120;
const BADGES = [
  { id: 'avatar', e: '🎨', n: 'Made my avatar' },
  { id: 'first', e: '🌱', n: 'First quiz' },
  { id: 'perfect', e: '💯', n: 'Perfect score' },
  { id: 'combo5', e: '🔥', n: '5 in a row' },
  { id: 'bookworm', e: '📖', n: 'Read a whole chapter' },
  { id: 'voice', e: '🎤', n: '5 phrases spoken' },
  { id: 'rosa', e: '💬', n: 'Mission with Rosa' },
  { id: 'streak3', e: '📅', n: '3-day streak' },
  { id: 'all6', e: '🗺️', n: 'A star in every chapter' },
  { id: 'queen', e: '👑', n: 'Every single star' }
];

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  for (const k in attrs || {}) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(kid));
  }
  return el;
}
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const rand = a => a[Math.floor(Math.random() * a.length)];
const dayStr = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

// ---------- saved progress ----------
const S = Object.assign({ xp: 0, streak: { last: '', n: 0 }, ch: {}, badges: [], sound: true }, load());
function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* private mode */ } }
function chS(id) { return S.ch[id] || (S.ch[id] = { seen: [], stars: 0, best: 0, plays: 0, speak: {} }); }
const level = () => Math.floor(S.xp / XP_PER_LEVEL);
const levelName = () => LEVELS[Math.min(level(), LEVELS.length - 1)];
const spokenCount = id => Object.values(chS(id).speak).filter(v => v >= PASS_SCORE).length;
// Each chapter has three quiz stars, plus a fourth for its chat mission with Rosa (when live chat is switched on).
const maxStars = () => (AI.chat ? 4 : 3);
const chatStar = id => (AI.chat && (S.chat || {})[id] ? 1 : 0);
const chStars = id => chS(id).stars + chatStar(id);
const totalStars = () => CHAPTERS.reduce((n, c) => n + chStars(c.id), 0);
function chProgress(c) {
  const s = chS(c.id);
  const parts = [[0.3, s.seen.length / c.learn.length], [0.4, s.stars / 3], [0.3, spokenCount(c.id) / c.speak.length]];
  if (AI.chat) parts.push([0.35, chatStar(c.id)]);
  const weight = parts.reduce((n, p) => n + p[0], 0);
  return Math.round(100 * parts.reduce((n, p) => n + p[0] * p[1], 0) / weight);
}

function addXP(n) {
  const before = level();
  S.xp += n;
  const today = dayStr();
  if (S.streak.last !== today) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    S.streak.n = S.streak.last === dayStr(y) ? S.streak.n + 1 : 1;
    S.streak.last = today;
    if (S.streak.n >= 3) award('streak3');
  }
  save();
  floatPoints(n);
  renderTop(S.xp - n);
  if (level() > before) {
    toast('⬆️ Level up! You are now: ' + levelName());
    confetti(140);
    sfx('win');
  }
}
function award(id) {
  if (S.badges.includes(id)) return;
  S.badges.push(id);
  save();
  const b = BADGES.find(x => x.id === id);
  setTimeout(() => { toast('🏅 New badge: ' + b.e + ' ' + b.n); confetti(60); }, 900);
}
function checkBadges() {
  if (CHAPTERS.every(c => chS(c.id).stars > 0)) award('all6');
  if (totalStars() === CHAPTERS.length * maxStars()) award('queen');
  if (CHAPTERS.reduce((n, c) => n + spokenCount(c.id), 0) >= 5) award('voice');
}

// ---------- sound: sfx, Gemini voice, browser fallback ----------
const AI = { ready: false, chat: false, voices: [], listeners: [], voice: 'browser', listen: 'browser' };
fetch(API + '?action=status').then(r => r.json()).then(j => {
  Object.assign(AI, { ready: !!j.ai, chat: !!j.chat, voices: j.voices || [], listeners: j.listeners || [], voice: j.voice, listen: j.listen });
  // the first screen was drawn before we knew whether Rosa is available
  if (AI.chat) { renderTop(); if ($('.mapwrap')) home(); }
}).catch(() => { });

// What the Settings popup offers. 'browser' needs no AI at all.
const VOICE_CHOICES = [
  ['gemini-lite', 'Gemini Flash-Lite', 'Google · warm teacher voice, gets properly excited when you win'],
  ['gemini', 'Gemini Flash', 'Google · the richest, most expressive voice (a little slower)'],
  ['mai', 'Marta & Emily', 'Microsoft · Marta from Spain for Spanish, Emily from Britain for cheering'],
  ['grok', 'Eve', 'Grok · one bright, chatty voice for both languages'],
  ['kokoro', 'Dora', 'Kokoro · tiny and super quick, a bit more robotic'],
  ['browser', 'This device\'s voice', 'Built into the tablet or computer · works with no AI']
];
const LISTEN_CHOICES = [
  ['gpt-mini', 'GPT-4o mini', 'OpenAI · answers in under a second, then a pronunciation tip follows'],
  ['gemini-flash', 'Gemini Flash', 'Google · also scores how clear you sound, but takes about 4 seconds'],
  ['gemini-transcribe', 'Gemini Transcribe', 'Google · careful word-for-word listener, tip follows'],
  ['whisper', 'Whisper Turbo', 'OpenAI · the cheapest, sometimes mishears English as Spanish'],
  ['browser', 'This device\'s ears', 'Built into the browser · works with no AI (Chrome only)']
];
// The saved choice if it is still available, otherwise the server's default.
const chosen = (key, available, fallback) => {
  const v = (S.settings || {})[key];
  return v === 'browser' || available.includes(v) ? v : (available.includes(fallback) ? fallback : available[0] || 'browser');
};
const voiceId = () => chosen('voice', AI.voices, AI.voice);
const listenId = () => chosen('listen', AI.listeners, AI.listen);

let actx;
function sfx(kind) {
  if (!S.sound) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = { ok: [660, 880, 1320], no: [300, 240], win: [523, 659, 784, 1047, 1319], tap: [900] }[kind];
    notes.forEach((f, i) => {
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + i * 0.09;
      o.type = kind === 'no' ? 'sine' : 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
      o.connect(g).connect(actx.destination);
      o.start(t); o.stop(t + 0.3);
    });
  } catch (e) { /* no audio */ }
}

const ttsCache = new Map();
let speakSeq = 0, currentAudio = null;
function stopSpeaking() {
  speakSeq++;
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}
// The audio for a phrase in a given voice, fetched once and then kept for the rest of the visit.
async function speechUrl(text, mode, lang, voice) {
  const k = voice + '|' + mode + '|' + text;
  if (!ttsCache.has(k)) {
    const r = await fetch(API + '?action=tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, mode, lang, voice }) });
    if (!r.ok) throw new Error('tts');
    ttsCache.set(k, URL.createObjectURL(await r.blob()));
  }
  return ttsCache.get(k);
}
// For short labels that should sound the instant they are tapped: the fastest voice on offer
// (Microsoft's), whatever voice is chosen for the lessons.
const quickVoice = () => (AI.voices.includes('mai') ? 'mai' : voiceId());
// mode: 'es' Spanish teacher voice, 'praise' excited voice, 'en' friendly English
async function speak(text, mode = 'es', lang, voice = voiceId()) {
  stopSpeaking();
  const my = speakSeq;
  lang = lang || (mode === 'es' ? 'es' : 'en');
  if (voice !== 'browser') {
    try {
      const url = await speechUrl(text, mode, lang, voice);
      if (my !== speakSeq) return;
      const a = currentAudio = new Audio(url);
      await a.play();
      return new Promise(res => { a.onended = a.onpause = res; });
    } catch (e) { if (my !== speakSeq) return; }
  }
  return browserSpeak(text, lang || (mode === 'es' ? 'es' : 'en'), mode === 'praise');
}
function browserSpeak(text, lang, excited) {
  return new Promise(res => {
    if (!('speechSynthesis' in window)) return res();
    const u = new SpeechSynthesisUtterance(text);
    const want = lang === 'es' ? 'es-ES' : 'en-GB';
    const voices = speechSynthesis.getVoices();
    const v = voices.find(x => x.lang.replace('_', '-') === want) || voices.find(x => x.lang.startsWith(lang));
    if (v) u.voice = v;
    u.lang = want;
    u.rate = lang === 'es' ? 0.85 : 1.05;
    u.pitch = excited ? 1.5 : 1.15;
    u.onend = u.onerror = () => res();
    speechSynthesis.speak(u);
  });
}
let lastPraise = null;
function praise() {
  // never the same cheer twice in a row, and never two with her name back to back
  const named = p => p[0].includes(NAME);
  const pick = rand(PRAISE.filter(p => p !== lastPraise && !(lastPraise && named(lastPraise) && named(p))));
  lastPraise = pick;
  const [text, lang] = pick;
  if (S.sound) speak(text, 'praise', lang);
  return text;
}

// ---------- listening to the learner ----------
const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
function similarity(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return Math.round(100 * (1 - d[a.length][b.length] / Math.max(a.length, b.length)));
}
const toB64 = blob => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(blob); });

const NO_SPEECH_MS = 5000;  // give up if she never starts
const MAX_RECORD_MS = 10000;

// Starts listening straight away and stops by itself when she finishes the phrase.
// Returns { stop(), result: Promise<{score, heard, tip}> }.
// hooks: onStop() when listening ends, onLevel(0-1) while she speaks, onTip(text) if a better tip arrives later.
async function listenFor(target, hooks = {}) {
  const listen = listenId();
  if (listen !== 'browser' && navigator.mediaDevices && window.MediaRecorder) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    const rec = new MediaRecorder(stream), chunks = [];
    rec.ondataavailable = e => chunks.push(e.data);
    const stop = () => { if (rec.state === 'recording') rec.stop(); };
    // The mic level tells us when she has started and when she has finished, and keeps
    // a silent recording from ever being sent off to be "scored".
    let peak = 0, meter = null;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      const an = actx.createAnalyser(), buf = new Uint8Array(an.fftSize = 1024);
      actx.createMediaStreamSource(stream).connect(an);
      const t0 = performance.now();
      let floor = 0, floorN = 0, loudTicks = 0, lastLoud = 0;
      meter = setInterval(() => {
        an.getByteTimeDomainData(buf);
        let lvl = 0;
        for (const v of buf) lvl = Math.max(lvl, Math.abs(v - 128) / 128);
        const t = performance.now() - t0;
        if (t < 150) return;                        // skip the sound of the tap itself
        peak = Math.max(peak, lvl);
        if (t < 450) { floor += lvl; floorN++; }    // learn the room's background noise
        const loud = lvl > Math.min(0.2, Math.max(0.06, (floorN ? floor / floorN : 0) * 2.5));
        if (loud) { loudTicks++; lastLoud = t; }
        if (hooks.onLevel) hooks.onLevel(Math.min(1, lvl * 3));
        const spoke = loudTicks >= 3;
        if (spoke ? t - lastLoud > silenceMs() : t > NO_SPEECH_MS) stop();
      }, 50);
    } catch (e) { peak = 1; /* can't measure: she taps to stop, and the server decides */ }
    const result = new Promise((res, rej) => {
      rec.onstop = async () => {
        clearInterval(meter);
        stream.getTracks().forEach(t => t.stop());
        if (hooks.onStop) hooks.onStop();
        if (peak < 0.04) return res({ score: 0, heard: '', tip: 'I couldn\'t hear you. Hold the device closer and say it nice and loud!' });
        try {
          const blob = new Blob(chunks, { type: rec.mimeType });
          const post = (action, body) => fetch(API + '?action=' + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
          const audio = await toB64(blob);
          const j = await post('check', { audio, mime: rec.mimeType, target, listen });
          if (!j.ok) throw new Error(j.error);
          res(j);
          // Quick listeners only check the words; a proper pronunciation tip follows in the background.
          if (j.more && hooks.onTip) post('tip', { audio, mime: rec.mimeType, target }).then(t => { if (t.ok && t.tip) hooks.onTip(t.tip); }).catch(() => { });
        } catch (e) { rej(e); }
      };
    });
    rec.start();
    const timer = setTimeout(stop, MAX_RECORD_MS);
    return { stop() { clearTimeout(timer); stop(); }, result };
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) throw new Error('nomic');
  const r = new SR();
  r.lang = 'es-ES'; r.maxAlternatives = 4;
  const result = new Promise((res, rej) => {
    let done = false;
    r.onresult = e => {
      done = true;
      const alts = Array.from(e.results[0]).map(a => a.transcript);
      const best = alts.map(t => [similarity(t, target), t]).sort((a, b) => b[0] - a[0])[0];
      res({ score: best[0], heard: best[1], tip: best[0] >= PASS_SCORE ? 'Lovely Spanish!' : 'Listen again and copy the sounds slowly.' });
    };
    r.onerror = e => { done = true; rej(new Error(e.error)); };
    r.onend = () => { if (hooks.onStop) hooks.onStop(); if (!done) res({ score: 0, heard: '', tip: 'I couldn\'t hear anything — try a bit louder!' }); };
  });
  r.start();
  return { stop() { r.stop(); }, result };
}

// ---------- sparkles & confetti ----------
const fx = $('#fx'), fctx = fx.getContext('2d');
let parts = [], fxRunning = false;
const FX_COLORS = ['#ff5fa8', '#ff9ccb', '#ffd34e', '#a66bff', '#ffffff', '#ff86b9', '#7be0c3'];
const FX_SHAPES = ['★', '♥', '✦', '●', '✿'];
const isCalm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !!(S.settings || {}).calm;
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; }
addEventListener('resize', sizeFx); sizeFx();
function burst(x, y, n, power = 9) {
  if (isCalm()) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = power * (0.35 + Math.random());
    parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.4, g: 0.28, life: 1, d: 0.012 + Math.random() * 0.014,
      s: 10 + Math.random() * 16, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: rand(FX_COLORS), ch: rand(FX_SHAPES) });
  }
  if (!fxRunning) { fxRunning = true; requestAnimationFrame(tickFx); }
}
function confetti(n = 100) {
  burst(innerWidth * 0.5, innerHeight * 0.35, n, 13);
  burst(innerWidth * 0.15, innerHeight * 0.5, n / 3, 10);
  burst(innerWidth * 0.85, innerHeight * 0.5, n / 3, 10);
}
function tickFx() {
  fctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
  for (const p of parts) {
    p.vy += p.g; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; p.life -= p.d;
    fctx.save();
    fctx.globalAlpha = Math.max(0, Math.min(1, p.life * 1.6));
    fctx.translate(p.x, p.y); fctx.rotate(p.r);
    fctx.fillStyle = p.c; fctx.font = p.s + 'px sans-serif'; fctx.textAlign = 'center'; fctx.textBaseline = 'middle';
    fctx.fillText(p.ch, 0, 0);
    fctx.restore();
  }
  if (parts.length) requestAnimationFrame(tickFx); else fxRunning = false;
}
// a little sparkle wherever she taps a button
let lastTap = null;
document.addEventListener('pointerdown', e => {
  lastTap = { x: e.clientX, y: e.clientY };
  if (e.target.closest('button')) burst(e.clientX, e.clientY, 7, 4);
});
// "+10" floating up from wherever she just tapped
function floatPoints(n) {
  const at = lastTap || { x: innerWidth / 2, y: innerHeight / 2 };
  const el = h('div', { class: 'pts', style: `left:${at.x}px;top:${at.y}px` }, '+' + n);
  document.body.append(el);
  setTimeout(() => el.remove(), 1400);
}

function toast(msg) {
  const t = h('div', { class: 'toast' }, msg);
  $('#toasts').append(t);
  setTimeout(() => t.remove(), 2700);
}

// ---------- shared UI bits ----------
const app = $('#app');
let leaveHook = null; // a screen that holds something open (the live chat) sets this to tidy up when she leaves
function show(...kids) {
  if (leaveHook) { const tidy = leaveHook; leaveHook = null; tidy(); }
  stopSpeaking();
  $('.fb')?.remove();
  app.replaceChildren(h('div', { class: 'view' }, ...kids));
  scrollTo(0, 0);
}
// Pass the points total from before a win (fromXp) to animate the star, the number and the bar up to the new total.
function renderTop(fromXp) {
  const pct = xp => (xp % XP_PER_LEVEL) / XP_PER_LEVEL * 100 + '%';
  const start = fromXp == null ? S.xp : fromXp, gained = S.xp > start;
  const star = h('span', { class: 'xpstar' }, '⭐'), num = h('b', { class: 'xpnum' }, String(start)), fill = h('i', { style: 'width:' + pct(start) });
  if (gained) {
    const levelUp = Math.floor(S.xp / XP_PER_LEVEL) > Math.floor(start / XP_PER_LEVEL), t0 = performance.now();
    // wait a moment so the floating "+10" is seen leaving first
    setTimeout(() => {
      if (!fill.isConnected) return;
      star.classList.add('gain'); num.classList.add('gain');
      fill.style.width = levelUp ? '100%' : pct(S.xp);
      if (levelUp) setTimeout(() => { fill.style.transition = 'none'; fill.style.width = '0%'; fill.offsetWidth; fill.style.transition = ''; fill.style.width = pct(S.xp); }, 650);
      const target = S.xp, count = now => {
        const k = Math.min(1, (now - t0 - 350) / 600);
        num.textContent = String(Math.round(start + (target - start) * k));
        if (k < 1 && num.isConnected) requestAnimationFrame(count);
      };
      requestAnimationFrame(count);
    }, 350);
  }
  const hour = new Date().getHours();
  const hello = hour < 12 ? '¡Buenos días' : hour < 19 ? '¡Buenas tardes' : '¡Buenas noches';
  $('#top').replaceChildren(
    h('button', { class: 'brand', onclick: home, 'aria-label': 'Home' }, avEl(S.avatar), h('span', { class: 'name' }, hello + ', ' + NAME + '! 💖')),
    h('div', { class: 'pill', title: levelName() }, star, num, h('span', { class: 'xpbar' }, fill)),
    h('div', { class: 'pill flame', title: 'Day streak' }, '🔥 ' + S.streak.n),
    AI.chat ? h('button', { class: 'pill chatnav', 'aria-label': 'Chat with Rosa', onclick: chatMenu }, rosaEl('mini'), h('span', {}, 'Chat')) : null,
    h('button', { class: 'pill icon', 'aria-label': 'Sound on or off', onclick: () => { S.sound = !S.sound; save(); if (!S.sound) stopSpeaking(); renderTop(); } }, S.sound ? '🔊' : '🔇'),
    h('button', { class: 'pill icon', 'aria-label': 'Settings', onclick: () => settings() }, '⚙️')
  );
}

// ---------- settings: a popup with a side menu ----------
const PAUSES = [['quick', 'Quick', 900], ['normal', 'Normal', 1300], ['patient', 'Patient', 2000]];
// how long the Speak games wait in silence before deciding she has finished
const silenceMs = () => (PAUSES.find(p => p[0] === (S.settings || {}).pause) || PAUSES[1])[2];
const applyCalm = () => document.body.classList.toggle('calm', isCalm());

function settings(start = 'avatar') {
  if ($('.modal')) return;
  S.settings = S.settings || {};
  let page = typeof start === 'string' ? start : 'avatar';
  const close = () => { stopSpeaking(); wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };

  const group = (key, choices, available, current, tryIt) => h('div', { class: 'choices', role: 'radiogroup' }, choices.map(([id, name, about]) => {
    const ok = id === 'browser' || available.includes(id);
    return h('div', { class: 'choice' + (current() === id ? ' on' : '') + (ok ? '' : ' off') },
      h('button', { class: 'pick', role: 'radio', 'aria-checked': current() === id ? 'true' : 'false', disabled: ok ? null : '',
        onclick: () => { S.settings[key] = id; save(); sfx('tap'); draw(); } },
        h('span', { class: 'dot' }), h('span', {}, h('b', {}, name), h('small', {}, ok ? about : 'Not set up on the server yet'))),
      ok && tryIt ? h('button', { class: 'try', 'aria-label': 'Hear ' + name, onclick: () => tryIt(id) }, '▶') : null);
  }));
  const toggle = (name, about, on, set) => h('button', { class: 'toggle' + (on ? ' on' : ''), role: 'switch', 'aria-checked': String(on),
    onclick: () => { set(!on); save(); draw(); } }, h('span', { class: 'knob' }), h('span', {}, h('b', {}, name), h('small', {}, about)));

  const PAGES = {
    avatar: ['🎨', 'My avatar', () => [
      h('p', {}, 'This is you on the map and at the top of the screen.'),
      h('div', { class: 'avrow' }, avEl(S.avatar), h('button', { class: 'btn', onclick: () => { close(); avatarBuilder(); } }, 'Change my avatar ✏️')),
      h('p', { class: 'hintline' }, '🔒 Win stars to unlock the cat ears, the crown and the heart sunglasses.')]],
    voice: ['🔊', 'Speaking', () => [
      h('p', {}, 'Who reads the Spanish to you? Tap ▶ to hear each voice, then pick your favourite.'),
      group('voice', VOICE_CHOICES, AI.voices, voiceId, async id => {
        await speak('¡Hola, ' + NAME + '! ¿Qué tal?', 'es', 'es', id);
        speak('Brilliant work, ' + NAME + '!', 'praise', 'en', id);
      }),
      h('h3', {}, 'Sounds'),
      toggle('Cheers and sound effects', 'The dings and the "Well done!" voice. Spanish phrases always play when you tap them.', S.sound, v => { S.sound = v; if (!v) stopSpeaking(); renderTop(); })]],
    listen: ['🎤', 'Listening', () => [
      h('p', {}, 'Who listens when you speak in the Speak games?'),
      group('listen', LISTEN_CHOICES, AI.listeners, listenId, null),
      h('h3', {}, 'How long should I wait?'),
      h('p', {}, 'After you stop talking, I wait a moment before I check your answer.'),
      h('div', { class: 'seg', role: 'radiogroup' }, PAUSES.map(([id, name, ms]) => h('button', { class: silenceMs() === ms ? 'on' : '', role: 'radio', 'aria-checked': String(silenceMs() === ms),
        onclick: () => { S.settings.pause = id; save(); sfx('tap'); draw(); } }, h('b', {}, name), h('small', {}, (ms / 1000) + ' seconds'))))]],
    look: ['✨', 'Sparkles', () => [
      h('p', {}, 'Too much going on? You can calm things down.'),
      toggle('Sparkles, confetti and bouncing', 'Turn off for a calmer screen. The points still count just the same.', !S.settings.calm, v => { S.settings.calm = !v; applyCalm(); })]],
    data: ['💾', 'My progress', () => {
      const code = h('textarea', { class: 'codebox', rows: '3', placeholder: 'Paste a progress code here', 'aria-label': 'Progress code' });
      const msg = h('p', { class: 'hintline' });
      return [
        h('div', { class: 'databar' }, h('span', {}, '⭐ ' + S.xp + ' points'), h('span', {}, '🌟 ' + totalStars() + '/' + CHAPTERS.length * maxStars() + ' stars'),
          h('span', {}, '🔥 ' + S.streak.n + '-day streak'), h('span', {}, '🏅 ' + S.badges.length + '/' + BADGES.length + ' badges')),
        h('p', {}, 'Your progress is saved on this device only.'),
        h('h3', {}, 'Move to another device'),
        h('p', {}, 'Copy your progress code here, then paste it into Settings on the other device.'),
        h('button', { class: 'btn ghost', onclick: async () => {
          const text = btoa(unescape(encodeURIComponent(JSON.stringify(S))));
          try { await navigator.clipboard.writeText(text); msg.textContent = '✅ Copied! Now paste it on the other device.'; } catch (e) { code.value = text; code.select(); msg.textContent = 'Copy the code from the box below.'; }
        } }, '📋 Copy my progress code'),
        code,
        h('button', { class: 'btn ghost', onclick: () => {
          let data = null;
          try { data = JSON.parse(decodeURIComponent(escape(atob(code.value.trim())))); } catch (e) { /* not a code */ }
          if (!data || typeof data.xp !== 'number' || typeof data.ch !== 'object') { msg.textContent = '❌ That doesn\'t look like a progress code.'; return; }
          if (!confirm('Replace the progress on this device with the pasted one (' + data.xp + ' points)?')) return;
          localStorage.setItem(KEY, JSON.stringify(data)); location.reload();
        } }, '📥 Load this code'),
        msg,
        h('h3', {}, 'Start over'),
        h('p', {}, 'Clears all points, stars, badges and your avatar on this device.'),
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Start again from zero? All stars and points will be cleared.')) { localStorage.removeItem(KEY); location.reload(); } } }, '🗑️ Start over from zero')];
    }],
    about: ['👪', 'For grown-ups', () => [
      h('p', {}, 'A few things worth knowing about how this app works.'),
      h('ul', { class: 'facts' },
        h('li', {}, 'Progress, the avatar and these settings are stored only in this browser.'),
        h('li', {}, 'In the Speak games a short recording is sent to the chosen listening model, which turns it into text. The app compares that text with the phrase.'),
        AI.chat ? h('li', {}, 'In Chat with Rosa the microphone is streamed live to Google\'s Gemini for the length of the chat. Rosa is told the learner\'s first name, age and the family details used in the lessons, and is instructed to stay on Spanish practice.') : null,
        AI.chat ? h('li', {}, 'Everything said in a chat is shown on screen as it happens, so you can read along.') : null,
        h('li', {}, 'Voices and listening models can be changed under Speaking and Listening. "This device\'s voice" and "This device\'s ears" use no outside AI service.'))]]
  };

  const menu = h('nav', { class: 'setmenu', 'aria-label': 'Settings sections' });
  const pane = h('div', { class: 'sheet pane' });
  const draw = () => {
    menu.replaceChildren(...Object.entries(PAGES).map(([id, [icon, name]]) =>
      h('button', { class: id === page ? 'on' : '', 'aria-current': id === page ? 'page' : null, onclick: () => { page = id; pane.scrollTop = 0; draw(); } }, h('span', {}, icon), name)));
    pane.replaceChildren(h('h2', {}, PAGES[page][0] + ' ' + PAGES[page][1]), ...PAGES[page][2]().filter(Boolean));
  };
  draw();
  const wrap = h('div', { class: 'modal', onclick: e => { if (e.target === wrap) close(); } },
    h('div', { class: 'setbox', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Settings' },
      h('div', { class: 'sethead' }, h('b', {}, '⚙️ Settings'), h('button', { class: 'x', 'aria-label': 'Close settings', onclick: close }, '✕')),
      menu, pane));
  document.body.append(wrap);
  document.addEventListener('keydown', onKey);
}

const starsEl = (n, max = 3) => h('span', { class: 'stars' }, Array.from({ length: max }, (_, i) => h('span', { class: i < n ? 'on' : '' }, '★')));

// tappable Spanish phrase
function item([es, en, emoji, say]) {
  const b = h('button', { class: 'item', onclick: async () => { b.classList.add('playing'); await speak(say || es); b.classList.remove('playing'); } },
    emoji ? h('span', { class: 'e' }, emoji) : null,
    h('span', {}, h('div', { class: 'es' }, es), h('div', { class: 'en' }, en)),
    h('span', { class: 'spk' }, '🔊'));
  return b;
}

// ---------- home ----------
function home() {
  const next = CHAPTERS.find(c => chProgress(c) < 100) || CHAPTERS[0];
  show(
    h('h2', { class: 'sec' }, 'Your adventure map — tap any island'),
    levelMap(),
    h('button', { class: 'btn big', style: 'margin:18px 0 0', onclick: () => chapter(next.id) }, '▶ ' + (S.xp ? 'Keep going' : 'Start') + ': ' + next.title),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('b', {}, '⭐ ' + S.xp), h('span', {}, 'sparkle points'), h('span', { class: 'lvl' }, 'Level ' + (level() + 1) + ' · ' + levelName())),
      h('div', { class: 'stat' }, h('b', {}, '🔥 ' + S.streak.n), h('span', {}, 'day streak')),
      h('div', { class: 'stat' }, h('b', {}, '🌟 ' + totalStars() + '/' + CHAPTERS.length * maxStars()), h('span', {}, 'stars'))),
    chatHomeCard(),
    h('h2', { class: 'sec' }, 'Your badges'),
    h('div', { class: 'badges' }, BADGES.map(b => h('div', { class: 'badge' + (S.badges.includes(b.id) ? '' : ' locked') }, h('b', {}, b.e), b.n)))
  );
}

// ---------- level map: a side-scrolling sky world ----------
const MAP_W = 1760, MAP_H = 390;
const NODE_X = i => 150 + i * 250, NODE_Y = [238, 180, 246, 174, 238, 184];
const GOAL = [1620, 206];
const MAP_DECOR = [[36, 300, '🦩', 2.4], [280, 96, '🎈', 2], [520, 300, '🎸', 2], [650, 78, '🌈', 3.2], [770, 310, '🌸', 1.8],
  [1030, 86, '🪁', 2.2], [1020, 312, '💃', 2.2], [1270, 300, '🌴', 2.6], [1400, 84, '⭐', 1.8], [1500, 300, '🎶', 2]];

function waveSvg(color, base, amp, len, phase) {
  let d = 'M0 ' + MAP_H;
  for (let x = 0; x <= MAP_W; x += 20) d += ' L' + x + ' ' + Math.round(base - amp * (Math.sin(x / len + phase) + 0.5 * Math.sin(x / (len * 0.43) + phase * 2)));
  return `<svg viewBox="0 0 ${MAP_W} ${MAP_H}" preserveAspectRatio="none"><path d="${d} L${MAP_W} ${MAP_H}Z" fill="${color}"/></svg>`;
}

function levelMap() {
  const firstOpen = CHAPTERS.findIndex(c => chProgress(c) < 100);
  const cur = firstOpen < 0 ? CHAPTERS.length - 1 : firstOpen;
  const pts = CHAPTERS.map((c, i) => [NODE_X(i), NODE_Y[i]]).concat([GOAL]);
  let d = 'M' + pts[0][0] + ' ' + (pts[0][1] + 34);
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    d += ` C${x0 + 110} ${y0 + 34} ${x1 - 110} ${y1 + 34} ${x1} ${y1 + 34}`;
  }
  const trail = `<svg viewBox="0 0 ${MAP_W} ${MAP_H}"><path d="${d}" fill="none" stroke="#e58fbd" stroke-width="22" stroke-linecap="round" transform="translate(0 9)"/>`
    + `<path d="${d}" fill="none" stroke="#fff8ec" stroke-width="22" stroke-linecap="round"/>`
    + `<path d="${d}" fill="none" stroke="#ff9ccb" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 16"/></svg>`;

  const marker = h('div', { class: 'marker', style: `left:${pts[cur][0]}px;top:${pts[cur][1]}px` }, avEl(S.avatar));
  const nodes = CHAPTERS.map((c, i) => {
    const s = chS(c.id), p = chProgress(c);
    return h('button', {
      class: 'node' + (p === 100 ? ' done' : '') + (i === cur ? ' cur' : ''), style: `left:${pts[i][0]}px;top:${pts[i][1]}px`,
      'aria-label': 'Chapter ' + c.id + ': ' + c.title + ', ' + s.stars + ' of 3 stars',
      onclick: () => { marker.style.left = pts[i][0] + 'px'; marker.style.top = pts[i][1] + 'px'; marker.classList.add('hop'); setTimeout(() => chapter(c.id), isCalm() ? 0 : 560); }
    },
      h('span', { class: 'bubble' }, c.emoji, p === 100 ? h('i', {}, '👑') : null),
      h('span', { class: 'plat' }),
      h('span', { class: 'lbl' }, h('b', {}, c.id + ' · ' + c.title), starsEl(chStars(c.id), maxStars())));
  });
  const allDone = totalStars() === CHAPTERS.length * maxStars();
  const world = h('div', { class: 'world', style: `width:${MAP_W}px;height:${MAP_H}px` },
    h('div', { class: 'layer sun' }),
    h('div', { class: 'layer far', html: waveSvg('#e3ccff', 210, 46, 150, 0.6) }),
    h('div', { class: 'layer near', html: waveSvg('#ffc2df', 262, 38, 110, 2.2) }),
    [[120, 40, 1], [560, 22, 0.8], [980, 50, 1.1], [1380, 28, 0.9]].map(([x, y, sc]) => h('div', { class: 'cloud', style: `left:${x}px;top:${y}px;transform:scale(${sc})` })),
    h('div', { class: 'layer sea', html: waveSvg('#ffffff', 352, 10, 46, 1) }),
    h('div', { class: 'layer', html: trail }),
    MAP_DECOR.map(([x, y, e, size]) => h('span', { class: 'decor', style: `left:${x}px;top:${y}px;font-size:${size}rem` }, e)),
    h('div', { class: 'node goal' + (allDone ? ' done' : ''), style: `left:${GOAL[0]}px;top:${GOAL[1]}px` },
      h('span', { class: 'castle' }, '🏰'), h('span', { class: 'plat' }),
      h('span', { class: 'lbl' }, h('b', {}, allDone ? '¡Reina del Español! 👑' : '¡La meta!'), h('span', {}, '🌟 ' + totalStars() + ' / ' + CHAPTERS.length * maxStars()))),
    nodes, marker);

  const map = h('div', { class: 'map' }, world);
  map.addEventListener('scroll', () => world.style.setProperty('--sx', map.scrollLeft), { passive: true });
  const go = dir => map.scrollBy({ left: dir * 320, behavior: 'smooth' });
  requestAnimationFrame(() => { map.scrollLeft = pts[cur][0] - map.clientWidth / 2; });
  return h('div', { class: 'mapwrap' }, map,
    h('button', { class: 'mapbtn l', 'aria-label': 'Scroll map left', onclick: () => go(-1) }, '‹'),
    h('button', { class: 'mapbtn r', 'aria-label': 'Scroll map right', onclick: () => go(1) }, '›'));
}

// ---------- avatar builder ----------
const avEl = a => h('span', { class: 'av', html: avatarSVG(a) });

function avatarBuilder() {
  const a = Object.assign({}, AV_DEFAULT, S.avatar), stars = totalStars();
  let tab = 'hair';
  const preview = h('div', { class: 'av big' }), tabsEl = h('div', { class: 'avtabs' }), grid = h('div', { class: 'avgrid' });
  const unlocked = (k, i) => !(AV[k][i] && AV[k][i].stars > stars);
  const draw = () => {
    preview.innerHTML = avatarSVG(a);
    tabsEl.replaceChildren(...AV_TABS.map(([k, es, en]) =>
      h('button', { class: 'avtab' + (k === tab ? ' on' : ''), onclick: () => { tab = k; draw(); speak(es, 'es', 'es', quickVoice()); } }, h('b', {}, es), h('small', {}, en))));
    const kind = AV_TABS.find(t => t[0] === tab)[3];
    grid.className = 'avgrid ' + kind;
    grid.replaceChildren(...AV[tab].map((opt, i) => {
      const open = unlocked(tab, i);
      return h('button', { class: 'avopt' + (a[tab] === i ? ' on' : '') + (open ? '' : ' locked'), disabled: open ? null : '', 'aria-label': 'Option ' + (i + 1),
        onclick: () => { a[tab] = i; sfx('tap'); draw(); } },
        kind === 'shape' ? h('span', { class: 'av', html: avatarSVG(Object.assign({}, a, { [tab]: i })) }) : h('span', { class: 'sw', style: 'background:' + opt }),
        open ? null : h('span', { class: 'lock' }, '🔒 ' + opt.stars + ' ★'));
    }));
  };
  draw();
  // fetch the nine labels up front so each one plays the moment it is tapped
  if (quickVoice() !== 'browser') AV_TABS.forEach(t => speechUrl(t[1], 'es', 'es', quickVoice()).catch(() => { }));
  show(
    h('button', { class: 'back', onclick: home }, '← Back'),
    h('div', { class: 'card avb' },
      h('h1', {}, 'Mi avatar ✨'),
      h('p', {}, 'Make her look just like you, ' + NAME + ' — or totally different!'),
      preview, tabsEl, grid,
      h('p', { class: 'hintline' }, '🔒 Win quiz stars to unlock the special extras.'),
      h('div', { class: 'avbtns' },
        h('button', { class: 'btn ghost', onclick: () => {
          for (const [k] of AV_TABS) { const ok = AV[k].map((_, i) => i).filter(i => unlocked(k, i)); a[k] = rand(ok); }
          sfx('ok'); draw();
        } }, '🎲 Surprise me'),
        h('button', { class: 'btn', onclick: () => {
          S.avatar = a; save(); award('avatar');
          toast('¡Qué guapa, ' + NAME + '! 💖'); confetti(80); sfx('win'); home();
        } }, '¡Listo! ✓'))));
}

// ---------- chapter: learn / play / speak ----------
function chapter(id, tab = 'learn', cardIdx = 0) {
  const c = CHAPTERS.find(x => x.id === id), s = chS(id);
  const tabBtn = (k, label) => h('button', { class: 'tab' + (tab === k ? ' on' : ''), onclick: () => chapter(id, k) }, label);
  let body;

  if (tab === 'learn') {
    const card = c.learn[cardIdx], last = cardIdx === c.learn.length - 1;
    if (!s.seen.includes(cardIdx)) {
      s.seen.push(cardIdx); save();
      if (s.seen.length === c.learn.length) { addXP(20); award('bookworm'); toast('📖 Chapter read! +20 ⭐'); }
    }
    body = h('div', { class: 'card lcard' },
      h('h2', {}, h('span', { class: 'ic' }, card.icon), card.h),
      h('p', { html: card.p }),
      h('div', { class: 'items' + (card.grid ? ' grid' : '') }, card.items.map(item)),
      card.tip ? h('div', { class: 'tip', html: card.tip }) : null,
      h('div', { class: 'lnav' },
        h('button', { class: 'btn ghost', disabled: cardIdx === 0 ? '' : null, onclick: () => chapter(id, 'learn', cardIdx - 1) }, '←'),
        h('div', { class: 'dots' }, c.learn.map((_, i) => h('i', { class: i === cardIdx ? 'on' : '' }))),
        last ? h('button', { class: 'btn', onclick: () => chapter(id, 'play') }, 'Play! 🎮')
          : h('button', { class: 'btn', onclick: () => chapter(id, 'learn', cardIdx + 1) }, 'Next →')));
  } else if (tab === 'play') {
    body = h('div', { class: 'card intro center' },
      h('div', { class: 'big-em' }, '🎮'),
      h('h2', {}, s.plays ? 'Beat your best, ' + NAME + '!' : 'Quiz time, ' + NAME + '!'),
      starsEl(s.stars),
      h('p', {}, s.plays ? 'Best score: ' + s.best + '% · played ' + s.plays + (s.plays === 1 ? ' time' : ' times') : QUIZ_LEN + ' quick questions. Every game is different!'),
      h('button', { class: 'btn big', onclick: () => quiz(c) }, s.plays ? 'Play again ✨' : 'Start the quiz ✨'));
  } else if (tab === 'chat') {
    const m = CHAT_MISSIONS[c.id - 1], won = (S.chat || {})[m.id];
    body = h('div', { class: 'card intro center' },
      rosaEl('big'),
      h('h2', {}, won ? 'Mission complete! ⭐' : 'Chat with Rosa: ' + m.title),
      h('p', {}, won ? 'You won this chapter\'s chat star. Come and talk to Rosa again any time!'
        : 'Rosa asks you about this chapter and you answer out loud. Finish the mission to win the 4th star!'),
      h('div', { class: 'chips', style: 'justify-content:center;margin-bottom:16px' }, m.hints.map(t => h('span', { class: 'chip' }, t))),
      h('button', { class: 'btn big', onclick: () => chatRoom(m, () => chapter(id, 'chat')) }, won ? 'Chat again 💬' : 'Start chatting 💬'));
  } else {
    body = h('div', {},
      h('p', { class: 'center', style: 'margin-bottom:14px;color:var(--ink-soft)' }, 'Tap 🔊 to listen, then tap 🎤 and say it. I\'ll know when you\'ve finished!'),
      c.speak.map((ph, i) => speakCard(c, ph, i)));
  }

  show(
    h('button', { class: 'back', onclick: home }, '← All chapters'),
    h('div', { class: 'chead' }, h('span', { class: 'em' }, c.emoji), h('div', {}, h('h1', {}, c.title), h('p', {}, c.sub))),
    h('div', { class: 'tabs' }, tabBtn('learn', '📖 Learn'), tabBtn('play', '🎮 Play'), tabBtn('speak', '🎤 Speak'), AI.chat ? tabBtn('chat', '💬 Chat') : null),
    body);
}

function speakCard(c, [es, en], i) {
  const s = chS(c.id);
  const best = h('div', { class: 'best' });
  const res = h('div', { class: 'res', hidden: '' });
  const showBest = () => { const b = s.speak[i]; best.textContent = b >= PASS_SCORE ? '✅ Best: ' + b + '%' : ''; };
  showBest();
  let session = null, run = 0;

  const finish = (score, heard, tip) => {
    const first = !(s.speak[i] >= PASS_SCORE);
    s.speak[i] = Math.max(s.speak[i] || 0, score); save(); showBest();
    res.hidden = false;
    if (score >= PASS_SCORE) {
      const p = praise();
      sfx('ok'); confetti(score >= 90 ? 90 : 40);
      res.className = 'res good';
      res.replaceChildren(h('b', {}, '🌟 ' + score + '% — ' + p), h('div', { class: 'tipline' }, tip || ''));
      addXP(first ? 15 : 5); checkBadges();
    } else {
      sfx('no');
      res.className = 'res mid';
      res.replaceChildren(h('b', {}, '💪 ' + score + '% — ' + rand(NEARLY)),
        h('div', { class: 'tipline' }, (heard ? 'I heard: "' + heard + '". ' : '') + (tip || 'Listen again and have another go!')));
    }
  };

  const idle = () => { mic.className = 'round mic'; mic.textContent = '🎤'; mic.style.removeProperty('--lvl'); card.classList.remove('thinking'); };
  const mic = h('button', { class: 'round mic', 'aria-label': 'Record', onclick: async () => {
    if (session) { session.stop(); return; }   // tapping again still stops it by hand
    stopSpeaking();
    const mine = ++run;
    try {
      session = await listenFor(es, {
        onLevel: l => mic.style.setProperty('--lvl', l.toFixed(2)),
        // while the answer is checked: a still hourglass on the button, and the whole card shimmers
        onStop: () => { mic.className = 'round mic busy'; mic.textContent = '⏳'; mic.style.removeProperty('--lvl'); card.classList.add('thinking'); },
        onTip: tip => {
          const line = res.querySelector('.tipline');
          if (mine !== run || !line) return;
          line.textContent = tip; line.classList.add('fresh');
        }
      });
      mic.className = 'round mic rec'; mic.textContent = '👂';
      const r = await session.result;
      finish(r.score, r.heard, r.tip);
    } catch (e) {
      res.hidden = false; res.className = 'res mid';
      const denied = e && (e.name === 'NotAllowedError' || e.message === 'not-allowed');
      res.replaceChildren(
        h('div', {}, denied ? 'I need the microphone to hear you. Allow it in the browser, or…' : 'I can\'t listen on this device right now, so…'),
        h('button', { class: 'btn ghost', style: 'margin-top:8px', onclick: () => finish(PASS_SCORE, '', 'Great — saying it out loud is how you learn!') }, 'I said it out loud ✓'));
    }
    session = null; idle();
  } }, '🎤');

  const card = h('div', { class: 'card sp' },
    h('div', {}, h('div', { class: 'es' }, es), h('div', { class: 'en' }, en), best),
    h('div', { class: 'acts' }, h('button', { class: 'round', 'aria-label': 'Listen', onclick: () => speak(es) }, '🔊'), mic),
    res);
  return card;
}

// ---------- quiz ----------
function makeQuiz(c) {
  const v = c.vocab, qs = [];
  const words = pick(v, 5);
  const options = (w, f) => shuffle([w, ...pick(v.filter(x => x[f] !== w[f] && x[1 - f] !== w[1 - f]), 3)]);
  words.slice(0, 3).forEach(w => {
    const toEn = Math.random() < 0.5, f = toEn ? 1 : 0, o = options(w, f);
    qs.push({ t: 'mc', q: toEn ? 'What does this mean?' : 'How do you say this in Spanish?', big: toEn ? w[0] : w[1], say: toEn ? w[0] : null,
      o: o.map(x => x[f]), a: w[f], es: w[0] });
  });
  words.slice(3).forEach(w => qs.push({ t: 'listen', say: w[0], o: options(w, 1).map(x => x[1]), a: w[1], es: w[0] }));
  qs.push({ t: 'match', pairs: pick(v, 4) });
  pick(c.extra, QUIZ_LEN - qs.length).forEach(q => qs.push(q.o ? Object.assign({}, q, { o: shuffle(q.o) }) : q));
  return shuffle(qs);
}

function quiz(c) {
  const qs = makeQuiz(c);
  let idx = 0, right = 0, combo = 0, xp = 0;

  const next = () => { idx++; idx < qs.length ? render() : results(); };

  function feedback(ok, answerText, sayEs) {
    // lock the question: no second Check, no changing the answer (the listen buttons stay live)
    const card = $('.q');
    if (card) { card.classList.add('locked'); card.querySelectorAll('button:not(.round):not(.listenbtn)').forEach(b => { b.disabled = true; }); }
    let title;
    if (ok) {
      right++; combo++;
      const gain = 10 + Math.min(combo - 1, 5);
      xp += gain; addXP(gain);
      title = '🌟 ' + praise() + '  +' + gain;
      sfx('ok'); burst(innerWidth / 2, innerHeight * 0.6, 40, 11);
      if (combo === 5) award('combo5');
    } else {
      combo = 0;
      title = '💪 ' + rand(NEARLY);
      sfx('no');
      if (sayEs) speak(sayEs);
    }
    const c2 = $('.combo'); if (c2) { c2.textContent = combo > 1 ? '🔥 ' + combo : ''; c2.classList.add('pop'); }
    const go = h('button', { class: 'btn', onclick: next }, idx === qs.length - 1 ? 'Finish 🎉' : 'Continue →');
    document.body.append(h('div', { class: 'fb ' + (ok ? 'good' : 'oops') }, h('div', { class: 'in' },
      h('div', { class: 'txt' }, h('h3', {}, title), answerText ? h('p', {}, (ok ? '' : 'The answer is: ') + answerText) : null), go)));
    go.focus();
  }

  function choices(q, onPick) {
    const long = q.o.some(o => o.length > 14);
    return h('div', { class: 'opts' + (long ? ' long' : '') }, q.o.map(o => {
      const b = h('button', { class: 'opt', onclick: () => {
        const ok = o === q.a;
        b.classList.add(ok ? 'right' : 'wrong');
        if (!ok) Array.from(b.parentNode.children).find(x => x.textContent === q.a).classList.add('right');
        onPick(ok);
      } }, o);
      return b;
    }));
  }

  function render() {
    const q = qs[idx];
    let body;

    if (q.t === 'mc') {
      body = [h('h2', {}, q.q),
        q.big ? h('div', { class: 'bigword' }, q.big, q.say ? h('button', { class: 'round', 'aria-label': 'Listen', onclick: () => speak(q.say) }, '🔊') : null) : h('div', { style: 'height:14px' }),
        choices(q, ok => feedback(ok, q.es ? q.es + ' = ' + (q.say ? q.a : q.big) : q.a, q.es || null))];
      if (q.say) setTimeout(() => speak(q.say), 350);
    } else if (q.t === 'listen') {
      body = [h('h2', {}, 'Listen carefully! What does it mean?'),
        h('button', { class: 'listenbtn', 'aria-label': 'Play the sound', onclick: () => speak(q.say) }, '🔊'),
        choices(q, ok => feedback(ok, q.es + ' = ' + q.a, null))];
      setTimeout(() => speak(q.say), 350);
    } else if (q.t === 'gap') {
      const blank = h('span', { class: 'blank' }, ' ');
      const [pre, post] = q.s.split('___');
      const full = q.s.replace('___', q.a);
      body = [h('h2', {}, 'Fill the gap'),
        h('div', { class: 'bigword' }, h('span', {}, pre, blank, post)),
        h('p', { class: 'hint' }, q.hint),
        choices(q, ok => { blank.textContent = q.a; feedback(ok, full, full); })];
    } else if (q.t === 'match') {
      let sel = null, left = q.pairs.length, slips = 0;
      const mk = (text, pairIdx, side) => {
        const b = h('button', { class: 'opt', onclick: () => {
          if (side === 'es') speak(text);
          if (!sel || sel.side === side) { sel?.b.classList.remove('sel'); sel = { b, pairIdx, side }; b.classList.add('sel'); return; }
          const other = sel; sel = null; other.b.classList.remove('sel');
          if (other.pairIdx === pairIdx) {
            [b, other.b].forEach(x => { x.classList.add('right'); setTimeout(() => x.classList.add('gone'), 450); });
            sfx('tap');
            if (--left === 0) setTimeout(() => feedback(slips < 2, slips < 2 ? 'All matched!' : 'All matched — a few slips, but you got there.', null), 500);
          } else {
            slips++;
            [b, other.b].forEach(x => { x.classList.add('wrong'); setTimeout(() => x.classList.remove('wrong'), 450); });
          }
        } }, text);
        return b;
      };
      body = [h('h2', {}, 'Match the pairs'), h('div', { style: 'height:14px' }),
        h('div', { class: 'match' },
          h('div', { class: 'opts', style: 'grid-template-columns:1fr' }, shuffle(q.pairs.map((p, i) => mk(p[0], i, 'es')))),
          h('div', { class: 'opts', style: 'grid-template-columns:1fr' }, shuffle(q.pairs.map((p, i) => mk(p[1], i, 'en')))))];
    } else if (q.t === 'build') {
      const answer = q.w.join(' ');
      const chosen = [];
      const line = h('div', { class: 'line' });
      const check = h('button', { class: 'btn big', disabled: '', onclick: () => feedback(chosen.map(x => x.w).join(' ') === answer, answer, answer) }, 'Check ✓');
      const bank = h('div', { class: 'bank' }, shuffle(q.w.concat(q.x || [])).map(w => {
        const t = h('button', { class: 'tile', onclick: () => {
          t.classList.add('used');
          const entry = { w };
          entry.el = h('button', { class: 'tile', onclick: () => { chosen.splice(chosen.indexOf(entry), 1); entry.el.remove(); t.classList.remove('used'); check.disabled = !chosen.length; } }, w);
          chosen.push(entry); line.append(entry.el); check.disabled = false;
        } }, w);
        return t;
      }));
      body = [h('h2', {}, 'Build the sentence in Spanish'), h('div', { class: 'bigword' }, q.en), line, bank, check];
    }

    show(
      h('div', { class: 'qtop' },
        h('button', { class: 'x', 'aria-label': 'Leave quiz', onclick: () => chapter(c.id, 'play') }, '✕'),
        h('div', { class: 'qbar' }, h('i', { style: 'width:' + idx / qs.length * 100 + '%' })),
        h('div', { class: 'combo' }, combo > 1 ? '🔥 ' + combo : '')),
      h('div', { class: 'card q' }, body));
  }

  function results() {
    const pct = Math.round(right / qs.length * 100);
    const stars = pct >= 95 ? 3 : pct >= 75 ? 2 : pct >= 50 ? 1 : 0;
    const s = chS(c.id), bonus = 20 + stars * 10;
    s.plays++; s.best = Math.max(s.best, pct); s.stars = Math.max(s.stars, stars); save();
    addXP(bonus);
    award('first'); if (pct === 100) award('perfect'); checkBadges();
    const line = stars === 3 ? 'Absolutely perfect, ' + NAME + '! You are a Spanish superstar!'
      : stars === 2 ? 'Brilliant work, ' + NAME + '! So nearly perfect!'
        : stars === 1 ? 'Well done, ' + NAME + '! You are getting better every time!'
          : 'Good try, ' + NAME + '! Have a look at the Learn cards and try again!';
    show(h('div', { class: 'card result center' },
      h('div', { class: 'stars' }, [0, 1, 2].map(i => h('span', { class: i < stars ? 'on' : '' }, '★'))),
      h('h1', {}, stars ? '¡Bravo, ' + NAME + '!' : '¡Buen intento!'),
      h('p', {}, line),
      h('div', { class: 'row' }, h('div', { class: 'chip' }, '✅ ' + right + ' / ' + qs.length), h('div', { class: 'chip' }, '⭐ +' + (xp + bonus) + ' points')),
      h('div', { class: 'btns' },
        h('button', { class: 'btn big', onclick: () => quiz(c) }, 'Play again 🔁'),
        h('button', { class: 'btn ghost big', onclick: () => chapter(c.id, 'speak') }, 'Practise speaking 🎤'),
        h('button', { class: 'btn ghost big', onclick: home }, 'All chapters 🏠'))));
    if (stars) { confetti(60 + stars * 60); sfx('win'); }
    if (S.sound) setTimeout(() => speak(line, 'praise', 'en'), 500);
  }

  render();
}

// ---------- go! ----------
applyCalm();
renderTop();
home();
