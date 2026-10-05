# Spanish practice app

A pink, gamified Spanish practice app built for one child, covering the six beginner chapters of a school
"¡Resumen! I can…" page: greetings, describing yourself, family and age, birthdays and the alphabet, pets and
colours, and writing longer sentences.

- **Learn** cards where every Spanish phrase can be tapped to hear it
- **Play** quizzes: multiple choice, listening, fill-the-gap, match-the-pairs, build-the-sentence
- **Speak** practice that listens, stops by itself when the learner finishes, and scores what was said
- **Chat with Rosa**: a live spoken conversation with a flamingo tutor (Gemini Live), in six guided missions
- Points, levels, stars, badges, a day streak, an avatar builder and a side-scrolling level map
- A Settings popup to switch between AI voices and listening models

The lessons are personalised (name, age, home town, pet, family, best friend), but none of that is in the code:
it all comes from `.env`, alongside the API keys.

## How it works

- `site/spanish/` — the whole app: plain HTML/CSS/JS, no build step.
  - `data.js` — lesson content. The "About the learner" block near the top reads the personal details and feeds
    every chapter; age is worked out from the birthday.
  - `app.js` — screens, quizzes, speaking practice, level map, settings. Progress is saved in the browser's localStorage.
  - `avatar.js` — the avatar drawing (layered SVG) and its options.
  - `chat.js` + `pcm-worklet.js` — Chat with Rosa. The browser streams the microphone straight to Gemini Live over a
    WebSocket using a single-use, short-lived token from `api.php`. Rosa's instructions, the missions and the
    learner's details are built in `api.php` (`rosa_prompt`, `MISSIONS`) and locked into that token.
  - `profile.php` — serves the personal details from `.env` to the page.
  - `api.php` — server-side proxy to OpenRouter and Google Gemini, so the API keys never reach the browser. The
    `VOICES` and `LISTENERS` lists at the top are what the Settings popup can switch between. Generated audio is
    cached in `spanish/cache/`.
- `.env` — API keys, personal details and settings. Not committed; blocked from the web by `site/.htaccess`.
- `tools/` — packaging, single-file upload and audio pre-generation scripts.

Without any API key the app still works, using the browser's own voice and speech recognition.

## Set up

1. Copy `.env.example` to `.env` and fill it in. At minimum set the learner's details; add an
   [OpenRouter](https://openrouter.ai/keys) key for the AI voices and listeners, and optionally a
   [Google AI Studio](https://aistudio.google.com/apikey) key for the listener that gives pronunciation tips.
2. Run it locally (needs PHP):

   ```
   php -S localhost:8765 -t site
   ```

   Then open <http://localhost:8765/spanish/>. The PHP files read `.env` from the project root.

## Deploy

Any host that runs PHP with the curl extension will do. The site root needs the contents of `site/` plus `.env`.

```
node tools/package.mjs
```

builds `site_<stamp>.zip` with both. Upload and extract it in the web root, then check that
`https://your-site/.env` returns 403. After that, pre-generate the audio so nothing lags (uses `SITE_URL` from `.env`):

```
node tools/warm-cache.mjs
```

A full redeploy may replace the audio cache, so for small changes upload just the changed files instead. On
Hostinger, `tools/push.mjs` does this with the credentials from its "generate upload URL" API:

```
node tools/push.mjs <tus-url> <auth_key> <rest_auth_key> spanish/app.js spanish/styles.css
```

Bump the `?v=` numbers in `site/spanish/index.html` (and upload it too) so browsers fetch the new files.

## Privacy notes

- Voice recordings are sent to the chosen listening model (Google or an OpenRouter provider) to be transcribed.
- In Chat with Rosa the microphone is streamed live to Google for the length of the chat, and Rosa is told the
  learner's details from `.env` so she can react naturally. Everything said appears on screen as a transcript.
- The personal details in `.env` are served to anyone who can open the site, since the lessons display them.
  Keep the site URL private if that matters; the pages ask search engines not to index them.
