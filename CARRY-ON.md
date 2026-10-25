# DOST — Carry-On / Project Handoff

**Updated:** 2026-10-18 (local-model slice implemented)
**Workspace:** `E:\SAMPLE BASIC`
**Purpose:** Resume DOST without reconstructing decisions from old conversations. Read this first.

## 1. Project in one paragraph

DOST is a Windows desktop companion: a small slime-like character. The user incubates an egg by answering three sessions of five light questions (15 total). When the egg is ready, DOST can send those answers to a **small AI model running on the same PC (Ollama + `qwen3.5:4b`)**, which writes DOST's personal lines: 5 nudges, 5 wisdom quotes and 5 jokes, each tagged with an emotion. DOST hatches as **Chill** (green) or **Bossy** (orange-red). It then lives in the tray and pops a small non-blocking overlay every 2 hours (2 minutes in demo/dev) using those saved lines. The model runs **once**, at hatch, never per reminder. It is a timer, not screen monitoring.

## 2. Where we are now

**The local-model generation is implemented and was verified against the real model on this PC.**

Done in this slice:
- Ollama for Windows **0.40.5** installed (via `winget install Ollama.Ollama`) at `%LOCALAPPDATA%\Programs\Ollama\`.
- Model **`qwen3.5:4b`** pulled (3.3 GB, stored in `C:\Users\f8tah\.ollama\models`).
- New modules `dost-prompt.js`, `local-model.js` and `generated-pack.js` (see §5).
- `main.js` no longer uses Gemini. The hatch choice now offers **Write my messages** (local model), **Check again** (if Ollama or the model is missing) and **Skip and hatch DOST**.
- Guest data schema bumped to **6**: the old `demoGenerationConsent` / `demoMessagePack` fields are dropped and replaced by `localGeneration`. Existing v5 guests migrate cleanly (tested). Also fixed an old migration-chain bug: v3 guests used to skip the questionnaire-version step.
- Generated lines are displayed on the hatch screen ("Lines DOST wrote for you") with their emotion tag, and are used by the reminder overlay. Each reminder presentation now carries `emotion`.

Verified headless (Node, real Ollama, real prompt, real validator):
- Bossy profile: about 60 s, 5/5/5 lines, playful CAPS ("STOP THINKING. PICK THE EASIEST STEP AND DO IT NOW."), real jokes.
- Chill profile: about 95 s, gentle lines ("You are already doing enough. Be as kind to yourself as you are to your work.").

**Not yet verified:** clicking through the flow in the Electron UI. The user prefers to launch the app themselves (an earlier GUI-automation attempt was rejected). Next step is the user's manual run: §9.

## 3. Decisions made in this slice (auto mode; the user can revisit any)

| Open question (from the old handoff) | Decision taken |
|---|---|
| Which model? | `qwen3.5:4b` (default Q4_K_M quant, tag `qwen3.5:4b`). Fits 16 GB RAM. Quality checked and good enough for the demo. |
| Taxonomy mapping | **Bossy:** "procrastination", "a pushover". **Chill:** "a kind person", "scared", "going in an endless spiral". Written into the prompt. |
| Emotion count | All **nine** are allowed: `ANGRY, ALOOF, SCHOLAR, ARTIST, DANCER, CALM, QUESTION, TIME TICKING, STUDENT`. Unknown values are normalised to `CALM`. |
| Persona authority | Kept the spec rule. If the model's PERSONA equals the score persona, keep it. If they conflict, hatch **Chill**. If generation is skipped or fails, use the score persona. |
| Output cardinality | Exactly 5 wisdom + 5 nudges + 5 jokes. Prepared `encouragement` and `followUps` (check-ins) stay from `personas.js`, so the OK/cross loop is unchanged. |
| JSON shape | `DOST_TALKS` is **grouped by category**: `{"PERSONA":"bossy","DOST_TALKS":{"wisdom":[{"TALK","EMOTION"}×5],"nudge":[…×5],"joke":[…×5]}}`. A flat list with a `CATEGORY` field produced unbalanced counts (8 wisdom, 3 jokes), so the grouped shape lets Ollama's JSON-schema grammar force 5 of each. The validator also still accepts the flat form. |
| Failure UX | Failure does **not** auto-hatch. It shows the error with **Try again** and **Hatch with prepared messages**. Hatching is never blocked. |
| Thinking mode | `think: false` (Qwen 3.5 would otherwise spend minutes reasoning). |

## 4. Prompt (summary; source of truth is `src/main/dost-prompt.js`)

1. Intro: who DOST is ("Dost" means friend in Urdu).
2. `<profile>`: the user's real answers, grouped by question group, as Q/A pairs. Built from whichever question set is active (v1 or v2), with no hardcoded IDs. Typed answers are quoted, and "Prefer not to share" answers are omitted.
3. STEP 1: infer the five traits, then map them to Bossy or Chill, with the user's own example lines ("There is no tomorrow. YOU NEED TO DO IT NOW! I am there for you", the glass-of-water/Rome line). Includes the score persona as a hint.
4. STEP 2: write 5 wisdom, 5 nudges and 5 jokes (real setup + punchline).
5. Rules: under 140 characters; DOST is always on the user's side (Bossy can shout but never threatens, insults or guilt-trips); no invented facts or numbers; no medical, diet or finance advice; no links or emoji; one emotion from the list.

Prompt tuning history: the first run's Bossy lines were too hostile ("I WILL YELL", invented "4 hours"), which the guardrail lines fixed. Jokes were too preachy, which the "real joke, setup + punchline" line fixed.

## 5. Architecture

| File | Role |
|---|---|
| `src/main/dost-prompt.js` | `formatProfile`, `buildPrompt`, the `responseSchema` for Ollama structured output, and the `EMOTIONS`/`CATEGORIES` constants. |
| `src/main/local-model.js` | Fixed `http://127.0.0.1:11434`. `checkSetup()` → `ready` / `no-ollama` / `no-model` (via `/api/tags`, 3 s timeout). `generate()` → `/api/chat` with a 240 s timeout, `temperature 0.8`, `num_ctx 4096`, `keep_alive 1m` (frees RAM soon after). No remote host is possible. |
| `src/main/generated-pack.js` | Treats output as untrusted: parses JSON (tolerates code fences), cleans text (8–200 chars, no URLs or `<>{}`), dedupes, normalises emotion and category, and requires ≥3 per category (keeps max 5). Converts to `{ id: 'local-nudge-1', kind: 'break', text, emotion }`. `mergeIntoPack` replaces `suggestions`/`wisdom`/`jokes` and sets `source: 'local-model'`. |
| `src/main/main.js` | IPC: `dost:check-local-model`, `dost:generate-local-pack`, `dost:skip-local-generation`. Orchestrates prompt → model → validation → persona rule → save → hatch. Logs only error messages; the prompt and output are never logged. |
| `src/preload/bridge.js` | Exposes `checkLocalModel`, `generateLocalPack`, `skipLocalGeneration`. The renderer never talks to Ollama. |
| `src/renderer/incubation.{html,js}` | Hatch-choice panel with a local-processing disclosure, setup guide (`ollama pull qwen3.5:4b`) and buttons; the hatched panel lists the generated lines. |
| `src/main/guest-store.js` | Schema 7 with local generation state plus the two-lane reminder countdowns, light-mute duration, and message rotation state. |

Reminder scheduling/selection now lives in `reminder-clock.js` and `message-selection.js`; generated and prepared content still use the shared pack shape. `personas.js` contains prepared fallback packs. `questions.js` / `questions-v1.js`, `overlay.*`, `slime.js`, and `persona.js` retain their previous roles.

**Leftovers, now unused:** `src/main/gemini-preview.js` and `.env.example` (`GEMINI_API_KEY`). Nothing imports them. They are safe to delete once the user agrees, and should be removed before the public repo/submission.

## 6. Known limits / caveats

- **GPU not used.** Ollama reports `total_vram=0` and runs on CPU, even though the laptop has an RTX 3050 (4 GB, driver 610.74). Likely causes are hybrid-graphics power state, or the server being launched from the agent shell before the Ollama tray app. Generation still works in 1–2.5 min. To try the GPU: quit and relaunch Ollama from the Start menu (tray app), plug in the charger, and check `ollama ps` (PROCESSOR column).
- Free RAM was low (~1.6 GB available at load) while the model was running. Close heavy apps before the demo.
- C: has ~11 GB free after the model. To move models, set the `OLLAMA_MODELS` user env var to a folder on E: and re-pull.
- Ollama must be running (the tray app starts it at login by default). If it isn't, the UI shows "couldn't find Ollama" + **Check again**.
- Small-model content is good but not perfect (some jokes are weak). A model's lines are shown to the user before reminders use them.

## 7. Approved product rules (unchanged, still in force)

- Local guest only; no accounts. 3 sessions × 5 required questions; 24 h wait between sessions (30 s in demo/dev).
- Only support-tone choices score: +2 Chill, +3 Bossy, +2 random for "it depends"; random tiebreak.
- Reminders: habit nudges every 2 hours and light jokes/wisdom about every 50 minutes, with a 30-minute minimum gap around habit prompts. Light timing has up to 5 minutes of jitter. OK makes the next light message an encouragement; cross mutes light messages for 5 hours while habit prompts continue. Crossing a habit prompt schedules a check-in for the next habit slot; crossing a light message does not create a task check-in. Neither response resets the clocks. Demo/dev scales these to 2-minute habits, 50-second light messages, 30-second spacing, 5-second jitter, and a 5-minute mute. No swipe dismissal.
- Dev-only controls (`npm run start:dev`): countdown, preview overlay, Start over, show reminder now. Hidden in `--demo` and normal mode. **Start over erases the guest; only do it when the user asks.**
- Privacy: answers and the pack live in Electron userData `guest.json`. The profile only goes to Ollama on 127.0.0.1. No cloud model, API key or server.
- Bossy is direct and playful, never shaming. DOST is a friend, not a productivity cop.

## 8. Planning docs

`devpost/learner-profile.md`, `scope.md`, `prd.md`, `spec.md`, `checklist.md`, `README.md`. The spec still mentions `qwen3.5:4b-q4_K_M` and the flat `DOST_TALKS` list in places; README was updated to `ollama pull qwen3.5:4b`. Bring spec.md in line with §3 when next touching docs.

## 9. How to run and test the new flow

```powershell
npm start            # normal timings
npm run start:dev    # fast timings + dev controls (Start over, preview, show reminder now)
npm run start:demo   # fast timings, no dev controls
```

To see generation end to end, the existing local guest is already hatched, so in `start:dev` choose **Start over** (erases the old guest), answer 15 questions (30 s waits between sessions), then on **READY TO HATCH** click **Write my messages**. Wait 1–2 min, read the lines, then **Show reminder now** from the tray to see one in the overlay.

Headless test without the UI: `node <scratchpad>/try-generation.js` (a sample profile through the real prompt → model → validator). It is not in the repo; recreate it if needed from `dost-prompt.js` exports.

## 10. Next steps

1. The user has verified Ollama/model generation and confirmed it returned 15 responses. The new two-lane reminder cadence is implemented but still needs a manual hands-on pass in `npm run start:dev`.
2. Verify light messages, habit prompts, minimum spacing, randomized light timing, cross/mute behavior, OK follow-up, habit check-in, and saved schedule after quit/relaunch.
3. Review the updated question bank, then finish character animation and the final end-to-end review.
4. Delete the Gemini leftovers (§5) only when the user asks/approves; update remaining HTML/spec mirrors to match the actual build.
5. Complete `6-ship` (demo video, public repo, Devpost write-up). The working tree is still uncommitted and includes mixed earlier changes.

## 11. Reminder cadence implementation status

The user's approved rule is: habit nudges every 2 hours; light jokes/wisdom around every 50 minutes; 30-minute minimum spacing around habit nudges; up to 5 minutes of jitter on light slots; cross mutes light messages for 5 hours while habit prompts continue; OK makes the next light item an encouragement. Responses change follow-up content without resetting either clock. Both countdowns and the light mute pause while DOST is fully quit.

Implementation was just added to `src/main/reminder-clock.js`, `src/main/message-selection.js`, `src/main/main.js`, and the guest-store schema migration. Demo timing uses 2 minutes for habits, 50 seconds for light prompts, 30 seconds minimum spacing, 5 seconds of jitter, and a 5-minute light mute. **This change has not yet been exercised in the Electron UI.** The build checklist's reminder slice is unchecked pending that hands-on verification.
