---
doc: spec
status: approved
---

# DOST — Technical Spec

## How This Works, In Plain Language

Dost is a Windows desktop app made with Electron. Electron lets us build the screens in HTML, CSS, and JavaScript while also opening ordinary Windows windows. The main window shows the egg and questions. After Dost hatches, a second, small transparent window can appear above other apps for reminders.

One part of Electron manages windows, the tray icon, the reminder clock, saved data, and the optional local-model request. The visible screens run in a separate part with a narrow bridge between them. This keeps system access out of the screen code and is a useful pattern to learn. Closing the main window hides Dost in the Windows tray so its clock keeps running; choosing Quit stops the app.

Answers, scores, reminder progress, and Dost's message pack are saved in one JSON file on this PC. After incubation, the user may ask Dost to generate its personalized pack using the saved answer profile with Ollama and a local model. DOST sends the prompt only to the Ollama service on the same PC; it does not call a cloud model or hosted backend. If the user skips generation, Ollama/model is unavailable, or generation fails, Dost uses its prepared local messages. The app does not inspect other apps or their contents.

## The Core Journey Through the System

1. `npm start` opens the incubation window. The main process reads the local data file and shows either a new egg or the saved step in the journey. A guest ID is generated locally; no account is needed.
2. The user starts a Connect session and answers five questions, one at a time. Questions support single-choice, bounded multi-select, and short typed replies with an explicit decline option. The screen sends each answer through the limited bridge; the main process validates, scores only support-style choices, and saves all answers.
3. After a session, the main process records when Connect becomes available again. Normal mode waits 24 hours. Demo mode uses a 30-second incubation wait so all three sessions can be shown in a recording.
4. Once all 15 answers are saved, the main process calculates the chill/bossy result and prepares the guest profile for local generation. The user may generate a personalized message pack by installing Ollama and downloading the selected model; DOST checks availability, sends the profile only to the local Ollama API, validates the JSON result, and saves the pack. The agreed prompt language and emotion names are kept. If setup is skipped or generation fails, the prepared local pack is used. Dost hatches and introduces itself either way.
5. The main process stores the remaining durations for two reminder lanes: a two-hour habit nudge and a roughly 50-minute light message. The demo scales those to two minutes and 50 seconds. Both clocks run while DOST is in the tray, pause on Quit, and resume on relaunch. Light messages are skipped within 30 minutes of a habit reminder.
6. At a due time, the main process opens a small lower-left, transparent, always-on-top reminder window. It selects a random unused message from the appropriate category until that list is exhausted. OK or cross dismisses it and updates follow-up state without resetting either clock. OK makes the next light item an encouragement. Cross mutes light messages for five hours; if a habit nudge was crossed, the next habit slot asks whether the user did it. Dismissing that check-in makes the following habit slot a different suggestion.

PRD refs: `prd.md > The Core Journey`, `Guest incubation and answers`, `Persona and hatching`, `Cross-app reminders`, `Dismissal and follow-up`, and `States and Boundaries`.

## Stack

- **JavaScript and HTML/CSS:** one approachable language across the screens and the desktop logic; the visual direction is already defined in the PRD.
- **Electron (current stable at project setup):** Windows desktop windows, system tray, background timer, and local application-data path. Electron's window options support transparent and always-on-top windows. The accepted tradeoff is a larger app footprint in exchange for staying in JavaScript. [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window/) · [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model) · [Context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [Tray](https://www.electronjs.org/docs/latest/api/tray/)
- **Node.js LTS supported by the selected Electron release:** runs the main process and local JSON file operations. Pin the exact Electron and Node-compatible development versions in the project lockfile during build. [Electron prerequisites](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)
- **Ollama (user-installed local model runtime):** exposes a local API on the same PC, which the Electron main process calls for one-time message-pack generation. Use `qwen3.5:4b-q4_K_M` as the initial candidate; its current Ollama listing is about 3.3 GB and identifies Apache 2.0 licensing. Check download size, runtime behavior, and output quality on the demo machine before locking it. The app must target localhost only and must not support cloud models. [Ollama for Windows](https://ollama.com/download/windows) · [Model listing](https://ollama.com/library/qwen3.5%3A4b-q4_K_M)
- **No front-end framework, hosted server, database, analytics, cloud AI, or account provider** in this proof of concept.

## Where It Runs and How Someone Tries It

- **Runtime:** a locally installed Windows desktop application; no website hosting or deployment is needed for the demo recording.
- **Requirements:** Windows 10 or later, Node.js LTS, npm, and an optional Ollama installation with the selected model downloaded. Prepared local messages work if Ollama or the model is unavailable.
- **Start the app:** from the project folder, run `npm install`, then `npm start` in PowerShell.
- **Run the demo cadence:** `npm run start:demo`. Demo mode shortens the two incubation waits to 30 seconds each, the habit interval to two minutes, and the light interval to 50 seconds, while hiding developer-only controls. Use `npm run start:dev` for the same timing with those controls visible, or `npm start` for normal intervals.
- **Local model setup:** install Ollama for Windows, then download the configured model using `ollama pull qwen3.5:4b-q4_K_M`. DOST provides setup guidance and a **Check again** action if it cannot find Ollama/model. No API key is needed. The model download requires internet once; generation after setup runs locally.
- **Recording:** show the three short incubation sessions, persona scoring/hatching, local-model setup/status, and the generated personalized message pack; then leave the app in the tray while working in another app until the demo reminder appears. For a shorter developer check, use **Show reminder now** in the developer-mode tray menu.
- **Submission:** the local app and a short demo video satisfy the demo path. A public GitHub repository is also required by the learning program; keep all local keys out of it. Hosting is optional.

## Look and Feel

Carry forward `prd.md > Look and Feel`: quiet blue incubation background, centered egg and effort bar, compact calm layout, then static green chill slime or orange-red bossy slime art. The overlay is a small lower-left companion with a short message and visible OK/cross actions; desktop swipe dismissal is not supported. Add the slime's lightweight idle and reaction animation in the final build slice through the dedicated `slime.js` module. Use supportive, clear language so bossy is direct without becoming hostile. The cross-app window must remain small and non-blocking; the underlying work stays visible.

## Components

### Electron main process and lifecycle

Creates the main window, transparent reminder window, and Windows tray menu. Closing the main window hides the app in the tray; tray actions reopen the main window or fully quit. It owns persistence, reminder timing, persona scoring, local Ollama detection, and the optional local-model request. Renderer windows have no direct Node.js access.

PRD refs: `prd.md > The Core Journey`, `Screens and Layout`, and `Cross-app reminders`.

### Preload bridge

Exposes only named actions needed by the UI: load current guest view, save an answer, complete a session, request local message generation, skip generation, acknowledge/dismiss a reminder, and invoke the demo reminder. It validates message shapes and communicates with the main process through Electron IPC.

PRD refs: `prd.md > Guest incubation and answers`, `Persona and hatching`, and `Dismissal and follow-up`.

### Incubation window

Shows the egg, effort progress, five-question Connect flow, session cooldown, hatching and introduction, plus an optional **Create Dost's messages locally** action. The questions cover broad daily-life context and use one of three response shapes: one selected option, several selected options, or a short typed response. Multi-select questions have a maximum and can define exclusive “none/not sure” choices. A typed question can be answered with **Prefer not to share**. Explain that choosing generation sends the saved answers to Ollama running on this PC; no cloud service receives the profile. If Ollama/model is missing, show setup instructions and a check-again action. The user can skip generation and hatch with prepared messages. The 15 questions themselves stay light and avoid sensitive topics.

PRD refs: `prd.md > Screens and Layout`, `Guest incubation and answers`, `Persona and hatching`, and `States and Boundaries`.

### Persona and local message selection

Scores only answers where the user expresses a support-tone preference: +2 chill, +3 bossy, and +2 randomly for an “it depends” choice; other options describe context but do not score. Typed answers remain saved locally but do not score. When the user asks for local generation, the complete answer profile is passed to Ollama on localhost; no profile is sent to a cloud model.

Prepared and model-generated message packs use the same small validated message shape. The local prepared selector is the fallback; the local-model adapter can replace the active pack after successful validation. Keep this boundary small; it does not add a general provider framework.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `Dismissal and follow-up`.

### Local model message generation

The hatch flow can offer **Create Dost's messages locally** after a clear description that the saved answer profile will be processed by a model on this PC. This action is optional; the user can hatch with prepared messages. DOST checks Ollama at `http://127.0.0.1:11434` and verifies the configured local model is installed. If setup is missing, the UI provides a link to Ollama for Windows, the model download command, and **Check again**. It never changes the endpoint to a remote host or uses an Ollama cloud model.

The main process formats answers through a version-neutral profile formatter: it accepts the active question definitions and saved answers, then emits labeled question/answer pairs by group without hardcoded question IDs. Typed responses are included except explicit declines. Preserve the user's requested categories and wording—“procrastination,” “a kind person,” “a pushover,” “scared,” or “going in an endless spiral”—and insert the answer profile into the designated placeholder. Preserve the supplied Dost message wording and tone as well. Request structured JSON with `PERSONA` and `DOST_TALKS`; each talk has `TALK`, `EMOTION`, and a `CATEGORY` used to place it in the app's message collections. Generate five wisdom quotes, five nudges, and five jokes. The allowed emotion names are exactly `ANGRY`, `ALOOF`, `SCHOLAR`, `ARTIST`, `DANCER`, `CALM`, `QUESTION`, `TIME TICKING`, and `STUDENT`. Calculate the score-based persona before the request and include it in the prompt. If the model-inferred persona conflicts with that score, final persona is Chill; if Ollama/model is unavailable or generation fails, use the score-based persona. Validate object shape, persona/category values, emotion allowlist, item counts, and text limits before saving as the active generated pack. No per-reminder model calls are made. On missing Ollama/model, timeout, non-success, or invalid output, keep prepared messages and let hatching continue. Do not log prompt or model output beyond the locally saved message pack.

Module boundaries are fixed for this slice: `dost-prompt.js` converts whichever question version is active into labeled Q/A context and fills the learner-approved prompt template with the score-based persona; `local-model.js` checks the fixed Ollama localhost API, installed model, timeout, and one generation call; `generated-pack.js` validates the response and normalizes categories/emotions into DOST's existing `{ id, kind, text }` reminder shape while retaining emotion metadata. The Electron main process orchestrates these modules, applies Chill-on-conflict, and stores only the final validated pack. No renderer code calls Ollama directly.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `What We're Building`.

### Local guest store

Reads/writes a single versioned JSON document in Electron's per-user application data folder. Save after every answer, session completion, local generation choice/result, and reminder response. On launch, validate the file; if missing or malformed, show a recoverable new-guest state rather than crashing. Keep schema version so later builds can migrate it.

PRD refs: `prd.md > Guest incubation and answers`, `Dismissal and follow-up`, and `States and Boundaries`.

### Reminder clock and tray

Starts two independent app-running lanes when Dost hatches: a habit lane every two hours and a light lane about every 50 minutes. Light timing receives up to five minutes of random jitter; a light event is skipped if it would land less than 30 minutes from a habit event. Demo/developer timing scales these values to two minutes, 50 seconds, five seconds of jitter, and a 30-second minimum gap. Both lanes pause when DOST quits and resume from saved remaining durations. A cross action mutes light messages for five hours (five minutes in demo mode), while habit prompts continue. OK changes the next light item to encouragement. Neither response resets the schedule. At a due time the main process shows one overlay at a time; DOST does not inspect app names, window contents, keystrokes, or scrolling.

`npm run start:dev` enables the same accelerated timing plus developer-only controls: a live next-reminder countdown, overlay preview, Start over, and an immediate reminder trigger. `npm run start:demo` keeps accelerated incubation and reminder timing but hides these controls. Regular `npm start` uses normal intervals and hides them too.

PRD refs: `prd.md > Cross-app reminders`, `Dismissal and follow-up`, and `Demo trigger`.

### Cross-app reminder overlay

An independent frameless transparent always-on-top window positioned at the lower-left of the primary screen. It displays the selected slime, one suggestion, a short companion message, and OK/cross actions. OK sets acknowledged state; cross sets not-done state. The follow-up state selects the next-cycle message.

PRD refs: `prd.md > Reminder overlay`, `Cross-app reminders`, and `Dismissal and follow-up`.

## Data Model

The guest is one local record; there is no account or remote database.

| Field | Contents | Update and return behavior |
|---|---|---|
| `schemaVersion`, `guestId` | Local format version and random guest identifier | Created on first launch; used to validate and identify this one local record. |
| `answers` | Question ID and one of a single option, bounded option-ID/label arrays, or short typed text (including explicit refusal) | Written after each answer; reloaded if the app closes during incubation. |
| `questionnaireVersion` | Question set used by an in-progress guest | Version 1 guests continue with the previous question set; new guests use version 2. |
| `sessionIndex`, `completedSessions`, `connectAvailableAt` | Session progress and next Connect time | Updated only after all five answers in a session; 24 hours normally or 30 seconds in demo mode. |
| `personaScores`, `persona` | Totals keyed by persona ID and the final selected type | Scores update from options; the highest score wins, with a random tie-break. The selected persona remains stable after answer 15. |
| `messagePack` | Active prepared or local-model-generated messages for this guest | Prepared messages are created after scoring; a validated local model result can replace them. Used offline for reminders. |
| `localGenerationStatus`, `localModelId` | Whether local generation was skipped, unavailable, or completed, and which model created the active pack | Stored locally for status/recovery; no prompt log or remote data record. |
| `reminderSchedule` | Remaining durations for the light and habit lanes plus the remaining light-mute duration | Saved on quit and after reminder changes; launch resumes both lanes without counting time while DOST was closed. |
| `pendingReminder`, `followUpState`, `lastSuggestionId`, `lastReminderId`, `nextReminderKind` | Any reminder awaiting a response and habit follow-up state | A crossed habit prompt creates one check-in at the next habit slot; a light cross only mutes light messages. |
| `nextLightKind`, `usedLightMessageIds`, `usedHabitMessageIds` | One-time next-light encouragement preference and message rotation | Light messages are shuffled through wisdom/jokes; habit messages rotate through suggestions/follow-ups. IDs prevent repeats until the available category is exhausted. |

`messagePack` contains bounded arrays for break ideas, encouragement, original wisdom-style lines, jokes, and follow-ups, alongside the persona and emotion tags. Do not persist prompt logs. **Start over** asks for confirmation, then replaces the local record with a new guest, clearing answers, persona, and saved message packs.

Data flow: UI answer → preload bridge → main process validates, scores, and saves locally. After incubation, the user may choose generation: main process formats saved answers → local Ollama API → validates structured response → saves generated pack locally. The reminder scheduler reads the active pack, selects a message from the due lane, and displays it in the overlay. OK/cross updates follow-up selection and light-mute state without resetting the two clocks.

## File Structure

```text
Dost/
├── package.json                 # scripts and pinned direct dependencies
├── package-lock.json            # reproducible dependency tree
├── .gitignore                   # excludes .env, build output, and local secrets
├── README.md                    # setup, Ollama/model installation, and demo steps
├── src/
│   ├── main/
│   │   ├── main.js              # app lifecycle, windows, IPC registration
│   │   ├── tray.js              # tray menu and reopen/quit behavior
│   │   ├── reminder-clock.js    # normal/demo interval and due events
│   │   ├── guest-store.js       # versioned JSON persistence and validation
│   │   ├── persona.js           # scoring and tie-break
│   │   ├── message-selection.js # local reminder selection by persona/context
│   │   ├── local-model.js       # Ollama detection and message generator adapter
│   │   └── ipc-handlers.js      # narrow validated renderer actions
│   ├── preload/
│   │   └── bridge.js            # safe, named API exposed to windows
│   ├── renderer/
│   │   ├── incubation.html      # egg, question flow, hatching consent
│   │   ├── overlay.html         # compact cross-app intervention
│   │   ├── styles.css           # blue shell, slime palette, layout
│   │   ├── incubation.js        # question and hatching UI behavior
│   │   ├── overlay.js           # OK/cross buttons and dismissal
│   │   └── slime.js             # isolated character art, animation states added last
│   └── shared/
│       ├── questions.js         # current 15 light questions and scoring metadata
│       ├── questions-v1.js      # previous set for guests already mid-incubation
│       ├── personas.js          # persona identity, palette, message packs, and tone
│       └── message-schema.js    # shared source shape and content limits
├── devpost/                     # scope, PRD, spec, and review companions
└── ...                          # generated dependencies/build output omitted
```

## External Services and Dependencies

### Local model runtime (optional message generation)

- **Runtime:** Ollama for Windows, installed by the user. DOST calls only `http://127.0.0.1:11434/api/chat`; never accept a custom remote host.
- **Model candidate:** `qwen3.5:4b-q4_K_M`, currently listed around 3.3 GB with Apache 2.0 licensing. Confirm hardware fit, exact size, license text, and output quality on the demo machine before committing to the model. [Ollama download](https://ollama.com/download/windows) · [Ollama model listing](https://ollama.com/library/qwen3.5%3A4b-q4_K_M)
- **Setup:** user installs Ollama and runs `ollama pull qwen3.5:4b-q4_K_M`. Model download requires internet. Once installed, generation uses the local runtime and the user's profile does not go to a cloud endpoint.
- **Request:** one prompt after incubation, containing the agreed prompt text plus all answered Q/A pairs. Request the shared JSON result with bounded lists and the specified persona/emotion names. No tools, search, remote inference, or per-reminder requests.
- **Response:** validate the JSON and every category/emotion/text bound before saving the generated pack. Reject malformed output and continue using prepared messages.
- **Privacy and persistence:** clearly indicate local processing before the user starts generation. Keep answers, prompt processing, and message pack on this PC. Do not write prompt/output logs or expose Ollama controls to the renderer.
- **Fallback:** generation skipped, Ollama/model missing, timeout, runtime error, or invalid JSON → hatch with prepared local messages; give setup/retry guidance where appropriate.

There is no required hosted database, analytics service, login, or hosting account.

## Important Failure Modes

- **Ollama/model unavailable or user skips generation:** hatch with the prepared local message pack and show setup/retry guidance.
- **Local model returns invalid or incomplete output:** reject the candidate pack and retain the prepared pack.
- **Saved JSON missing or invalid:** create a clean guest and show a recoverable “local progress could not be read” message with reset option; never silently crash.
- **Overlay interaction or window creation fails:** retain the pending suggestion and expose it when the user reopens Dost from the tray; do not discard the reminder outcome.

## What Was Simplified and Why

- **One local guest JSON file** instead of accounts and cloud sync — proves the incubation and reminder loop without authentication or a server.
- **An optional user-installed Ollama runtime and model** instead of a hosted inference service — allows DOST to use the actual answer profile while keeping inference on the user's PC; model installation is an extra setup step and local quality/performance depends on hardware.
- **Running-time intervals** instead of monitoring apps or screen contents — preserves the cross-app moment while honoring the agreed interval-based trigger and avoiding activity tracking.
- **Short demo clocks** instead of waiting 24 hours, two hours, and 50 minutes in a recording — same state flow with demo-only 30-second incubation waits, two-minute habit interval, and 50-second light interval.
- **One fixed lower-left overlay on the primary display** rather than multi-monitor placement/settings — keeps the character visible and the window implementation focused.

## Decisions and Open Issues

### Decisions

- **Learner chose Windows-only and Electron.** Plain JavaScript/HTML/CSS keep the first build in one familiar web language; larger app size accepted for accessible implementation and window controls.
- **Learner chose tray residency.** Closing the main window hides Dost, preserving the timer; Quit stops the process.
- **Learner chose local-only guest persistence.** No login, server database, or account linking in this POC.
- **Persona content is data-driven.** A shared persona catalog owns each persona's ID, presentation, palette, message pack, and personalized variants. Scoring and character rendering use catalog IDs; the guest store migrates its score fields when the catalog schema changes.
- **Learner chose interval-based reminders.** Count app-running time in separate habit and light lanes; no input, app, or content monitoring. The habit lane is two hours (two minutes in demo), and the light lane is about 50 minutes (50 seconds in demo) with a minimum spacing rule and cross-triggered mute.
- **Learner chose local-model generation from the real answer profile.** The Windows demo asks users to install Ollama and download a local model; the Electron main process calls only localhost. There is no Gemini request, hosted backend, API key, or cloud inference.
- **Learner asked that questions not be too personal.** Questions focus on light lifestyle habits, occupation/work type, ideals, personality, and hurdles. When users choose local generation, their answers are processed only on their PC.
- **Learner's useful uncertainty:** whether an interval-only trigger would make the demo less credible. Clarified as an honest scheduled check-in, not a claim that Dost detected screen use. The app demonstrates the real reminder cycle with accelerated timing.

### Open before or during build

- The current 15 light questions and selectable option-to-score mappings are implemented in `src/shared/questions.js` and used by the incubation flow. `questions-v1.js` preserves the original wording for an existing guest who has not hatched yet.
- Before implementing the prompt, assign the user's profile labels (“procrastination,” “a kind person,” “a pushover,” “scared,” and “going in an endless spiral”) to the Chill/Bossy inference groups. Preserve the labels as written; do not invent or rename them.
- Demo mode uses a 30-second incubation wait between sessions; normal wait remains 24 hours.
- Verify current Electron/Node compatibility, Ollama detection on Windows, the selected local model's installation and hardware fit, and structured output quality. Do not let Ollama be required for the app to run.
- Confirm the hatching screen explains local answer processing, offers setup/check-again and skip options, and continues with prepared content when local generation is unavailable.
