class VideoSceneController {
  constructor(selector = '.scene') {
    this.scenes = [...document.querySelectorAll(selector)];
    this.rail = document.querySelector('.chapters');
    this.ratios = new Map(this.scenes.map(scene => [scene, 0]));
    this.activeScene = null;
    this.framePending = false;
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  video(scene) { return scene?.querySelector('video.feature'); }

  load(video, preload = 'metadata') {
    if (!video || video.src) return;
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = preload;
    video.src = video.dataset.src;
    video.load();
    video.addEventListener('canplay', () => video.closest('.scene').classList.add('ready'), { once: true });
    video.addEventListener('error', () => video.closest('.scene').classList.add('video-failed'), { once: true });
  }

  buildRail() {
    this.rail.innerHTML = `<div class="rail-numbers">${this.scenes.map((scene, index) =>
      `<a href="#${scene.id}" aria-label="Go to scene ${index + 1}" data-index="${index}">${String(index + 1).padStart(2, '0')}</a>`
    ).join('')}</div><i class="rail-line"><b></b></i>`;
  }

  warm(index) {
    const next = this.video(this.scenes[index + 1]);
    if (next && !next.src) this.load(next, 'metadata');
  }

  activate(scene) {
    if (!scene || scene === this.activeScene) return;
    const previous = this.activeScene;
    const activeIndex = this.scenes.indexOf(scene);
    this.activeScene = scene;
    this.rail.classList.remove('offstage');

    this.scenes.forEach((item, index) => {
      const video = this.video(item);
      const active = item === scene;
      item.classList.toggle('active', active);
      item.classList.toggle('past', index < activeIndex);
      if (!active) video?.pause();
    });

    const video = this.video(scene);
    this.load(video, activeIndex === 0 ? 'auto' : 'metadata');
    video?.play().then(() => scene.classList.remove('autoplay-waiting')).catch(() => scene.classList.add('autoplay-waiting'));
    this.warm(activeIndex);

    this.rail.querySelectorAll('.rail-numbers a').forEach((item, index) => item.classList.toggle('current', index === activeIndex));
    this.rail.style.setProperty('--story-progress', `${activeIndex / (this.scenes.length - 1) * 100}%`);
    if (previous) {
      previous.classList.add('leaving');
      setTimeout(() => previous.classList.remove('leaving'), this.reducedMotion ? 0 : 1050);
    }
  }

  deactivate() {
    if (!this.activeScene) return;
    this.video(this.activeScene)?.pause();
    this.activeScene.classList.remove('active');
    this.activeScene = null;
    this.rail.classList.add('offstage');
  }

  choose() {
    this.framePending = false;
    let best = this.scenes[0];
    let bestRatio = -1;
    this.ratios.forEach((ratio, scene) => {
      if (ratio > bestRatio) { best = scene; bestRatio = ratio; }
    });
    if (bestRatio > .24) this.activate(best);
    else if (bestRatio === 0) this.deactivate();
  }

  init() {
    this.buildRail();
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => this.ratios.set(entry.target, entry.intersectionRatio));
      if (!this.framePending) {
        this.framePending = true;
        requestAnimationFrame(() => this.choose());
      }
    }, { threshold: [0, .15, .25, .4, .52, .65, .8, 1] });
    this.scenes.forEach(scene => observer.observe(scene));
    this.load(this.video(this.scenes[0]), 'auto');
    this.activate(this.scenes[0]);
  }
}

const loader = document.createElement('div');
loader.className = 'loader';
loader.innerHTML = '<span>A</span><b>ASHA <i>DENTAL</i></b><small>Preparing your experience</small>';
document.body.prepend(loader);

const sceneController = new VideoSceneController();
sceneController.init();
const heroVideo = sceneController.video(sceneController.scenes[0]);
const reveal = () => loader.classList.add('done');
heroVideo?.addEventListener('playing', reveal, { once: true });
setTimeout(reveal, 1400);

const header = document.querySelector('.nav');
const menuButton = document.querySelector('.menu-toggle');
const menuLabel = menuButton.querySelector('span');
const menuLinks = [...document.querySelectorAll('#site-menu a')];
function closeMenu() {
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  menuLabel.textContent = 'Menu';
  document.body.classList.remove('menu-visible');
}
menuButton.addEventListener('click', () => {
  const open = header.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuLabel.textContent = open ? 'Close' : 'Menu';
  document.body.classList.toggle('menu-visible', open);
  if (open) setContactAssistant(false);
});
menuLinks.forEach(link => link.addEventListener('click', closeMenu));
addEventListener('resize', () => { if (innerWidth > 920) closeMenu(); });
addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30), { passive: true });

const contactAssistant = document.querySelector('.contact-assistant');
const contactLauncher = contactAssistant.querySelector('.contact-launcher');
const contactPanel = contactAssistant.querySelector('.contact-panel');
const contactClose = contactAssistant.querySelector('.contact-close');
const contactActions = [...contactAssistant.querySelectorAll('.contact-options a')];

function setContactAssistant(open, restoreFocus = false) {
  contactAssistant.classList.toggle('open', open);
  contactLauncher.setAttribute('aria-expanded', String(open));
  contactPanel.setAttribute('aria-hidden', String(!open));
  if (open) {
    closeMenu();
    requestAnimationFrame(() => contactClose.focus());
  } else if (restoreFocus) {
    contactLauncher.focus();
  }
}

contactLauncher.addEventListener('click', () => {
  setContactAssistant(!contactAssistant.classList.contains('open'));
});
contactClose.addEventListener('click', () => setContactAssistant(false, true));
contactActions.forEach(link => link.addEventListener('click', () => setContactAssistant(false)));
document.addEventListener('pointerdown', event => {
  if (contactAssistant.classList.contains('open') && !contactAssistant.contains(event.target)) {
    setContactAssistant(false);
  }
}, { passive: true });
addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const assistantWasOpen = contactAssistant.classList.contains('open');
    closeMenu();
    setContactAssistant(false, assistantWasOpen);
  }
});

document.addEventListener('pointerdown', () => {
  const scene = sceneController.activeScene;
  if (scene?.classList.contains('autoplay-waiting')) {
    sceneController.video(scene)?.play().then(() => scene.classList.remove('autoplay-waiting')).catch(() => {});
  }
}, { passive: true });

document.querySelectorAll('.scene-link[data-treatment]').forEach(link => link.addEventListener('click', () => {
  const detail = document.getElementById(link.dataset.treatment);
  if (detail) detail.open = true;
}));

const form = document.getElementById('appointment-form');
const dateInput = document.getElementById('date');
dateInput.min = new Date().toISOString().split('T')[0];

function invalidate(input, message) {
  const field = input.closest('.field');
  field.classList.toggle('invalid', Boolean(message));
  field.querySelector('small').textContent = message;
  input.setAttribute('aria-invalid', String(Boolean(message)));
  return !message;
}

function validateForm() {
  const name = form.elements.name;
  const phone = form.elements.phone;
  const email = form.elements.email;
  const date = form.elements.date;
  const checks = [
    invalidate(name, name.value.trim().length < 2 ? 'Please enter your full name.' : ''),
    invalidate(phone, phone.value.replace(/\D/g, '').length < 10 ? 'Please enter a valid phone number.' : ''),
    invalidate(email, email.value && !email.validity.valid ? 'Please enter a valid email address.' : ''),
    invalidate(date, !date.value ? 'Please choose a preferred date.' : '')
  ];
  return checks.every(Boolean);
}

form.addEventListener('input', event => {
  if (event.target.matches('input')) invalidate(event.target, '');
});

form.addEventListener('submit', event => {
  event.preventDefault();
  const status = form.querySelector('.form-status');
  if (!validateForm()) {
    status.textContent = 'Please review the highlighted fields.';
    form.querySelector('.invalid input, .invalid select')?.focus();
    return;
  }
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.innerHTML = 'Preparing request…';
  const data = new FormData(form);
  const message = [
    'Hello Asha Dental, I would like to request an appointment.',
    `Name: ${data.get('name')}`,
    `Phone: ${data.get('phone')}`,
    `Email: ${data.get('email') || 'Not provided'}`,
    `Treatment: ${data.get('treatment')}`,
    `Preferred date: ${data.get('date')}`,
    `Preferred time: ${data.get('time')}`,
    `Message: ${data.get('message') || 'None'}`
  ].join('\n');
  status.textContent = 'Opening WhatsApp. Your appointment is not confirmed until the clinic responds.';
  const destination = `https://wa.me/917276209022?text=${encodeURIComponent(message)}`;
  window.open(destination, '_blank', 'noopener');
  setTimeout(() => {
    button.disabled = false;
    button.innerHTML = 'Send appointment request <b>↗</b>';
  }, 350);
});

if (performance.getEntriesByType('navigation')[0]?.type === 'back_forward') {
  const saved = sessionStorage.getItem('asha-scroll-position');
  if (saved) requestAnimationFrame(() => scrollTo(0, Number(saved)));
}
addEventListener('pagehide', () => sessionStorage.setItem('asha-scroll-position', String(scrollY)));
