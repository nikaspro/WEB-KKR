import { gsap } from 'gsap';

const svgNamespace = 'http://www.w3.org/2000/svg';

const createSvgElement = (tagName, attributes = {}) => {
  const element = document.createElementNS(svgNamespace, tagName);
  Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
  return element;
};

export function mountHeroColorFlow(root, {reduced = false} = {}) {
  const svg = root?.querySelector('.hotel-hero-color-flow__svg');
  const defs = root?.querySelector('[data-flow-defs]');
  const linesRoot = root?.querySelector('[data-flow-lines]');
  if (!svg || !defs || !linesRoot) return null;

  const laneCount = 16;
  const geometry = createSvgElement('g', {id:'hotel-flow-geometry'});

  for (let index = 0; index < laneCount; index += 1) {
    const branch = index < laneCount / 2 ? 'left' : 'right';
    const branchIndex = index % (laneCount / 2);
    const spread = (branchIndex - 3.5) * 9;
    const direction = branch === 'left' ? -1 : 1;
    const startX = 260 + spread * .15;
    const endX = 260 - spread * .15;
    const arcX = 260 + direction * (104 + branchIndex * 8.5);
    const pathData = `M ${startX.toFixed(1)} 236 C ${arcX.toFixed(1)} 382, ${arcX.toFixed(1)} 618, ${endX.toFixed(1)} 764`;
    const gradientId = `hotel-flow-gradient-${index}`;
    const flowDuration = 3.9 + (branchIndex % 4) * .38;
    const flowDelay = -(branchIndex * .43 + (branch === 'right' ? .9 : 0));
    const gradient = createSvgElement('linearGradient', {
      id:gradientId,
      x1:'0',
      y1:'0',
      x2:'0',
      y2:'280',
      gradientUnits:'userSpaceOnUse',
      spreadMethod:'repeat'
    });

    const stops = branch === 'left'
      ? [
          ['0', 'hotel-flow-stop--blue-dim'],
          ['.24', 'hotel-flow-stop--blue'],
          ['.47', 'hotel-flow-stop--hot'],
          ['.66', 'hotel-flow-stop--blue'],
          ['1', 'hotel-flow-stop--blue-dim']
        ]
      : [
          ['0', 'hotel-flow-stop--purple-dim'],
          ['.24', 'hotel-flow-stop--purple'],
          ['.47', 'hotel-flow-stop--hot'],
          ['.66', 'hotel-flow-stop--purple'],
          ['1', 'hotel-flow-stop--purple-dim']
        ];

    stops.forEach(([offset, className]) => {
      gradient.append(createSvgElement('stop', {offset, class:className}));
    });

    if (!reduced) {
      gradient.append(createSvgElement('animateTransform', {
        attributeName:'gradientTransform',
        type:'translate',
        from:branch === 'left' ? '0 -280' : '0 280',
        to:branch === 'left' ? '0 280' : '0 -280',
        dur:`${flowDuration}s`,
        begin:`${flowDelay}s`,
        repeatCount:'indefinite'
      }));
    }

    defs.append(gradient);

    const lane = createSvgElement('g', {class:`hotel-flow-lane hotel-flow-lane--${branch}`});
    lane.style.setProperty('--hotel-flow-paint', `url(#${gradientId})`);
    lane.style.setProperty('--hotel-flow-lane-delay', `${(-index * .29).toFixed(2)}s`);
    lane.style.setProperty('--hotel-flow-lane-duration', `${(6.5 + (branchIndex % 4) * .58).toFixed(2)}s`);
    lane.style.setProperty('--hotel-flow-delay', `${(-branchIndex * .31).toFixed(2)}s`);
    lane.style.setProperty('--hotel-flow-breathe-duration', `${(2.7 + (branchIndex % 3) * .34).toFixed(2)}s`);
    lane.append(createSvgElement('path', {
      class:'hotel-flow-path',
      d:pathData,
      pathLength:'1'
    }));
    geometry.append(lane);
  }

  defs.append(geometry);

  const messages = [...root.querySelectorAll('.hotel-flow-dialogue-message')];
  let dialogueTimeline = null;

  if (!reduced && messages.length) {
    const messageInterval = 3.2;
    dialogueTimeline = gsap.timeline({repeat:-1, repeatDelay:.35});
    gsap.set(messages, {autoAlpha:0, y:18, scale:.78});

    messages.forEach((message, index) => {
      const start = index * messageInterval;
      const previousMessage = messages[index - 1];
      const rim = message.querySelector('.hotel-flow-dialogue-rim');
      const sheen = message.querySelector('.hotel-flow-dialogue-sheen');

      if (previousMessage) {
        dialogueTimeline.to(previousMessage, {
          opacity:.42,
          scale:.86,
          duration:.58,
          ease:'power2.out'
        }, start);
      }

      dialogueTimeline.to(message, {
        autoAlpha:1,
        y:0,
        scale:1.1,
        duration:.68,
        ease:'expo.out'
      }, start);

      if (rim) {
        dialogueTimeline.fromTo(rim, {strokeDashoffset:0}, {
          strokeDashoffset:-1,
          duration:2.5,
          ease:'none'
        }, start + .08);
      }

      if (sheen) {
        dialogueTimeline
          .set(sheen, {x:0, opacity:0}, start + .18)
          .to(sheen, {x:310, opacity:.9, duration:.62, ease:'power2.in'}, start + .18)
          .to(sheen, {x:720, opacity:0, duration:.72, ease:'power2.out'}, start + .8);
      }
    });

    dialogueTimeline.to(messages, {
      autoAlpha:0,
      y:-10,
      scale:.82,
      duration:.7,
      stagger:.06,
      ease:'power2.in'
    }, messages.length * messageInterval + .25);
  }

  return {
    pause:() => {
      svg.pauseAnimations?.();
      dialogueTimeline?.pause();
    },
    resume:() => {
      svg.unpauseAnimations?.();
      dialogueTimeline?.resume();
    }
  };
}
