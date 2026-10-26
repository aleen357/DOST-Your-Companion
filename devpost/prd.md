---
doc: prd
status: approved
---

# DOST — Product Requirements

A small animated companion that learns about a person during incubation, then gives them personalized break reminders over other work.
Source: `scope.md > The Unique Kernel`, `Who It's For`, and `The Core Loop`.

## The Core Journey

1. **Arrive as a guest.** The user sees Dost's egg and the effort remaining before it hatches. No account setup is required for the proof of concept.
2. **Complete the first Connect session.** The user opens a compact dialogue at the bottom of the screen. It asks five questions, one at a time, using a mix of selectable answers, short "little scene" choices and typed responses. Every question must be answered (or a typed question explicitly declined) to finish the session.
3. **Return for the next sessions.** After the first and second groups of five answers, Connect is unavailable for 24 hours and shows a countdown. The user returns for the next session and answers five more questions. The proof-of-concept demo shortens these waits so all three sessions can be shown at once.
4. **Hatch Dost.** After all 15 answers, the egg is full and shows **Let's Go**. Pressing it starts the hatch: the egg glows with rainbow colors while DOST checks for Ollama and the configured model on this PC. If they are ready, the model reads the answer profile once and writes DOST's personalized lines (one to two minutes). If its inferred persona disagrees with the score-based one, DOST chooses Chill. If Ollama or the model is missing, or generation fails, DOST quietly hatches with the score-based persona and prepared local messages. Either way, a **Hello** button appears; pressing it cracks the egg open and DOST introduces itself. If the user looked away during a slow hatch, the taskbar flashes and a Windows notification says DOST is ready.
5. **Live with Dost.** The hatched screen shows only DOST, its persona name and one hello line, with two care buttons: **Feed** and **Sleep**.
6. **Receive reminders over other work.** The habit lane offers a break nudge every two hours; the light lane offers a joke or wisdom line about every 50 minutes, with spacing rules to avoid crowding the habit nudge. Demo timing scales these to two minutes and 50 seconds. This is scheduled running time, not actual screen-use detection.
7. **Respond and continue the cycle.** OK or cross dismisses the overlay without resetting either clock. OK makes the next light message an encouragement. Cross mutes light messages for five hours; habit nudges continue. If the crossed message was a habit nudge, the next habit slot asks whether the user did it. After that check-in, the following habit slot returns to a suggestion.

## Screens and Layout

### Incubation screen

- The shared purple candy background, with the egg as the central focus of a white, lilac-rimmed card.
- The first screen says what DOST is and what the user is doing: the DOST logo, "a break buddy for your desktop", the headline "Hatch a tiny friend who reminds you to take breaks." and three steps (Answer · Hatch · Take breaks). The steps hide once a session is open or the egg is full.
- Type is Baloo 2 (bundled, SIL OFL), a rounded, bubbly font; the DOST wordmark is extra-bold candy pink.
- A bar at the top shows progress toward hatching ("15 little moments until hatch", then "Your egg is full").
- Connect opens a compact dialogue anchored at the bottom. It shows one question at a time with its group name, session number and position (for example "2 OF 5").
- The footer reminds the user that answers stay on this PC and no account is needed.
- Account connection, sign-up, and guest-account linking are outside the proof of concept; the user starts as a guest.

### Hatching

- **Let's Go** → rainbow "brewing" egg with "Wait, your DOST is coming!" → **Hello** → the egg cracks open → DOST appears.
- Chill Dost is green; bossy Dost is orange-red. Both are animated slimes with an idle motion.

### Hatched home

- The same purple room as every other screen. DOST lives on the roomy screen of a wide, rounded handheld, like a Tamagotchi: the shell takes DOST's own colour (green for Chill, orange-red for Bossy) with a gingham band, the screen has a row of small icons above and below DOST, and Feed and Sleep are the two round buttons on the shell.
- Below that, a line explains that DOST will keep popping up on screen while the user works, with a reminder or a little motivation, and that everything stays on this PC.
- Below the handheld: the persona label (for example "DOST · CHILL") and DOST's introduction line.
- **Feed:** a random snack (strawberry, cookie or watermelon) drops in, DOST chews it in three bites, then wiggles happily with hearts.
- **Sleep:** DOST yawns and dozes in a nightcap; every reminder is muted for five hours. The button becomes **Wake** to end the nap early. Feed is unavailable while DOST sleeps.

### Reminder overlay

- Small character and message sit unobtrusively at the lower-left edge, like the reference the learner shared. It must not take over the whole screen.
- The overlay has a bold rounded yellow border and two round toy buttons, **Okay** and **Close**, styled like Feed and Sleep. Swipe dismissal is not part of the desktop proof of concept.

## Look and Feel

- Every screen shares one purple room: a faint gingham weave with small pixel-art candies, lollipops and hearts. Incubation uses a white, lilac-rimmed card centered on the egg and progress bar.
- Dost is a slime: green for chill and orange-red for bossy, with idle, reaction, eating and sleeping animation. Angry eyes or emoticons alone can look hostile, so the message and animation make the intended tone clear; bossy is playful, never shaming.
- Motion follows the Windows animation setting; with animations off, DOST appears still but fully visible.
- The cross-app intervention is compact and friendly, following the lower-left placement in the learner's reference. Keep the underlying work visible.

## Features and Behavior

### Guest incubation and answers

Source: `scope.md > The Core Loop` and `The POC Boundary`.

- The user completes three Connect sessions, with five questions per session and a 24-hour wait between sessions.
- Session one ("Your days") covers daily roles, restorative breaks, reminder topics, and two light scenes about to-do lists and late nights. Session two ("Little scenes") uses short playful scenarios (deadlines, a friend's favour, a "got a minute?" message, tripping on stairs) plus one typed small win for the month. Session three ("Your kind of friend") asks about the coach, alarm and "stuck" animal they relate to, a favourite joke style, and one typed note about what cheers them up. Wording must work for people who work, study, provide care, manage a home, or are between jobs.
- Questions use single-choice, bounded multi-select, and short typed responses. Every option question also accepts optional words of the user's own; text alone is enough when no option fits. A typed-only question may be declined with **Prefer not to share**. Each session must be fully answered before it counts.
- Answers do not receive an immediate reply during incubation. All answers stay on this PC and are used in the one-time local-model prompt at hatch, when Ollama is ready.
- Guest progress and answers remain available across the three incubation visits and app restarts.
- **Start over** (developer mode) asks for confirmation, then clears all saved guest progress and returns to the fresh egg.

### Persona and hatching

Source: `scope.md > The Unique Kernel` and `Inspiration & Identity`.

- Scene and support-style options carry hidden persona points: +2 chill, +2 bossy, or +2 to a random persona for playful "it depends" answers (for example "Cracks jokes during drills"). Options that describe context or a balanced habit score nothing. Typed text never scores.
- The higher total determines the score-based persona. If totals tie, choose randomly.
- When local generation succeeds, the model also infers a persona. If it differs from the score-based persona, the final persona is Chill. If generation is unavailable or fails, keep the score-based persona.
- Scene options also carry hidden trait hints (procrastination, a pushover, a kind person, scared, going in an endless spiral, plus humour style). The model sees each scene only as its theme and the hint, never the scene text, so it cannot echo the quiz back. Lines that label or shame the person are discarded.

### Cross-app reminders

Source: `scope.md > The Core Loop` and `What "Working" Looks Like`.

- After the agreed app-running interval, Dost appears automatically over other work; the user does not need to open Dost to trigger each reminder.
- DOST has two independent app-running reminder lanes: a habit nudge every two hours, and a light joke/wisdom message about every 50 minutes. A light message is skipped if it would be less than 30 minutes from a habit nudge. Light-message timing receives a small random jitter; demo mode scales the schedule to a 50-second light interval and a two-minute habit interval, with a 30-second minimum gap. Dost remains running in the Windows tray when its main window is closed. This is an app-running schedule, not system-wide screen-time detection.
- While DOST sleeps, any reminder that comes due is skipped and the clocks move on.
- The reminder uses the locally saved message pack (generated lines, merged over prepared lines tailored by the user's answers) to offer a relevant break or alternative, with motivation or coding encouragement. Examples include a 15-minute walk, water, a wisdom line, an encouragement, or a joke.
- The overlay stays small and non-blocking, with OK and cross controls.

### Dismissal and follow-up

- **OK:** dismisses the overlay and marks the message as acknowledged. The two reminder clocks continue; the next light message is an encouragement, after which light messages return to random jokes/wisdom.
- **Cross:** dismisses the overlay and mutes light jokes/wisdom for five hours (five minutes in demo mode). Habit nudges continue. If the crossed message was a habit nudge, the next habit slot asks whether the user did it, using DOST's persona.
- After that check-in, the following habit slot brings a suggestion again. A cross on a light message does not create a "did you do it?" check-in.

## States and Boundaries

- **New guest:** show the egg and progress bar; Connect starts the first five-question session.
- **Answering:** show one question at a time. The session cannot complete until all five are answered.
- **Waiting between sessions:** after the first and second sessions, Connect shows the time until the next session (24 hours; 30 seconds in the demo).
- **Ready for next session:** once the wait ends, Connect again opens the next five-question set.
- **Egg full:** after answer 15, show **Let's Go**.
- **Brewing:** rainbow egg while the local model writes, or briefly while DOST finds it is unavailable.
- **Ready to hatch:** **Hello** shown; pressing it opens the egg.
- **Hatched:** DOST, its introduction, Feed and Sleep.
- **Asleep:** nightcap, Wake button, all reminders muted for five hours in every mode.
- **Reminder visible:** show the compact overlay over other work. OK and cross remove it, with different follow-up meaning as specified above.
- **Unreadable saved data:** start a fresh egg and say that earlier local progress could not be read.
- **Demo trigger:** use a shortened app-running interval so the reminder and follow-up can be demonstrated without waiting hours; do not present it as screen-use detection.

## Product Decisions

- Keep the incubation because Dost needs user context to offer relevant guidance.
- Use 15 questions total across three sessions of five; the larger 50-question bank remains deferred.
- Ask indirect, playful scene questions instead of direct personality questions, so answers feel light and the persona is not obvious from the quiz.
- Score with +2 chill, +2 bossy, and occasional random +2; choose randomly on a final tie. Typed answers never score.
- Make generation part of **Let's Go** rather than a separate opt-in screen: it runs only when Ollama and the model are already installed on this PC, and the README explains setup. Without them, DOST hatches with prepared lines and no error.
- Make post-hatch reminders a small cross-app intervention with a two-hour habit lane plus a roughly 50-minute light joke/wisdom lane. Enforce a 30-minute minimum gap around habit prompts, add small jitter to light timing, and mute light prompts for five hours after cross. Demo mode scales these to two minutes, 50 seconds, 30 seconds, and five minutes respectively.
- OK acknowledges and changes the next light follow-up to encouragement without resetting either clock. Cross mutes light messages for five hours; crossing a habit prompt also schedules a check-in for the next habit slot.
- Add Feed and Sleep as care moments that make DOST feel like a companion; Sleep doubles as a five-hour "focus, leave me alone" switch.
- Allow exactly one Windows notification, "Your DOST is ready!", when a slow hatch finishes while the window is not focused.
- Remove the cleaning action and six-hour cooldown to keep the incubation focused on the 15 answers.

## What We're Building

- A guest incubation journey with three five-question sessions, mixed response types, mandatory answers, and a shortened 24-hour wait in the demo.
- An egg progress display, a Let's Go → rainbow brew → Hello → hatch sequence, and the resulting Chill or Bossy DOST.
- One-time local-model generation at hatch when Ollama is ready, with prepared messages as the offline fallback.
- A hatched home with Feed and Sleep.
- A small cross-app Dost overlay after the app-running interval, with personalized reminder content, OK/cross actions, and the defined follow-up cycle.

## Deferred From the POC

- The full 50-question bank, external Google or password sign-in, and guest-account linking.
- Real phone or desktop screen-time detection, reminder notifications (reminders use DOST's own overlay), AI generation for every reminder, and actual two-hour waits in the demo.
- An in-app Ollama setup screen with a "Check again" action (setup lives in the README for now).
- Additional personas, reminder schedules, and expanded personalization.

## Possible Later Enhancements

The question bank could grow beyond the 15-question proof set, and users could connect a guest profile to an account. Real screen-time detection and reminder scheduling could replace the simulated trigger. An in-app setup guide could detect a missing model and walk the user through installing it.

## Non-Goals

- No account creation or Google sign-in in the proof of concept; guest incubation is enough to demonstrate the loop.
- No monitoring of activity, window names, or content across other apps; reminders are based only on the app-running interval.
- No cloud AI: the model runs only through Ollama on this PC.
- No full-screen takeover or office-tool integration.
- No cleaning mechanic; it was removed to keep the core journey focused.

## Open Questions

- None blocking. The 15 questions, scores and hints live in `src/shared/questions.js` (questionnaire version 3); earlier guests keep their version 1 or 2 question set.
