# DOST

A small Windows desktop companion that learns what kind of encouragement fits, then offers helpful break reminders.

DOST starts as an egg. You answer five light questions in each of three short incubation sessions, and DOST hatches as **Chill** (gentle, green) or **Bossy** (playful, orange-red). If a local AI model is set up, it writes DOST's personal nudges, wisdom and jokes from your answers, once, at hatch time. Everything runs on your PC: your answers are never sent to a cloud service.

## Install DOST as an app (Windows)

DOST can be packaged as an ordinary Windows installer with Start Menu and desktop shortcuts and an uninstaller.

1. Build the installer from the project folder (needs Node.js, see below):

   ```powershell
   npm install
   npm run dist
   ```

   This creates `dist\DOST-Setup-0.1.0.exe`.
2. Run `DOST-Setup-0.1.0.exe` and follow the steps. It installs for your user only, so no administrator rights are needed.
3. The installer is not code-signed, so Windows SmartScreen may say it "protected your PC". Choose **More info**, then **Run anyway**.
4. Start **DOST** from the Start Menu or desktop. To use DOST's personal messages, also do step 2 below (Ollama).

The installed app uses normal timing. For the short demo timing, run the installed `DOST.exe` with `--demo` (for example, copy the desktop shortcut and add ` --demo` to the end of its **Target** field). Uninstall it from **Settings** → **Apps** → **Installed apps**.

## Run from source

### 1. Install Node.js

Install [Node.js](https://nodejs.org/) (the LTS version includes npm). Check it worked:

```powershell
node --version
npm --version
```

### 2. Install Ollama and the model (optional, for personal messages)

DOST uses [Ollama](https://ollama.com/) to run a small language model on your own PC. Without it, DOST still works and hatches with its prepared messages.

1. Download and install [Ollama for Windows](https://ollama.com/download/windows), or install it from a terminal:

   ```powershell
   winget install Ollama.Ollama
   ```

2. Open a new terminal and download the model DOST uses (about 3.3 GB, once; needs internet):

   ```powershell
   ollama pull qwen3.5:4b
   ```

3. Check that the model is installed:

   ```powershell
   ollama list
   ```

Ollama runs in the background after installation (look for its icon in the Windows tray). DOST talks to it only at `http://127.0.0.1:11434`, on this PC. When you press **Let's Go** on the ready egg, DOST uses the model if it is installed; writing the messages takes one to two minutes while the egg glows. If Ollama or the model is missing, or generation fails, DOST hatches with its prepared messages instead.

### 3. Turn on Windows animation effects

DOST's egg, hatch and slime motion follow your Windows motion setting. If animations are turned off, DOST appears still. To turn them on:

1. Open **Settings** → **Accessibility** → **Visual effects**.
2. Turn **Animation effects** on.

Restart DOST after changing this setting.

### 4. Install and run DOST

From the project folder:

```powershell
npm install
npm start
```

## Using DOST

Use **Connect** to answer five questions in each of three incubation sessions. In the normal app, each session unlocks 24 hours after the last one. Once all fifteen answers are in, press **Let's Go** to hatch DOST.

After hatching, the main window shows DOST with two care buttons:

- **Feed** gives DOST a snack with a short eating animation.
- **Sleep** puts DOST to bed and mutes every reminder for five hours. Press **Wake** to end the nap early.

DOST lives in the Windows tray. Closing the main window keeps it running; choose **Quit DOST** from the tray menu to exit.

### Reminders

- Habit nudges come every two hours, and light jokes or wisdom about every 50 minutes. Light messages get small timing variation and are skipped when they would land within 30 minutes of a habit nudge.
- Each reminder is a small overlay that doesn't block your work. **OK** makes the next light follow-up encouraging. The cross mutes light messages for five hours; habit nudges continue, and crossing a habit nudge schedules a check-in at the next habit slot.
- The clocks pause while DOST is fully quit and resume from their saved remaining time.

Guest answers and the message pack are saved locally in Electron's user data folder. Use **Start over** to erase them and begin with a fresh egg.

## Demo and developer modes

```powershell
npm run start:demo
```

Demo mode shortens every wait so the whole journey fits in a few minutes: the incubation pause is 30 seconds, habit nudges come every two minutes, light messages about every 50 seconds, and muting lasts five minutes. Sleep still lasts five hours.

```powershell
npm run start:dev
```

Developer mode uses the same short timing and adds a live next-reminder countdown, an overlay preview, Start over and an immediate reminder trigger in the tray.

## Project layout

- `src/main/` runs the Electron app: windows, tray, reminder clocks, saved data and the local model connection.
- `src/renderer/` holds the incubation screen, the reminder overlay and the slime artwork.
- `src/shared/personas.js` defines each persona: identity, tone, palette, prepared messages and answer-specific message variants. Scoring and the slime renderer use the persona IDs from that catalog.
- `devpost/` holds the scope, product definition, technical spec and build checklist.

## License

[MIT](LICENSE)
