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

  let typingTimeline = null;

  const prepareTypewriter = ({selector, start, duration, anchor = 'left'}) => {
    const typingCopy = root.querySelector(selector);
    const typingBubble = typingCopy?.closest('.hotel-flow-conversation');
    const typingShape = typingBubble?.querySelector('.hotel-flow-message-shape');
    if (!typingCopy || !typingBubble || !typingShape) return null;

    const message = typingCopy.textContent;
    const textX = Number(typingCopy.getAttribute('x'));
    const textY = Number(typingCopy.getAttribute('y'));
    const shapeX = Number(typingShape.getAttribute('x'));
    const finalWidth = Number(typingShape.getAttribute('width'));
    const rightEdge = shapeX + finalWidth;
    const minimumWidth = 96;
    const caret = createSvgElement('line', {
      class:'hotel-flow-typing-caret',
      x1:textX,
      x2:textX,
      y1:textY - 18,
      y2:textY + 18
    });
    const measure = typingCopy.cloneNode();
    const characterWidths = [0];

    measure.classList.remove('hotel-flow-message-copy--typing');
    measure.setAttribute('visibility', 'hidden');
    typingBubble.append(measure);
    typingBubble.append(caret);

    for (let count = 1; count <= message.length; count += 1) {
      measure.textContent = message.slice(0, count);
      characterWidths.push(measure.getComputedTextLength());
    }

    measure.remove();
    const fullTextWidth = characterWidths.at(-1) || 1;
    const horizontalPadding = textX - shapeX;
    const targetWidth = horizontalPadding * 2 + fullTextWidth;
    const typingState = {count:0};
    let visibleCharacterCount = -1;
    const renderTyping = () => {
      const nextCount = Math.min(message.length, Math.floor(typingState.count));
      if (nextCount === visibleCharacterCount) return;

      visibleCharacterCount = nextCount;
      const revealedWidth = characterWidths[nextCount];
      const bubbleWidth = minimumWidth + (targetWidth - minimumWidth) * (revealedWidth / fullTextWidth);
      const currentShapeX = anchor === 'right' ? rightEdge - bubbleWidth : shapeX;
      const currentTextX = currentShapeX + horizontalPadding;
      const caretX = currentTextX + revealedWidth;
      typingCopy.textContent = message.slice(0, nextCount);
      typingCopy.setAttribute('x', currentTextX.toFixed(1));
      typingShape.setAttribute('x', currentShapeX.toFixed(1));
      typingShape.setAttribute('width', bubbleWidth.toFixed(1));
      caret.setAttribute('x1', caretX.toFixed(1));
      caret.setAttribute('x2', caretX.toFixed(1));
    };

    return {duration, message, renderTyping, start, typingState, reset:() => {
      typingState.count = 0;
      visibleCharacterCount = -1;
      renderTyping();
    }};
  };

  if (!reduced) {
    const typewriters = [
      prepareTypewriter({
        selector:'.hotel-flow-field--flat .hotel-flow-message-copy--typing',
        start:.88,
        duration:2.86
      }),
      prepareTypewriter({
        selector:'.hotel-flow-field--flat .hotel-flow-message-copy--response',
        start:7.37,
        duration:2.2,
        anchor:'right'
      })
    ].filter(Boolean);

    if (!typewriters.length) {
      return {
        pause:() => svg.pauseAnimations?.(),
        resume:() => svg.unpauseAnimations?.()
      };
    }

    root.classList.add('is-typewriter-ready');
    typingTimeline = gsap.timeline({repeat:-1});
    typingTimeline.call(() => typewriters.forEach(typewriter => typewriter.reset()), [], 0);
    typewriters.forEach(typewriter => {
      typingTimeline.to(typewriter.typingState, {
        count:typewriter.message.length + .01,
        duration:typewriter.duration,
        ease:'none',
        onUpdate:typewriter.renderTyping
      }, typewriter.start);
    });
    typingTimeline.call(() => {}, [], 11);
  }

  return {
    pause:() => {
      svg.pauseAnimations?.();
      typingTimeline?.pause();
    },
    resume:() => {
      svg.unpauseAnimations?.();
      typingTimeline?.resume();
    }
  };
}
