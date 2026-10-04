// Lesson content for chapters 1-6 (from the "¡Resumen! I can..." page).
// vocab / items: [spanish, english, emoji?, textToSpeak?]
// extra questions:
//   gap   {t:'gap', s:'___ jirafa', hint, o:[...], a}
//   build {t:'build', en, w:[tiles in order], x:[decoy tiles]}
//   mc    {t:'mc', q, big?, o:[...], a}

const N1 = ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince'];
const N2 = ['dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro',
  'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve', 'treinta', 'treinta y uno'];
const MONTHS = [['enero', 'January'], ['febrero', 'February'], ['marzo', 'March'], ['abril', 'April'], ['mayo', 'May'], ['junio', 'June'],
  ['julio', 'July'], ['agosto', 'August'], ['septiembre', 'September'], ['octubre', 'October'], ['noviembre', 'November'], ['diciembre', 'December']];
const ALPHABET = [['A', 'a'], ['B', 'be'], ['C', 'ce'], ['D', 'de'], ['E', 'e'], ['F', 'efe'], ['G', 'ge'], ['H', 'hache'], ['I', 'i'],
  ['J', 'jota'], ['K', 'ka'], ['L', 'ele'], ['M', 'eme'], ['N', 'ene'], ['Ñ', 'eñe'], ['O', 'o'], ['P', 'pe'], ['Q', 'cu'], ['R', 'erre'],
  ['S', 'ese'], ['T', 'te'], ['U', 'u'], ['V', 'uve'], ['W', 'uve doble'], ['X', 'equis'], ['Y', 'i griega'], ['Z', 'zeta']];

// ---- About the learner ----
// The real details live in .env and arrive as PROFILE (see profile.php); these samples are used when none are set.
const P = Object.assign({
  name: 'Sofia', birthday: '2014-03-15', city: 'London', hero: 'Shakira',
  petName: 'Luna', petAge: 2, broName: 'Leo', broAge: 20, cousinName: 'Maya', cousinAge: 14, friendName: 'Ella', friendAge: 12
}, typeof PROFILE === 'undefined' ? {} : PROFILE);
const ME = P.name;
const HERO_EN = P.hero.replace(' de ', ' from ');
const [BIRTH_YEAR, BIRTH_MONTH, BIRTH_DAY] = P.birthday.split('-').map(Number);
const BIRTHDAY = { day: BIRTH_DAY, month: BIRTH_MONTH, year: BIRTH_YEAR };
const NUM = n => [...N1, ...N2][n - 1] || String(n);
const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const AGE = (() => {
  const t = new Date();
  const had = t.getMonth() + 1 > BIRTHDAY.month || (t.getMonth() + 1 === BIRTHDAY.month && t.getDate() >= BIRTHDAY.day);
  return t.getFullYear() - BIRTHDAY.year - (had ? 0 : 1);
})();
const AGE_ES = NUM(AGE);
const BDAY_DAY = NUM(BIRTHDAY.day);
const BDAY_MONTH = MONTHS[BIRTHDAY.month - 1]; // [spanish, english]
const BDAY_ES = 'Mi cumpleaños es el ' + BDAY_DAY + ' de ' + BDAY_MONTH[0] + '.';
const BDAY_EN = 'My birthday is the ' + ordinal(BIRTHDAY.day) + ' of ' + BDAY_MONTH[1] + '.';
const PET = { name: P.petName, age: +P.petAge };          // a cat
const BRO = { name: P.broName, age: +P.broAge };          // stepbrother
const COUSIN = { name: P.cousinName, age: +P.cousinAge };
const FRIEND = { name: P.friendName, age: +P.friendAge }; // best friend
// "Sofia" -> "S-O-F-I-A" and "ese, o, efe, i, a"
const letters = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z]/g, '').split('');
const spellDash = s => letters(s).join('-');
const spellNames = s => letters(s).map(l => ALPHABET.find(x => x[0] === l)[1]).join(', ');
const yrs = p => p.name + ' tiene ' + NUM(p.age) + ' años.';

const CHAPTERS = [
  {
    id: 1, emoji: '👋', title: '¡Hola!', sub: 'Hello, names & how you feel',
    learn: [
      {
        h: 'Hello & goodbye', icon: '👋',
        p: 'Start every chat like a Spanish superstar. Tap a bubble to hear it!',
        items: [['¡Hola!', 'Hello!', '👋'], ['¡Adiós!', 'Goodbye!', '🙋‍♀️'], ['¡Hasta luego!', 'See you later!', '😊']],
        tip: 'Spanish uses an upside-down <b>¡</b> at the start of an exclamation. Cute, right?'
      },
      {
        h: 'Asking questions', icon: '❓',
        p: 'Questions start with an upside-down <b>¿</b>. Here are two you can ask anyone.',
        items: [['¿Cómo te llamas?', 'What are you called?', '🗣️'], ['Me llamo ' + ME + '.', 'I am called ' + ME + '.', '💖'],
          ['¿Dónde vives?', 'Where do you live?', '🏠'], ['Vivo en ' + P.city + '.', 'I live in ' + P.city + '.', '📍']],
        tip: '<b>ll</b> sounds like the English <b>y</b> — so <i>llamo</i> is "YAH-mo".'
      },
      {
        h: 'How are you?', icon: '😊',
        p: 'Someone asks <b>¿Qué tal?</b> — pick the answer that matches your mood.',
        items: [['¿Qué tal?', 'How are you?', '💬'], ['fenomenal', 'great', '🤩'], ['bien', 'well / good', '🙂'], ['regular', 'so-so', '😐'], ['fatal', 'awful', '😫']]
      },
      {
        h: 'Four ways to say "the"', icon: '🦒',
        p: 'English has one "the". Spanish has four! It depends on whether the word is a boy word or a girl word, and if there is one or many.',
        items: [['el búfalo', 'the buffalo (boy word, one)', '🐃'], ['la jirafa', 'the giraffe (girl word, one)', '🦒'],
          ['los zorros', 'the foxes (boy word, many)', '🦊'], ['las vacas', 'the cows (girl word, many)', '🐄']],
        tip: 'Words ending in <b>-o</b> are usually <b>el</b>, words ending in <b>-a</b> are usually <b>la</b>. Add <b>s</b> for many: <b>los / las</b>.'
      },
      {
        h: 'Sound it out', icon: '🔊',
        p: 'Spanish letters almost always make the same sound. Listen and copy!',
        items: [['tigre', 'tiger — "TEE-greh"', '🐯'], ['camello', 'camel — ll sounds like y', '🐫'], ['jirafa', 'giraffe — j is a breathy h', '🦒'],
          ['hola', 'hello — h is silent!', '🤫'], ['zorro', 'fox — roll the rr', '🦊']]
      }
    ],
    vocab: [['¡Hola!', 'Hello!'], ['¡Adiós!', 'Goodbye!'], ['¿Cómo te llamas?', 'What are you called?'], ['Me llamo…', 'I am called…'],
      ['¿Dónde vives?', 'Where do you live?'], ['Vivo en…', 'I live in…'], ['¿Qué tal?', 'How are you?'], ['fenomenal', 'great'],
      ['bien', 'well'], ['regular', 'so-so'], ['fatal', 'awful'], ['la jirafa', 'the giraffe'], ['los zorros', 'the foxes'],
      ['las vacas', 'the cows'], ['el búfalo', 'the buffalo'], ['el tigre', 'the tiger'], ['el camello', 'the camel']],
    extra: [
      { t: 'gap', s: '___ jirafa', hint: 'the giraffe', o: ['el', 'la', 'los', 'las'], a: 'la' },
      { t: 'gap', s: '___ zorros', hint: 'the foxes', o: ['el', 'la', 'los', 'las'], a: 'los' },
      { t: 'gap', s: '___ vacas', hint: 'the cows', o: ['el', 'la', 'los', 'las'], a: 'las' },
      { t: 'gap', s: '___ búfalo', hint: 'the buffalo', o: ['el', 'la', 'los', 'las'], a: 'el' },
      { t: 'gap', s: '___ camellos', hint: 'the camels', o: ['el', 'la', 'los', 'las'], a: 'los' },
      { t: 'gap', s: '___ llamo ' + ME + '.', hint: 'I am called ' + ME + '.', o: ['Me', 'Te', 'Yo', 'En'], a: 'Me' },
      { t: 'build', en: 'I am called ' + ME + '.', w: ['Me', 'llamo', ME + '.'], x: ['Vivo', 'tal'] },
      { t: 'build', en: 'I live in ' + P.city + '.', w: ['Vivo', 'en', P.city + '.'], x: ['Me', 'llamo'] },
      { t: 'build', en: 'What are you called?', w: ['¿Cómo', 'te', 'llamas?'], x: ['vives?', 'tal'] },
      { t: 'mc', q: 'In Spanish, the letter H is…', o: ['silent', 'like "ch"', 'very loud', 'like "j"'], a: 'silent' },
      { t: 'mc', q: 'How does "ll" sound in camello?', o: ['like y in "yes"', 'like l in "lemon"', 'like sh', 'it is silent'], a: 'like y in "yes"' },
      { t: 'mc', q: 'You feel amazing today! ¿Qué tal?', o: ['fenomenal', 'fatal', 'regular', 'adiós'], a: 'fenomenal' }
    ],
    speak: [['¡Hola!', 'Hello!'], ['Me llamo ' + ME + '.', 'I am called ' + ME + '.'], ['¿Cómo te llamas?', 'What are you called?'],
      ['¿Qué tal?', 'How are you?'], ['Fenomenal.', 'Great.'], ['Vivo en ' + P.city + '.', 'I live in ' + P.city + '.'], ['la jirafa', 'the giraffe'], ['¡Adiós!', 'Goodbye!']]
  },
  {
    id: 2, emoji: '🌟', title: '¿Cómo eres?', sub: 'What you are like',
    learn: [
      {
        h: 'What are you like?', icon: '🌟',
        p: 'To say what kind of person you are, use <b>Soy…</b> (I am…).',
        items: [['¿Qué tipo de persona eres?', 'What kind of person are you?', '🤔'], ['Soy generosa y sincera.', 'I am generous and honest.', '💖']]
      },
      {
        h: 'Describing words', icon: '🎨',
        p: 'These are adjectives. Which ones are you?',
        items: [['generoso', 'generous', '🎁'], ['sincero', 'honest', '🤝'], ['listo', 'clever', '🧠'], ['tímido', 'shy', '🙈'],
          ['simpático', 'nice / kind', '😊'], ['divertido', 'fun', '🎉'], ['tranquilo', 'calm', '😌'], ['serio', 'serious', '🧐'], ['tonto', 'silly', '🤪']]
      },
      {
        h: 'Boy endings & girl endings', icon: '👧',
        p: 'Adjectives change their ending to match the person. Boys use <b>-o</b>, girls use <b>-a</b>.',
        items: [['Soy listo.', 'I am clever. (a boy says)', '👦'], ['Soy lista.', 'I am clever. (a girl says)', '👧'],
          ['Soy divertida.', 'I am fun. (a girl says)', '🎉'], ['Soy sincera.', 'I am honest. (a girl says)', '💖']],
        tip: ME + ', you always use the <b>-a</b> ending for yourself: generos<b>a</b>, list<b>a</b>, simpátic<b>a</b>!'
      },
      {
        h: 'The verb ser (to be)', icon: '✨',
        p: 'One little verb, three magic forms.',
        items: [['soy', 'I am', '🙋‍♀️'], ['eres', 'you are', '👉'], ['es', 'he is / she is', '🧑'],
          ['Mi amiga ' + FRIEND.name + ' es divertida.', 'My friend ' + FRIEND.name + ' is fun.', '👯‍♀️'],
          ['Mi prima ' + COUSIN.name + ' es simpática.', 'My cousin ' + COUSIN.name + ' is nice.', '💕']]
      },
      {
        h: 'Passions & heroes', icon: '🏆',
        p: 'Tell people what you love and who you look up to.',
        items: [['Mi pasión es el deporte.', 'My passion is sport.', '⚽'], ['Mi pasión es la música.', 'My passion is music.', '🎵'],
          ['Mi héroe es ' + P.hero + '.', 'My hero is ' + HERO_EN + '.', '🎤']]
      },
      {
        h: 'Joining words', icon: '🔗',
        p: 'Connectives stick your ideas together and make sentences longer.',
        items: [['y', 'and', '➕'], ['también', 'also', '👍'], ['pero', 'but', '↔️'], ['Soy lista pero tímida.', 'I am clever but shy.', '💬']]
      }
    ],
    vocab: [['soy', 'I am'], ['eres', 'you are'], ['es', 'he is / she is'], ['y', 'and'], ['también', 'also'], ['pero', 'but'],
      ['generoso', 'generous'], ['sincero', 'honest'], ['listo', 'clever'], ['tímido', 'shy'], ['simpático', 'nice'], ['divertido', 'fun'],
      ['tranquilo', 'calm'], ['serio', 'serious'], ['tonto', 'silly'], ['mi pasión', 'my passion'], ['mi héroe', 'my hero'],
      ['el deporte', 'sport'], ['la música', 'music']],
    extra: [
      { t: 'gap', s: ME + ': «Soy ___.»', hint: 'I am clever.', o: ['lista', 'listo', 'listos', 'listas'], a: 'lista' },
      { t: 'gap', s: 'Pablo: «Soy ___.»', hint: 'I am generous. (a boy)', o: ['generoso', 'generosa', 'generosas', 'genial'], a: 'generoso' },
      { t: 'gap', s: 'Yo ___ sincera.', hint: 'I am honest.', o: ['soy', 'eres', 'es', 'y'], a: 'soy' },
      { t: 'gap', s: 'Tú ___ simpático.', hint: 'You are nice.', o: ['soy', 'eres', 'es', 'pero'], a: 'eres' },
      { t: 'gap', s: 'Mi amiga ' + FRIEND.name + ' ___ divertida.', hint: 'My friend ' + FRIEND.name + ' is fun.', o: ['es', 'soy', 'eres', 'y'], a: 'es' },
      { t: 'gap', s: COUSIN.name + ' es ___.', hint: COUSIN.name + ' is clever. (she is a girl)', o: ['lista', 'listo', 'listos', 'soy'], a: 'lista' },
      { t: 'gap', s: BRO.name + ' es ___.', hint: BRO.name + ' is generous. (he is a boy)', o: ['generoso', 'generosa', 'generosas', 'eres'], a: 'generoso' },
      { t: 'gap', s: 'Mi héroe ___ ' + P.hero + '.', hint: 'My hero is ' + HERO_EN + '.', o: ['soy', 'eres', 'es', 'y'], a: 'es' },
      { t: 'gap', s: 'Soy tímida ___ simpática.', hint: 'I am shy but nice.', o: ['pero', 'y', 'también', 'es'], a: 'pero' },
      { t: 'gap', s: 'Soy generosa ___ sincera.', hint: 'I am generous and honest.', o: ['y', 'pero', 'soy', 'mi'], a: 'y' },
      { t: 'build', en: 'I am generous and honest.', w: ['Soy', 'generosa', 'y', 'sincera.'], x: ['pero', 'es'] },
      { t: 'build', en: 'My passion is music.', w: ['Mi', 'pasión', 'es', 'la', 'música.'], x: ['soy', 'héroe'] },
      { t: 'build', en: 'I am fun but shy.', w: ['Soy', 'divertida', 'pero', 'tímida.'], x: ['y', 'eres'] },
      { t: 'mc', q: 'A girl wants to say "I am calm". Which is right?', o: ['Soy tranquila.', 'Soy tranquilo.', 'Es tranquila.', 'Eres tranquilo.'], a: 'Soy tranquila.' },
      { t: 'mc', q: 'Which word means "also"?', o: ['también', 'pero', 'y', 'soy'], a: 'también' }
    ],
    speak: [['Soy generosa y sincera.', 'I am generous and honest.'], ['Soy lista.', 'I am clever.'], ['Soy divertida pero tímida.', 'I am fun but shy.'],
      ['¿Qué tipo de persona eres?', 'What kind of person are you?'], ['Mi pasión es la música.', 'My passion is music.'],
      ['Mi héroe es ' + P.hero + '.', 'My hero is ' + HERO_EN + '.'], ['También soy simpática.', 'I am also nice.'],
      ['Mi amiga ' + FRIEND.name + ' es divertida.', 'My friend ' + FRIEND.name + ' is fun.']]
  },
  {
    id: 3, emoji: '🎈', title: 'Mi familia', sub: 'Numbers 1-15, age & family',
    learn: [
      {
        h: 'Count to 15', icon: '🔢',
        p: 'Tap each number to hear it. Can you count along?',
        items: N1.map((n, i) => [n, String(i + 1)]), grid: true
      },
      {
        h: 'How old are you?', icon: '🎂',
        p: 'In Spanish you don\'t <i>be</i> an age — you <b>have</b> years!',
        items: [['¿Cuántos años tienes?', 'How old are you?', '🎂'], ['Tengo ' + AGE_ES + ' años.', 'I am ' + AGE + '. ("I have ' + AGE + ' years")', '🎈']],
        tip: 'So it is <b>Tengo</b> ' + AGE_ES + ' años — never <i>Soy</i> ' + AGE_ES + ' años.'
      },
      {
        h: 'Brothers & sisters', icon: '👫',
        p: 'Talk about who is in your family.',
        items: [['¿Tienes hermanos?', 'Do you have brothers or sisters?', '👫'], ['Tengo un hermano.', 'I have one brother.', '👦'],
          ['Tengo una hermana.', 'I have one sister.', '👧'], ['Tengo dos hermanos.', 'I have two brothers (or siblings).', '👬'],
          ['No tengo hermanos.', 'I don\'t have any brothers or sisters.', '🙅‍♀️'], ['Soy hija única.', 'I am an only child. (girl)', '👑'],
          ['Soy hijo único.', 'I am an only child. (boy)', '🤴']]
      },
      {
        h: ME + '\'s people', icon: '💖',
        p: 'Now talk about <b>your</b> family and friends. <b>Se llama</b> means "he/she is called".',
        items: [['Tengo un hermanastro. Se llama ' + BRO.name + '.', 'I have a stepbrother. He is called ' + BRO.name + '.', '👦'],
          [yrs(BRO), BRO.name + ' is ' + BRO.age + '.', '🎂'],
          ['Mi prima se llama ' + COUSIN.name + '.', 'My cousin is called ' + COUSIN.name + '.', '👧'],
          ['Mi prima ' + yrs(COUSIN), 'My cousin ' + COUSIN.name + ' is ' + COUSIN.age + '.', '🎈'],
          ['Mi amiga se llama ' + FRIEND.name + '.', 'My friend is called ' + FRIEND.name + '.', '👯‍♀️'],
          ['Mi amiga ' + yrs(FRIEND), 'My friend ' + FRIEND.name + ' is ' + FRIEND.age + '.', '🎈'],
          ['Mi gato ' + yrs(PET), 'My cat ' + PET.name + ' is ' + PET.age + '.', '🐱']],
        tip: '<b>hermanastro</b> = stepbrother · <b>prima</b> = girl cousin · <b>amiga</b> = girl friend'
      },
      {
        h: 'The verb tener (to have)', icon: '✨',
        p: 'You already used it for age and family. Here are its three forms.',
        items: [['tengo', 'I have', '🙋‍♀️'], ['tienes', 'you have', '👉'], ['tiene', 'he has / she has', '🧑']]
      }
    ],
    vocab: [...N1.map((n, i) => [n, String(i + 1)]), ['hermano', 'brother'], ['hermana', 'sister'], ['tengo', 'I have'],
      ['tienes', 'you have'], ['tiene', 'he has / she has'], ['años', 'years'],
      ['hermanastro', 'stepbrother'], ['prima', 'cousin (girl)'], ['amiga', 'friend (girl)']],
    extra: [
      { t: 'mc', q: 'Maths time!', big: 'tres + cuatro', o: ['siete', 'seis', 'ocho', 'nueve'], a: 'siete' },
      { t: 'mc', q: 'Maths time!', big: 'diez + cinco', o: ['quince', 'catorce', 'trece', 'doce'], a: 'quince' },
      { t: 'mc', q: 'Maths time!', big: 'seis + seis', o: ['doce', 'once', 'trece', 'diez'], a: 'doce' },
      { t: 'mc', q: 'Maths time!', big: 'catorce − uno', o: ['trece', 'quince', 'doce', 'once'], a: 'trece' },
      { t: 'mc', q: 'Maths time!', big: 'dos × cuatro', o: ['ocho', 'seis', 'nueve', 'diez'], a: 'ocho' },
      { t: 'gap', s: '___ ' + AGE_ES + ' años.', hint: 'I am ' + AGE + '.', o: ['Tengo', 'Soy', 'Vivo', 'Tienes'], a: 'Tengo' },
      { t: 'gap', s: 'Mi prima ' + COUSIN.name + ' ___ ' + NUM(COUSIN.age) + ' años.', hint: 'My cousin ' + COUSIN.name + ' is ' + COUSIN.age + '.', o: ['tiene', 'tengo', 'tienes', 'es'], a: 'tiene' },
      { t: 'gap', s: 'Mi amiga ' + FRIEND.name + ' tiene ___ años.', hint: FRIEND.name + ' is ' + FRIEND.age + '.', o: [NUM(FRIEND.age), NUM(FRIEND.age + 1), NUM(FRIEND.age - 1), NUM(FRIEND.age + 3)], a: NUM(FRIEND.age) },
      { t: 'mc', q: 'How old is ' + PET.name + ' the cat?', big: 'Mi gato ' + yrs(PET), o: [String(PET.age), String(PET.age + 1), String(PET.age + 3), String(PET.age + 10)], a: String(PET.age) },
      { t: 'mc', q: 'Who is ' + BRO.name + '?', big: 'Tengo un hermanastro.', o: ['my stepbrother', 'my cousin', 'my friend', 'my cat'], a: 'my stepbrother' },
      { t: 'build', en: 'My friend ' + FRIEND.name + ' is ' + FRIEND.age + '.', w: ['Mi', 'amiga', FRIEND.name, 'tiene', NUM(FRIEND.age), 'años.'], x: ['tengo'] },
      { t: 'gap', s: '¿Cuántos años ___?', hint: 'How old are you?', o: ['tienes', 'tengo', 'tiene', 'eres'], a: 'tienes' },
      { t: 'gap', s: 'Mi hermana ___ ocho años.', hint: 'My sister is eight.', o: ['tiene', 'tengo', 'tienes', 'es'], a: 'tiene' },
      { t: 'gap', s: 'Tengo una ___.', hint: 'I have one sister.', o: ['hermana', 'hermano', 'hermanos', 'años'], a: 'hermana' },
      { t: 'mc', q: 'A girl with no brothers or sisters says…', o: ['Soy hija única.', 'Soy hijo único.', 'Tengo dos hermanos.', 'Tengo una hermana.'], a: 'Soy hija única.' },
      { t: 'build', en: 'I am ' + AGE + ' years old.', w: ['Tengo', AGE_ES, 'años.'], x: ['Soy', 'dos'] },
      { t: 'build', en: 'I have two brothers.', w: ['Tengo', 'dos', 'hermanos.'], x: ['hermana', 'tienes'] },
      { t: 'build', en: 'How old are you?', w: ['¿Cuántos', 'años', 'tienes?'], x: ['tengo', 'eres'] }
    ],
    speak: [['uno, dos, tres', 'one, two, three'], ['cuatro, cinco, seis', 'four, five, six'], ['Tengo ' + AGE_ES + ' años.', 'I am ' + AGE + '.'],
      ['¿Cuántos años tienes?', 'How old are you?'], ['¿Tienes hermanos?', 'Do you have brothers or sisters?'],
      ['Tengo un hermanastro. Se llama ' + BRO.name + '.', 'I have a stepbrother. He is called ' + BRO.name + '.'],
      ['Mi prima ' + yrs(COUSIN), 'My cousin ' + COUSIN.name + ' is ' + COUSIN.age + '.'],
      ['Mi amiga ' + yrs(FRIEND), 'My friend ' + FRIEND.name + ' is ' + FRIEND.age + '.'], ['trece, catorce, quince', 'thirteen, fourteen, fifteen']]
  },
  {
    id: 4, emoji: '🎂', title: 'Mi cumpleaños', sub: 'Numbers to 31, birthdays & the alphabet',
    learn: [
      {
        h: 'Count from 16 to 31', icon: '🔢',
        p: 'Now the big numbers — just enough for every day of the month.',
        items: N2.map((n, i) => [n, String(i + 16)]), grid: true,
        tip: '16-19 start with <b>dieci-</b> (ten and…). 21-29 start with <b>veinti-</b> (twenty and…).'
      },
      {
        h: 'The months', icon: '📅',
        p: 'They look a lot like English — but in Spanish they have <b>no capital letter</b>.',
        items: MONTHS, grid: true
      },
      {
        h: 'When is your birthday?', icon: '🎂',
        p: 'The pattern is: <b>el</b> + number + <b>de</b> + month.',
        items: [['¿Cuándo es tu cumpleaños?', 'When is your birthday?', '🎁'],
          [BDAY_ES, BDAY_EN + ' (That\'s yours, ' + ME + '!)', '🎂'],
          ['Mi cumpleaños es el veintisiete de mayo.', 'My birthday is the 27th of May.', '🎈']]
      },
      {
        h: 'The Spanish alphabet', icon: '🔤',
        p: 'Tap a letter to hear its Spanish name. Look out for the extra letter <b>Ñ</b>!',
        items: ALPHABET.map(([l, name]) => [l, name, '', name]), grid: true
      },
      {
        h: 'How do you spell it?', icon: '✏️',
        p: 'Ask how to spell any word, then spell your own name.',
        items: [['¿Cómo se escribe?', 'How do you spell it?', '✏️'], ['Se escribe ' + spellDash(ME) + '.', 'It is spelt ' + spellDash(ME) + '.', '💖', 'Se escribe ' + spellNames(ME) + '.'],
          [PET.name + ' se escribe ' + spellDash(PET.name) + '.', PET.name + ' is spelt ' + spellDash(PET.name) + '.', '🐱', PET.name + ' se escribe ' + spellNames(PET.name) + '.']]
      }
    ],
    vocab: [...N2.map((n, i) => [n, String(i + 16)]), ...MONTHS, ['cumpleaños', 'birthday'], ['¿Cuándo?', 'When?']],
    extra: [
      { t: 'mc', q: 'Which letter is this?', big: 'jota', o: ['J', 'G', 'H', 'Y'], a: 'J' },
      { t: 'mc', q: 'Which letter is this?', big: 'hache', o: ['H', 'J', 'CH', 'A'], a: 'H' },
      { t: 'mc', q: 'Which letter is this?', big: 'i griega', o: ['Y', 'I', 'G', 'E'], a: 'Y' },
      { t: 'mc', q: 'Which letter is this?', big: 'uve', o: ['V', 'U', 'W', 'B'], a: 'V' },
      { t: 'mc', q: 'Which letter is this?', big: 'eñe', o: ['Ñ', 'N', 'M', 'E'], a: 'Ñ' },
      { t: 'mc', q: 'Maths time!', big: 'veinte + cinco', o: ['veinticinco', 'veintiséis', 'quince', 'treinta'], a: 'veinticinco' },
      { t: 'mc', q: 'Maths time!', big: 'treinta − dos', o: ['veintiocho', 'veintinueve', 'dieciocho', 'veintidós'], a: 'veintiocho' },
      { t: 'mc', q: 'Maths time!', big: 'diez + siete', o: ['diecisiete', 'dieciséis', 'veintisiete', 'dieciocho'], a: 'diecisiete' },
      { t: 'gap', s: 'Mi cumpleaños es el ' + BDAY_DAY + ' ___ ' + BDAY_MONTH[0] + '.', hint: BDAY_EN, o: ['de', 'en', 'el', 'y'], a: 'de' },
      { t: 'mc', q: ME + ', when is YOUR birthday?', o: ['el ' + BDAY_DAY + ' de ' + BDAY_MONTH[0], 'el dieciséis de ' + BDAY_MONTH[0], 'el ' + BDAY_DAY + ' de noviembre', 'el seis de diciembre'], a: 'el ' + BDAY_DAY + ' de ' + BDAY_MONTH[0] },
      { t: 'mc', q: BRO.name + ' is ' + BRO.age + '. Which number is that?', o: [NUM(BRO.age), NUM(BRO.age - 10), NUM(BRO.age + 1), 'treinta'], a: NUM(BRO.age) },
      { t: 'gap', s: '¿Cómo se ___?', hint: 'How do you spell it?', o: ['escribe', 'llama', 'tiene', 'es'], a: 'escribe' },
      { t: 'gap', s: '¿Cuándo es ___ cumpleaños?', hint: 'When is your birthday?', o: ['tu', 'mi', 'el', 'de'], a: 'tu' },
      { t: 'build', en: BDAY_EN, w: ['Mi', 'cumpleaños', 'es', 'el', BDAY_DAY, 'de', BDAY_MONTH[0] + '.'], x: ['tu'] },
      { t: 'build', en: 'When is your birthday?', w: ['¿Cuándo', 'es', 'tu', 'cumpleaños?'], x: ['mi', 'de'] },
      { t: 'mc', q: 'Which is written correctly in Spanish?', o: ['el dos de marzo', 'el dos de Marzo', 'el Dos de marzo', 'dos el marzo'], a: 'el dos de marzo' }
    ],
    speak: [['dieciséis, diecisiete, dieciocho', 'sixteen, seventeen, eighteen'], ['veinte, veintiuno, veintidós', 'twenty, twenty-one, twenty-two'],
      ['treinta y uno', 'thirty-one'], ['¿Cuándo es tu cumpleaños?', 'When is your birthday?'],
      [BDAY_ES, BDAY_EN], ['¿Cómo se escribe?', 'How do you spell it?'],
      ['enero, febrero, marzo', 'January, February, March'], [spellNames(ME), spellDash(ME)]]
  },
  {
    id: 5, emoji: '🐶', title: 'Mis mascotas', sub: 'Pets, colours & describing',
    learn: [
      {
        h: 'Pets!', icon: '🐾',
        p: 'Boy words use <b>un</b>, girl words use <b>una</b>.',
        items: [['un perro', 'a dog', '🐶'], ['un gato', 'a cat', '🐱'], ['un conejo', 'a rabbit', '🐰'], ['un pez', 'a fish', '🐟'],
          ['un caballo', 'a horse', '🐴'], ['un ratón', 'a mouse', '🐭'], ['un pájaro', 'a bird', '🐦'], ['una cobaya', 'a guinea pig', '🐹'],
          ['una serpiente', 'a snake', '🐍'], ['una tortuga', 'a tortoise', '🐢']]
      },
      {
        h: 'Do you have pets?', icon: '💬',
        p: 'Use <b>tengo</b> again — it is such a useful word!',
        items: [['¿Tienes mascotas?', 'Do you have pets?', '🐾'], ['Tengo un gato. Se llama ' + PET.name + '.', 'I have a cat. He is called ' + PET.name + '.', '🐱'],
          [yrs(PET), PET.name + ' is ' + PET.age + '.', '🎂'], ['Tengo un perro.', 'I have a dog.', '🐶'],
          ['Tengo un gato y una cobaya.', 'I have a cat and a guinea pig.', '🐱'], ['No tengo mascotas.', 'I don\'t have any pets.', '🙅‍♀️']]
      },
      {
        h: 'Colours', icon: '🌈',
        p: 'Tap to hear each colour. Guess which one is ' + ME + '\'s favourite…',
        items: [['rosa', 'pink', '🌸'], ['negro', 'black', '🖤'], ['blanco', 'white', '🤍'], ['marrón', 'brown', '🤎'], ['gris', 'grey', '🩶'],
          ['rojo', 'red', '❤️'], ['amarillo', 'yellow', '💛'], ['verde', 'green', '💚'], ['azul', 'blue', '💙'], ['naranja', 'orange', '🧡']]
      },
      {
        h: 'Colours match the animal', icon: '🎨',
        p: 'The colour comes <b>after</b> the animal, and its ending changes to match.',
        items: [['un gato blanco', 'a white cat', '🐱'], ['una cobaya blanca', 'a white guinea pig', '🐹'],
          ['dos gatos blancos', 'two white cats', '🐱'], ['dos cobayas blancas', 'two white guinea pigs', '🐹']],
        tip: 'Endings: <b>-o</b> (boy word), <b>-a</b> (girl word), <b>-os</b> (boy words, many), <b>-as</b> (girl words, many).'
      },
      {
        h: 'Describe your pet', icon: '💭',
        p: 'Add your opinion with <b>Creo que…</b> (I think that…) and little booster words.',
        items: [['Es negro.', 'It is black.', '🖤'], ['Creo que es muy tonto.', 'I think it is very silly.', '🤪'],
          ['Es un poco tímido.', 'It is a bit shy.', '🙈'], ['Es bastante divertido.', 'It is quite fun.', '🎉'],
          ['Creo que ' + PET.name + ' es muy divertido.', 'I think ' + PET.name + ' is very fun.', '🐱'],
          ['muy', 'very', '⬆️'], ['un poco', 'a bit', '🤏'], ['bastante', 'quite', '👌']]
      },
      {
        h: 'Describe a photo', icon: '📸',
        p: '<b>Hay</b> means "there is" or "there are". Say it like "eye".',
        items: [['En la foto hay dos mascotas.', 'In the photo there are two pets.', '📸'], ['En la foto hay un perro marrón.', 'In the photo there is a brown dog.', '🐶']]
      }
    ],
    vocab: [['un perro', 'a dog'], ['un gato', 'a cat'], ['un conejo', 'a rabbit'], ['un pez', 'a fish'], ['un caballo', 'a horse'],
      ['un ratón', 'a mouse'], ['un pájaro', 'a bird'], ['una cobaya', 'a guinea pig'], ['una serpiente', 'a snake'], ['una tortuga', 'a tortoise'],
      ['rosa', 'pink'], ['negro', 'black'], ['blanco', 'white'], ['marrón', 'brown'], ['gris', 'grey'], ['rojo', 'red'], ['amarillo', 'yellow'],
      ['verde', 'green'], ['azul', 'blue'], ['naranja', 'orange'], ['muy', 'very'], ['un poco', 'a bit'], ['bastante', 'quite'],
      ['mascotas', 'pets'], ['hay', 'there is / there are']],
    extra: [
      { t: 'gap', s: 'una cobaya ___', hint: 'a white guinea pig', o: ['blanca', 'blanco', 'blancos', 'blancas'], a: 'blanca' },
      { t: 'gap', s: 'dos gatos ___', hint: 'two black cats', o: ['negros', 'negro', 'negra', 'negras'], a: 'negros' },
      { t: 'gap', s: 'dos cobayas ___', hint: 'two white guinea pigs', o: ['blancas', 'blancos', 'blanca', 'blanco'], a: 'blancas' },
      { t: 'gap', s: 'un perro ___', hint: 'a black dog', o: ['negro', 'negra', 'negros', 'negras'], a: 'negro' },
      { t: 'gap', s: 'Es ___ tímido.', hint: 'It is very shy.', o: ['muy', 'un poco', 'hay', 'y'], a: 'muy' },
      { t: 'gap', s: 'Es ___ tonto.', hint: 'It is a bit silly.', o: ['un poco', 'muy', 'bastante', 'pero'], a: 'un poco' },
      { t: 'gap', s: 'En la foto ___ dos mascotas.', hint: 'In the photo there are two pets.', o: ['hay', 'es', 'tengo', 'soy'], a: 'hay' },
      { t: 'gap', s: 'Tengo ___ tortuga.', hint: 'I have a tortoise.', o: ['una', 'un', 'el', 'dos'], a: 'una' },
      { t: 'build', en: 'I have a white cat.', w: ['Tengo', 'un', 'gato', 'blanco.'], x: ['blanca', 'una'] },
      { t: 'build', en: 'I have a cat and he is called ' + PET.name + '.', w: ['Tengo', 'un', 'gato', 'y', 'se llama', PET.name + '.'], x: ['una', 'perro'] },
      { t: 'build', en: 'I think ' + PET.name + ' is very fun.', w: ['Creo', 'que', PET.name, 'es', 'muy', 'divertido.'], x: ['divertida', 'hay'] },
      { t: 'gap', s: PET.name + ' es un ___.', hint: PET.name + ' is a cat.', o: ['gato', 'perro', 'conejo', 'pez'], a: 'gato' },
      { t: 'gap', s: 'Mi gato ' + PET.name + ' es muy ___.', hint: 'My cat ' + PET.name + ' is very fun. (boy cat)', o: ['divertido', 'divertida', 'divertidos', 'divertidas'], a: 'divertido' },
      { t: 'build', en: 'I think it is very silly.', w: ['Creo', 'que', 'es', 'muy', 'tonto.'], x: ['hay', 'un'] },
      { t: 'build', en: 'In the photo there are two pets.', w: ['En', 'la', 'foto', 'hay', 'dos', 'mascotas.'], x: ['es'] },
      { t: 'build', en: 'I have a white guinea pig.', w: ['Tengo', 'una', 'cobaya', 'blanca.'], x: ['blanco', 'un'] },
      { t: 'mc', q: 'Where does the colour go in Spanish?', o: ['after the animal', 'before the animal', 'at the start of the sentence', 'you don\'t say it'], a: 'after the animal' }
    ],
    speak: [['Tengo un gato. Se llama ' + PET.name + '.', 'I have a cat. He is called ' + PET.name + '.'], [yrs(PET), PET.name + ' is ' + PET.age + '.'], ['¿Tienes mascotas?', 'Do you have pets?'],
      ['Es negro y marrón.', 'It is black and brown.'], ['Creo que ' + PET.name + ' es muy divertido.', 'I think ' + PET.name + ' is very fun.'],
      ['Es un poco tímido.', 'It is a bit shy.'], ['En la foto hay dos mascotas.', 'In the photo there are two pets.'], ['Mi color favorito es el rosa.', 'My favourite colour is pink.']]
  },
  {
    id: 6, emoji: '✍️', title: '¡Súper escritora!', sub: 'Make your writing sparkle',
    learn: [
      {
        h: 'From boring to sparkly', icon: '✨',
        p: 'Short sentences are fine… but look what happens when you add a little magic:',
        items: [['Tengo un gato. Se llama ' + PET.name + '.', 'I have a cat. He is called ' + PET.name + '. (a bit plain)', '😐'],
          ['Mi gato se llama ' + PET.name + ' y creo que es muy divertido, pero un poco tonto.', 'My cat is called ' + PET.name + ' and I think he is very fun, but a bit silly.', '🤩']],
        tip: 'The secret recipe has four ingredients. Swipe on to collect them all!'
      },
      {
        h: 'Ingredient 1: joining words', icon: '🔗',
        p: 'Connectives turn two short sentences into one long one.',
        items: [['y', 'and', '➕'], ['pero', 'but', '↔️'], ['también', 'also', '👍'], ['Tengo un perro y también un gato.', 'I have a dog and also a cat.', '🐶']]
      },
      {
        h: 'Ingredient 2: booster words', icon: '🚀',
        p: 'Intensifiers say <i>how much</i>.',
        items: [['muy', 'very', '⬆️'], ['bastante', 'quite', '👌'], ['un poco', 'a bit', '🤏'], ['Soy bastante lista.', 'I am quite clever.', '🧠']]
      },
      {
        h: 'Ingredient 3: different verbs', icon: '🎭',
        p: 'Don\'t start every sentence the same way. Mix your verbs!',
        items: [['soy', 'I am', '🙋‍♀️'], ['tengo', 'I have', '🎁'], ['vivo', 'I live', '🏠'], ['es', 'he / she / it is', '🧑'], ['tienes', 'you have', '👉']]
      },
      {
        h: 'Ingredient 4: adjectives', icon: '🎨',
        p: 'Describing words add colour. Remember to match the ending!',
        items: [['Soy sincera y generosa.', 'I am honest and generous.', '💖'], ['Mi gato ' + PET.name + ' es divertido.', 'My cat ' + PET.name + ' is fun.', '🐱'], ['Mi amiga ' + FRIEND.name + ' es divertida.', 'My friend ' + FRIEND.name + ' is fun.', '👯‍♀️'], ['Mi tortuga es tranquila.', 'My tortoise is calm.', '🐢']]
      },
      {
        h: 'Check it like a teacher', icon: '🏅',
        p: 'Read your work back. Did you use a joining word? A booster? Two different verbs? An adjective with the right ending? Then you deserve…',
        items: [['¡Bravo!', 'Well done!', '👏'], ['Buen trabajo.', 'Good work.', '🏅']]
      }
    ],
    vocab: [['y', 'and'], ['pero', 'but'], ['también', 'also'], ['muy', 'very'], ['un poco', 'a bit'], ['bastante', 'quite'], ['soy', 'I am'],
      ['tengo', 'I have'], ['vivo', 'I live'], ['tienes', 'you have'], ['¡Bravo!', 'Well done!'], ['Buen trabajo.', 'Good work.'],
      ['sincera', 'honest (girl)'], ['generosa', 'generous (girl)'], ['Creo que…', 'I think that…']],
    extra: [
      { t: 'gap', s: '___ ' + AGE_ES + ' años.', hint: 'I am ' + AGE + '.', o: ['Tengo', 'Soy', 'Vivo', 'Es'], a: 'Tengo' },
      { t: 'gap', s: '___ en ' + P.city + '.', hint: 'I live in ' + P.city + '.', o: ['Vivo', 'Soy', 'Tengo', 'Es'], a: 'Vivo' },
      { t: 'gap', s: '___ generosa.', hint: 'I am generous.', o: ['Soy', 'Tengo', 'Vivo', 'Tienes'], a: 'Soy' },
      { t: 'gap', s: 'Mi gato ' + PET.name + ' ___ divertido.', hint: 'My cat ' + PET.name + ' is fun.', o: ['es', 'soy', 'tengo', 'vivo'], a: 'es' },
      { t: 'gap', s: 'Soy lista ___ divertida.', hint: 'I am clever and fun.', o: ['y', 'pero', 'muy', 'es'], a: 'y' },
      { t: 'gap', s: 'Tengo un perro y ___ un gato.', hint: 'I have a dog and also a cat.', o: ['también', 'pero', 'muy', 'soy'], a: 'también' },
      { t: 'gap', s: FRIEND.name + ' es ___ divertida.', hint: FRIEND.name + ' is very fun.', o: ['muy', 'y', 'pero', 'hay'], a: 'muy' },
      { t: 'mc', q: 'Which sentence is the most sparkly?', o: ['Soy lista y bastante divertida, pero un poco tímida.', 'Soy lista.', 'Soy lista. Soy tímida.', 'Lista.'], a: 'Soy lista y bastante divertida, pero un poco tímida.' },
      { t: 'mc', q: ME + ' writes about herself. Which is correct?', o: ['Soy sincera.', 'Soy sincero.', 'Tengo sincera.', 'Es sincero.'], a: 'Soy sincera.' },
      { t: 'mc', q: 'Your friend\'s writing is great. What do you say?', o: ['¡Bravo! Buen trabajo.', '¿Qué tal?', '¡Adiós!', 'Fatal.'], a: '¡Bravo! Buen trabajo.' },
      { t: 'build', en: 'I am generous but a bit shy.', w: ['Soy', 'generosa', 'pero', 'un poco', 'tímida.'], x: ['muy', 'tengo'] },
      { t: 'build', en: 'I have a dog and also a cat.', w: ['Tengo', 'un', 'perro', 'y', 'también', 'un', 'gato.'], x: ['pero'] },
      { t: 'build', en: 'I am called ' + ME + ' and I am ' + AGE + '.', w: ['Me', 'llamo', ME, 'y', 'tengo', AGE_ES, 'años.'], x: ['soy'] },
      { t: 'build', en: 'My cat ' + PET.name + ' is very fun.', w: ['Mi', 'gato', PET.name, 'es', 'muy', 'divertido.'], x: ['divertida', 'soy'] },
      { t: 'build', en: 'I have a stepbrother and also a cousin.', w: ['Tengo', 'un', 'hermanastro', 'y', 'también', 'una', 'prima.'], x: ['pero'] },
      { t: 'build', en: 'My friend ' + FRIEND.name + ' is quite fun.', w: ['Mi', 'amiga', FRIEND.name, 'es', 'bastante', 'divertida.'], x: ['divertido', 'tengo'] }
    ],
    speak: [['Me llamo ' + ME + ' y tengo ' + AGE_ES + ' años.', 'I am called ' + ME + ' and I am ' + AGE + '.'], ['Soy generosa y bastante divertida.', 'I am generous and quite fun.'],
      ['Soy lista pero un poco tímida.', 'I am clever but a bit shy.'], ['Tengo un gato y se llama ' + PET.name + '.', 'I have a cat and he is called ' + PET.name + '.'],
      ['Mi gato ' + PET.name + ' es muy divertido.', 'My cat ' + PET.name + ' is very fun.'],
      ['Mi amiga ' + FRIEND.name + ' es bastante divertida.', 'My friend ' + FRIEND.name + ' is quite fun.'],
      [BDAY_ES, BDAY_EN], ['¡Bravo! Buen trabajo.', 'Well done! Good work.']]
  }
];
