---
doc: scope
status: approved
---

# DOST

A small on-screen companion that learns a little about you, then nudges you toward a helpful break in a tone that fits you.

## The Unique Kernel
Dost hatches after three question sessions that gather light context about the user. Fifteen answers shape whether the companion is chill or bossy and are used by an optional local model to create a personalized message pack. If score-based and model-inferred personas disagree, DOST chooses Chill. The user installs Ollama and downloads the model first; answers and generation stay on the PC. If the local model is unavailable, Dost uses its prepared reminders and the score-based persona. After a scheduled interval while Dost is running, the small character appears over other work with a relevant reminder and encouragement. The app does not claim to detect actual screen use.

## Who It's For
The first user is the learner: a software engineer who can spend long stretches at the computer and would appreciate a gentle reminder after about two hours for a 15-minute walk or water, along with reassurance and coding motivation. The POC measures time Dost is running, not verified time at the computer.

## The Core Loop
The user starts as a guest and sees an egg with its remaining hatch effort. Across three daily visits, they answer five light questions per visit; a 24-hour wait separates question sessions. All 15 answers are required. Choice answers add points toward a chill or bossy persona (for example, +2 chill or +2 bossy, with some answers adding +2 randomly to either). After the third visit, the egg hatches and Dost introduces itself. If Ollama and the chosen local model are installed, Dost uses the full answer profile to infer a persona and create a personalized message pack on the same PC; if the model inference conflicts with the score-based persona, Chill wins. Otherwise, DOST uses the scored persona and prepared local messages. Later, without requiring the user to start a session, DOST offers a habit nudge every two hours and a light joke or wisdom message about every 50 minutes while the app runs, with a five-hour light-message mute after cross.

## Inspiration & Identity
A Tamagotchi-like companion, named Dost (“friend” in Urdu). DOST has an orange-red bossy look and a green chill look. Its chill or bossy tone is inferred from the user's answers. Angry eyes and emoticons alone may not communicate the intended emotion; the final animation and reminder text should also make the mood clear. A little kiss or affectionate gesture could make the reminder feel personal.

## Why This Matters to the Learner
The learner wants to spend less time on screens, exercise more, be productive, and keep learning programming patterns so they feel prepared for future career changes. They want to make an application that is useful or fun, smooth to use, and thoughtfully architected.

## What "Working" Looks Like
In a short demo, the learner starts as a guest, advances through three incubation visits with five questions each, and completes all 15 answers. The actual experience uses a 24-hour wait between question sessions; the demo shortens the waits so the journey can be shown at once. Dost hatches in the persona indicated by the accumulated choice answers. With Ollama and the selected model installed, DOST generates its message pack locally from the user's answers; if generation is unavailable, it uses prepared local messages. After a scheduled interval while Dost runs, the small character appears over other work with a fitting reminder—such as taking a 15-minute walk or drinking water—and supportive coding encouragement.

## The POC Boundary
Build a focused set of 15 light questions (five per visit) for three incubation visits and a two-persona scoring result. Offer a user-installed Ollama runtime and model as an optional local generator that uses the guest's answers to create a personalized reminder pack on-device; retain prepared local messages as the fallback. Show a small cross-app DOST intervention after a short app-running interval, pairing one practical break suggestion with encouragement; do not claim to detect actual screen time. Shorten the real 24-hour question-session wait in the demo. Use OK and cross for desktop dismissal, with swipe removed. Keep the slime's animation in a separate module and add lightweight character motion and expressions in the final build slice. Start directly as a guest; sign-in and account linking are not needed to prove this loop.

## Later
The full 50-question bank; Google or password accounts and guest-account linking; actual phone or desktop screen-time detection; system notifications; additional personas; broader personalization and reminder schedules; cloud or server-side AI generation.

## Explicitly Cut
The seedling-cleaning action and its six-hour cooldown are removed to keep incubation focused on the 15 answers. Swipe dismissal is removed for the Windows desktop POC; the overlay uses OK and cross. Changing office-provided tools and taking over the whole screen are outside the project. Real system-wide screen-time monitoring is outside this proof of concept because the core reminder uses an app-running interval.
