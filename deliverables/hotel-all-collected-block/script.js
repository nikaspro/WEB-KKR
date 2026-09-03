/* global gsap, ScrollTrigger */

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const section = document.querySelector('.collection');
const form = document.querySelector('.collection-input');
const shell = document.querySelector('.collection-input__shell');
const input = document.querySelector('.collection-input input');
const status = document.querySelector('.collection__status');
const statusRegion = document.querySelector('.collection__statuses');
const cards = gsap.utils.toArray('.collection-card');
const anchors = gsap.utils.toArray('.collection-card-anchor');
const wave = document.querySelector('.collection__result-wave');

// Чем меньше duration, тем быстрее бегут свет по тексту и обводка
const steps = [
  { text:'Думаю', scale:1.32, duration:2.20, rotation:-1.2 },
  { text:'Открываю сайт', scale:1.68, duration:1.75, rotation:1.25 },
  { text:'Изучаю страницы', scale:2.04, duration:1.35, rotation:-1.4 },
  { text:'Собираю главное', scale:2.40, duration:1.00, rotation:1.15 },
  { text:'Все собрал', scale:2.78, duration:.78, rotation:-.8 }
];

const measureCanvas = document.createElement('canvas');
const measureContext = measureCanvas.getContext('2d');
let activeIndex = -1;
let finalReached = false;
let waveTimeline = null;

function measureText(text, element) {
  const style = getComputedStyle(element);
  measureContext.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  return measureContext.measureText(text).width;
}

function getPillWidth() {
  const available = Math.min(1080, form.parentElement.clientWidth);
  return Math.ceil(Math.min(400, available / steps.at(-1).scale));
}

function getTextScale(text, pillScale) {
  const visualWidth = getPillWidth() * pillScale;
  const padding = gsap.utils.clamp(38, 58, innerWidth * .03) * pillScale * 2;
  return Math.min(pillScale, (visualWidth - padding) / Math.max(1, measureText(text, status)));
}

function showStatus(index) {
  const step = steps[index];
  if (!step || activeIndex === index) return;
  activeIndex = index;
  status.textContent = step.text;
  status.classList.toggle('is-final', index === steps.length - 1);
  status.style.setProperty('--text-flow-duration', `${step.duration}s`);
  status.setAttribute('aria-hidden', 'false');
  statusRegion.setAttribute('aria-label', step.text);
}

function playResultWave() {
  waveTimeline?.kill();
  waveTimeline = gsap.timeline({
    onComplete:() => {
      gsap.set(wave, { autoAlpha:0 });
      waveTimeline = null;
    }
  })
    .to(wave, { autoAlpha:.78, duration:1.05, ease:'sine.inOut' })
    .to({}, { duration:1.35 })
    .to(wave, { autoAlpha:0, duration:1.45, ease:'sine.inOut' });
}

function syncFinalState(timeline, finalTime) {
  const reached = timeline.time() >= finalTime - .01;
  section.classList.toggle('is-final', reached);
  form.setAttribute('aria-busy', String(!reached));

  if (reached && !finalReached) {
    finalReached = true;
    playResultWave();
  } else if (!reached) {
    finalReached = false;
  }
}

function cardFlights() {
  const x = Math.min(500, innerWidth * .31);
  const y = Math.min(230, innerHeight * .24);
  const wideX = Math.min(560, innerWidth * .36);
  return [
    { x:-x, y:-y, rotation:-12, scale:1.18 },
    { x:x, y:-y * .92, rotation:12, scale:.88 },
    { x:0, y:y * 1.25, rotation:-2.5, scale:1.06 },
    { x:-wideX, y:y * .78, rotation:6.5, scale:.9 },
    { x:wideX, y:y * .68, rotation:-7, scale:1.2 }
  ];
}

function buildSequence() {
  gsap.set(status, { autoAlpha:0, scale:1, rotation:0, transformOrigin:'50% 50%' });
  gsap.set(cards, { autoAlpha:0, x:0, y:0, scale:.18, rotation:0, transformOrigin:'50% 50%' });
  gsap.set(input, { color:'#fff' });

  const statusStart = .32;
  const statusStep = 1.02;
  const finalIndex = steps.length - 1;
  const finalTime = statusStart + finalIndex * statusStep;

  const timeline = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:section,
      start:'top top',
      end:'bottom bottom',
      scrub:true,
      invalidateOnRefresh:true,
      onUpdate:() => {
        const index = Math.min(finalIndex, Math.max(0, Math.floor((timeline.time() - statusStart) / statusStep)));
        showStatus(index);
        syncFinalState(timeline, finalTime);
      },
      onRefresh:() => requestAnimationFrame(() => syncFinalState(timeline, finalTime))
    }
  })
    .to(input, { color:'rgba(255,255,255,0)', duration:.22, ease:'power2.out' }, 0)
    .to(status, { autoAlpha:1, duration:.01 }, statusStart);

  steps.forEach((step, index) => {
    const at = statusStart + index * statusStep;
    const morphAt = Math.max(.08, at - .24);

    timeline
      .set(shell, { '--rim-duration':`${step.duration}s` }, morphAt)
      .to(form, {
        width:getPillWidth,
        scale:step.scale,
        rotation:step.rotation,
        duration:.72,
        ease:'sine.inOut'
      }, morphAt)
      .to(status, {
        scale:() => getTextScale(step.text, step.scale),
        rotation:step.rotation,
        duration:.72,
        ease:'sine.inOut'
      }, morphAt);
  });

  timeline
    .to(status, { autoAlpha:0, duration:.32, ease:'sine.inOut' }, finalTime - .34)
    .to(status, { autoAlpha:1, duration:.48, ease:'sine.inOut' }, finalTime + .02)
    .fromTo(cards,
      {
        autoAlpha:0,
        x:index => cardFlights()[index].x * .58,
        y:index => cardFlights()[index].y * .58,
        scale:.76,
        rotation:index => cardFlights()[index].rotation * .58
      },
      {
        autoAlpha:1,
        x:index => cardFlights()[index].x,
        y:index => cardFlights()[index].y,
        scale:index => cardFlights()[index].scale,
        rotation:index => cardFlights()[index].rotation,
        duration:.3,
        stagger:.018,
        ease:'power3.out'
      },
      finalTime
    )
    .to({}, { duration:.92 }, finalTime + .865);

  return timeline;
}

function enableCardParallax() {
  if (!matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const depths = [56,48,68,52,60];
  const controllers = anchors.map((anchor,index) => ({
    x:gsap.quickTo(anchor,'x',{ duration:.62,ease:'power3.out' }),
    y:gsap.quickTo(anchor,'y',{ duration:.68,ease:'power3.out' }),
    rotationX:gsap.quickTo(anchor,'rotationX',{ duration:.72,ease:'power3.out' }),
    rotationY:gsap.quickTo(anchor,'rotationY',{ duration:.72,ease:'power3.out' }),
    depth:depths[index]
  }));

  addEventListener('pointermove', event => {
    if (!section.classList.contains('is-final')) return;
    const x = gsap.utils.clamp(-1,1,(event.clientX / innerWidth - .5) * 2);
    const y = gsap.utils.clamp(-1,1,(event.clientY / innerHeight - .5) * 2);
    controllers.forEach(controller => {
      controller.x(-x * controller.depth);
      controller.y(-y * controller.depth * .34);
      controller.rotationX(y * 5.6);
      controller.rotationY(-x * 7.6);
    });
  }, { passive:true });
}

if (reduced) {
  const final = steps.at(-1);
  showStatus(steps.length - 1);
  section.classList.add('is-final');
  form.setAttribute('aria-busy','false');
  gsap.set(input,{ color:'transparent' });
  gsap.set(form,{ width:getPillWidth,scale:final.scale,rotation:final.rotation });
  gsap.set(status,{ autoAlpha:1,scale:() => getTextScale(final.text,final.scale),rotation:final.rotation });
  gsap.set(cards,{ autoAlpha:1 });
} else {
  buildSequence();
  enableCardParallax();
}
