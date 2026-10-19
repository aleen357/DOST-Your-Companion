// DOST is drawn in layers so personas and emotions stay independent:
//   persona  -> colours (palette) + face.brows
//   emotion  -> an accessory layer on top, plus optional eyes/mouth/brows/motion overrides
// To add a new emotion, add one entry to ACCESSORIES. No per-persona copies needed.

const BODY = 'M56 24C80 24 97 42 99 66C101 88 84 99 56 99S11 88 13 66C15 42 32 24 56 24Z';

const BROWS = {
  none: '',
  confident: '<path class="slime-brow" d="M33 51Q40 50 47 54"/><path class="slime-brow" d="M79 51Q72 50 65 54"/>',
  angry: '<path class="slime-brow" d="M34 50L47 56"/><path class="slime-brow" d="M78 50L65 56"/>'
};

const EYES = {
  open: '<g class="slime-eyes"><ellipse class="slime-eye" cx="42" cy="64" rx="3.8" ry="5"/><ellipse class="slime-eye" cx="70" cy="64" rx="3.8" ry="5"/></g>',
  closed: '<path class="slime-mouth" d="M37 65q5 -5 10 0"/><path class="slime-mouth" d="M65 65q5 -5 10 0"/>'
};

const MOUTHS = {
  smile: '<path class="slime-mouth" d="M49 74q7 7 14 0"/>',
  frown: '<path class="slime-mouth" d="M49 78q7 -6 14 0"/>',
  smirk: '<path class="slime-mouth" d="M50 76q8 3 14 -3"/>',
  o: '<ellipse class="slime-eye" cx="56" cy="76" rx="3" ry="3.6"/>'
};

// Accessory art is persona-neutral. Animated parts carry no transform attribute;
// their parent <g> positions them so CSS can pivot around local (0, 0).
const ACCESSORIES = {
  ARTIST: {
    front: `
      <g transform="rotate(-14 54 25)">
        <path d="M30 28q2 -14 26 -14t24 14q-25 6 -50 0Z" fill="#c94b5b"/>
        <ellipse cx="55" cy="28" rx="26" ry="4.5" fill="#a83a4b"/>
        <circle cx="56" cy="13" r="2.6" fill="#a83a4b"/>
      </g>
      <circle cx="84" cy="80" r="3" fill="#4a90e2" opacity=".75"/>
      <g transform="translate(97 92)"><g class="acc-brush">
        <path d="M0 0V-24" stroke="#a8743f" stroke-width="3.6" stroke-linecap="round"/>
        <rect x="-2.6" y="-30" width="5.2" height="6" rx="1" fill="#b9c2cc"/>
        <path d="M-2.6 -30q0 -8 2.6 -12q2.6 4 2.6 12Z" fill="#4a90e2"/>
      </g></g>`
  },
  SCHOLAR: {
    front: `
      <g fill="#ffffff2e" stroke="#3b3b4f" stroke-width="2.3">
        <circle cx="42" cy="64" r="8.5"/><circle cx="70" cy="64" r="8.5"/>
        <path d="M50.5 63q5.5 -3 11 0M33.5 62l-7 -3M78.5 62l7 -3" fill="none"/>
      </g>
      <g transform="translate(6 82) rotate(-12)">
        <rect width="22" height="16" rx="2" fill="#5b7bd5"/>
        <rect x="3" y="2.5" width="17" height="11" rx="1" fill="#fff"/>
        <path d="M11.5 2.5v11" stroke="#5b7bd5" stroke-width="1.4"/>
      </g>`
  },
  STUDENT: {
    front: `
      <path d="M42 26v8q14 6 28 0v-8Z" fill="#2c3446"/>
      <path d="M28 25L56 14L84 25L56 35Z" fill="#3a4459"/>
      <circle cx="56" cy="24.5" r="1.8" fill="#f2c14e"/>
      <g transform="translate(56 24.5)"><g class="acc-tassel">
        <path d="M0 0L22 3V13" fill="none" stroke="#f2c14e" stroke-width="1.6"/>
        <rect x="19.5" y="12" width="5" height="6" rx="1.5" fill="#f2c14e"/>
      </g></g>
      <g transform="translate(99 92) rotate(18)">
        <rect x="-2.6" y="-24" width="5.2" height="20" fill="#f2c14e"/>
        <rect x="-2.6" y="-28" width="5.2" height="4" rx="1" fill="#f29aa3"/>
        <path d="M-2.6 -4L0 3L2.6 -4Z" fill="#f1d3a5"/><path d="M-.8 1L0 3L.8 1Z" fill="#3b3b4f"/>
      </g>`
  },
  DANCER: {
    motion: 'dance',
    eyes: 'closed',
    front: `
      <path d="M56 22L42 14V30ZM56 22L70 14V30Z" fill="#ff7eb6"/><circle cx="56" cy="22" r="3.6" fill="#e85d9b"/>
      <g transform="translate(14 46)"><g class="acc-note">
        <ellipse cx="0" cy="0" rx="3.4" ry="2.5" fill="#7a6cf0"/><path d="M3 0V-13q4 2 6 6" fill="none" stroke="#7a6cf0" stroke-width="1.8"/>
      </g></g>
      <g transform="translate(96 40)"><g class="acc-note acc-note-late">
        <ellipse cx="0" cy="0" rx="3.4" ry="2.5" fill="#e85d9b"/><path d="M3 0V-13q4 2 6 6" fill="none" stroke="#e85d9b" stroke-width="1.8"/>
      </g></g>`
  },
  CALM: {
    motion: 'breathe',
    eyes: 'closed',
    front: `
      <g transform="translate(56 25)"><g class="acc-sway">
        <path d="M0 0q-1 -6 1 -11" fill="none" stroke="#4f9e55" stroke-width="2" stroke-linecap="round"/>
        <path d="M1 -10q8 -7 12 0q-6 5 -12 0Z" fill="#6cc36b"/>
        <path d="M0 -6q-8 -5 -11 1q6 4 11 -1Z" fill="#83d67f"/>
      </g></g>`
  },
  QUESTION: {
    motion: 'tilt',
    mouth: 'o',
    front: `
      <g transform="translate(92 26)"><g class="acc-bob">
        <text x="0" y="0" text-anchor="middle" font-size="24" font-weight="800" font-family="Manrope, 'Segoe UI', sans-serif" fill="#6a7bd8">?</text>
      </g></g>`
  },
  'TIME TICKING': {
    front: `
      <path d="M24 44q-4 6 0 8.5q4 -2.5 0 -8.5Z" fill="#8fd3ff"/>
      <g transform="translate(97 84)">
        <circle cx="-6" cy="-11" r="3.6" fill="#e2574c"/><circle cx="6" cy="-11" r="3.6" fill="#e2574c"/>
        <path d="M-6 10l-3 4M6 10l3 4" stroke="#e2574c" stroke-width="2.4" stroke-linecap="round"/>
        <circle r="11" fill="#fff" stroke="#e2574c" stroke-width="3"/>
        <path d="M0 0V-5" stroke="#3b3b4f" stroke-width="1.8" stroke-linecap="round"/>
        <g class="acc-tick"><path d="M0 0V-8" stroke="#3b3b4f" stroke-width="1.4" stroke-linecap="round"/></g>
        <circle r="1.4" fill="#3b3b4f"/>
      </g>`
  },
  ANGRY: {
    motion: 'shake',
    brows: 'angry',
    mouth: 'frown',
    front: `
      <g transform="translate(86 36)"><g class="acc-throb">
        <path d="M-7 -2q5 0 5 -5M2 -7q0 5 5 5M7 2q-5 0 -5 5M-2 7q0 -5 -5 -5" fill="none" stroke="#e24b4b" stroke-width="2.6" stroke-linecap="round"/>
      </g></g>
      <g transform="translate(34 22)"><g class="acc-steam"><circle r="4" fill="#d9dee6"/><circle cx="4" cy="-4" r="3" fill="#e6eaf0"/></g></g>
      <g transform="translate(78 20)"><g class="acc-steam acc-steam-late"><circle r="4" fill="#d9dee6"/><circle cx="-4" cy="-4" r="3" fill="#e6eaf0"/></g></g>`
  },
  ALOOF: {
    mouth: 'smirk',
    front: `
      <path d="M32 58h20v5q0 8 -10 8t-10 -8ZM60 58h20v5q0 8 -10 8t-10 -8Z" fill="#26283a"/>
      <path d="M52 60h8M32 59l-6 -3M80 59l6 -3" stroke="#26283a" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M36 61l4 -2M64 61l4 -2" stroke="#ffffffaa" stroke-width="1.6" stroke-linecap="round"/>
      <g transform="translate(88 50)"><g class="acc-twinkle"><path d="M0 -5L1.2 -1.2L5 0L1.2 1.2L0 5L-1.2 1.2L-5 0L-1.2 -1.2Z" fill="#ffd45c"/></g></g>`
  }
};

function normalizeEmotion(value) {
  return String(value || '').toUpperCase().replace(/[_-]+/g, ' ').trim();
}

function mountSlime(container, persona = 'chill', options = {}) {
  if (!container) return;
  const profile = typeof persona === 'string' ? window.DostPersonas.getPersona(persona) : persona;
  const selected = profile || window.DostPersonas.getPersona('chill');
  const emotion = normalizeEmotion(options.emotion);
  const accessory = ACCESSORIES[emotion] || {};
  const brows = BROWS[accessory.brows || selected.face?.brows] || '';
  const eyes = EYES[accessory.eyes] || EYES.open;
  const mouth = MOUTHS[accessory.mouth] || MOUTHS.smile;
  container.innerHTML = `
    <svg class="slime-svg" viewBox="0 0 112 112" aria-hidden="true" focusable="false">
      <ellipse class="slime-ground-shadow" cx="56" cy="101" rx="30" ry="4"/>
      <g class="slime-hop"><g class="slime-squish"><g class="slime-mood"${accessory.motion ? ` data-motion="${accessory.motion}"` : ''}>
        ${accessory.back || ''}
        <path class="slime-body" d="${BODY}"/>
        <ellipse class="slime-shine" cx="36" cy="40" rx="10" ry="6" transform="rotate(-35 36 40)"/>
        <circle class="slime-shine" cx="50" cy="32" r="2.4"/>
        <circle class="slime-blush" cx="30" cy="73" r="5"/><circle class="slime-blush" cx="82" cy="73" r="5"/>
        ${eyes}${brows}${mouth}
        ${accessory.front || ''}
      </g></g></g>
    </svg>`;
  container.dataset.persona = selected.id;
  container.dataset.emotion = ACCESSORIES[emotion] ? emotion : '';
  container.style.setProperty('--slime-body', selected.palette.body);
  container.style.setProperty('--slime-line', selected.palette.line);
  container.style.setProperty('--slime-shine', selected.palette.shine);
  container.style.setProperty('--slime-blush', selected.palette.blush);
}

window.DostSlime = Object.freeze({ mount: mountSlime, emotions: Object.freeze(Object.keys(ACCESSORIES)) });
