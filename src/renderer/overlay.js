const okayButton = document.querySelector('#ok-button');
const closeButton = document.querySelector('#close-button');

function renderReminder(presentation) {
  if (!presentation?.persona || typeof presentation.message !== 'string') return;
  window.DostSlime.mount(document.querySelector('#slime-mount'), presentation.persona.id);
  const label = document.querySelector('#persona-label');
  const dot = document.createElement('span');
  dot.className = 'persona-dot';
  label.replaceChildren(dot, document.createTextNode(` ${presentation.persona.name} · ${presentation.persona.label}`));
  document.querySelector('#companion-message').textContent = presentation.message;
  document.querySelector('#preview-label').hidden = !presentation.preview;
  document.querySelector('#slime-description').setAttribute('aria-label', `${presentation.persona.name}, ${presentation.persona.label} companion`);
}

window.dost.onReminderUpdate(renderReminder);
window.dost.getReminderPresentation().then(renderReminder).catch(() => {});

function dismiss(action) {
  window.dost.dismissReminder(action);
}

okayButton.addEventListener('click', () => dismiss('ok'));
closeButton.addEventListener('click', () => dismiss('cross'));
