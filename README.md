# DOST

A small Windows desktop companion that learns what kind of encouragement fits, then offers helpful break reminders.

## Run locally

Install Node.js and npm, then run these commands from the project folder:

```powershell
npm install
npm start
```

Use `npm run start:dev` for the accelerated developer mode. It includes a live next-reminder countdown, overlay preview, Start over, and an immediate reminder trigger in the tray. `npm run start:demo` keeps the same short demo timing while hiding those developer controls.

Use **Connect** to answer five questions in each of three short incubation sessions. In the normal app, each session unlocks after 24 hours. To demonstrate the whole hatch journey without waiting, run `npm run start:demo`; the incubation wait is 30 seconds. Guest answers and the selected message pack are saved locally in Electron's user data folder. Use **Start over** to erase the saved answers and begin with a fresh egg. Closing the main window keeps DOST in the Windows tray; choose **Quit DOST** from the tray menu to exit.

In regular use, the companion preview and reset tools are hidden. After DOST hatches, reminders run every two hours while the app is in the tray. In demo mode they run every two minutes. OK leads to a light quote, goal, or joke on the next interval; cross leads to a check-in, then a different suggestion if dismissed again. The remaining interval and pending reminder are saved locally when you quit. The preview art is static; character motion will be added near the end of the build.

Persona definitions live together in `src/shared/personas.js`: identity, tone, palette, prepared messages, and answer-specific message variants. Scoring and the slime renderer use the persona IDs from that catalog.
