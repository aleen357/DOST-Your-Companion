---
doc: checklist
status: approved
---

# DOST Build Checklist

Build mode: learn

## Slices

- [x] **1. DOST can appear over another app and be dismissed**
  Becomes usable: A running Windows app with a small DOST overlay that can be summoned from the main window and dismissed with OK or cross.
  Why now: This proves the unusual cross-app window behavior early, while the implementation is still small. It also bootstraps Electron, the safe preload bridge, and the tray lifecycle inside the first usable step.
  PRD ref: `prd.md > Screens and Layout > Reminder overlay`, `prd.md > Look and Feel`, and `prd.md > Features and Behavior > Cross-app reminders`
  Spec ref: `spec.md > Where It Runs and How Someone Tries It`, `spec.md > Look and Feel`, `spec.md > Components > Electron main process and lifecycle`, `spec.md > Components > Preload bridge`, `spec.md > Components > Cross-app reminder overlay`, and `spec.md > File Structure`
  Build: Initialize the Electron project with the approved DOST display name; add a main window, tray hide/reopen/quit behavior, a narrow preload bridge, and a frameless transparent always-on-top overlay. Add an in-app demo control that shows the overlay. Mount static slime art through a dedicated `slime.js` module, leaving motion and expressions for the final slice. Wire OK and cross to close it. Add project scripts and secret-safe ignore rules.
  Verify (mechanical): Run `npm install` and `npm start`; confirm Electron launches, the demo control opens the lower-left overlay above another window, both OK and cross close it, closing the main window leaves the tray icon available, and Quit exits the process.
  Learner check: Open DOST, switch to another app, show the companion, and try OK and cross. Tell me what feels clear or awkward about its size, placement, character art, and actions.
  Commit: `Build DOST cross-app companion overlay`

- [x] **2. The egg hatches into a locally personalized DOST**
  Becomes usable: A guest can complete three five-question sessions, return after the waiting periods, and hatch a chill or bossy DOST whose prepared reminder pack is chosen locally.
  Why now: This delivers the incubation idea and its personalization kernel before the automatic reminder cycle is added. Feedback from the first overlay can still shape the shared visual language.
  PRD ref: `prd.md > The Core Journey` (steps 1–4), `prd.md > Features and Behavior > Guest incubation and answers`, `prd.md > Features and Behavior > Persona and hatching`, and `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Incubation window`, `spec.md > Components > Persona and local message selection`, `spec.md > Components > Local guest store`, `spec.md > Data Model`, `spec.md > Important Failure Modes`, and `spec.md > File Structure`
  Build: Add a versioned local guest JSON store and recoverable new-guest state. Write the 15 light questions in `src/shared/questions.js` with selectable score mappings and a few typed responses. Implement one-question-at-a-time sessions, mandatory completion, 24-hour normal and 30-second demo waits (`npm run start:demo`), +2 chill/+3 bossy/random +2 scoring and random tie-break, progress display, hatch introduction, and locally selected prepared message packs. Keep local selection behind a small source boundary using the shared message schema; don't add a general AI/provider framework.
  Verify (mechanical): Run the app in demo mode; complete all three sessions, confirm the wait blocks Connect between sessions, close and reopen during incubation to confirm progress persists, and finish all 15 answers to see the expected score-selected persona and its local messages. Confirm a malformed or absent local file recovers to a usable guest screen.
  Learner check: Complete the short incubation journey in the app. Check that the questions feel light, the scoring/hatch result makes sense, and the local messages fit the persona; point out anything you would rewrite.
  Commit: `Add DOST incubation and local persona`

- [ ] **3. DOST delivers scheduled reminders and follows up**
  Becomes usable: After hatching, DOST runs from the tray, shows local reminders on schedule, and changes the next message based on how the user dismissed the previous one.
  Why now: This connects the incubated context to the product's promised cross-app nudge, using the already verified overlay and local pack.
  PRD ref: `prd.md > The Core Journey` (steps 5–6), `prd.md > Features and Behavior > Cross-app reminders`, `prd.md > Features and Behavior > Dismissal and follow-up`, and `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components > Reminder clock and tray`, `spec.md > Components > Cross-app reminder overlay`, `spec.md > Data Model`, and `spec.md > Important Failure Modes`
  Build: Start the first interval at hatch; use two hours normally and two minutes in demo and developer modes. Keep timing while hidden in the tray and persist remaining time across Quit/relaunch. Select each reminder from the local persona pack and display the selected persona. After OK, schedule a quote, another goal, or joke; after cross, schedule a “did you do it?” check-in; after dismissing that, schedule a different suggestion. Restart the interval on every dismissal and retain pending content if overlay display fails. Add a developer-only countdown, overlay preview, Start over, and immediate reminder control through `npm run start:dev`; hide these controls in demo and regular modes.
  Verify (mechanical): Hatch in demo mode, confirm developer controls are absent, and confirm the scheduled overlay appears above another app. In developer mode, confirm the live countdown updates and the developer-only controls work. Exercise OK and cross paths through their next-cycle messages, then quit and relaunch to confirm the saved schedule/follow-up state resumes.
  Learner check: Let a reminder appear while another app is open. Try the OK path and the cross path; tell me whether the timing and follow-up feel supportive rather than nagging.
  Commit: `Add DOST reminder schedule and follow-up`

- [ ] **4. The optional AI preview is clearly disclosed and isolated**
  Becomes usable: At hatch, the user can preview a sample generated from the built-in fictional profile, or skip it and use DOST normally.
  Why now: The core companion already works offline, so the external call can be added as an optional demonstration without becoming a dependency for incubation or reminders.
  PRD ref: `prd.md > The Core Journey` (step 4), `prd.md > Features and Behavior > Cross-app reminders`, and `prd.md > What We're Building`
  Spec ref: `spec.md > Components > Optional fictional AI demo preview`, `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`, and `spec.md > Decisions and Open Issues`
  Build: Add a consent notice naming Google and the Gemini unpaid tier, describing provider data use/review, and stating that only built-in fictional data is sent while real guest answers stay local. Implement Gemini as a separate optional generator adapter that returns the shared message schema. Use an optional local API key, validate generated content, and store/display it separately from the guest's locally selected message pack. Decline, missing key, network/API failure, or invalid output must skip the preview and still hatch DOST.
  Verify (mechanical): With no API key, hatch and confirm the local reminder flow works. With an available local key and explicit consent, confirm a fictional sample preview is generated and stored separately; inspect the request construction to confirm no guest answer or typed text is included. Decline and failure paths must also hatch normally.
  Learner check: Review the consent message and decide whether it is understandable and comfortable. Compare the sample preview with the reminder DOST actually uses.
  Commit: `Add optional fictional AI preview`

- [ ] **5. DOST's character gets its final animation and expressions**
  Becomes usable: The same modular slime art now has a calm idle motion and clear chill/bossy reactions that make the companion feel alive without obscuring its message.
  Why now: Character motion is the final visual polish, after the full incubation, reminder, follow-up, and optional AI journeys are in place; the separate `slime.js` module keeps it easy to adjust.
  PRD ref: `prd.md > Look and Feel`, `prd.md > Screens and Layout > Hatching`, and `prd.md > What We're Building`
  Spec ref: `spec.md > Look and Feel`, `spec.md > Components > Cross-app reminder overlay`, and `spec.md > File Structure`
  Build: Add lightweight CSS/SVG idle and reaction states in `slime.js` and the character styles for both personas. Respect reduced-motion preferences and keep controls and message text unaffected.
  Verify (mechanical): Run `npm start`; confirm both personas render, idle and reaction states switch from the intended UI states, and reduced-motion settings suppress movement while leaving the character visible.
  Learner check: View each persona and reaction in the app. Tell me whether the animation reads as friendly and clear at the overlay's small size.
  Commit: `Polish DOST character animations`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1, inspect overlay above another app and give feedback on placement, character art, and dismissal.
- [ ] Final kick-the-tires exploration and feedback completed — after all slices, try incubation, hatching, reminder timing, follow-up branches, and preview/skip behavior.

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [complete after the build]
Route and stops: [complete after the build]
Edit outcome: [complete after the build]
Reflection: [complete after the build]
Activity mode: [complete after the build]

## Revisions

- Centralized persona identity, palette, message packs, and tailored variants in a shared catalog — this keeps the current two personas together and lets scoring and the slime renderer resolve persona IDs without assuming only chill and bossy exist.
- Added a confirmed **Start over** action that clears local selections and restores the fresh-egg state; a one-time `--reset-guest` launch flag resets the current demo record.
- Added a small shared message-source boundary — the learner wants the architecture to leave room for a future local/private model; the current proof still uses local reminder selection and an optional, isolated fictional Gemini preview.
- Removed swipe dismissal for the Windows desktop flow and fixed the button click issue by removing pointer capture from the overlay card — hands-on review found OK and cross were not responding; pointer capture retargeted pointerup/click events away from the buttons. The learner retested and confirmed OK, cross, overlay, and tray behavior work.
- Moved DOST character motion and expressions to a final dedicated slice — the learner wants to add character animation at the end, with the renderer kept modular for that work.
