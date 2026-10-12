const previewButton = document.querySelector('#preview-button');
const feedback = document.querySelector('#feedback');

previewButton.addEventListener('click', () => {
  window.dost.showReminderPreview();
  feedback.textContent = 'Your companion is here. Try switching to another window with DOST still open.';
});
