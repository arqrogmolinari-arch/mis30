# Rocío 30 — Party Game Hub 💖

Mobile-first realtime party hub (Vite + React + Supabase) with a Y2K/Bratz look.
Three games — a quiz about the host, "who's most likely to…", and two-truths-and-a-lie —
run from one shared room engine. Fixed room code: `ROCIO30`.

## Roles on party night
- **Big Screen** (laptop → TV): open `/screen/ROCIO30` — shows the join QR, then the live board.
- **Host** (Rocío's phone): open `/host/ROCIO30` — pick games, reveal, advance, close the night.
- **Guests** (their phones): scan the QR → `/join/ROCIO30` → tap their own face to enter.

## Run locally
1. `npm install`
2. `.env.local` is already set up with the Supabase URL + key. (Template: `.env.example`.)
3. `npm run dev` — then open the routes above. For phones on the same WiFi, use `npm run dev -- --host` and open the printed LAN URL.

## Add the real guests
1. Generate one photo per guest and drop it in `public/players/<slug>.jpg` (e.g. `public/players/rocio.jpg`).
2. Edit `src/content/players.json` — one `{ "slug", "name" }` per guest. The `slug` must match the photo filename.
3. On `/host/ROCIO30`, click **Seed players from roster** to upsert the roster into the database.
   - The seed is idempotent (safe to re-run). Re-running after editing names/photos updates existing rows.
   - Until photos are added, players show a glam gradient tile with their name — the app works fine without photos.

## Content to edit before the party
- `src/content/quiz.json` — 15–20 questions about Rocío: `{ "q", "options": [...], "correct": <index> }`.
- `src/content/most_likely.json` — an array of prompt strings.
- (Two-truths content is written live by guests at the start of that game — nothing to pre-load.)

## How each game flows (host controls)
- **Quiz:** pick the Quiz card → each question shows for 20s → "Cerrar y revelar" (awards +1 per correct) → "Siguiente" → final podium.
- **Most likely:** pick the card → guests vote (self-vote allowed) → "Cerrar votación" shows the winner + bars → "Siguiente". No scoring (social only).
- **Two truths:** pick the card → guests write 3 statements + mark the lie → host picks each player in turn → others guess the lie → "Cerrar y revelar" (+1 per correct guesser, +1 to the author per person fooled) → "Siguiente jugador".
- **Close the night:** from the lobby, "Cerrar la noche · ranking final" shows the global podium (quiz + two-truths scores). "Reiniciar puntajes" zeroes all scores.

## Party-day reminders
- If the Supabase project paused (free tier pauses after ~7 days idle), reactivate it from the dashboard beforehand.
- **Realtime cold-start:** on a freshly woken project, open `/screen/ROCIO30` a few minutes early so the Realtime service warms up before guests join.
- Have mobile-data as a backup if the house WiFi is flaky (traffic is tiny — ~18 phones).
- Deploy to any static host (Vercel/Netlify/Cloudflare Pages) for a stable QR, or run on localhost with phones on the same WiFi via `npm run dev -- --host`.

## Stack
React 19 · Vite 8 · React Router · @supabase/supabase-js (Realtime via Postgres Changes) · qrcode.react · plain CSS with design tokens.
