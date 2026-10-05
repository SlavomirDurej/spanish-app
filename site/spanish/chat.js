// Chat with Rosa: a live spoken conversation. The browser streams the microphone straight to
// Gemini Live over a WebSocket and plays Rosa's voice as it arrives. The server only hands out a
// short-lived token; Rosa's instructions (and the learner's details) are locked into that token
// on the server, so nothing here can change what she is told.
// Uses helpers from app.js (h, show, S, save, addXP, award, confetti, sfx, toast, home, chapter).

const CHAT_MISSIONS = [
  { id: 1, emoji: '👋', title: 'Say hello', hints: ['Me llamo…', 'Fenomenal · Bien · Regular', 'Vivo en…', '¡Adiós!'] },
  { id: 2, emoji: '🌟', title: 'All about me', hints: ['Soy … y …', 'Soy … pero …', 'Mi héroe es…', 'Mi pasión es…'] },
  { id: 3, emoji: '🎈', title: 'My family', hints: ['Tengo … años.', 'Tengo un hermanastro.', 'Se llama…', 'Tiene … años.'] },
  { id: 4, emoji: '🎂', title: 'Birthdays & spelling', hints: ['Mi cumpleaños es el … de …', 'Se escribe…', 'veinte, veintiuno, veintidós…'] },
  { id: 5, emoji: '🐶', title: 'My pets', hints: ['Tengo un gato.', 'Se llama…', 'Tiene … años.', 'Es blanco / negro / gris…', 'Es muy · bastante · un poco…'] },
  { id: 6, emoji: '✨', title: 'The big chat', hints: ['… y …', '… pero …', 'También…', 'Creo que…'] }
];
const CHAT_HELP = ['No entiendo. — I don\'t understand.', '¿Puedes repetir? — Can you say it again?', 'Más despacio, por favor. — Slower, please.'];
const CHAT_TURN_XP = 5, CHAT_TURN_XP_MAX = 8, CHAT_MISSION_XP = 30;

function chatHomeCard() {
  if (!AI.chat) return null;
  const done = Object.keys(S.chat || {}).length;
  return h('button', { class: 'chatcard', onclick: chatMenu },
    h('span', { class: 'rosa small' }, '🦩'),
    h('span', {}, h('b', {}, 'Chat with Rosa'), h('small', {}, done ? done + ' of ' + CHAT_MISSIONS.length + ' missions done. Talk to her again!' : 'Have a real conversation in Spanish. She talks back!')),
    h('span', { class: 'go' }, '💬'));
}

function chatMenu() {
  show(
    h('button', { class: 'back', onclick: home }, '← Home'),
    h('div', { class: 'chead' }, h('span', { class: 'em rosa small' }, '🦩'), h('div', {}, h('h1', {}, 'Chat with Rosa'), h('p', {}, 'Pick a mission. Rosa asks, you answer out loud!'))),
    h('div', { class: 'missions' }, CHAT_MISSIONS.map(m => h('button', { class: 'mission' + ((S.chat || {})[m.id] ? ' done' : ''), onclick: () => chatRoom(m) },
      h('span', { class: 'em' }, m.emoji), h('span', {}, h('small', {}, 'Mission ' + m.id), h('b', {}, m.title)), h('span', { class: 'tick' }, (S.chat || {})[m.id] ? '✅' : '▶')))),
    h('p', { class: 'note' }, 'Rosa needs your microphone. Each chat lasts a few minutes, and a grown-up can read everything that was said on the screen.'));
}

function chatRoom(m) {
  const AC = window.AudioContext || window.webkitAudioContext;
  // Both audio contexts are made here, inside the tap that opened the room, or browsers keep them silent.
  let playCtx = null, micCtx = null;
  try { playCtx = new AC(); micCtx = new AC({ sampleRate: 16000 }); } catch (e) { /* handled below */ }
  let ws = null, micStream = null, ended = false, opened = false, missionDone = false, turns = 0, earned = 0;
  let playAt = 0, rosaTalking = false, quietTimer = null, capTimer = null, tick = null, curIn = null, curOut = null;
  const sources = new Set();

  const rosa = h('div', { class: 'rosa big' }, '🦩');
  const status = h('div', { class: 'chatstatus' }, 'Waking Rosa up…');
  const log = h('div', { class: 'chatlog', 'aria-live': 'polite' });
  const timebar = h('i', {});
  const stage = h('div', { class: 'card chatstage' }, rosa, status, h('div', { class: 'chattime' }, timebar));
  const setStatus = (text, mode) => { status.textContent = text; stage.dataset.mode = mode || ''; };

  const bubble = who => { const b = h('div', { class: 'bubble ' + who }); log.append(b); return b; };
  const say = (el, text) => { el.textContent += text; log.scrollTop = log.scrollHeight; };

  function stopPlayback() {
    sources.forEach(s => { try { s.stop(); } catch (e) { /* already stopped */ } });
    sources.clear(); playAt = 0;
  }
  function onRosaQuiet() {
    rosaTalking = false; rosa.classList.remove('talking');
    if (ended) return;
    if (missionDone) return finish('mission');
    setStatus('Your turn! Say it out loud 🎤', 'listen');
  }
  // Rosa's voice arrives as little pieces of 24 kHz PCM; queue them back to back.
  function play(b64) {
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1);
    const buf = playCtx.createBuffer(1, pcm.length, 24000), ch = buf.getChannelData(0);
    for (let i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
    const src = playCtx.createBufferSource();
    src.buffer = buf; src.connect(playCtx.destination);
    playAt = Math.max(playAt, playCtx.currentTime + 0.06);
    src.start(playAt); playAt += buf.duration;
    sources.add(src);
    clearTimeout(quietTimer);
    rosaTalking = true; rosa.classList.add('talking'); setStatus('Rosa is talking…', 'talk');
    src.onended = () => { sources.delete(src); if (!sources.size) quietTimer = setTimeout(onRosaQuiet, 300); };
  }

  function onMessage(msg) {
    if (msg.setupComplete) {
      opened = true;
      setStatus('Rosa is saying hello…', 'talk');
      ws.send(JSON.stringify({ clientContent: { turns: [{ role: 'user', parts: [{ text: 'Hola' }] }], turnComplete: true } }));
      return;
    }
    if (msg.goAway) return finish('time');
    const sc = msg.serverContent;
    if (!sc) return;
    if (sc.inputTranscription && sc.inputTranscription.text) {
      if (!curIn) { curIn = bubble('me'); if (curOut) log.insertBefore(curIn, curOut); }
      say(curIn, sc.inputTranscription.text);
    }
    if (sc.outputTranscription && sc.outputTranscription.text) say(curOut || (curOut = bubble('bot')), sc.outputTranscription.text);
    for (const p of (sc.modelTurn && sc.modelTurn.parts) || []) if (p.inlineData && p.inlineData.data) play(p.inlineData.data);
    if (sc.interrupted) stopPlayback();
    if (sc.turnComplete) {
      if (curIn && curIn.textContent.trim()) {
        turns++;
        if (turns <= CHAT_TURN_XP_MAX) { earned += CHAT_TURN_XP; addXP(CHAT_TURN_XP); }
      }
      if (curOut && /misi[oó]n cumplida/i.test(curOut.textContent)) missionDone = true;
      curIn = curOut = null;
      if (!sources.size && !rosaTalking) onRosaQuiet();
    }
  }

  function cleanup() {
    ended = true;
    clearTimeout(quietTimer); clearTimeout(capTimer); clearInterval(tick);
    stopPlayback();
    if (ws) { ws.onclose = ws.onerror = ws.onmessage = null; try { ws.close(); } catch (e) { /* closed */ } }
    if (micStream) micStream.getTracks().forEach(t => t.stop());
    [micCtx, playCtx].forEach(c => { if (c && c.state !== 'closed') c.close().catch(() => { }); });
  }

  function finish(why, detail) {
    if (ended) return;
    cleanup();
    leaveHook = null;
    const ok = why === 'mission';
    if (ok) {
      S.chat = S.chat || {}; S.chat[m.id] = true; save();
      earned += CHAT_MISSION_XP; addXP(CHAT_MISSION_XP); award('rosa'); confetti(160); sfx('win');
    }
    const title = ok ? '¡Misión cumplida! 🎉' : why === 'time' ? 'Time\'s up! ⏰' : why === 'error' ? 'Rosa had to fly off 🪽' : 'Chat finished 👋';
    const line = why === 'error' ? (detail || 'Something went wrong. Try again in a moment.')
      : turns ? 'You answered Rosa ' + turns + (turns === 1 ? ' time' : ' times') + ' in Spanish' + (earned ? ' and earned ' + earned + ' points!' : '!')
        : 'Next time, answer Rosa out loud after she asks a question.';
    stage.replaceChildren(
      h('div', { class: 'rosa big' }, ok ? '🥳' : '🦩'), h('h2', {}, title), h('p', {}, line),
      h('div', { class: 'chatbtns' },
        h('button', { class: 'btn', onclick: () => chatRoom(m) }, 'Chat again 🔁'),
        h('button', { class: 'btn ghost', onclick: chatMenu }, 'Missions'),
        h('button', { class: 'btn ghost', onclick: home }, 'Home 🏠')));
    stage.dataset.mode = 'end';
  }

  show(
    h('div', { class: 'qtop' },
      h('button', { class: 'x', 'aria-label': 'Leave the chat', onclick: () => { cleanup(); chatMenu(); } }, '✕'),
      h('div', { class: 'chattitle' }, m.emoji + ' ' + m.title)),
    stage,
    h('div', { class: 'card chathints' }, h('b', {}, 'Useful words'),
      h('div', { class: 'chips' }, m.hints.map(t => h('span', { class: 'chip' }, t))),
      h('div', { class: 'helpwords' }, CHAT_HELP.map(t => h('div', {}, t)))),
    log,
    h('button', { class: 'btn ghost big', onclick: () => finish('user') }, 'Finish chat 👋'));
  leaveHook = cleanup;   // any other screen change hangs up

  (async () => {
    try {
      if (!playCtx || !micCtx || !navigator.mediaDevices || !window.AudioWorkletNode) throw new Error('This browser can\'t do live chat. Try Chrome or Safari.');
      const [tok, stream] = await Promise.all([
        fetch(API + '?action=live', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mission: m.id }) }).then(r => r.json()),
        navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } })
      ]);
      micStream = stream;
      if (ended) return cleanup();
      if (!tok.ok) throw new Error(tok.error || 'Rosa is not available right now.');
      await micCtx.audioWorklet.addModule('pcm-worklet.js?v=1');
      const node = new AudioWorkletNode(micCtx, 'pcm-worklet');
      micCtx.createMediaStreamSource(stream).connect(node);
      const silent = btoa(String.fromCharCode.apply(null, new Uint8Array(3200)));
      node.port.onmessage = e => {
        if (!opened || ended || ws.readyState !== 1) return;
        // While Rosa is speaking she is sent silence, so she never hears (and answers) herself.
        let data = silent;
        if (!rosaTalking) {
          const pcm = new Int16Array(e.data);
          let peak = 0;
          for (let i = 0; i < pcm.length; i += 16) peak = Math.max(peak, Math.abs(pcm[i]));
          stage.style.setProperty('--lvl', Math.min(1, peak / 9000).toFixed(2));
          data = btoa(String.fromCharCode.apply(null, new Uint8Array(e.data)));
        }
        ws.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: 'audio/pcm;rate=16000' } } }));
      };
      await Promise.all([micCtx.resume(), playCtx.resume()]);

      ws = new WebSocket(tok.url + '?access_token=' + encodeURIComponent(tok.token));
      ws.onopen = () => ws.send(JSON.stringify({ setup: { model: tok.model } }));
      ws.onmessage = async ev => { try { onMessage(JSON.parse(typeof ev.data === 'string' ? ev.data : await ev.data.text())); } catch (e) { /* skip a bad frame */ } };
      ws.onerror = () => finish('error');
      ws.onclose = () => finish(opened ? (missionDone ? 'mission' : 'time') : 'error');

      const total = (tok.minutes || 5) * 60e3, t0 = Date.now();
      capTimer = setTimeout(() => finish('time'), total);
      tick = setInterval(() => { timebar.style.width = Math.max(0, 100 - (Date.now() - t0) / total * 100) + '%'; }, 1000);
    } catch (e) {
      const denied = e && e.name === 'NotAllowedError';
      finish('error', denied ? 'Rosa needs the microphone. Allow it in the browser, then try again.' : (e && e.message) || null);
    }
  })();
}
