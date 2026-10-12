function mountSlime(container, persona = 'chill') {
  if (!container) return;
  const mood = persona === 'bossy' ? 'bossy' : 'chill';
  container.innerHTML = `
    <svg class="slime-svg ${mood}" viewBox="0 0 112 112" aria-hidden="true" focusable="false">
      <path class="slime-body" d="M13 79c-2-13 6-21 13-35 7-13 16-24 32-24 15 0 24 10 31 25 6 12 12 21 10 34-2 15-19 22-44 22S15 95 13 79Z"/>
      <ellipse class="slime-shine" cx="36" cy="33" rx="10" ry="6" transform="rotate(-38 36 33)"/>
      <ellipse class="slime-eye" cx="40" cy="67" rx="3.5" ry="5"/><ellipse class="slime-eye" cx="70" cy="67" rx="3.5" ry="5"/>
      <path class="slime-mouth" d="M48 78q8 8 16 0"/>
      <circle class="slime-blush" cx="28" cy="76" r="5"/><circle class="slime-blush" cx="82" cy="76" r="5"/>
    </svg>`;
  container.dataset.persona = mood;
}

window.DostSlime = Object.freeze({ mount: mountSlime });
