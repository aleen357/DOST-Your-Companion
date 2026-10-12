---
doc: spec
status: approved
---

# DOST — Technical Spec

## How This Works, In Plain Language

Dost is a Windows desktop app made with Electron. Electron lets us build the screens in HTML, CSS, and JavaScript while also opening ordinary Windows windows. The main window shows the egg and questions. After Dost hatches, a second, small transparent window can appear above other apps for reminders.

One part of Electron manages windows, the tray icon, the reminder clock, saved data, and the optional AI demo-preview request. The visible screens run in a separate part with a narrow bridge between them. This keeps system access out of the screen code and is a useful pattern to learn. Closing the main window hides Dost in the Windows tray so its clock keeps running; choosing Quit stops the app.

Answers, scores, reminder progress, and Dost's message pack are saved in one JSON file on this PC. Dost's own reminders are selected locally from prepared messages using the guest's persona and structured answer categories; typed answers never leave the PC. At hatching, the user may also choose an explicitly labeled AI demo preview. That one request sends only a built-in fictional profile—not the guest's answers—to Google's Gemini API. The preview is saved locally and shown as a sample, not used as the guest's personalized pack. If the user declines, the key or network is unavailable, or generation fails, hatching still proceeds with the local messages. The app does not inspect other apps or their contents.

## The Core Journey Through the System

1. `npm start` opens the incubation window. The main process reads the local data file and shows either a new egg or the saved step in the journey. A guest ID is generated locally; no account is needed.
2. The user starts a Connect session and answers five questions, one at a time. The screen sends each answer through the limited bridge; the main process scores choice answers and saves all answers.
3. After a session, the main process records when Connect becomes available again. Normal mode waits 24 hours. Demo mode uses a 30-second incubation wait so all three sessions can be shown in a recording.
4. Once all 15 answers are saved, the main process calculates the chill/bossy result and chooses the guest's message pack locally from persona and structured choice categories. Message sources use one small shared schema: the local source supplies real reminders and the optional generator supplies a separate demo sample. At hatch, the user may separately opt into an AI demo preview. A plain-language disclosure explains that a built-in fictional profile—not their answers—goes to Google Gemini, where unpaid-tier content may be used to improve products and human reviewers may process it. Accepting makes one request for a sample JSON pack; declining or a failed request simply skips the preview. Dost hatches and introduces itself either way.
5. The main process stores the next reminder time. Normal mode uses a two-hour interval; demo mode uses two minutes. The interval counts while Dost is running in the tray. If the user quits Dost, its remaining time is saved and resumes on the next launch. A reminder that becomes due while Windows is asleep appears after wake.
6. At the due time, the main process opens a small lower-left, transparent, always-on-top reminder window. It chooses a prepared local message using Dost's persona and the user's structured choice categories. OK or cross dismisses it and updates the saved follow-up state. After OK, the next interval offers a quote, another goal, or a joke. After cross, the next interval asks whether the user did it; if that follow-up is dismissed again, the following interval offers a different suggestion. Every dismissal starts the next interval.

PRD refs: `prd.md > The Core Journey`, `Guest incubation and answers`, `Persona and hatching`, `Cross-app reminders`, `Dismissal and follow-up`, and `States and Boundaries`.

## Stack

- **JavaScript and HTML/CSS:** one approachable language across the screens and the desktop logic; the visual direction is already defined in the PRD.
- **Electron (current stable at project setup):** Windows desktop windows, system tray, background timer, and local application-data path. Electron's window options support transparent and always-on-top windows. The accepted tradeoff is a larger app footprint in exchange for staying in JavaScript. [Electron BrowserWindow](https://www.electronjs.org/docs/latest/api/browser-window/) · [Electron process model](https://www.electronjs.org/docs/latest/tutorial/process-model) · [Context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation) · [Tray](https://www.electronjs.org/docs/latest/api/tray/)
- **Node.js LTS supported by the selected Electron release:** runs the main process and local JSON file operations. Pin the exact Electron and Node-compatible development versions in the project lockfile during build. [Electron prerequisites](https://www.electronjs.org/docs/latest/tutorial/tutorial-prerequisites)
- **Google Gemini Developer API (demo preview only):** one request using static fictional sample data, configured to return schema-shaped JSON. Use the current stable free-tier Flash model available at build time; official docs currently recommend `gemini-3.8-flash`. Verify model availability and free-tier limits during build. [Gemini models](https://ai.google.dev/gemini-api/docs/models) · [Structured output](https://ai.google.dev/gemini-api/docs/structured-output) · [GenerateContent API](https://ai.google.dev/api/generate-content)
- **`dotenv`:** loads a local `.env` into the Electron main process during development; `.env` stays ignored by Git.
- **No front-end framework, server, database, analytics, or account provider** in this proof of concept.

## Where It Runs and How Someone Tries It

- **Runtime:** a locally installed Windows desktop application; no website hosting or deployment is needed for the demo recording.
- **Requirements:** Windows 10 or later, Node.js LTS, and npm. A Gemini API key is optional and only enables the fictional AI demo preview; the app's actual guest reminders work without a key.
- **Start the app:** from the project folder, run `npm install`, then `npm start` in PowerShell.
- **Run the demo cadence:** `$env:DOST_DEMO_MODE = 'true'; npm start`. Demo mode shortens the two incubation waits to 30 seconds each and the reminder interval to two minutes. Remove the environment variable or set it to `false` for the normal 24-hour incubation wait and two-hour reminder interval.
- **Optional API key setup:** create a Gemini Developer API key for the local demo, then put `GEMINI_API_KEY` in a local `.env` file that is ignored by Git. Include `.env.example` with a placeholder only. Never commit or package the key. A key embedded in a distributable desktop app could be extracted; the fictional preview is for a locally configured demo, not public distribution with a shared key.
- **Recording:** show the three short incubation sessions, persona scoring/hatching, and the fictional AI-preview disclosure/choice; then leave the app in the tray while working in another app until the demo reminder appears. For a shorter recording, use the main-window **Show reminder now** control, which triggers the exact same overlay and dismissal path without waiting for the demo interval.
- **Submission:** the local app and a short demo video satisfy the demo path. A public GitHub repository is also required by the learning program; keep all local keys out of it. Hosting is optional.

## Look and Feel

Carry forward `prd.md > Look and Feel`: quiet blue incubation background, centered egg and effort bar, compact calm layout, then static green chill slime or orange-red bossy slime art. The overlay is a small lower-left companion with a short message and visible OK/cross actions; desktop swipe dismissal is not supported. Add the slime's lightweight idle and reaction animation in the final build slice through the dedicated `slime.js` module. Use supportive, clear language so bossy is direct without becoming hostile. The cross-app window must remain small and non-blocking; the underlying work stays visible.

## Components

### Electron main process and lifecycle

Creates the main window, transparent reminder window, and Windows tray menu. Closing the main window hides the app in the tray; tray actions reopen the main window or fully quit. It owns persistence, reminder timing, persona scoring, and the optional Gemini demo-preview request. Renderer windows have no direct Node.js access.

PRD refs: `prd.md > The Core Journey`, `Screens and Layout`, and `Cross-app reminders`.

### Preload bridge

Exposes only named actions needed by the UI: load current guest view, save an answer, complete a session, request hatch, request the fictional AI preview, skip the preview, acknowledge/dismiss a reminder, and invoke the demo reminder. It validates message shapes and communicates with the main process through Electron IPC.

PRD refs: `prd.md > Guest incubation and answers`, `Persona and hatching`, and `Dismissal and follow-up`.

### Incubation window

Shows the egg, effort progress, five-question Connect flow, session cooldown, hatching and introduction, plus an optional **Preview AI-generated sample** action. The notice names Google and the Gemini unpaid/free tier, says only a fictional built-in profile is sent, and states that the guest's answers stay on this PC. It explains that Google may use unpaid-tier prompts/responses to improve products and human reviewers may process them. The user can skip the preview and hatch normally. The 15 questions themselves stay light and avoid sensitive topics.

PRD refs: `prd.md > Screens and Layout`, `Guest incubation and answers`, `Persona and hatching`, and `States and Boundaries`.

### Persona and local message selection

Scores selectable answers using the agreed +2/+3/random +2 rules and random tie-break. Typed answers remain saved locally but do not score. For Dost's actual reminder pack, selects prepared local messages by persona and structured choice categories; it never sends the guest's answers to a cloud model.

All message sources return the same small validated message shape. The local selector is the source for actual reminders. The optional fictional-profile generator is a separate source whose sample is stored and displayed independently. Keep this boundary small; it gives a later local or private model a clear integration point without adding that model or a general provider framework to this proof of concept.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `Dismissal and follow-up`.

### Optional fictional AI demo preview

The hatching screen offers a separate **Preview AI-generated sample** action. Before making a request, show an affirmative consent notice naming Google and the Gemini unpaid/free tier, explaining that the service may use prompts/responses to improve products and human reviewers may process them, and stating that only a fictional built-in profile is sent. It explicitly says the guest's answers stay on this PC and the generated preview is not personalized to them. Questions remain light and avoid sensitive topics. The user can decline and hatch normally. This is a demo usage disclosure, not a full legal terms document.

The main process sends the static sample prompt to Gemini's GenerateContent endpoint, requests structured JSON for suggestions, encouragement, original wisdom-style lines, and jokes, then validates and stores the result as a separate demo preview. It does not replace the guest's locally selected pack and makes no later AI calls. Missing key/network, timeout, rate-limit, non-success, or invalid output skips the preview and still hatches Dost.

PRD refs: `prd.md > Persona and hatching`, `Cross-app reminders`, and `What We're Building`.

### Local guest store

Reads/writes a single versioned JSON document in Electron's per-user application data folder. Save after every answer, session completion, AI preview consent choice, preview result, and reminder response. On launch, validate the file; if missing or malformed, show a recoverable new-guest state rather than crashing. Keep schema version so later builds can migrate it.

PRD refs: `prd.md > Guest incubation and answers`, `Dismissal and follow-up`, and `States and Boundaries`.

### Reminder clock and tray

Starts the first interval when Dost hatches, then restarts it whenever a reminder is dismissed. Keeps time while the app runs, including when its main window is hidden in the tray. Saves remaining duration when the user fully quits. Normal reminder interval is two hours; demo and developer intervals are two minutes. At a due time it asks the main process to show the overlay; it does not inspect app names, window contents, keystrokes, or scrolling.

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
| `answers` | Question IDs, answer type, selected option or short typed text | Written after each answer; reloaded if the app closes during incubation. |
| `sessionIndex`, `completedSessions`, `connectAvailableAt` | Session progress and next Connect time | Updated only after all five answers in a session; 24 hours normally or 30 seconds in demo mode. |
| `personaScores`, `persona` | Totals keyed by persona ID and the final selected type | Scores update from options; the highest score wins, with a random tie-break. The selected persona remains stable after answer 15. |
| `messagePack` | Prepared local messages selected for this guest by persona and structured choice categories | Selected after scoring and reused offline; typed answers are not used in prompts or sent to a model. |
| `demoGenerationConsent`, `demoMessagePack` | Whether user opted into a fictional AI sample preview and its validated result | Stored separately from the real guest pack; never used as personalized reminders. |
| `reminderRemainingMs`, `pendingReminder`, `followUpState`, `lastSuggestionId`, `lastReminderId`, `nextReminderKind` | Remaining schedule, any reminder awaiting a response, and response cycle | Saved on quit and after reminder changes; launch resumes the interval or re-shows a pending reminder. |

`messagePack` contains bounded arrays for break ideas, encouragement, original wisdom-style lines, and jokes. Do not persist API request logs. **Start over** asks for confirmation, then replaces the local record with a new guest, clearing answers, persona, and saved message packs.

Data flow: UI answer → preload bridge → main process validates and scores → local JSON file. Main process selects the guest's prepared message pack using persona and choice categories. If the user opts into the demo preview, the main process sends only a built-in fictional prompt to Gemini → validates JSON response → saves a separate preview locally. The reminder clock reads the guest's local pack → overlay displays a selected item → OK/cross updates saved follow-up state.

## File Structure

```text
Dost/
├── package.json                 # scripts and pinned direct dependencies
├── package-lock.json            # reproducible dependency tree
├── .gitignore                   # excludes .env, build output, and local secrets
├── .env.example                 # key name and placeholders only
├── README.md                    # setup, API-key setup, and demo steps
├── src/
│   ├── main/
│   │   ├── main.js              # app lifecycle, windows, IPC registration
│   │   ├── tray.js              # tray menu and reopen/quit behavior
│   │   ├── reminder-clock.js    # normal/demo interval and due events
│   │   ├── guest-store.js       # versioned JSON persistence and validation
│   │   ├── persona.js           # scoring and tie-break
│   │   ├── message-selection.js # local reminder selection by persona/context
│   │   ├── gemini-preview.js   # optional fictional sample generator adapter
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
│       ├── questions.js         # 15 light questions and scoring metadata
│       ├── personas.js          # persona identity, palette, message packs, and tone
│       └── message-schema.js    # shared source shape and content limits
├── devpost/                     # scope, PRD, spec, and review companions
└── ...                          # generated dependencies/build output omitted
```

## External Services and Dependencies

### Gemini Developer API (optional fictional demo preview)

- **Purpose:** demonstrate AI generation once with a fictional sample profile; no API call for a real guest's answers and none per reminder.
- **Endpoint:** `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`.
- **Authentication:** `x-goog-api-key: $GEMINI_API_KEY`, kept in local `.env`, ignored by Git. Do not bundle it in a distributable build.
- **Request:** one built-in, fictional sample profile and sample persona; `generationConfig.responseMimeType` is `application/json` and `responseSchema` constrains arrays of break suggestions, motivation, original wisdom-style lines, and jokes. Do not add guest answers, typed text, name, account, app history, search, or tools.
- **Response:** parse `candidates[0].content.parts[0].text` as JSON, validate against local schema and length/item limits, then save to the separate demo-preview field. Reject malformed or unsafe output and skip the preview.
- **Model:** current stable Flash model selected during build; official docs currently recommend `gemini-3.8-flash`. Check current model access and rate limits before implementation.
- **Cost and data terms:** official free tier lists text input/output at no charge, subject to model-specific rate limits. For unpaid usage, Google may use requests/responses to improve products and human reviewers may process them; its terms say not to submit sensitive, confidential, or personal information. The in-app disclosure and affirmative choice are required before this request. [Pricing](https://ai.google.dev/gemini-api/docs/pricing) · [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits) · [Additional terms](https://ai.google.dev/gemini-api/terms) · [GenerateContent API](https://ai.google.dev/api/generate-content)
- **Consent and privacy:** the app describes the fictional data sent and Google's unpaid-tier terms before the request. The preview is optional, separate from the guest's local pack, and labeled as sample output. No actual guest answer is sent to this external service.
- **Fallback:** decline, no key, offline state, rate limit, timeout, non-success response, or invalid JSON → skip preview; local message pack still hatches Dost.
- **Distribution limit:** a desktop app cannot safely hide a shared API key. The proof of concept uses a locally configured key for its own demo. Broader release needs a server-side provider/private paid model, or a per-user credential model, to be designed separately.

There is no required hosted database, analytics service, login, or hosting account.

## Important Failure Modes

- **Gemini unavailable or user declines:** skip the optional preview and finish hatching with the persona's locally selected message pack; explain that the preview was skipped.
- **Saved JSON missing or invalid:** create a clean guest and show a recoverable “local progress could not be read” message with reset option; never silently crash.
- **Overlay interaction or window creation fails:** retain the pending suggestion and expose it when the user reopens Dost from the tray; do not discard the reminder outcome.

## What Was Simplified and Why

- **One local guest JSON file** instead of accounts and cloud sync — proves the incubation and reminder loop without authentication or a server.
- **One optional AI preview using fictional sample data** instead of sending real guest answers — demonstrates generation while keeping actual user context on the PC.
- **A clearly disclosed Gemini free-tier request** instead of a private server model — demonstrates the AI path locally without putting personal answers on a provider; real profile-based AI personalization is deferred.
- **Running-time intervals** instead of monitoring apps or screen contents — preserves the cross-app moment while honoring the agreed interval-based trigger and avoiding activity tracking.
- **Short demo clocks** instead of waiting 24 hours and two hours in a recording — same state flow with demo-only 30-second incubation waits and two-minute reminder interval.
- **One fixed lower-left overlay on the primary display** rather than multi-monitor placement/settings — keeps the character visible and the window implementation focused.

## Decisions and Open Issues

### Decisions

- **Learner chose Windows-only and Electron.** Plain JavaScript/HTML/CSS keep the first build in one familiar web language; larger app size accepted for accessible implementation and window controls.
- **Learner chose tray residency.** Closing the main window hides Dost, preserving the timer; Quit stops the process.
- **Learner chose local-only guest persistence.** No login, server database, or account linking in this POC.
- **Persona content is data-driven.** A shared persona catalog owns each persona's ID, presentation, palette, message pack, and personalized variants. Scoring and character rendering use catalog IDs; the guest store migrates its score fields when the catalog schema changes.
- **Learner chose interval-based reminders.** Count time while the app runs, with a two-hour normal interval and two-minute demo interval. No input, app, or content monitoring.
- **Learner chose a local demo AI preview with fictional data.** A built-in fictional profile goes to the unpaid Gemini API only after explicit consent; actual guest answers never leave the PC. Dost uses a locally selected message pack. This preserves a visible AI demo while avoiding third-party processing of user data.
- **Learner asked that questions not be too personal.** Questions focus on light lifestyle habits, occupation/work type, ideals, personality, and hurdles. The AI preview disclosure states that only fictional sample data is sent; actual answers stay local.
- **Learner's useful uncertainty:** whether an interval-only trigger would make the demo less credible. Clarified as an honest scheduled check-in, not a claim that Dost detected screen use. The app demonstrates the real reminder cycle with accelerated timing.

### Open before or during build

- The exact 15 light question wordings and selectable option-to-score mappings are implemented in `src/shared/questions.js` and used by the incubation flow.
- Demo mode uses a 30-second incubation wait between sessions; normal wait remains 24 hours.
- Verify current stable Electron, Node LTS compatibility, Gemini Flash model availability, and free-tier limits when scaffolding. Do not let the API be required for the app to run.
- Confirm the hatching disclosure names Google, describes the fictional data sent and free-tier data use/human review, says actual answers stay local, and offers **Skip AI preview** without pressure.
