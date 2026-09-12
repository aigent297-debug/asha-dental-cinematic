const scenes = [...document.querySelectorAll('.scene')];
const nav = document.querySelector('.nav');
const rail = document.querySelector('.chapters');
const ratios = new Map(scenes.map(scene => [scene, 0]));
let activeScene = null;
let framePending = false;

const loader = document.createElement('div');
loader.className = 'loader';
loader.innerHTML = '<span>A</span><b>ASHA <i>DENTAL</i></b><small>Preparing your experience</small>';
document.body.prepend(loader);

rail.innerHTML = `<div class="rail-numbers">${scenes.map((scene, index) =>
  `<a href="#${scene.id}" aria-label="Go to scene ${index + 1}" data-index="${index}">${String(index + 1).padStart(2, '0')}</a>`
).join('')}</div><i class="rail-line"><b></b></i>`;

function featureVideo(scene) {
  return scene?.querySelector('video.feature');
}

function loadVideo(video, preload = 'metadata') {
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

function warmNext(index) {
  const next = featureVideo(scenes[index + 1]);
  if (next && !next.src) loadVideo(next, 'metadata');
}

function activate(scene) {
  if (!scene || scene === activeScene) return;
  const previous = activeScene;
  activeScene = scene;
  const activeIndex = scenes.indexOf(scene);

  scenes.forEach((item, index) => {
    const video = featureVideo(item);
    const isActive = item === scene;
    item.classList.toggle('active', isActive);
    item.classList.toggle('past', index < activeIndex);
    if (!isActive && video) video.pause();
  });

  const video = featureVideo(scene);
  loadVideo(video, activeIndex === 0 ? 'auto' : 'metadata');
  if (video) video.play().catch(() => scene.classList.add('autoplay-waiting'));
  warmNext(activeIndex);

  rail.querySelectorAll('.rail-numbers a').forEach((item, index) => item.classList.toggle('current', index === activeIndex));
  rail.style.setProperty('--story-progress', `${activeIndex / (scenes.length - 1) * 100}%`);

  if (previous) previous.classList.add('leaving');
  setTimeout(() => previous?.classList.remove('leaving'), 1050);
}

function chooseActiveScene() {
  framePending = false;
  let best = scenes[0];
  let bestRatio = -1;
  ratios.forEach((ratio, scene) => {
    if (ratio > bestRatio) { best = scene; bestRatio = ratio; }
  });
  if (bestRatio > 0.24) activate(best);
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => ratios.set(entry.target, entry.intersectionRatio));
  if (!framePending) {
    framePending = true;
    requestAnimationFrame(chooseActiveScene);
  }
}, { threshold: [0, .15, .25, .4, .52, .65, .8, 1] });

scenes.forEach(scene => observer.observe(scene));
const heroVideo = featureVideo(scenes[0]);
loadVideo(heroVideo, 'auto');
activate(scenes[0]);

const reveal = () => loader.classList.add('done');
heroVideo?.addEventListener('playing', reveal, { once: true });
setTimeout(reveal, 1400);

document.addEventListener('pointerdown', () => {
  if (activeScene?.classList.contains('autoplay-waiting')) {
    featureVideo(activeScene)?.play().then(() => activeScene.classList.remove('autoplay-waiting')).catch(() => {});
  }
}, { passive: true });

addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30), { passive: true });
