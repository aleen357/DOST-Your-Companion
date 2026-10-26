---
doc: spec
status: approved
---

# DOST — Technical Spec

## How This Works, In Plain Language

Dost is a Windows desktop app made with Electron. Electron lets us build the screens in HTML, CSS, and JavaScript while also opening ordinary Windows windows. The main window shows the egg, the questions and, after hatching, DOST with its Feed and Sleep buttons. A second, small transparent window appears above other apps for reminders.

One part of Electron manages windows, the tray icon, the reminder clock, saved data, and the local-model request. The visible screens run in a separate part with a narrow bridge between them. This keeps system access out of the screen code and is a useful pattern to learn. Closing the main window hides Dost in the Windows tray so its clock keeps running; choosing Quit stops the app.

Answers, scores, reminder progress, sleep state and Dost's message pack are saved in one JSON file on this PC. When the user presses **Let's Go** after incubation, DOST checks whether Ollama and the configured model are installed on this PC. If so, it sends the answer profile only to that local Ollama service and saves the lines it writes; it does not call a cloud model or hosted backend. If Ollama/model is unavailable or generation fails, Dost hatches with its prepared local messages. The app does not inspect other apps or their contents.

## The Core Journey Through the System

1. `npm start` opens the incubation window. The main process reads the local data file and shows either a new egg or the saved step in the journey. A guest ID is generated locally; no account is needed.
2. The user starts a Connect session and answers five questions, one at a time. Questions support single-choice, bounded multi-select, and short typed replies; option questions also accept optional free text, and typed-only questions have an explicit decline. The screen sends each answer through the limited bridge; the main process validates it, adds any hidden option scores, and saves it.
3. After a session, the main process records when Connect becomes available again. Normal mode waits 24 hours. Demo mode uses a 30-second incubation wait so all three sessions can be shown in a recording.
4. Once all 15 answers are saved, the main process calculates the chill/bossy score and the egg shows **Let's Go**. Pressing it shows the rainbow brewing egg and calls `generate-local-pack`: the main process checks Ollama at localhost, and if the model is installed, builds the prompt from the saved answers, makes one generation call, validates the JSON, applies Chill-on-conflict, merges the generated lines into the persona's prepared pack, and hatches. If the result is anything but `generated`, the renderer calls `skip-local-generation`, which hatches with the score-based persona and prepared pack. The renderer then shows **Hello**; pressing it plays the egg-opening sequence. If the window is not focused when hatching finishes, the main process flashes the taskbar and shows a "Your DOST is ready!" notification.
5. The main process stores the remaining durations for two reminder lanes: a two-hour habit nudge and a roughly 50-minute light message. The demo scales those to two minutes and 50 seconds. Both clocks run while DOST is in the tray, pause on Quit, and resume on relaunch. Light messages are skipped within 30 minutes of a habit reminder.
6. At a due time, the main process opens a small lower-left, transparent, always-on-top reminder window. It selects a random unused message from the appropriate category until that list is exhausted. OK or cross dismisses it and updates follow-up state without resetting either clock. OK makes the next light item an encouragement. Cross mutes light messages for five hours; if a habit nudge was crossed, the next habit slot asks whether the user did it, and the slot after that returns to a suggestion.
7. On the hatched screen, **Feed** plays a renderer-only eating animation. **Sleep** saves `sleepUntil` five hours ahead (in every mode); while asleep, any due reminder is skipped and the clocks move on. **Wake** clears it.

PRD refs: `prd.md > The Core Journey`, `Guest incubation and answers`, `Persona and hatching`, `Cross-app reminders`, `Dismissal and follow-up`, and `States and Boundaries`.

## Stack

- **JavaScript and HTML/CSS:** one approachable language across the screens and the desktop logic; the visual direction is already defined in the PRD.
- **Electron 44 (`^44.0.0`, pinned in the lockfile):** Windows desktop windows, system tray, background timer, notifications, and local application-data path. Electron's window options support transparent and always-on-top windows. The accepted tradeoff is a larger app footprint in exchange for staying in JavaScript. [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window/) · [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model) · [Context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [Tray](https://www.electronjs.org/docs/latest/api/tray/)
- **Node.js LTS:** runs npm and the Electron tooling. [Electron prerequisites](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)
- **Ollama (user-installed local model runtime):** exposes a local API on the same PC, which the Electron main process calls once at hatch. The configured model is `qwen3.5:4b` (about 3.3 GB, Apache 2.0). The app targets localhost only and does not support cloud models. [Ollama for Windows](https://ollama.com/download/windows) · [Model listing](https://ollama.com/library/qwen3.5)
- **No front-end framework, hosted server, database, analytics, cloud AI, or account provider** in this proof of concept.

## Where It Runs and How Someone Tries It

- **Runtime:** a locally installed Windows desktop application; no website hosting or deployment is needed for the demo recording.
- **Requirements:** Windows 10 or later, Node.js LTS, npm, and an optional Ollama installation with the model downloaded. Prepared local messages work if Ollama or the model is unavailable. Windows **Animation effects** must be on to see DOST move.
- **Start the app:** from the project folder, run `npm install`, then `npm start` in PowerShell.
- **Install it as an app:** `npm run dist` packages DOST with electron-builder into `distDOST-Setup-0.1.0.exe`, a per-user NSIS installer with Start Menu and desktop shortcuts and an uninstaller. It is not code-signed, so SmartScreen shows a warning. The packaged app sets its Windows app ID (`com.aleen357.dost`) so its notifications appear.
- **Run the demo cadence:** `npm run start:demo`. Demo mode shortens the two incubation waits to 30 seconds each, the habit interval to two minutes, the light interval to 50 seconds and the light mute to five minutes, while hiding developer-only controls. Sleep still lasts five hours. Use `npm run start:dev` for the same timing with developer controls visible, or `npm start` for normal intervals.
- **Local model setup (README):** install Ollama for Windows (or `winget install Ollama.Ollama`), then `ollama pull qwen3.5:4b`, and check with `ollama list`. No API key is needed. The model download requires internet once; generation after setup runs locally and takes one to two minutes.
- **Recording:** show the three short incubation sessions, Let's Go with the rainbow brew, the hatch, Feed and Sleep, then leave the app in the tray while working in another app until the demo reminder appears. For a shorter developer check, use **Show reminder now** in the developer-mode tray menu.
- **Submission:** the public GitHub repository [aleen357/DOST-Your-Companion](https://github.com/aleen357/DOST-Your-Companion) (MIT) and a short demo video. Hosting is not needed.

## Look and Feel

Carry forward `prd.md > Look and Feel`: one purple gingham background with small pixel candies (`candy-tile.svg`, drawn by `dev/make-candy.js`) on every screen, a lilac-rimmed incubation card with a centered egg and progress bar, compact calm layout, then the animated green chill slime or orange-red bossy slime. The overlay is a small lower-left companion with a short message and visible OK/cross actions; desktop swipe dismissal is not supported. All slime drawing and motion (idle, reactions, eating, sleeping, snacks and hearts) lives in `slime.js`. Motion is disabled under `prefers-reduced-motion`, which follows the Windows animation setting. Use supportive, clear language so bossy is direct without becoming hostile. The cross-app window must remain small and non-blocking; the underlying work stays visible.

## Components

### Electron main process and lifecycle (`main.js`)

Creates the main window, transparent reminder window, and Windows tray menu (Open DOST, Quit DOST, plus Preview companion and Show reminder now in developer mode). Closing the main window hides the app in the tray. It registers the IPC handlers, owns persistence, reminder timing, persona scoring, sleep state, Ollama orchestration, and the "ready" notification. Renderer windows have no direct Node.js access.

PRD refs: `prd.md > The Core Journey`, `Screens and Layout`, and `Cross-app reminders`.

### Preload bridge (`bridge.js`)

Exposes only named actions needed by the UI: load current guest view, submit an answer, check the local model, generate the local pack, skip local generation, set sleep, acknowledge/dismiss a reminder, show the reminder preview, and (developer mode) reset and trigger a reminder. It communicates with the main process through Electron IPC; the main process validates every payload.

PRD refs: `prd.md > Guest incubation and answers`, `Persona and hatching`, and `Dismissal and follow-up`.

### Incubation window (`incubation.html`, `incubation.js`)

Shows the egg, progress bar, five-question Connect flow, session countdown, the Let's Go → brewing → Hello → egg-open reveal, and the hatched home with Feed and Sleep/Wake. Questions use one of three response shapes: one selected option, several selected options (bounded, with exclusive "none/not sure" choices), or a short typed response. Option questions can also take an optional free-text note. A typed-only question can be answered with **Prefer not to share**. The reveal stage is kept in the renderer; the persona and pack are already saved before **Hello** appears. Developer mode adds a countdown, Preview overlay and Start over.

PRD refs: `prd.md > Screens and Layout`, `Guest incubation and answers`, `Persona and hatching`, and `States and Boundaries`.

### Questions and persona scoring (`questions.js`, `persona.js`)

`questions.js` is questionnaire version 3: 15 questions, five per session, in groups "Your days", "Little scenes" and "Your kind of friend". Scene questions carry a `theme`; their options carry hidden `scores` (`{ chill: 2 }`, `{ bossy: 2 }` or `{ random: 2 }`) and a hidden `hint` for the model. Scores and hints never reach the renderer. `persona.js` adds scores (random points go to a random persona ID from the catalog) and picks the highest total, breaking ties randomly. `questions-v1.js` and `questions-v2.js` keep earlier sets for guests who started on them.

PRD refs: `prd.md > Guest incubation and answers` and `Persona and hatching`.

### Persona catalog and local message selection (`personas.js`, `message-selection.js`)

A shared persona catalog owns each persona's ID, name, label, introduction, palette, prepared messages and personalized variants. `selectLocalPack` copies the persona's prepared pack and puts answer-specific lines first (a walk or water suggestion from the break/reminder answers, coding encouragement for software work). It also selects reminders: random unused messages per lane, with the encouragement and check-in rules above.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `Dismissal and follow-up`.

### Local model message generation (`dost-prompt.js`, `local-model.js`, `generated-pack.js`)

- `dost-prompt.js` turns whichever question set is active into labeled notes without hardcoding question IDs. Plain questions appear as asked and answered, including free text (declines are left out). Scene questions are reduced to their theme and the picked option's hint, so the model cannot echo the scenes. Trait words in hints (procrastination, a pushover, a kind person, scared, going in an endless spiral) are shown once, apart from the descriptions, to steer the persona choice without leaking into lines. It fills the learner-approved prompt with the score-based persona and asks for `PERSONA` and `DOST_TALKS`, where each talk has `TALK`, `EMOTION` and `CATEGORY`. Categories are wisdom, nudge, joke and encouragement; the model writes six per category so validation can drop weak ones. Emotions are exactly `ANGRY`, `ALOOF`, `SCHOLAR`, `ARTIST`, `DANCER`, `CALM`, `QUESTION`, `TIME TICKING` and `STUDENT`.
- `local-model.js` talks only to `http://127.0.0.1:11434`: `/api/tags` (3-second timeout) to confirm the model is installed, then one `/api/chat` call with a JSON schema (240-second timeout). Server errors get two short retries; timeouts do not.
- `generated-pack.js` treats the output as untrusted: parses JSON, keeps lines of 8–200 characters without links or markup, drops lines that label or shame the person or copy the prompt's examples, normalizes emotions and categories, keeps up to five per category and requires at least three. `mergeIntoPack` maps the result into DOST's `{ id, kind, text }` reminder shape over the prepared pack.

The main process applies Chill-on-conflict, saves only the final pack and a small status record, and never logs the prompt or output. No renderer code calls Ollama, and no per-reminder model calls are made.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `What We're Building`.

### Local guest store (`guest-store.js`)

Reads/writes a single versioned JSON document (schema version 7) in Electron's per-user application data folder. Saves after every answer, session completion, hatch, sleep change and reminder response. On launch, validates and migrates older documents step by step; if the file is missing or malformed, starts a fresh guest and shows a recoverable "couldn't read your earlier local progress" note rather than crashing.

PRD refs: `prd.md > Guest incubation and answers`, `Dismissal and follow-up`, and `States and Boundaries`.

### Reminder clock (`reminder-clock.js`)

Starts two independent app-running lanes when Dost hatches: a habit lane every two hours and a light lane about every 50 minutes. Light timing receives up to five minutes of random jitter; a light event is skipped if it would land less than 30 minutes from a habit event. Demo/developer timing scales these values to two minutes, 50 seconds, five seconds of jitter, and a 30-second minimum gap. Both lanes pause when DOST quits and resume from saved remaining durations. A cross action mutes light messages for five hours (five minutes in demo mode), while habit prompts continue. OK changes the next light item to encouragement. Neither response resets the schedule. At a due time the main process shows one overlay at a time, or skips it while DOST sleeps. DOST does not inspect app names, window contents, keystrokes, or scrolling.

PRD refs: `prd.md > Cross-app reminders`, `Dismissal and follow-up`, and `Demo trigger`.

### Cross-app reminder overlay (`overlay.html`, `overlay.js`)

An independent frameless transparent always-on-top window positioned at the lower-left of the primary screen, shown without taking focus. It displays the persona's slime, one message, and OK/cross actions. OK sets acknowledged state; cross sets not-done state. The follow-up state selects the next-cycle message.

PRD refs: `prd.md > Reminder overlay`, `Cross-app reminders`, and `Dismissal and follow-up`.

### Character (`slime.js`)

Draws both slimes as inline SVG from the persona palette and exposes `mount` (awake or asleep) and `feed`. Feeding drops a random snack from a small catalog (strawberry, cookie, watermelon), chews in three bites, then wiggles with hearts. Adding a snack means adding one entry.

PRD refs: `prd.md > Hatched home` and `Look and Feel`.

## Data Model

The guest is one local record; there is no account or remote database.

| Field | Contents | Update and return behavior |
|---|---|---|
| `schemaVersion`, `guestId` | Local format version (7) and random guest identifier | Created on first launch; used to validate, migrate and identify this one local record. |
| `questionnaireVersion` | Question set used by this guest (1, 2 or 3) | New guests use version 3; earlier guests keep their own set. |
| `answers` | Question ID → type, selected option ID(s) and labels, optional or typed text, or an explicit decline | Written after each answer; reloaded if the app closes during incubation. |
| `sessionIndex`, `completedSessions`, `connectAvailableAt` | Session progress and next Connect time | Updated only after all five answers in a session; 24 hours normally or 30 seconds in demo mode. |
| `personaScores`, `persona` | Totals keyed by persona ID and the selected persona | Scores update from options; the highest score wins, with a random tie-break. Generation may change the persona to Chill on conflict. |
| `messagePack` | Active prepared or prepared-plus-generated messages for this guest | Written at hatch. Used offline for reminders. |
| `localGeneration` | `{ status: generated / failed / skipped, model, scorePersona, inferredPersona, error, at }` | Stored for status and debugging; no prompt or output log. |
| `hatchedAt` | When DOST hatched | Starts the reminder clock. |
| `reminderSchedule`, `reminderRemainingMs` | Remaining durations for the light and habit lanes plus the light-mute time | Saved on quit and after reminder changes; launch resumes both lanes without counting time while DOST was closed. |
| `pendingReminder`, `followUpState`, `lastSuggestionId`, `lastReminderId`, `nextReminderKind` | Any reminder awaiting a response and habit follow-up state | A crossed habit prompt creates one check-in at the next habit slot; a light cross only mutes light messages. |
| `nextLightKind`, `usedLightMessageIds`, `usedHabitMessageIds` | One-time next-light encouragement preference and message rotation | IDs prevent repeats until the available category is exhausted. |
| `sleepUntil` | End of the current nap, or null | Set five hours ahead by Sleep, cleared by Wake; reminders that come due while asleep are skipped. |

**Start over** (developer mode) asks for confirmation, then replaces the local record with a new guest, clearing answers, persona, and saved message packs.

Data flow: UI answer → preload bridge → main process validates, scores, and saves locally. At Let's Go: main process checks localhost Ollama → formats saved answers → one local `/api/chat` call → validates the structured response → saves the merged pack and hatches (or hatches with the prepared pack). The reminder scheduler reads the active pack, selects a message from the due lane, and displays it in the overlay. OK/cross updates follow-up selection and light-mute state without resetting the two clocks.

## File Structure

```text
DOST/
├── package.json                 # scripts (start, start:demo, start:dev, dist) and installer config
├── package-lock.json            # reproducible dependency tree
├── .gitignore                   # excludes .env, learner profile, build output and local notes
├── LICENSE                      # MIT
├── README.md                    # setup, Ollama/model installation, and demo steps
├── assets/icon.png              # app and tray icon
├── dev/                         # local preview pages and icon script used while building
├── src/
│   ├── main/
│   │   ├── main.js              # lifecycle, windows, tray, IPC handlers, sleep, notification
│   │   ├── reminder-clock.js    # two-lane normal/demo schedule
│   │   ├── guest-store.js       # versioned JSON persistence, validation and migration
│   │   ├── persona.js           # scoring and tie-break
│   │   ├── message-selection.js # prepared pack tailoring and reminder selection
│   │   ├── dost-prompt.js       # answers → local-model prompt
│   │   ├── local-model.js       # localhost Ollama check and generation call
│   │   └── generated-pack.js    # model output validation and merge
│   ├── preload/
│   │   └── bridge.js            # safe, named API exposed to windows
│   ├── renderer/
│   │   ├── incubation.html      # egg, questions, hatch, Feed and Sleep
│   │   ├── incubation.js        # question, hatch reveal and care behavior
│   │   ├── overlay.html         # compact cross-app intervention
│   │   ├── overlay.js           # OK/cross buttons and dismissal
│   │   ├── slime.js             # character art, animation states and snacks
│   │   └── styles.css           # purple candy room, handheld, slime palette, layout, reduced motion
│   └── shared/
│       ├── questions.js         # current 15 questions (version 3) with hidden scores and hints
│       ├── questions-v2.js      # version 2 set for guests who started on it
│       ├── questions-v1.js      # version 1 set for guests who started on it
│       └── personas.js          # persona identity, palette, message packs, and tone
└── devpost/                     # scope, PRD, spec, checklist, app map, demo script and media
```

## External Services and Dependencies

### Local model runtime (optional message generation)

- **Runtime:** Ollama for Windows, installed by the user. DOST calls only `http://127.0.0.1:11434` (`/api/tags`, `/api/chat`); there is no setting for a remote host.
- **Model:** `qwen3.5:4b`, about 3.3 GB, Apache 2.0, verified on the demo machine.
- **Setup:** user installs Ollama and runs `ollama pull qwen3.5:4b`. Model download requires internet. Once installed, generation uses the local runtime and the user's profile does not go to a cloud endpoint.
- **Request:** one prompt at hatch, containing the agreed prompt text plus the formatted answer notes, with a JSON schema for the response. No tools, search, remote inference, or per-reminder requests.
- **Response:** validate the JSON and every category/emotion/text bound before saving. Reject malformed output and continue with prepared messages.
- **Privacy and persistence:** the hatch screen footer and README state that answers stay on this PC. Keep answers, prompt processing, and message pack on this PC. Do not write prompt/output logs or expose Ollama to the renderer.
- **Fallback:** Ollama/model missing, timeout, runtime error, or invalid JSON → hatch with prepared local messages, with no error shown to the user.

There is no required hosted database, analytics service, login, or hosting account.

## Important Failure Modes

- **Ollama/model unavailable:** hatch with the prepared local message pack; README explains setup.
- **Local model returns invalid or incomplete output:** reject it, record `failed`, and hatch with the prepared pack.
- **Local model returns a server error:** retry twice after a short pause, then fall back.
- **Saved JSON missing or invalid:** create a clean guest and show a recoverable "local progress could not be read" note; never silently crash.
- **App quit while a reminder is pending:** keep `pendingReminder` and show it again on relaunch.

## What Was Simplified and Why

- **One local guest JSON file** instead of accounts and cloud sync — proves the incubation and reminder loop without authentication or a server.
- **A user-installed Ollama runtime and model** instead of a hosted inference service — DOST uses the actual answer profile while keeping inference on the user's PC; model installation is an extra setup step and quality/performance depends on hardware.
- **Generation folded into Let's Go** instead of a separate consent/setup screen — fewer steps in a short proof of concept; setup lives in the README and the fallback is silent.
- **Running-time intervals** instead of monitoring apps or screen contents — preserves the cross-app moment while honoring the agreed interval-based trigger and avoiding activity tracking.
- **Short demo clocks** instead of waiting 24 hours, two hours, and 50 minutes in a recording — same state flow with demo-only 30-second incubation waits, two-minute habit interval, and 50-second light interval.
- **One fixed lower-left overlay on the primary display** rather than multi-monitor placement/settings — keeps the character visible and the window implementation focused.

## Decisions and Open Issues

### Decisions

- **Learner chose Windows-only and Electron.** Plain JavaScript/HTML/CSS keep the build in one familiar web language; larger app size accepted for accessible implementation and window controls.
- **Learner chose tray residency.** Closing the main window hides Dost, preserving the timer; Quit stops the process.
- **Learner chose local-only guest persistence.** No login, server database, or account linking in this POC.
- **Persona content is data-driven.** A shared persona catalog owns each persona's ID, presentation, palette, message pack, and personalized variants. Scoring and character rendering use catalog IDs; the guest store migrates its score fields when the catalog schema changes.
- **Learner chose interval-based reminders.** Count app-running time in separate habit and light lanes; no input, app, or content monitoring.
- **Learner chose local-model generation from the real answer profile.** The Electron main process calls only localhost. There is no Gemini request, hosted backend, API key, or cloud inference.
- **Learner asked that questions not be too personal, and later that they feel playful.** Version 3 uses light scene questions with hidden scores and hints; two short typed questions ask the user to leave out private details.
- **Learner added Feed and Sleep** after the end-to-end demo, so DOST feels like a companion and Sleep acts as a five-hour focus switch.
- **Learner's useful uncertainty:** whether an interval-only trigger would make the demo less credible. Clarified as an honest scheduled check-in, not a claim that Dost detected screen use.

### Open

- None blocking the proof of concept. An in-app Ollama setup guide with "Check again" is deferred (see `prd.md > Deferred From the POC`).
