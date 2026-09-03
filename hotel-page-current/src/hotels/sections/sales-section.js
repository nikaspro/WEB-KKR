import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);

const currencyEase = CustomEase.create('salesCurrencyEase', '0.555,1.176,0.574,-0.347');
const getCurrencyTilt = index => -34 + index * 17 % 69;

function createOdometer(counter) {
  const target = Number(counter.dataset.value);
  const prefix = counter.dataset.prefix ?? '';
  const suffix = counter.dataset.suffix ?? '';
  const rollSteps = target;
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
  const targetDigits = String(target).length;

  windowNode.style.setProperty('--sales-odometer-digits', '1');
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

  return {
    counter,
    rollSteps,
    targetDigits,
    track:trackNode,
    window:windowNode
  };
}

export function initHotelSalesSection(root = document) {
  const section = root.querySelector('[data-hotel-section="sales"]');

  if (!section || section.dataset.salesReady === 'true') return null;

  section.dataset.salesReady = 'true';
  section.removeAttribute('data-sales-static');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const title = section.querySelector('.hotel-sales__title');
  const aiSwitch = section.querySelector('[data-sales-ai-switch]');
  const aiTrack = aiSwitch?.querySelector('.hotel-sales__ai-track');
  const aiThumb = aiSwitch?.querySelector('.hotel-sales__ai-thumb');
  const currencyRain = section.querySelector('.hotel-sales__currency-rain');
  const bars = [...section.querySelectorAll('.hotel-sales__bar')];
  const bottomPanels = [...section.querySelectorAll('.hotel-sales__twister-panel--bottom')];
  const greenPanels = [...section.querySelectorAll('.hotel-sales__twister-panel--top')];
  const counters = [...section.querySelectorAll('[data-sales-counter]')];
  const labels = [...section.querySelectorAll('.hotel-sales__label')];
  const odometers = counters.map(createOdometer);
  const firstStageScales = [.42, .48, .54];
  const currencySymbols = [];

  if (currencyRain) {
    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 240; index += 1) {
      const symbol = document.createElement('span');
      const row = index % 8;

      symbol.className = 'hotel-sales__currency-symbol';
      symbol.textContent = '₽';
      symbol.style.setProperty('--sales-currency-x', `${(index * 43 + Math.floor(index / 8) * 17) % 101}%`);
      symbol.style.setProperty('--sales-currency-y', `${96 + row * 12}%`);
      symbol.style.setProperty('--sales-currency-size', `${26 + (index * 17) % 68}px`);
      fragment.append(symbol);
      currencySymbols.push(symbol);
    }

    currencyRain.replaceChildren(fragment);
  }

  gsap.set(title, {
    autoAlpha:reducedMotion ? 1 : 0,
    y:reducedMotion ? 0 : 26
  });
  gsap.set(aiSwitch, {
    autoAlpha:reducedMotion ? 1 : 0,
    y:reducedMotion ? 0 : 20
  });
  gsap.set(aiTrack, {
    backgroundColor:reducedMotion ? '#0400fa' : 'rgba(255,255,255,.1)'
  });
  gsap.set(aiThumb, {
    x:reducedMotion ? 52 : 0,
    backgroundColor:reducedMotion ? 'rgba(255,255,255,.68)' : 'rgba(255,255,255,.3)',
    color:'transparent'
  });
  gsap.set(bottomPanels, {autoAlpha:1});
  gsap.set(currencySymbols, {
    autoAlpha:0,
    xPercent:-50,
    y:0,
    rotation:0
  });
  gsap.set(greenPanels, {
    autoAlpha:0,
    yPercent:0
  });
  gsap.set(labels, {
    autoAlpha:reducedMotion ? 1 : 0,
    y:reducedMotion ? 0 : 18
  });
  gsap.set(counters, {
    autoAlpha:reducedMotion ? 1 : 0,
    y:reducedMotion ? 0 : 18
  });
  gsap.set(bars, {
    '--sales-reveal':reducedMotion ? '0%' : '100%',
    scaleY:1
  });
  aiSwitch?.classList.toggle('is-on', reducedMotion);

  odometers.forEach(({counter, rollSteps, track}) => {
    gsap.set(track, {
      y:reducedMotion ? -rollSteps * counter.offsetHeight : 0
    });
  });

  if (reducedMotion) return null;

  const blankLeadDuration = .52;
  const titleRevealStart = blankLeadDuration;
  const titleRevealDuration = .42;
  const firstGrowthStart = titleRevealStart + .56;
  const firstGrowthDuration = .8;
  const firstGrowthStagger = .28;
  const firstGrowthEnd = firstGrowthStart
    + firstGrowthDuration
    + Math.max(0, bars.length - 1) * firstGrowthStagger;
  const labelRevealDelay = .48;
  const labelRevealDuration = .34;
  const labelRevealEnd = firstGrowthStart
    + labelRevealDelay
    + labelRevealDuration
    + Math.max(0, labels.length - 1) * firstGrowthStagger;
  const switchRevealStart = Math.max(firstGrowthEnd, labelRevealEnd) + .18;
  const switchRevealDuration = .32;
  const pauseDuration = .86;
  const synchronizedGrowthStart = switchRevealStart + switchRevealDuration + pauseDuration;
  const synchronizedGrowthDuration = 2.34;
  const synchronizedGrowthStagger = .04;
  const synchronizedGrowthEnd = synchronizedGrowthStart
    + synchronizedGrowthDuration
    + Math.max(0, bars.length - 1) * synchronizedGrowthStagger;
  const finalHoldDuration = .08;
  const timelineEnd = synchronizedGrowthEnd + finalHoldDuration;
  const greenWaveStartProgress = synchronizedGrowthStart / timelineEnd;
  const currencyWaveStartProgress = synchronizedGrowthEnd / timelineEnd;
  const phase = {value:0};
  let greenWaveSide = -1;
  let currencyWaveSide = -1;

  const greenWaveTimeline = gsap.timeline({paused:true});

  greenWaveTimeline
    .set(greenPanels, {
      autoAlpha:0,
      willChange:'opacity'
    })
    .fromTo(aiTrack, {
      y:0,
      scale:1,
      rotation:0
    }, {
      keyframes:[
        {y:-18, scale:1.55, rotation:-12, duration:.78, ease:'power2.out'},
        {y:-18, scale:1.55, rotation:-12, duration:.26, ease:'none'},
        {y:2, scale:1.01, rotation:-1.5, duration:.39, ease:'power2.in'},
        {y:0, scale:1, rotation:0, duration:.19, ease:'power2.out'}
      ]
    }, 0)
    .to(greenPanels, {
      autoAlpha:1,
      duration:.28,
      stagger:.04,
      ease:'power2.out'
    }, 0)
    .to(greenPanels, {
      autoAlpha:0,
      duration:1.18,
      stagger:.06,
      ease:'power2.out'
    }, .62)
    .to(counters, {
      color:'#72f0b8',
      filter:'drop-shadow(0 0 16px rgba(47,224,155,.38))',
      duration:.28,
      stagger:.04,
      ease:'power2.out'
    }, 0)
    .to(counters, {
      color:'#fff',
      filter:'drop-shadow(0 0 0 rgba(47,224,155,0))',
      duration:1.18,
      stagger:.06,
      ease:'power2.out'
    }, .62)
    .set(greenPanels, {clearProps:'willChange'})
    .set(counters, {clearProps:'color,filter'});

  const currencyWaveTimeline = gsap.timeline({paused:true});

  currencyWaveTimeline
    .set(currencySymbols, {
      autoAlpha:0,
      xPercent:-50,
      y:0,
      rotation:0,
      willChange:'transform,opacity'
    })
    .fromTo(currencySymbols, {
      xPercent:-50,
      y:0,
      rotation:getCurrencyTilt,
      scale:index => .72 + index % 5 * .08
    }, {
      y:index => -window.innerHeight * (1.32 + index % 8 * .12),
      rotation:index => getCurrencyTilt(index) + (index % 3 - 1) * 8,
      scale:index => .88 + index % 6 * .06,
      duration:index => 1.72 + index % 6 * .1,
      stagger:.004,
      ease:currencyEase
    }, 0)
    .to(currencySymbols, {
      autoAlpha:index => .26 + index % 5 * .045,
      duration:.24,
      stagger:.004,
      ease:'power2.out'
    }, 0)
    .to(currencySymbols, {
      autoAlpha:0,
      duration:.48,
      stagger:.004,
      ease:'power2.in'
    }, 1.42)
    .set(currencySymbols, {
      autoAlpha:0,
      clearProps:'transform,willChange'
    });

  const timeline = gsap.timeline({
    defaults:{ease:'none'},
    paused:true
  });

  timeline.to(phase, {value:1, duration:blankLeadDuration}, 0);

  timeline.to(title, {
    autoAlpha:1,
    y:0,
    duration:titleRevealDuration,
    ease:'power2.out'
  }, titleRevealStart);

  timeline.to(aiSwitch, {
    autoAlpha:1,
    y:0,
    duration:switchRevealDuration,
    ease:'power2.out'
  }, switchRevealStart);

  bars.forEach((bar, index) => {
    const firstStageScale = firstStageScales[index] ?? .48;

    timeline.to(bar, {
      '--sales-reveal':`${(1 - firstStageScale) * 100}%`,
      duration:firstGrowthDuration,
      ease:'none'
    }, firstGrowthStart + index * firstGrowthStagger);
  });

  labels.forEach((label, index) => {
    timeline.to(label, {
      autoAlpha:1,
      y:0,
      duration:labelRevealDuration,
      ease:'power1.out'
    }, firstGrowthStart + labelRevealDelay + index * firstGrowthStagger);
  });

  timeline.to(phase, {
    value:2,
    duration:synchronizedGrowthStart - firstGrowthEnd
  }, firstGrowthEnd);

  timeline.to(aiTrack, {
    backgroundColor:'#0400fa',
    duration:.34,
    ease:'power2.out'
  }, synchronizedGrowthStart);

  timeline.to(aiThumb, {
    x:52,
    backgroundColor:'rgba(255,255,255,.68)',
    duration:.42,
    ease:'back.out(1.5)'
  }, synchronizedGrowthStart);

  timeline.to(counters, {
    autoAlpha:1,
    y:0,
    duration:.4,
    stagger:synchronizedGrowthStagger,
    ease:'power1.out'
  }, synchronizedGrowthStart);

  bars.forEach((bar, index) => {
    const start = synchronizedGrowthStart + index * synchronizedGrowthStagger;

    timeline.to(bar, {
      '--sales-reveal':'0%',
      duration:synchronizedGrowthDuration,
      ease:'sine.inOut'
    }, start);
  });

  odometers.forEach(({counter, rollSteps, targetDigits, track, window}, index) => {
    const start = synchronizedGrowthStart + index * synchronizedGrowthStagger;

    timeline.to(track, {
      y:() => -rollSteps * counter.offsetHeight,
      duration:synchronizedGrowthDuration,
      ease:'sine.inOut'
    }, start);

    if (targetDigits > 1) {
      const digitExpansionProgress = 9.5 / rollSteps;
      const digitExpansionTime = Math.acos(1 - 2 * digitExpansionProgress) / Math.PI;

      timeline.to(window, {
        '--sales-odometer-digits':targetDigits,
        duration:.001,
        ease:'none'
      }, start + digitExpansionTime * synchronizedGrowthDuration);
    }
  });

  timeline.to(phase, {value:4, duration:finalHoldDuration}, synchronizedGrowthEnd);

  timeline.progress(0).pause();

  const syncTimeline = self => {
    timeline.progress(self.progress).pause();

    const nextGreenWaveSide = self.progress >= greenWaveStartProgress ? 1 : -1;
    const nextCurrencyWaveSide = self.progress >= currencyWaveStartProgress ? 1 : -1;

    if (nextGreenWaveSide !== greenWaveSide) {
      greenWaveSide = nextGreenWaveSide;
      aiSwitch?.classList.toggle('is-on', nextGreenWaveSide > 0);

      if (nextGreenWaveSide > 0) {
        greenWaveTimeline.restart();
      } else {
        greenWaveTimeline.pause(0);
        gsap.set(aiTrack, {y:0, scale:1, rotation:0});
        gsap.set(greenPanels, {
          autoAlpha:0,
          yPercent:0,
          clearProps:'willChange'
        });
        gsap.set(counters, {
          color:'#fff',
          filter:'none'
        });
      }
    }

    if (nextCurrencyWaveSide !== currencyWaveSide) {
      currencyWaveSide = nextCurrencyWaveSide;

      if (nextCurrencyWaveSide > 0) {
        currencyWaveTimeline.restart();
      } else {
        currencyWaveTimeline.pause(0);
        gsap.set(currencySymbols, {
          autoAlpha:0,
          clearProps:'transform,willChange'
        });
      }
    }
  };

  const salesTrigger = ScrollTrigger.create({
    trigger:section,
    start:() => section.offsetTop,
    end:() => section.offsetTop + section.offsetHeight - innerHeight,
    invalidateOnRefresh:true,
    onRefresh:syncTimeline,
    onUpdate:syncTimeline
  });
  syncTimeline(salesTrigger);

  const refreshSalesRange = () => salesTrigger.refresh();

  window.addEventListener('load', refreshSalesRange, {once:true});
  document.fonts?.ready.then(() => {
    requestAnimationFrame(() => requestAnimationFrame(refreshSalesRange));
  });

  return {
    timeline,
    greenWaveTimeline,
    currencyWaveTimeline,
    scrollTrigger:salesTrigger
  };
}
