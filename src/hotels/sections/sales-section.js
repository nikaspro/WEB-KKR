import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function createOdometer(counter) {
  const target = Number(counter.dataset.value);
  const prefix = counter.dataset.prefix ?? '';
  const suffix = counter.dataset.suffix ?? '';
  const rollSteps = target < 10 ? 11 : target;
  const finalLabel = `${prefix}${target}${suffix}`;
  const prefixNode = document.createElement('span');
  const suffixNode = document.createElement('span');
  const windowNode = document.createElement('span');
  const trackNode = document.createElement('span');

  prefixNode.className = 'hotel-sales__odometer-affix';
  prefixNode.textContent = prefix;
  suffixNode.className = 'hotel-sales__odometer-affix';
  suffixNode.textContent = suffix;
  windowNode.className = 'hotel-sales__odometer-window';
  windowNode.style.setProperty('--sales-odometer-digits', String(target).length);
  trackNode.className = 'hotel-sales__odometer-track';
  trackNode.setAttribute('aria-hidden', 'true');

  for (let step = 0; step <= rollSteps; step += 1) {
    const valueNode = document.createElement('span');
    valueNode.className = 'hotel-sales__odometer-number';
    valueNode.textContent = String(step === rollSteps ? target : step % (target + 1));
    trackNode.append(valueNode);
  }

  windowNode.append(trackNode);
  counter.replaceChildren(prefixNode, windowNode, suffixNode);
  counter.setAttribute('aria-label', finalLabel);

  return {counter, rollSteps, track:trackNode};
}

export function initHotelSalesSection(root = document) {
  const section = root.querySelector('[data-hotel-section="sales"]');

  if (!section || section.dataset.salesReady === 'true') return null;

  section.dataset.salesReady = 'true';
  section.removeAttribute('data-sales-static');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const title = section.querySelector('.hotel-sales__title');
  const bars = [...section.querySelectorAll('.hotel-sales__bar')];
  const bottomPanels = [...section.querySelectorAll('.hotel-sales__twister-panel--bottom')];
  const greenPanels = [...section.querySelectorAll('.hotel-sales__twister-panel--top')];
  const counters = [...section.querySelectorAll('[data-sales-counter]')];
  const labels = [...section.querySelectorAll('.hotel-sales__label')];
  const odometers = counters.map(createOdometer);
  const initialReveal = '100%';

  gsap.set(title, {autoAlpha:1, y:0});
  gsap.set(bottomPanels, {autoAlpha:1});
  gsap.set(greenPanels, {
    autoAlpha:0,
    yPercent:0
  });
  gsap.set(labels, {autoAlpha:1, y:0});
  gsap.set(counters, {autoAlpha:reducedMotion ? 1 : 0, y:0});
  gsap.set(bars, {
    '--sales-reveal':reducedMotion ? '0%' : initialReveal
  });

  odometers.forEach(({counter, rollSteps, track}) => {
    gsap.set(track, {
      y:reducedMotion ? -rollSteps * counter.offsetHeight : 0
    });
  });

  if (reducedMotion) return null;

  const growthStart = .64;
  const growthDuration = 1.42;
  const growthEnd = growthStart + growthDuration;
  const odometerStart = growthEnd - .2;
  const counterRevealStart = growthEnd - .06;
  const odometerDuration = .58;
  const phase = {value:0};
  let greenWaveArmed = true;

  const resetGreenWave = () => {
    greenWaveTimeline.pause(0);
    gsap.set(greenPanels, {
      autoAlpha:0,
      yPercent:0,
      clearProps:'willChange'
    });
  };

  const greenWaveTimeline = gsap.timeline({paused:true});

  greenWaveTimeline
    .set(greenPanels, {
      autoAlpha:1,
      willChange:'transform, opacity'
    })
    .to(greenPanels, {
      yPercent:228,
      duration:1.58,
      stagger:.075,
      ease:'power1.inOut'
    }, 0)
    .to(greenPanels, {
      autoAlpha:0,
      duration:.2,
      stagger:.04,
      ease:'sine.out'
    }, 1.42)
    .set(greenPanels, {clearProps:'willChange'});

  const timeline = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:section,
      start:'top top',
      end:'bottom bottom',
      scrub:.35,
      invalidateOnRefresh:true,
      onUpdate:self => {
        if (self.progress < .48 && !greenWaveArmed) {
          greenWaveArmed = true;
          resetGreenWave();
          return;
        }

        if (self.progress >= .76 && greenWaveArmed) {
          greenWaveArmed = false;
          greenWaveTimeline.restart();
        }
      }
    }
  });

  timeline.to(phase, {value:1, duration:growthStart}, 0);

  bars.forEach((bar, index) => {
    timeline.fromTo(bar, {
      '--sales-reveal':initialReveal
    }, {
      '--sales-reveal':'0%',
      duration:growthDuration,
      ease:'power2.inOut'
    }, growthStart + index * .035);
  });

  timeline.to(counters, {
    autoAlpha:1,
    duration:.16,
    stagger:.035,
    ease:'power2.out'
  }, counterRevealStart);

  odometers.forEach(({counter, rollSteps, track}, index) => {
    timeline.to(track, {
      y:() => -rollSteps * counter.offsetHeight,
      duration:odometerDuration,
      ease:'power2.inOut'
    }, odometerStart + index * .035);
  });

  timeline.to(phase, {value:2, duration:.6}, growthEnd + .12);

  return {
    timeline,
    greenWaveTimeline,
    scrollTrigger:timeline.scrollTrigger
  };
}
