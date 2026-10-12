const okayButton = document.querySelector('#ok-button');
const closeButton = document.querySelector('#close-button');

window.DostSlime.mount(document.querySelector('#slime-mount'), 'chill');

function dismiss(action) {
  window.dost.dismissReminder(action);
}

okayButton.addEventListener('click', () => dismiss('ok'));
closeButton.addEventListener('click', () => dismiss('cross'));
