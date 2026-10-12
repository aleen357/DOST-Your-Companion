---
doc: prd
status: approved
---

# DOST — Product Requirements

A small animated companion that learns about one software engineer during incubation, then gives them personalized break reminders over other work.
Source: `scope.md > The Unique Kernel`, `Who It's For`, and `The Core Loop`.

## The Core Journey

1. **Arrive as a guest.** The user sees Dost's egg and the effort remaining before it hatches. No account setup is required for the proof of concept.
2. **Complete the first Connect session.** The user opens a compact dialogue at the bottom of the screen. It asks five questions, one at a time, using a mix of selectable answers and typed responses. Every question must be answered to finish the session.
3. **Return for the next sessions.** After the first and second groups of five answers, Connect is unavailable for 24 hours. The user returns for the next session and answers five more questions. The proof-of-concept demo shortens these waits so all three sessions can be shown at once.
4. **Hatch Dost.** After all 15 answers are complete, selectable answers determine the chill-versus-bossy score. Dost's reminder pack is selected locally from prepared messages using persona and structured answer categories; typed answers stay local. At hatching the user may opt into a clearly labeled AI demo preview. It sends a built-in fictional profile—not the guest's answers—to Google's Gemini free tier. The generated sample is saved locally and shown as a preview, not used as the guest's personalized pack. If the user declines or generation is unavailable, Dost still hatches with local messages.
5. **Receive a reminder over other work.** After Dost has been running for roughly two hours, it appears as a small, non-blocking overlay over the current app. The demo shortens the interval to two minutes. This is a scheduled running-time reminder, not actual screen-use detection. The reminder offers a relevant alternative, such as taking a 15-minute walk or drinking water, with encouragement.
6. **Respond and continue the cycle.** OK or cross dismisses the overlay. OK signals that the user listened; after the normal interval, Dost offers a motivational quote, another goal, or a joke. Cross means the user did not do the suggestion; at the next interval, Dost asks whether they did it in its own persona. If dismissed again, the following interval brings a different suggestion.

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
- Questions cover the learner's stated context areas: lifestyle habits, occupation/work, ideals or goals, personality, and hurdles.
- The 15 questions use a mix of selectable and typed responses. Each session must be fully answered before it counts; incomplete answers do not complete the session.
- Selectable answers contribute persona points and can select prepared messages locally. Typed answers stay in the guest's local context, are not sent to any model, and do not receive an immediate reply.
- Guest progress and answers remain available across the three incubation visits.

### Persona and hatching

Source: `scope.md > The Unique Kernel` and `Inspiration & Identity`.

- Once all 15 answers are complete, compare the selectable-answer scores.
- Some choices add +2 to chill; some add +3 to bossy; designated choices may add +2 randomly to either persona.
- The higher total determines the persona. If totals tie, choose randomly.
- Show the egg hatching and introduce the resulting Dost. The green chill and orange-red bossy variants use static placeholder art until final animation polish, with clear supportive or direct wording.

### Cross-app reminders

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

- After the agreed app-running interval, Dost appears automatically over other work; the user does not need to open Dost to trigger each reminder.
- The normal trigger is a two-hour interval while the app is running; demo mode shortens it to two minutes. Dost remains running in the Windows tray when its main window is closed. This is an app-running interval, not system-wide screen-time detection.
- Dost's actual reminder pack is selected locally from prepared messages using persona and structured choice categories; typed answers remain local and are not processed by a model.
- Before hatching, the user may opt into a separate AI demo preview. Show an in-app disclosure naming Google and the Gemini free tier, explaining unpaid-tier prompt use and possible human review, and stating that only a built-in fictional profile is sent. The guest's answers stay on this PC. The generated sample is stored locally and labeled as a demo preview, not used for the guest's reminders.
- If the user declines, is offline, has no configured API key, hits a rate limit, or generation fails, skip the optional preview and continue hatching normally.
- The reminder uses the locally saved message pack to offer a relevant break or alternative, with motivation or coding encouragement. Examples include a 15-minute walk, water, a motivational quote, another goal, or a joke.
- The overlay stays small and non-blocking, with OK and cross controls.

### Dismissal and follow-up

- **OK:** dismisses the overlay and marks the suggestion as acknowledged. At the next normal reminder interval, Dost offers a motivational quote, another goal, or a joke.
- **Cross:** dismisses the overlay and treats the suggestion as not completed. At the next normal reminder interval, Dost asks whether the user did it, using its own persona.
- If that follow-up is also dismissed, the following interval brings a different suggestion.

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
- Use 15 questions total, five in each of three sessions; the 50-question bank is deferred.
- Ask one question at a time, mixing choice and typed answers. Require all five answers in each session.
- Use choice answers for chill/bossy scoring and typed answers as local-only context; do not have Dost reply during incubation.
- Use +2 chill, +3 bossy, and occasional random +2 scoring; choose randomly on a final tie.
- Make post-hatch reminders a small cross-app intervention using a two-hour app-running interval, shortened to two minutes in demo mode.
- Offer one optional AI demo preview at hatching, generated from a built-in fictional profile only. Clearly disclose the free-tier data use and never send guest answers. Select Dost's actual reminder pack locally from prepared content.
- OK acknowledges; cross indicates the user did not do the suggestion. The follow-up uses the same normal interval.
- Remove the cleaning action and six-hour cooldown to keep the incubation focused on the 15 answers.

## What We're Building

- A guest incubation journey with three five-question sessions, mixed response types, mandatory answers, and a shortened 24-hour wait in the demo.
- An egg progress display and hatch into the score-selected Dost persona.
- A small cross-app Dost overlay after the app-running interval, with locally selected personalized reminder content, OK/cross actions, and the defined follow-up cycle. The optional fictional AI preview demonstrates generation separately. Final character animation polish is included as the last build slice.

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

- The exact 15 question wordings and score mapping must be finalized before implementation; questions should remain light and non-sensitive.
- The exact demo incubation wait is selected in the technical plan; normal waits remain 24 hours.
