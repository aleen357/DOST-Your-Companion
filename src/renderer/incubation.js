const byId = (id) => document.getElementById(id);
const previewButton = byId('preview-button');
const connectButton = byId('connect-button');
const resetButton = byId('reset-button');
const feedback = byId('feedback');
const questionPanel = byId('question-panel');
let state;
let sessionOpen = false;
let selectedOptionId = null;

previewButton.addEventListener('click', () => {
  window.dost.showReminderPreview();
  feedback.textContent = 'Your companion preview is open above your other windows.';
});

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
    feedback.textContent = 'A fresh egg. Connect whenever you’re ready.';
    render();
  } catch (error) {
    feedback.textContent = `DOST couldn’t reset your progress: ${error.message}`;
  }
});

byId('continue-button').addEventListener('click', async () => {
  const question = state?.question;
  if (!question) return;
  const answer = question.type === 'choice'
    ? { optionId: selectedOptionId }
    : { text: byId('text-answer').value };
  byId('form-error').textContent = '';
  try {
    state = await window.dost.submitAnswer(question.id, answer);
    selectedOptionId = null;
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
  const count = state.completedQuestions;
  byId('progress-count').textContent = `${count} of ${state.totalQuestions}`;
  byId('progress-fill').style.width = `${(count / state.totalQuestions) * 100}%`;
  byId('effort-track').setAttribute('aria-valuenow', String(count));
  byId('progress-label').textContent = state.hatched ? 'Your DOST has hatched' : '15 little moments until hatch';
  byId('recovery-note').hidden = !state.recovered;
  byId('recovery-note').textContent = 'I couldn’t read your earlier local progress, so I started a fresh egg.';
  byId('egg-stage').hidden = state.hatched;
  byId('hatch-panel').hidden = !state.hatched;
  connectButton.hidden = state.hatched;
  byId('intro').textContent = state.hatched ? 'A little friend, shaped around what matters to you.' : 'Your DOST is getting ready to meet you.';
  byId('footer-copy').textContent = state.hatched ? 'Your answers and DOST stay on this PC.' : 'Your answers stay on this PC. No account needed.';

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
    byId('text-answer').hidden = question.type !== 'text';
    byId('text-answer-label').hidden = question.type !== 'text';
    byId('text-answer').value = '';
    byId('continue-button').disabled = question.type === 'choice';
    if (question.type === 'choice') {
      for (const option of question.options) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'answer-option';
        button.textContent = option.label;
        button.setAttribute('aria-pressed', 'false');
        button.addEventListener('click', () => {
          selectedOptionId = option.id;
          optionContainer.querySelectorAll('.answer-option').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
          byId('continue-button').disabled = false;
        });
        optionContainer.append(button);
      }
    } else {
      selectedOptionId = null;
      byId('text-answer').addEventListener('input', () => {
        byId('continue-button').disabled = !byId('text-answer').value.trim();
      }, { once: true });
      byId('text-answer').oninput = () => {
        byId('continue-button').disabled = !byId('text-answer').value.trim();
      };
    }
  }

  if (state.hatched) renderHatch();
}

function renderHatch() {
  const profile = state.personaConfig;
  byId('hatch-persona').textContent = `${profile.name.toUpperCase()} · ${profile.label.toUpperCase()}`;
  byId('hatch-title').textContent = profile.introduction;
  window.DostSlime.mount(byId('hatch-slime'), profile.id);
  const encouragement = state.messagePack.encouragement[0];
  byId('hatch-message').textContent = encouragement.text;
  const pack = byId('hatch-pack');
  pack.replaceChildren();
  for (const message of state.messagePack.suggestions) {
    const chip = document.createElement('span');
    chip.className = 'message-chip';
    chip.textContent = message.text;
    pack.append(chip);
  }
}

async function initialize() {
  state = await window.dost.getIncubationState();
  render();
  window.setInterval(async () => {
    if (!state.hatched && state.waitRemainingMs > 0) {
      state = await window.dost.getIncubationState();
      render();
    }
  }, 1000);
}

initialize().catch((error) => {
  feedback.textContent = `DOST couldn’t open your incubation data: ${error.message}`;
});
