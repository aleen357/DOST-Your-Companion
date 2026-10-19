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
  Build: Start two independent lanes at hatch: a habit nudge every two hours and a light joke/wisdom message about every 50 minutes. Add up to five minutes of random jitter to light timing and enforce a 30-minute minimum gap around habit reminders. Scale these to two minutes, 50 seconds, five seconds, and 30 seconds in demo/developer modes. Keep both lanes running while hidden in the tray and persist their remaining time across Quit/relaunch. Shuffle through the generated messages without repeating until a category is exhausted. OK changes the next light follow-up to encouragement; cross mutes light messages for five hours (five minutes in demo) while habit nudges continue. Crossing a habit nudge also schedules a “did you do it?” check-in at the next habit slot; after that check-in, the next habit slot returns to a suggestion. Do not reset either clock on dismissal. Add a developer-only countdown, overlay preview, Start over, and immediate habit reminder through `npm run start:dev`; hide these controls in demo and regular modes.
  Verify (mechanical): Hatch in demo mode, confirm developer controls are absent, and confirm light and habit events follow the short schedule with the minimum gap. In developer mode, confirm the countdown updates and immediate habit reminder works. Exercise OK, light-cross, habit-cross, and check-in paths; confirm the five-minute demo mute affects only light messages. Quit and relaunch to confirm both saved lanes, mute state, and follow-up state resume.
  Learner check: Let a reminder appear while another app is open. Try the OK path and the cross path; tell me whether the timing and follow-up feel supportive rather than nagging.
  Commit: `Add DOST reminder schedule and follow-up`

- [ ] **4. DOST creates a personalized message pack with a local model**
  Becomes usable: After incubation, the user can generate a personalized message pack from their answers using a model running locally through Ollama, or continue with prepared messages.
  Why now: Finalize the local generation contract before revising the question wording. A question-bank-independent profile format lets us improve questions later without rewriting the Ollama client or generated-pack contract.
  PRD ref: `prd.md > The Core Journey` (step 4), `prd.md > Features and Behavior > Cross-app reminders`, and `prd.md > What We're Building`
  Spec ref: `spec.md > Components > Local model message generation`, `spec.md > External Services and Dependencies`, `spec.md > Important Failure Modes`, and `spec.md > Decisions and Open Issues`
  Build: Replace the Gemini preview with three small boundaries: a profile formatter that turns any versioned question bank into labeled Q/A pairs, a local Ollama client that checks the fixed localhost runtime/model and makes one request, and a response adapter that validates the agreed JSON and maps talks to DOST's reminder categories. Preserve the user's prompt wording and emotion names. Reconcile score-based and model-inferred persona in one generation: on disagreement choose Chill. Store the generated pack locally as active content. If the user skips, Ollama/model is missing, or generation fails, keep the prepared pack and allow hatching.
  Verify (mechanical): Confirm the formatter works with either question-bank version without hardcoded question IDs; Ollama/model detection uses only localhost; a successful response validates and maps into existing reminder categories; score/model disagreement resolves to Chill; and missing runtime/model or invalid output leaves the prepared pack usable. Confirm there is no cloud endpoint or API key.
  Learner check: Install Ollama and download the selected local model, use **Start over** in `npm run start:dev`, complete the current incubation set, and generate Dost's pack. Inspect whether the result reflects the profile, requested persona rule, categories, and emotion names. Try the prepared-message fallback when local generation is unavailable.
  Commit: `Add local-model personalization for DOST`

- [ ] **5. DOST learns a broader, more useful profile during incubation**
  Becomes usable: A new guest can answer 15 inclusive questions using single choice, multi-select, or short free responses, with an explicit way to decline a free-response question.
  Why now: With the profile-to-prompt contract and output mapping established, revise the questions to give DOST useful context for different kinds of work, study, care, and home life without changing the local-model interface.
  PRD ref: `prd.md > Guest incubation and answers`, `prd.md > Persona and hatching`, and `prd.md > What We're Building`
  Spec ref: `spec.md > Components > Incubation window`, `spec.md > Components > Persona and local message selection`, `spec.md > Data Model`, and `spec.md > File Structure`
  Build: Use 15 light questions across daily life, goals, social style, hurdles, and support style. Keep five questions per session. Support single-choice, bounded multi-select with exclusive “none” choices, and short typed responses with “Prefer not to share.” Score only explicit support-style choices locally; pass the version-neutral labeled answer profile to the local model after incubation. Preserve the prior question set for guests already mid-incubation and make local reminder selection understand the new answer shapes.
  Verify (mechanical): Run JavaScript syntax checks and a small structural check that the set has 15 questions, five per session, unique IDs/options, and bounded multi-select rules. Confirm the guest migration preserves old answers and tags in-progress guests for their original question set. Confirm profile formatting is unchanged by a question ID/wording change.
  Learner check: In `npm run start:dev`, use **Start over**, answer through all three demo sessions, try each answer type and “Prefer not to share,” and confirm the support-style answers and local-model personalization make sense. Check that wording feels natural outside software work.
  Commit: `Refine DOST incubation questions and response types`

- [ ] **6. DOST's character gets its final animation and expressions**
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

- Reworked the 15-question incubation slice after the learner asked for a broader, more intuitive profile covering general daily life, goals, social style, hurdles, and preferred support. Added single-select, bounded multi-select, typed responses, and an explicit “Prefer not to share” action. Only support-tone choices affect persona scoring; other context stays descriptive. Existing in-progress guests keep the prior question set through a versioned migration.
- Replaced the planned fictional Gemini preview with optional local-model generation from the user's answer profile. The learner chose a local runtime and asked DOST to guide users through installing Ollama and downloading the model; no hosted backend or cloud inference is in scope.
- Centralized persona identity, palette, message packs, and tailored variants in a shared catalog — this keeps the current two personas together and lets scoring and the slime renderer resolve persona IDs without assuming only chill and bossy exist.
- Added a confirmed **Start over** action that clears local selections and restores the fresh-egg state; a one-time `--reset-guest` launch flag resets the current demo record.
- Added a small shared message-source boundary so prepared messages and local-model-generated packs use the same validated shape.
- Removed swipe dismissal for the Windows desktop flow and fixed the button click issue by removing pointer capture from the overlay card — hands-on review found OK and cross were not responding; pointer capture retargeted pointerup/click events away from the buttons. The learner retested and confirmed OK, cross, overlay, and tray behavior work.
- Moved DOST character motion and expressions to a final dedicated slice — the learner wants to add character animation at the end, with the renderer kept modular for that work.
- Added a separate `--dev` launch mode with a live reminder countdown and preview/reset/immediate-trigger controls; ordinary demo mode keeps the accelerated timing but hides developer controls, as requested.
