// Chat with Rosa: a live spoken conversation. The browser streams the microphone straight to
// Gemini Live over a WebSocket and plays Rosa's voice as it arrives. The server only hands out a
// short-lived token; Rosa's instructions (and the learner's details) are locked into that token
// on the server, so nothing here can change what she is told.
// Uses helpers from app.js (h, show, S, save, addXP, award, confetti, sfx, toast, home, chapter).

// Rosa's portrait: long dark waves, a fringe, a red headband and flower, gold hoops, on violet.
const ROSA_SVG = '<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="200" height="200" fill="#c7b3ff"/><g fill="#1f1412"><path d="M48 90 Q44 34 100 34 Q156 34 152 90 Q166 110 156 130 Q168 150 156 176 Q136 186 130 160 L70 160 Q64 186 44 176 Q32 150 44 130 Q34 110 48 90Z"/></g><path d="M89 132h22v28h-22z" fill="#e8b386"/><path d="M89 142h22v8q-11 6 -22 0z" fill="rgba(0,0,0,.13)"/><path d="M36 204 Q36 156 100 156 Q164 156 164 204Z" fill="#ffffff"/><path d="M60 170 Q100 192 140 170" fill="none" stroke="#e0314b" stroke-width="7" stroke-linecap="round"/><path d="M84 150 Q100 164 116 150" fill="none" stroke="#f2b632" stroke-width="2.5"/><circle cx="100" cy="159" r="4" fill="#f2b632"/><circle cx="54" cy="102" r="8" fill="#e8b386"/><circle cx="146" cy="102" r="8" fill="#e8b386"/><path d="M55 90 Q55 44 100 44 Q145 44 145 90 Q145 122 122 138 Q100 150 78 138 Q55 122 55 90Z" fill="#e8b386"/><circle cx="72" cy="114" r="8" fill="#ff7fb5" opacity=".32"/><circle cx="128" cy="114" r="8" fill="#ff7fb5" opacity=".32"/><ellipse cx="82" cy="98" rx="5.2" ry="5.8" fill="#4a2a1a"/><circle cx="83.6" cy="96.2" r="1.7" fill="#fff"/><path d="M75 94 Q82 87 89 94" fill="none" stroke="#3b1b2c" stroke-width="2.2" stroke-linecap="round"/><path d="M88 93 l4 -3" stroke="#3b1b2c" stroke-width="2" stroke-linecap="round"/><path d="M74 84 Q82 79 90 84" fill="none" stroke="#1f1412" stroke-width="3" stroke-linecap="round"/><ellipse cx="118" cy="98" rx="5.2" ry="5.8" fill="#4a2a1a"/><circle cx="119.6" cy="96.2" r="1.7" fill="#fff"/><path d="M111 94 Q118 87 125 94" fill="none" stroke="#3b1b2c" stroke-width="2.2" stroke-linecap="round"/><path d="M124 93 l4 -3" stroke="#3b1b2c" stroke-width="2" stroke-linecap="round"/><path d="M110 84 Q118 79 126 84" fill="none" stroke="#1f1412" stroke-width="3" stroke-linecap="round"/><path d="M97 108 Q100 111 103 108" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-linecap="round"/><path d="M87 119 Q100 131 113 119 Q100 124 87 119Z" fill="#cf2f4f"/><path d="M90 120.5 Q100 124 110 120.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><g fill="#1f1412"><path d="M51 96 Q46 36 100 36 Q154 36 149 96 L147 78 Q100 66 53 78Z"/></g><path d="M54 70 Q100 40 146 70" fill="none" stroke="#e0314b" stroke-width="8" stroke-linecap="round"/><circle cx="52" cy="118" r="8" fill="none" stroke="#f2b632" stroke-width="3"/><circle cx="148" cy="118" r="8" fill="none" stroke="#f2b632" stroke-width="3"/><g transform="translate(142 56) scale(1.15)"><circle r="8" cy="-9" fill="#e0314b" transform="rotate(0)"/><circle r="8" cy="-9" fill="#e0314b" transform="rotate(72)"/><circle r="8" cy="-9" fill="#e0314b" transform="rotate(144)"/><circle r="8" cy="-9" fill="#e0314b" transform="rotate(216)"/><circle r="8" cy="-9" fill="#e0314b" transform="rotate(288)"/><circle r="5.5" fill="#ffd34e"/></g></svg>';
const rosaEl = size => h('span', { class: 'rosa ' + size, html: ROSA_SVG });

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
    rosaEl('small'),
    h('span', {}, h('b', {}, 'Chat with Rosa'), h('small', {}, done ? done + ' of ' + CHAT_MISSIONS.length + ' missions done. Each one wins a chapter\'s 4th star!' : 'Have a real conversation in Spanish. Each mission wins a chapter\'s 4th star!')),
    h('span', { class: 'go' }, '💬'));
}

function chatMenu() {
  show(
    h('button', { class: 'back', onclick: home }, '← Home'),
    h('div', { class: 'chead' }, rosaEl('small'), h('div', {}, h('h1', {}, 'Chat with Rosa'), h('p', {}, 'Pick a mission. Rosa asks, you answer out loud!'))),
    h('div', { class: 'missions' }, CHAT_MISSIONS.map(m => h('button', { class: 'mission' + ((S.chat || {})[m.id] ? ' done' : ''), onclick: () => chatRoom(m) },
      h('span', { class: 'em' }, m.emoji), h('span', {}, h('small', {}, 'Mission ' + m.id), h('b', {}, m.title)), h('span', { class: 'tick' }, (S.chat || {})[m.id] ? '✅' : '▶')))),
    h('p', { class: 'note' }, 'Rosa needs your microphone. Each chat lasts a few minutes, and a grown-up can read everything that was said on the screen.'));
}

// back: where the ✕ and the end screen return to (the mission list, or the chapter she came from)
function chatRoom(m, back = chatMenu) {
  const AC = window.AudioContext || window.webkitAudioContext;
  // Both audio contexts are made here, inside the tap that opened the room, or browsers keep them silent.
  let playCtx = null, micCtx = null;
  try { playCtx = new AC(); micCtx = new AC({ sampleRate: 16000 }); } catch (e) { /* handled below */ }
  let ws = null, micStream = null, ended = false, opened = false, missionDone = false, turns = 0, earned = 0;
  let playAt = 0, rosaTalking = false, quietTimer = null, capTimer = null, tick = null, curIn = null, curOut = null;
  const sources = new Set();

  const rosa = rosaEl('big');
  const status = h('div', { class: 'chatstatus' }, 'Waking Rosa up…');
  const log = h('div', { class: 'chatlog', 'aria-live': 'polite' });
  const timebar = h('i', {});
  const stage = h('div', { class: 'card chatstage' }, rosa, status, h('div', { class: 'chattime' }, timebar));
  const setStatus = (text, mode) => { status.textContent = text; stage.dataset.mode = mode || ''; };

  // a bubble keeps its words in .txt, so Rosa's can carry her little portrait as well
  const bubble = who => { const b = h('div', { class: 'bubble ' + who }, who === 'bot' ? rosaEl('mini') : null); b.txt = h('span', {}); b.append(b.txt); log.append(b); return b; };
  const say = (el, text) => { el.txt.textContent += text; log.scrollTop = log.scrollHeight; };

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
      if (curIn && curIn.txt.textContent.trim()) {
        turns++;
        if (turns <= CHAT_TURN_XP_MAX) { earned += CHAT_TURN_XP; addXP(CHAT_TURN_XP); }
      }
      if (curOut && /misi[oó]n cumplida/i.test(curOut.txt.textContent)) missionDone = true;
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
      S.chat = S.chat || {}; S.chat[m.id] = true; save(); checkBadges();
      earned += CHAT_MISSION_XP; addXP(CHAT_MISSION_XP); award('rosa'); confetti(160); sfx('win');
    }
    const title = ok ? '¡Misión cumplida! 🎉' : why === 'time' ? 'Time\'s up! ⏰' : why === 'error' ? 'Rosa had to go 👋' : 'Chat finished 👋';
    const line = why === 'error' ? (detail || 'Something went wrong. Try again in a moment.')
      : turns ? 'You answered Rosa ' + turns + (turns === 1 ? ' time' : ' times') + ' in Spanish' + (earned ? ' and earned ' + earned + ' points!' : '!')
        : 'Next time, answer Rosa out loud after she asks a question.';
    stage.replaceChildren(
      rosaEl('big'), h('h2', {}, title), h('p', {}, line),
      h('div', { class: 'chatbtns' },
        h('button', { class: 'btn', onclick: () => chatRoom(m, back) }, 'Chat again 🔁'),
        h('button', { class: 'btn ghost', onclick: back }, back === chatMenu ? 'Missions' : 'Back to the chapter'),
        h('button', { class: 'btn ghost', onclick: home }, 'Home 🏠')));
    stage.dataset.mode = 'end';
  }

  show(
    h('div', { class: 'qtop' },
      h('button', { class: 'x', 'aria-label': 'Leave the chat', onclick: () => { cleanup(); back(); } }, '✕'),
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
