# DOST — Demo Video Script (shot plan)

Target: under 3:00 (check the Devpost form for the real limit).
Record with: `npm run start:demo` (fast timings, no dev controls).
Narration: the "Say" lines are talking points. Put them in your own words when you record.

## Before you record

- Close heavy apps (the model needs RAM) and anything personal: email, chats, file names, notifications (turn on Focus / Do Not Disturb).
- Make sure Ollama is running in the tray.
- Start from a fresh egg. If the guest is already hatched, use **Start over** in `npm run start:dev` first, then quit and relaunch with `npm run start:demo`.
- Set the screen to 1920×1080 with a clean wallpaper and an empty desktop.
- Recorder: Xbox Game Bar (Win+G), or OBS for full-screen capture. Record the microphone separately if you can.
- Record each scene as its own clip. You'll cut the waits (30 s between sessions, 1–2 min of generation) in editing.

---

## Scene 1 — Hook (0:00–0:10)

**Show:** Close-up of the DOST egg on the screen, wobbling. Quick cut to the hatched slime hopping with hearts after being fed.
**On-screen text:** `DOST — a friend that lives on your desktop`
**Say:**
- Who DOST is in one breath
- "Dost" means *friend* in Urdu

## Scene 2 — The problem (0:10–0:25)

**Show:** You working at a cluttered screen (browser, document), or a simple title card.
**Say:**
- The problem in your own life: forgetting breaks, water, getting stuck, procrastinating
- Normal reminder apps feel cold and are easy to ignore
- One line: DOST is a reminder buddy with a personality built from *you*

## Scene 3 — Incubating the egg (0:25–0:55)

**Show:**
1. App opens on the egg with "Incubate with three short sessions."
2. Answer 2–3 questions on camera (pick fun ones, click clearly, move slowly).
3. Hard cut through the rest. Show the session counter going 1 → 2 → 3.

**On-screen text:** `3 sessions × 5 questions` · `(1 day apart; sped up for the demo)`
**Say:**
- You don't fill in a settings page. You raise DOST by answering light questions.
- Your answers decide what kind of friend hatches.

## Scene 4 — Let's Go: the local AI writes DOST's lines (0:55–1:20)

**Show:**
1. READY TO HATCH screen, then click **Let's Go**.
2. Optional 2-second cutaway: Task Manager or `ollama ps` showing the model running on this PC.
3. Speed up the wait (4–8×) or cut it, with the caption `~1 minute later`.

**On-screen text:** `Runs on your PC: Ollama + qwen3.5:4b` · `No cloud, no account, no API key`
**Say:**
- A small AI model running *on your own laptop* reads your answers once
- It writes DOST's nudges, wisdom, jokes and encouragement, each with an emotion
- Nothing leaves your computer

## Scene 5 — The hatch (1:20–1:45)

**Show:**
1. The full rainbow egg hatch sequence, in real time. This is your best moment, so don't cut it.
2. DOST appears as **Chill** (green) or **Bossy** (orange-red).
3. Briefly scroll the "Lines DOST wrote for you". Pause on one funny or sweet line long enough to read.

**On-screen text:** `Chill 🟢 or Bossy 🟠 — decided by your answers`
**Say:**
- What persona you got, and why it fits you
- Read one line DOST wrote for you out loud

*(Optional: a 3-second split screen of the other persona from a second run, so judges see both.)*

## Scene 6 — Living with DOST (1:45–2:20)

**Show:**
1. Minimise DOST to the tray. Open a normal app (browser, Word).
2. Wait for a reminder (about 50 s in demo mode; cut the wait). The overlay pops over your work without blocking it.
3. Click **OK**. Cut to the next message, an encouragement.
4. On another reminder, click the **cross** and show the caption `Light messages muted for a while`.

**On-screen text:** `Every 2 hours: habit nudge` · `~Every 50 min: a joke or wisdom` · `(sped up for the demo)`
**Say:**
- DOST stays out of the way and pops up on a timer. It is not watching your screen.
- OK and the cross change what DOST says next
- It feels like a friend checking in, not a nagging app

## Scene 7 — Feed and Sleep (2:20–2:40)

**Show:**
1. Open DOST, then click **Feed**. A snack drops (strawberry, cookie or watermelon), DOST chews, then hops with hearts.
2. Click **Sleep**: a yawn and the nightcap. Caption: `Sleep = reminders paused for 5 hours`.
3. Click **Wake**.

**Say:**
- The little care moments that make it a companion
- Sleep is the "leave me alone" button for when you need focus

## Scene 8 — How it works (2:40–2:52)

**Show:** A simple diagram card (make it in Canva or Slides):
`Your answers → local model (Ollama, on this PC) → DOST's lines → saved → reminders on a timer`
**On-screen text:** `Electron · Node.js · Ollama · qwen3.5:4b · 100% local`
**Say:**
- The model runs once, at hatch. Reminders reuse the saved lines.
- Everything stays on your PC.

## Scene 9 — Closing (2:52–3:00)

**Show:** DOST hopping happily with hearts, then an end card with the project name and GitHub link.
**Say:**
- One closing line in your own words: what you'd want DOST to be for someone
- "Thanks for watching!"

---

## Editing checklist

- [ ] Total under the form's limit (aim for 2:45–3:00)
- [ ] Every wait is cut or sped up and labelled "sped up for the demo"
- [ ] The hatch and Feed animations play at real speed
- [ ] On-screen text is big enough to read on a phone
- [ ] No personal info, notifications, file paths or the learner profile visible
- [ ] Soft background music, quieter than your voice
- [ ] YouTube: Unlisted or Public, "Not made for kids", and checked while logged out
