# DOST

A small Windows desktop companion that learns what kind of encouragement fits, then offers helpful break reminders.

## Run locally

Install Node.js and npm, then run these commands from the project folder:

```powershell
npm install
npm start
```

Use **Connect** to answer five questions in each of three short incubation sessions. In the normal app, each session unlocks after 24 hours. To demonstrate the whole hatch journey without waiting, run `npm run start:demo`; the incubation wait is 30 seconds. Guest answers and the selected message pack are saved locally in Electron's user data folder. Use **Start over** to erase the saved answers and begin with a fresh egg. Closing the main window keeps DOST in the Windows tray; choose **Quit DOST** from the tray menu to exit.

Use **Preview overlay** to show the companion above another app. The preview art is static; character motion will be added near the end of the build. Interval reminders and the optional fictional AI preview are added in later slices.

Persona definitions live together in `src/shared/personas.js`: identity, tone, palette, prepared messages, and answer-specific message variants. Scoring and the slime renderer use the persona IDs from that catalog.
