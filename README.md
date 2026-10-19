# DOST

A small Windows desktop companion that learns what kind of encouragement fits, then offers helpful break reminders.

## Run locally

Install Node.js and npm, then run these commands from the project folder:

```powershell
npm install
npm start
```

Use `npm run start:dev` for the accelerated developer mode. It includes a live next-reminder countdown, overlay preview, Start over, and an immediate reminder trigger in the tray. `npm run start:demo` keeps the same short demo timing while hiding those developer controls.

Optional message personalization uses a model running locally through Ollama. Install [Ollama for Windows](https://ollama.com/download/windows), then download the model with `ollama pull qwen3.5:4b` (about 3.3 GB, once). DOST checks whether Ollama and the model are available. The model download requires internet; profile generation runs on this PC. If the local model is unavailable or you skip generation, DOST hatches with its prepared messages.

Use **Connect** to answer five questions in each of three short incubation sessions. In the normal app, each session unlocks after 24 hours. To demonstrate the whole hatch journey without waiting, run `npm run start:demo`; the incubation wait is 30 seconds. Guest answers and the selected message pack are saved locally in Electron's user data folder. Use **Start over** to erase the saved answers and begin with a fresh egg. Closing the main window keeps DOST in the Windows tray; choose **Quit DOST** from the tray menu to exit.

In regular use, the companion preview and reset tools are hidden. After DOST hatches, habit nudges run every two hours and light jokes/wisdom run about every 50 minutes. Light messages get small timing variation and are skipped when they would land within 30 minutes of a habit nudge. Demo mode scales the cadence to a two-minute habit nudge and roughly 50-second light messages. OK makes the next light follow-up encouraging. Cross mutes light messages for five hours (five minutes in demo); habit nudges continue, and crossing a habit nudge schedules a check-in at the next habit slot. Both clocks pause while DOST is fully quit and resume from their saved remaining time. The preview art is static; character motion will be added near the end of the build.

Persona definitions live together in `src/shared/personas.js`: identity, tone, palette, prepared messages, and answer-specific message variants. Scoring and the slime renderer use the persona IDs from that catalog.
