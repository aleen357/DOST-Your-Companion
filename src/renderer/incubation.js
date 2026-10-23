const byId = (id) => document.getElementById(id);
const previewButton = byId('preview-button');
const connectButton = byId('connect-button');
const resetButton = byId('reset-button');
const generatePreviewButton = byId('generate-preview-button');
const skipPreviewButton = byId('skip-preview-button');
const checkAgainButton = byId('check-again-button');
const helloButton = byId('hello-button');
const feedback = byId('feedback');
const questionPanel = byId('question-panel');
let state;
let sessionOpen = false;
let selectedOptionId = null;
let selectedOptionIds = new Set();
let textDeclined = false;
let localSetup = null;
// Hatch reveal, kept in the renderer: 'brewing' (model writing) → 'ready' (Hello shown) → 'cracking' → null.
let revealStage = null;
let dostArriving = false;

previewButton.addEventListener('click', () => {
  window.dost.showReminderPreview();
  feedback.textContent = 'Your companion preview is open above your other windows.';
});

skipPreviewButton.addEventListener('click', async () => {
  setPreviewChoiceBusy(true);
  try {
    const result = await window.dost.skipLocalGeneration();
    state = result.state;
    sessionOpen = false;
    revealStage = 'ready';
    feedback.textContent = '';
    render();
  } catch (error) {
    byId('ai-preview-status').textContent = error.message || 'DOST could not hatch yet. Please try again.';
  } finally {
    setPreviewChoiceBusy(false);
  }
});

generatePreviewButton.addEventListener('click', async () => {
  setPreviewChoiceBusy(true);
  revealStage = 'brewing';
  feedback.textContent = '';
  render();
  let keepMessage = false;
  try {
    const result = await window.dost.generateLocalPack();
    state = result.state;
    revealStage = result.status === 'generated' ? 'ready' : null;
    if (result.status === 'generated') {
      sessionOpen = false;
      feedback.textContent = '';
    } else if (result.status === 'failed') {
      keepMessage = true;
      byId('ai-preview-status').textContent = `The local model didn’t finish (${result.error}). Try again, or hatch with prepared messages.`;
    } else {
      localSetup = { status: result.status, model: state.localModelName };
    }
    render();
  } catch (error) {
    keepMessage = true;
    revealStage = null;
    byId('ai-preview-status').textContent = error.message || 'DOST could not start writing its messages.';
    render();
  } finally {
    setPreviewChoiceBusy(false, keepMessage ? byId('ai-preview-status').textContent : '');
  }
});

checkAgainButton.addEventListener('click', () => refreshLocalSetup());

const wait = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

helloButton.addEventListener('click', async () => {
  if (revealStage !== 'ready') return;
  revealStage = 'cracking';
  render();
  const stage = byId('egg-stage');
  await wait(900);
  stage.classList.add('is-open');
  await wait(550);
  stage.classList.remove('is-open');
  revealStage = null;
  dostArriving = true;
  render();
});

async function refreshLocalSetup() {
  try {
    localSetup = await window.dost.checkLocalModel();
  } catch {
    localSetup = { status: 'no-ollama', model: state?.localModelName };
  }
  if (state) render();
}

function renderSetupGuide() {
  const ready = localSetup?.status === 'ready';
  const known = Boolean(localSetup);
  byId('setup-guide').hidden = !known || ready;
  checkAgainButton.hidden = !known || ready;
  generatePreviewButton.disabled = !ready;
  if (!known || ready) return;
  if (localSetup.status === 'no-ollama') {
    byId('setup-text').textContent = 'DOST couldn’t find Ollama on this PC. Install Ollama for Windows from ollama.com, start it, download the model, then choose Check again.';
  } else {
    byId('setup-text').textContent = 'Ollama is running, but DOST’s model isn’t downloaded yet. Run this once in a terminal, then choose Check again:';
  }
  byId('setup-command').textContent = `ollama pull ${localSetup.model}`;
}

function setPreviewChoiceBusy(busy, message = '') {
  generatePreviewButton.disabled = busy || localSetup?.status !== 'ready';
  skipPreviewButton.disabled = busy;
  checkAgainButton.disabled = busy;
  byId('ai-preview-status').textContent = message;
}

connectButton.addEventListener('click', () => {
  if (!state?.canConnect) return;
  sessionOpen = true;
  render();
});

resetButton.addEventListener('click', async () => {
  if (!window.confirm('Start over? This will erase your saved answers and persona.')) return;
  try {
    state = await window.dost.resetIncubation();
    sessionOpen = false;
    selectedOptionId = null;
    selectedOptionIds = new Set();
    textDeclined = false;
    feedback.textContent = 'A fresh egg. Connect whenever you’re ready.';
    render();
  } catch (error) {
    feedback.textContent = `DOST couldn’t reset your progress: ${error.message}`;
  }
});

byId('continue-button').addEventListener('click', async () => {
  const question = state?.question;
  if (!question) return;
  const answer = question.type === 'choice' || question.type === 'choice-text'
    ? { optionId: selectedOptionId, text: byId('text-answer').value }
    : question.type === 'multi'
      ? { optionIds: [...selectedOptionIds], text: byId('text-answer').value }
      : { text: byId('text-answer').value, declined: textDeclined };
  byId('form-error').textContent = '';
  try {
    state = await window.dost.submitAnswer(question.id, answer);
    selectedOptionId = null;
    selectedOptionIds = new Set();
    textDeclined = false;
    if (state.hatched || (state.completedQuestions > 0 && state.completedQuestions % 5 === 0)) sessionOpen = false;
    if (!state.hatched && state.completedQuestions > 0 && state.completedQuestions % 5 === 0) {
      feedback.textContent = `Session ${state.completedSessions} complete. Your next five questions unlock after the incubation pause.`;
    }
    render();
  } catch (error) {
    byId('form-error').textContent = error.message || 'That answer did not save. Please try again.';
  }
});

function formatWait(ms) {
  const seconds = Math.ceil(ms / 1000);
  if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function render() {
  byId('developer-tools').hidden = !state.developerMode;
  renderDeveloperTimer();
  const count = state.completedQuestions;
  byId('progress-count').textContent = `${count} of ${state.totalQuestions}`;
  byId('progress-fill').style.width = `${(count / state.totalQuestions) * 100}%`;
  byId('effort-track').setAttribute('aria-valuenow', String(count));
  byId('progress-label').textContent = state.hatched ? 'Your DOST has hatched' : state.hatchPending ? 'Ready for one last choice' : '15 little moments until hatch';
  byId('recovery-note').hidden = !state.recovered;
  byId('recovery-note').textContent = 'I couldn’t read your earlier local progress, so I started a fresh egg.';
  const revealing = Boolean(revealStage);
  const showDost = state.hatched && !revealing;
  const eggStage = byId('egg-stage');
  byId('egg').style.setProperty('--egg-fill', `${(count / state.totalQuestions) * 100}%`);
  eggStage.hidden = (state.hatched || state.hatchPending) && !revealing;
  eggStage.classList.toggle('is-brewing', revealStage === 'brewing');
  eggStage.classList.toggle('is-ready', revealStage === 'ready');
  eggStage.classList.toggle('is-cracking', revealStage === 'cracking');
  byId('egg-status').hidden = revealStage !== 'brewing';
  helloButton.hidden = revealStage !== 'ready';
  for (const id of ['main-eyebrow', 'main-title', 'intro', 'effort-row', 'effort-track']) byId(id).hidden = showDost || revealing;
  byId('hatch-panel').hidden = !showDost;
  byId('hatch-choice-panel').hidden = !state.hatchPending || revealing;
  if (state.hatchPending) {
    if (!localSetup) refreshLocalSetup();
    renderSetupGuide();
    skipPreviewButton.textContent = state.localGeneration?.status === 'failed' ? 'Hatch with prepared messages' : 'Skip and hatch DOST';
    generatePreviewButton.textContent = state.localGeneration?.status === 'failed' ? 'Try again' : 'Write my messages';
  }
  connectButton.hidden = state.hatched || state.hatchPending || revealing;
  byId('intro').textContent = state.hatchPending
    ? 'One last choice before your DOST hatches.'
    : state.hatched ? 'A little friend, shaped around what matters to you.' : 'Your DOST is getting ready to meet you.';
  byId('footer-copy').textContent = state.hatchPending
    ? 'Your answers only go to the model running on this PC.'
    : state.hatched ? 'Your answers and DOST stay on this PC.' : 'Your answers stay on this PC. No account needed.';

  const question = state.question;
  questionPanel.hidden = !sessionOpen || !question || !state.canConnect;
  if (questionPanel.hidden) {
    if (!state.hatched && state.sessionIndex > 0 && state.waitRemainingMs > 0) {
      connectButton.disabled = true;
      connectButton.textContent = `Next session in ${formatWait(state.waitRemainingMs)}`;
    } else if (!state.hatched) {
      connectButton.disabled = !state.canConnect;
      connectButton.innerHTML = state.sessionIndex === 0 ? 'Connect <span aria-hidden="true">↗</span>' : 'Connect again <span aria-hidden="true">↗</span>';
    }
  } else {
    connectButton.hidden = true;
    byId('question-group').textContent = `${question.group.toUpperCase()} · SESSION ${state.sessionIndex + 1}`;
    byId('question-number').textContent = `${(count % 5) + 1} OF 5`;
    byId('question-prompt').textContent = question.prompt;
    byId('form-error').textContent = '';
    const optionContainer = byId('answer-options');
    optionContainer.replaceChildren();
    byId('answer-help').hidden = !question.helperText;
    byId('answer-help').textContent = question.helperText || '';
    const hasText = question.type === 'text' || question.allowText;
    byId('text-answer').hidden = !hasText;
    byId('text-answer-label').hidden = !hasText;
    byId('text-answer-label').textContent = question.allowText ? 'In your own words (optional)' : 'Your answer';
    byId('text-answer').placeholder = question.textPlaceholder || 'A few words is plenty.';
    byId('text-answer').value = '';
    byId('decline-answer').hidden = !question.canDecline;
    byId('decline-answer').textContent = 'Prefer not to share';
    selectedOptionId = null;
    selectedOptionIds = new Set();
    textDeclined = false;
    byId('continue-button').disabled = true;
    const updateContinue = () => {
      const hasTyped = Boolean(byId('text-answer').value.trim());
      const hasChoice = question.type === 'multi' ? selectedOptionIds.size > 0 : Boolean(selectedOptionId);
      byId('continue-button').disabled = question.type === 'text'
        ? !hasTyped && !textDeclined
        : !hasChoice && !(question.allowText && hasTyped);
    };
    if (question.type === 'choice' || question.type === 'choice-text' || question.type === 'multi') {
      const isMulti = question.type === 'multi';
      byId('continue-button').disabled = true;
      for (const option of question.options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'answer-option';
        button.textContent = option.label;
        button.dataset.optionId = option.id;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
          if (isMulti) {
            if (selectedOptionIds.has(option.id)) {
              selectedOptionIds.delete(option.id);
              button.setAttribute('aria-pressed', 'false');
            } else {
              if ((question.exclusiveOptionIds || []).includes(option.id)) {
                selectedOptionIds.clear();
                optionContainer.querySelectorAll('.answer-option').forEach((item) => item.setAttribute('aria-pressed', 'false'));
              } else {
                for (const exclusiveId of question.exclusiveOptionIds || []) {
                  if (selectedOptionIds.delete(exclusiveId)) {
                    const exclusiveButton = [...optionContainer.querySelectorAll('.answer-option')]
                      .find((item) => item.dataset.optionId === exclusiveId);
                    exclusiveButton?.setAttribute('aria-pressed', 'false');
                  }
                }
              }
              if (selectedOptionIds.size >= question.maxSelections) {
                byId('form-error').textContent = `Choose up to ${question.maxSelections} answers.`;
                return;
              }
              selectedOptionIds.add(option.id);
              button.setAttribute('aria-pressed', 'true');
            }
            byId('form-error').textContent = '';
          } else {
            // Clicking the picked answer again clears it, so the typed answer can stand alone.
            selectedOptionId = selectedOptionId === option.id && question.allowText ? null : option.id;
            optionContainer.querySelectorAll('.answer-option').forEach((item) => item.setAttribute('aria-pressed', String(item.dataset.optionId === selectedOptionId)));
          }
          updateContinue();
        });
        optionContainer.append(button);
      }
    }
    byId('text-answer').oninput = () => {
      textDeclined = false;
      updateContinue();
    };
    byId('decline-answer').onclick = () => {
      textDeclined = true;
      byId('text-answer').value = '';
      byId('continue-button').disabled = false;
      byId('form-error').textContent = '';
    };
  }

  if (showDost) renderHatch();
}

function formatReminderTime(ms) {
  if (!Number.isFinite(ms)) return 'not scheduled';
  if (ms <= 0) return 'due now';
  const totalSeconds = Math.ceil(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours ? `${hours}h ${minutes}m ${seconds}s` : `${minutes}m ${seconds}s`;
}

function renderDeveloperTimer() {
  const timer = byId('developer-timer');
  if (!timer) return;
  timer.textContent = state?.reminderPending
    ? 'Next reminder: waiting for your response'
    : `Next reminder in: ${formatReminderTime(state?.reminderRemainingMs)}`;
}

// After hatching, the screen is just DOST with its default animation, its name and one hello line.
function renderHatch() {
  const profile = state.personaConfig;
  const slime = byId('hatch-slime');
  byId('hatch-persona').textContent = `${profile.name.toUpperCase()} · ${profile.label.toUpperCase()}`;
  byId('hatch-title').textContent = profile.introduction;
  if (slime.dataset.persona !== profile.id) window.DostSlime.mount(slime, profile.id);
  slime.classList.toggle('is-arriving', dostArriving);
  dostArriving = false;
}

async function initialize() {
  state = await window.dost.getIncubationState();
  render();
  window.setInterval(async () => {
    const shouldRefreshView = !state.hatched && state.waitRemainingMs > 0;
    const shouldRefreshTimer = state.developerMode && state.hatched;
    if (!shouldRefreshView && !shouldRefreshTimer) return;
    const latest = await window.dost.getIncubationState();
    if (shouldRefreshView) {
      state = latest;
      render();
    } else {
      state = { ...state, reminderRemainingMs: latest.reminderRemainingMs, reminderPending: latest.reminderPending };
      renderDeveloperTimer();
    }
  }, 1000);
}

initialize().catch((error) => {
  feedback.textContent = `DOST couldn’t open your incubation data: ${error.message}`;
});
