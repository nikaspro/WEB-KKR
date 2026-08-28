import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initHotelSalesSection(root = document) {
  const section = root.querySelector('[data-hotel-section="sales"]');

  if (!section || section.dataset.salesReady === 'true') return null;

  section.dataset.salesReady = 'true';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return null;

  const title = section.querySelector('.hotel-sales__title');
  const bars = [...section.querySelectorAll('.hotel-sales__bar')];
  const counters = [...section.querySelectorAll('[data-sales-counter]')];
  const labels = [...section.querySelectorAll('.hotel-sales__label')];

  gsap.set(title, { autoAlpha:0, y:34 });
  gsap.set(bars, {scaleY:0, transformOrigin:'50% 100%'});
  gsap.set(labels, { autoAlpha:0, y:22 });

  const counterStates = counters.map(counter => {
    const state = { value:0 };
    const prefix = counter.dataset.prefix ?? '';
    const suffix = counter.dataset.suffix ?? '';

    counter.textContent = '';

    return {
      counter,
      prefix,
      state,
      suffix,
      target:Number(counter.dataset.value)
    };
  });

  const timeline = gsap.timeline({
    defaults:{ease:'power2.out'},
    paused:true
  });

  timeline.to(title, { autoAlpha:1, y:0, duration:.26 }, 0);

  bars.forEach((bar, index) => {
    const start = .12 + index * .1;
    const counterState = counterStates[index];

    timeline.to(bar, {
      scaleY:1,
      duration:.58
    }, start);
    timeline.to(counterState.state, {
      value:counterState.target,
      duration:.5,
      ease:'power2.out',
      onUpdate:() => {
        const roundedValue = Math.round(counterState.state.value);
        counterState.counter.textContent = roundedValue > 0
          ? `${counterState.prefix}${roundedValue}${counterState.suffix}`
          : '';
      }
    }, start + .04);
    timeline.to(labels[index], { autoAlpha:1, y:0, duration:.34 }, start + .28);
  });

  timeline.progress(0).pause();

  const syncTimeline = self => {
    timeline.progress(self.progress).pause();
  };

  const salesTrigger = ScrollTrigger.create({
    trigger:section,
    start:'top 12%',
    end:'bottom bottom',
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
  window.setTimeout(refreshSalesRange, 420);

  return timeline;
}
