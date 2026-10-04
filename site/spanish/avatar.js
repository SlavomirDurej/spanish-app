// The learner's avatar: a small layered SVG character.
// An avatar is a plain object of option indexes, e.g. { skin: 1, hair: 0, ... }.
const AV = {
  skin: ['#ffe3cf', '#f8cba6', '#e6ab7c', '#c88a5e', '#9a643f', '#6d4428'],
  hairColor: ['#2a1c1a', '#4b2e20', '#7b4b2c', '#c58a42', '#f1cd78', '#d8562c', '#ff6fb1', '#9b6bff', '#3fb7e6'],
  hair: ['long', 'bob', 'pony', 'bunches', 'buns', 'curly'],
  eyes: ['round', 'lashes', 'happy', 'sparkle'],
  mouth: ['smile', 'grin', 'tongue', 'ooh'],
  top: ['#ff5fa8', '#26222c', '#a66bff', '#6fdcbd', '#ffd34e', '#ffffff', '#5aa9ff'],
  motif: ['none', 'heart', 'star', 'bolt'],
  // "stars" = total quiz stars needed to unlock
  extra: [{ id: 'none' }, { id: 'bow' }, { id: 'flower' }, { id: 'glasses' }, { id: 'headphones' },
    { id: 'cat', stars: 3 }, { id: 'crown', stars: 6 }, { id: 'hearts', stars: 10 }],
  bg: ['linear-gradient(160deg,#ffd0e8,#ffc2df)', 'linear-gradient(160deg,#ff8cc3,#a66bff)', 'linear-gradient(160deg,#ffe3a8,#ff9ccb)',
    'linear-gradient(160deg,#c9f5e6,#9fdcff)', 'linear-gradient(160deg,#e6d9ff,#ffd0e8)', 'linear-gradient(160deg,#2a2233,#6b2a5c)']
};
const AV_DEFAULT = { skin: 1, hairColor: 2, hair: 0, eyes: 1, mouth: 0, top: 0, motif: 1, extra: 1, bg: 0 };
// Builder tabs, labelled in Spanish so the words sink in.
const AV_TABS = [
  ['skin', 'la piel', 'skin', 'color'], ['hair', 'el pelo', 'hair', 'shape'], ['hairColor', 'el color', 'hair colour', 'color'],
  ['eyes', 'los ojos', 'eyes', 'shape'], ['mouth', 'la boca', 'mouth', 'shape'], ['top', 'la ropa', 'clothes', 'color'],
  ['motif', 'el dibujo', 'picture', 'shape'], ['extra', 'los extras', 'extras', 'shape'], ['bg', 'el fondo', 'background', 'bg']
];

function avatarSVG(a) {
  a = Object.assign({}, AV_DEFAULT, a);
  const skin = AV.skin[a.skin], hc = AV.hairColor[a.hairColor], top = AV.top[a.top], ink = '#4b1f3d';
  const style = AV.hair[a.hair], extra = AV.extra[a.extra].id;
  const cap = '<path d="M51 96 Q46 36 100 36 Q154 36 149 96 Q146 70 124 62 Q100 70 70 64 Q56 72 51 96Z"/>';
  const fringe = '<path d="M51 96 Q46 36 100 36 Q154 36 149 96 L147 78 Q100 66 53 78Z"/>';
  const dots = pts => pts.map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]}"/>`).join('');
  const HAIR = {
    long: ['<path d="M48 90 Q44 34 100 34 Q156 34 152 90 L160 172 Q136 182 130 160 L70 160 Q64 182 40 172Z"/>', fringe],
    bob: ['<path d="M46 92 Q44 34 100 34 Q156 34 154 92 Q160 138 136 142 L64 142 Q40 138 46 92Z"/>', cap],
    pony: ['<path d="M138 44 Q186 40 182 104 Q180 140 160 156 Q170 116 150 84Z"/><circle cx="147" cy="52" r="8" fill="#ff5fa8"/>', cap],
    bunches: ['<path d="M52 78 Q18 84 24 134 Q28 156 46 152 Q40 124 58 104Z"/><path d="M148 78 Q182 84 176 134 Q172 156 154 152 Q160 124 142 104Z"/>'
      + '<circle cx="50" cy="84" r="7" fill="#ff5fa8"/><circle cx="150" cy="84" r="7" fill="#ff5fa8"/>', fringe],
    buns: [dots([[62, 40, 18], [138, 40, 18]]), cap],
    curly: [dots([[56, 70, 22], [48, 100, 22], [56, 130, 20], [144, 70, 22], [152, 100, 22], [144, 130, 20], [78, 44, 22], [122, 44, 22], [100, 38, 22]]),
      dots([[68, 62, 14], [89, 54, 14], [111, 54, 14], [132, 62, 14]])]
  }[style];

  const eye = x => ({
    round: `<circle cx="${x}" cy="98" r="5" fill="${ink}"/><circle cx="${x + 1.6}" cy="96.4" r="1.6" fill="#fff"/>`,
    lashes: `<circle cx="${x}" cy="98" r="5.4" fill="${ink}"/><circle cx="${x + 1.6}" cy="96.4" r="1.7" fill="#fff"/>`
      + `<path d="M${x - 6} 93l-3 -3M${x} 91.5v-4M${x + 6} 93l3 -3" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>`,
    happy: `<path d="M${x - 6} 100 Q${x} 91 ${x + 6} 100" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    sparkle: `<circle cx="${x}" cy="98" r="6.6" fill="${ink}"/><circle cx="${x + 2}" cy="95.6" r="2.3" fill="#fff"/><circle cx="${x - 2.2}" cy="100.4" r="1.2" fill="#fff"/>`
  })[AV.eyes[a.eyes]];
  const mouth = {
    smile: `<path d="M88 117 Q100 128 112 117" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    grin: `<path d="M86 115 Q100 133 114 115Z" fill="#7a2148"/><path d="M89 116 Q100 121 111 116Z" fill="#fff"/>`,
    tongue: `<path d="M86 115 Q100 133 114 115Z" fill="#7a2148"/><ellipse cx="100" cy="124" rx="6" ry="4.5" fill="#ff7fb5"/>`,
    ooh: `<ellipse cx="100" cy="120" rx="5" ry="6" fill="#7a2148"/>`
  }[AV.mouth[a.mouth]];

  const mc = top === '#ffffff' ? '#ff5fa8' : '#ffffff';
  const motif = {
    none: '',
    heart: `<path transform="translate(100 183)" d="M0 7 C-14 -5 -6 -13 0 -5 C6 -13 14 -5 0 7Z" fill="${mc}"/>`,
    star: `<path transform="translate(100 182)" d="M0 -10 L3 -3 L10 -3 L4.5 1.5 L6.5 9 L0 4.5 L-6.5 9 L-4.5 1.5 L-10 -3 L-3 -3Z" fill="${mc}"/>`,
    bolt: `<path transform="translate(100 182)" d="M3 -11 L-7 2 L-1 2 L-3 11 L7 -2 L1 -2Z" fill="${mc}"/>`
  }[AV.motif[a.motif]];

  const heart = 'M0 8 C-16 -6 -7 -15 0 -6 C7 -15 16 -6 0 8Z';
  const acc = {
    none: '',
    bow: '<g transform="translate(138 52) rotate(20)"><path d="M0 0 L-19 -12 Q-23 0 -19 12Z M0 0 L19 -12 Q23 0 19 12Z" fill="#ff5fa8"/><circle r="5.5" fill="#ec3d8f"/></g>',
    flower: '<g transform="translate(62 56)">' + [0, 72, 144, 216, 288].map(d => `<circle r="7" cy="-8" fill="#fff" transform="rotate(${d})"/>`).join('') + '<circle r="5.5" fill="#ffd34e"/></g>',
    glasses: `<g fill="rgba(255,255,255,.35)" stroke="${ink}" stroke-width="3"><rect x="67" y="87" width="28" height="22" rx="10"/><rect x="105" y="87" width="28" height="22" rx="10"/><path d="M95 97h10" fill="none"/></g>`,
    headphones: `<path d="M48 100 Q46 26 100 26 Q154 26 152 100" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/>`
      + '<rect x="38" y="86" width="18" height="32" rx="9" fill="#ff5fa8"/><rect x="144" y="86" width="18" height="32" rx="9" fill="#ff5fa8"/>',
    cat: `<path d="M54 60 L58 20 L90 42Z" fill="${hc}"/><path d="M62 50 L64 31 L79 42Z" fill="#ffb3d6"/><path d="M146 60 L142 20 L110 42Z" fill="${hc}"/><path d="M138 50 L136 31 L121 42Z" fill="#ffb3d6"/>`,
    crown: '<path d="M70 42 L66 14 L86 29 L100 8 L114 29 L134 14 L130 42Z" fill="#ffd34e" stroke="#e0a400" stroke-width="2.5" stroke-linejoin="round"/>'
      + '<circle cx="100" cy="30" r="4" fill="#ff5fa8"/><circle cx="82" cy="34" r="3" fill="#7be0c3"/><circle cx="118" cy="34" r="3" fill="#7be0c3"/>',
    hearts: `<g fill="#ff5fa8" stroke="${ink}" stroke-width="2.5" stroke-linejoin="round"><path transform="translate(81 97) scale(1.05)" d="${heart}"/><path transform="translate(119 97) scale(1.05)" d="${heart}"/></g><path d="M93 95h14" stroke="${ink}" stroke-width="3"/>`
  }[extra];
  const hideEyes = extra === 'hearts';

  return `<svg class="avsvg" viewBox="0 0 200 200" style="background:${AV.bg[a.bg]}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<g fill="${hc}">${HAIR[0]}</g>
<path d="M88 132h24v28h-24z" fill="${skin}"/><path d="M88 142h24v8q-12 6 -24 0z" fill="rgba(0,0,0,.12)"/>
<path d="M36 204 Q36 156 100 156 Q164 156 164 204Z" fill="${top}"/>${motif}
<circle cx="53" cy="101" r="8" fill="${skin}"/><circle cx="147" cy="101" r="8" fill="${skin}"/>
<ellipse cx="100" cy="94" rx="47" ry="50" fill="${skin}"/>
<circle cx="70" cy="113" r="8" fill="#ff7fb5" opacity=".38"/><circle cx="130" cy="113" r="8" fill="#ff7fb5" opacity=".38"/>
${hideEyes ? '' : eye(82) + eye(118)}
<path d="M97 107 Q100 110 103 107" fill="none" stroke="rgba(0,0,0,.25)" stroke-width="2" stroke-linecap="round"/>
${mouth}
<g fill="${hc}">${HAIR[1]}</g>
${acc}
</svg>`;
}
