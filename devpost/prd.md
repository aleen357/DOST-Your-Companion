---
doc: prd
status: approved
---

# DOST — Product Requirements

A small animated companion that learns about a person during incubation, then gives them personalized break reminders over other work.
Source: `scope.md > The Unique Kernel`, `Who It's For`, and `The Core Loop`.

## The Core Journey

1. **Arrive as a guest.** The user sees Dost's egg and the effort remaining before it hatches. No account setup is required for the proof of concept.
2. **Complete the first Connect session.** The user opens a compact dialogue at the bottom of the screen. It asks five questions, one at a time, using a mix of selectable answers and typed responses. Every question must be answered to finish the session.
3. **Return for the next sessions.** After the first and second groups of five answers, Connect is unavailable for 24 hours. The user returns for the next session and answers five more questions. The proof-of-concept demo shortens these waits so all three sessions can be shown at once.
4. **Hatch Dost.** After all 15 answers are complete, selectable answers determine the score-based chill-or-bossy persona. The user may choose to generate Dost's personalized message pack with a local model. DOST explains that Ollama and the selected model must be installed; the user's answers are sent only to Ollama running on this PC. The model also infers a persona from the answer profile; if its inferred persona disagrees with the score-based one, DOST chooses Chill. If the user skips setup, Ollama is unavailable, or generation fails, Dost hatches with the score-based persona and prepared local messages.
5. **Receive reminders over other work.** The habit lane offers a break nudge every two hours; the light lane offers a joke or wisdom line about every 50 minutes, with spacing rules to avoid crowding the habit nudge. Demo timing scales these to two minutes and 50 seconds. This is scheduled running time, not actual screen-use detection.
6. **Respond and continue the cycle.** OK or cross dismisses the overlay without resetting either clock. OK makes the next light message an encouragement. Cross mutes light messages for five hours; habit nudges continue. If the crossed message was a habit nudge, the next habit slot asks whether the user did it. If that check-in is dismissed, the following habit slot offers a different suggestion.

## Screens and Layout

### Incubation screen

- Quiet blue background with the egg as the central focus.
- A bar at the top shows effort remaining before the egg hatches.
- Connect opens a compact dialogue anchored at the bottom. It shows one question at a time.
- Account connection, sign-up, and guest-account linking are outside the proof of concept; the user starts as a guest.

### Hatching

- After the third completed Connect session, the egg hatches and Dost introduces itself.
- Chill Dost is green; bossy Dost is orange-red. The early prototype uses static character art; expressive idle and reaction animations are polished in the final build slice.

### Reminder overlay

- Small character and message sit unobtrusively at the lower-left edge, like the reference the learner shared. It must not take over the whole screen.
- The Windows overlay provides OK and cross controls. Swipe dismissal is not part of the desktop proof of concept.

## Look and Feel

- Incubation uses a quiet blue background and simple, calm layout centered on the egg and remaining-effort bar.
- Dost is a slime: green for chill and orange-red for bossy. The final build slice adds simple idle and reaction animation. Angry eyes or emoticons alone can look hostile, so the message and animation should make the intended tone clear.
- The cross-app intervention is compact and friendly, following the lower-left placement in the learner's reference. Keep the underlying work visible.

## Features and Behavior

### Guest incubation and answers

Source: `scope.md > The Core Loop` and `The POC Boundary`.

- The user completes three Connect sessions, with five questions per session and a 24-hour wait between sessions.
- Questions cover daily life and roles, goals, social style, hurdles, and preferred support; the wording must work for people who work, study, provide care, manage a home, or have changing routines.
- The 15 questions use single-choice, bounded multi-select, and short typed responses. A multi-select “none/not sure” choice is exclusive. A typed response may be declined explicitly. Each session must be fully answered before it counts; incomplete answers do not complete the session.
- Selectable answers contribute persona points only where the user expresses a preferred support style. All answers, including typed responses, remain local and may be included in the optional local-model prompt after the user chooses generation; they do not receive an immediate reply during incubation.
- Guest progress and answers remain available across the three incubation visits.
- **Start over** asks for confirmation, then clears all saved guest progress and returns to the fresh egg.

### Persona and hatching

Source: `scope.md > The Unique Kernel` and `Inspiration & Identity`.

- Once all 15 answers are complete, compare the selectable-answer scores.
- Support-style choices add +2 to chill, +3 to bossy, or +2 randomly when the user says the preferred tone depends on the moment. Other choices describe the user's context and do not score the persona.
- The higher total determines the persona. If totals tie, choose randomly.
- When local generation is available, include its inferred persona in the generated pack. If it differs from the score-based persona, the final persona is Chill. If local generation is skipped or fails, keep the score-based persona.
- Show the egg hatching and introduce the resulting Dost. The green chill and orange-red bossy variants use static placeholder art until final animation polish, with clear supportive or direct wording.

### Cross-app reminders

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

- After the agreed app-running interval, Dost appears automatically over other work; the user does not need to open Dost to trigger each reminder.
- DOST has two independent app-running reminder lanes: a habit nudge every two hours, and a light joke/wisdom message about every 50 minutes. A light message is skipped if it would be less than 30 minutes from a habit nudge. Light-message timing receives a small random jitter; demo mode scales the schedule to a 50-second light interval and a two-minute habit interval, with a 30-second minimum gap. Dost remains running in the Windows tray when its main window is closed. This is an app-running schedule, not system-wide screen-time detection.
- After hatching, the user may ask DOST to generate its message pack using their saved answers through Ollama and a locally installed model. Show that processing happens on this PC and do not send the profile to any remote endpoint. Keep the agreed prompt language and emotion names; return a bounded JSON pack that the app validates before saving.
- The user may skip local generation. If Ollama or the selected model is missing, unavailable, or returns invalid output, show setup/retry guidance and continue with prepared messages so DOST still works.
- The reminder uses the locally saved message pack to offer a relevant break or alternative, with motivation or coding encouragement. Examples include a 15-minute walk, water, a motivational quote, another goal, or a joke.
- The overlay stays small and non-blocking, with OK and cross controls.

### Dismissal and follow-up

- **OK:** dismisses the overlay and marks the message as acknowledged. The two reminder clocks continue; the next light message is an encouragement, after which light messages return to random jokes/wisdom.
- **Cross:** dismisses the overlay and mutes light jokes/wisdom for five hours (five minutes in demo mode). Habit nudges continue. If the crossed message was a habit nudge, the next habit slot asks whether the user did it, using DOST's persona.
- If that habit follow-up is dismissed, the following habit slot brings a different suggestion. A cross on a light message does not create a “did you do it?” check-in.

## States and Boundaries

- **New guest:** show the egg and remaining-effort bar; Connect starts the first five-question session.
- **Answering:** show one question at a time. The session cannot complete until all five are answered.
- **Waiting between sessions:** after the first and second sessions, Connect remains unavailable for 24 hours. The demo shortens this wait.
- **Ready for next session:** once the wait ends, Connect opens the next five-question set.
- **Hatched:** after all 15 answers, replace the egg with the scored Dost persona and its introduction.
- **Reminder visible:** show the compact overlay over other work. OK and cross remove it, with different follow-up meaning as specified above.
- **Demo trigger:** use a shortened app-running interval so the reminder and follow-up can be demonstrated without waiting hours; do not present it as screen-use detection.

## Product Decisions

- Keep the incubation because Dost needs user context to offer relevant guidance.
- Use 15 questions total across five context groups and three sessions of five; the larger 50-question bank remains deferred.
- Ask one question at a time, mixing single-select, bounded multi-select, and typed answers. Every step must be answered or explicitly declined before its session completes.
- Use only explicit support-style answers for chill/bossy scoring and retain all other selections and typed answers locally; do not have Dost reply during incubation.
- Use +2 chill, +3 bossy, and occasional random +2 scoring; choose randomly on a final tie.
- Make post-hatch reminders a small cross-app intervention with a two-hour habit lane plus a roughly 50-minute light joke/wisdom lane. Enforce a 30-minute minimum gap around habit prompts, add small jitter to light timing, and mute light prompts for five hours after cross. Demo mode scales these to two minutes, 50 seconds, 30 seconds, and five minutes respectively.
- Offer optional, one-time local-model generation after incubation, using the guest's saved answers to create Dost's message pack. Keep inference on the user's PC and fall back to prepared local content if setup or generation fails.
- OK acknowledges and changes the next light follow-up to encouragement without resetting either clock. Cross mutes light messages for five hours; crossing a habit prompt also schedules a check-in for the next habit slot.
- Remove the cleaning action and six-hour cooldown to keep the incubation focused on the 15 answers.

## What We're Building

- A guest incubation journey with three five-question sessions, mixed response types, mandatory answers, and a shortened 24-hour wait in the demo.
- An egg progress display and hatch into the score-selected Dost persona.
- A small cross-app Dost overlay after the app-running interval, with personalized reminder content, OK/cross actions, and the defined follow-up cycle. Optional local-model generation creates the personalized pack; prepared messages remain the offline fallback. Final character animation polish is included as the last build slice.

## Deferred From the POC

- The full 50-question bank, external Google or password sign-in, and guest-account linking.
- Real phone or desktop screen-time detection, system notifications, AI generation for every reminder, and actual two-hour waits in the demo.
- Additional personas, reminder schedules, and expanded personalization.

## Possible Later Enhancements

The question bank could grow beyond the 15-question proof set, and users could connect a guest profile to an account. Real screen-time detection and reminder scheduling could replace the simulated trigger.

## Non-Goals

- No account creation or Google sign-in in the proof of concept; guest incubation is enough to demonstrate the loop.
- No monitoring of activity, window names, or content across other apps; reminders are based only on the app-running interval.
- No full-screen takeover or office-tool integration.
- No cleaning mechanic; it was removed to keep the core journey focused.

## Open Questions

- The 15 light question wordings, response options, and score mapping are implemented in `src/shared/questions.js`; typed answers stay local and do not affect persona scoring.
- Demo incubation uses a 30-second wait between sessions; normal waits remain 24 hours.
