import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAgentMessageGradients } from './agent-message-gradients.js';
import { initHotelSalesSection } from './sections/sales-section.js';

gsap.registerPlugin(ScrollTrigger);
initHotelSalesSection();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const destroyAgentMessageGradients = initAgentMessageGradients(document, {reduced});
const hero = document.querySelector('.hotels-hero .hero');
const heroTitle = document.getElementById('heroH1');
const heroCopy = document.getElementById('heroP');
const heroDownload = document.querySelector('.hero-download');
const scrollCue = document.querySelector('.hero-scroll');
const hotelAgentChat = document.querySelector('[data-hotel-agent-chat]');
const hotelAgentRequestMessage = hotelAgentChat?.querySelector('.hotel-agent-chat__message--agent');
const hotelAgentReplyMessage = hotelAgentChat?.querySelector('.hotel-agent-chat__message--hotel');
const hotelAgentRequestCopy = hotelAgentChat?.querySelector('[data-hotel-agent-request]');
const hotelAgentReplyCopy = hotelAgentChat?.querySelector('[data-hotel-agent-reply]');
const hotelEnergyLink = hotelAgentChat?.querySelector('[data-hotel-energy-link]');
const hotelEnergySvg = hotelEnergyLink?.querySelector('svg');
const hotelEnergyRequest = hotelAgentChat?.querySelector('[data-hotel-energy-request]');
const hotelEnergyReply = hotelAgentChat?.querySelector('[data-hotel-energy-reply]');
const hotelEnergyDots = [...(hotelAgentChat?.querySelectorAll('[data-hotel-energy-dots] i') ?? [])];
const heroBand = document.getElementById('heroBand');
const heroParticles = document.getElementById('heroParticles');
const heroCursorTrail = document.getElementById('heroCursorTrail');
document.body.classList.add('hotels-enhanced');

try {
  sessionStorage.setItem('luna:intro-seen', '1');
} catch (err) {
  // Страница остается рабочей, даже если браузер блокирует sessionStorage.
}

const hotelStaffDialogues = [
  {
    request:'Прилетаем в 8:30. Нужен ранний заезд и трансфер с детским креслом',
    requestPacket:'Ранний заезд и трансфер',
    replyPacket:'Номер и трансфер подтверждены',
    reply:'Готово. Номер будет готов к 9:00, водитель встретит вас в аэропорту'
  },
  {
    request:'Добавь на вечер ужин у окна и баню',
    requestPacket:'Ужин и баня на вечер',
    replyPacket:'Столик и баня подтверждены',
    reply:'Готово. Столик на 19:00 и баня на 20:30 добавлены в план'
  }
];
let hotelStaffDialogueTimeline = null;
let hotelStaffDialogueObserver = null;
let hotelEnergyGlassInstances = [];

function initHotelEnergyLiquidGlass() {
  if (typeof window.liquidGlass !== 'function') return;

  hotelEnergyGlassInstances = [hotelEnergyRequest, hotelEnergyReply]
    .filter(Boolean)
    .map(packet => window.liquidGlass(packet, {
      scale:-126,
      chroma:7,
      border:.09,
      mapBlur:16,
      blur:2,
      saturate:1.65,
      fallbackBlur:18
    }));
}

function addHotelEnergyJourney(timeline, packet, direction, start) {
  const travelSign = direction === 'down' ? 1 : -1;
  const activeClass = direction === 'down' ? 'is-request-active' : 'is-reply-active';
  const sourceY = () => direction === 'down'
    ? -innerHeight * .18
    : innerHeight * .28;
  const targetY = () => direction === 'down'
    ? innerHeight * .28
    : -innerHeight * .18;

  timeline
    .set(packet, {
      autoAlpha:0,
      y:sourceY,
      scale:.3,
      scaleX:.72,
      scaleY:1.22,
      rotation:direction === 'down' ? -3 : 4,
      filter:'blur(7px)'
    }, start)
    .call(() => {
      hotelEnergyLink.classList.remove('is-request-active', 'is-reply-active');
      hotelEnergyLink.classList.add('is-packet-active', activeClass);
    }, null, start)
    .to(packet, {
      autoAlpha:1,
      scale:.9,
      scaleX:.86,
      scaleY:1.16,
      filter:'blur(2px)',
      duration:.16,
      ease:'power3.out'
    }, start)
    .to(packet, {
      y:-travelSign * 34,
      scale:1,
      scaleX:1,
      scaleY:1,
      rotation:direction === 'down' ? -.7 : 1.1,
      filter:'blur(0px)',
      duration:.7,
      ease:'expo.out'
    }, start + .08)
    .to(packet, {
      y:travelSign * 34,
      duration:.46,
      ease:'sine.inOut'
    }, start + .78)
    .to(packet, {
      autoAlpha:0,
      y:targetY,
      scale:.14,
      scaleX:.64,
      scaleY:1.38,
      rotation:direction === 'down' ? 3.5 : -4.5,
      filter:'blur(8px)',
      duration:.58,
      ease:'expo.in'
    }, start + 1.24)
    .call(() => hotelEnergyLink.classList.remove('is-packet-active', activeClass), null, start + 1.88);

  const particleLanes = [
    [-216,-92],[-174,36],[-138,-28],[-104,92],[-70,-76],[-38,46],
    [-8,-110],[22,82],[54,-42],[86,16],[116,-92],[146,74],
    [176,-18],[202,104],[-190,118],[-118,-126],[72,126],[158,-132]
  ];

  hotelEnergyDots.forEach((dot, index) => {
    const [laneX, laneY] = particleLanes[index % particleLanes.length];
    const delay = (index % 6) * .018;
    const dotOpacity = .46 + (index % 4) * .13;

    timeline
      .set(dot, {
        autoAlpha:0,
        x:laneX * 1.45,
        y:() => sourceY() + laneY * .28,
        scale:.25,
        scaleX:.5,
        scaleY:2.2,
        filter:'blur(4px)'
      }, start + delay)
      .to(dot, {
        autoAlpha:dotOpacity,
        scale:.82,
        scaleX:.72,
        scaleY:1.75,
        filter:'blur(1.5px)',
        duration:.15,
        ease:'power3.out'
      }, start + delay)
      .to(dot, {
        x:laneX,
        y:-travelSign * 42 + laneY * .34,
        scale:1,
        scaleX:1,
        scaleY:1,
        filter:'blur(0px)',
        duration:.7,
        ease:'expo.out'
      }, start + .08 + delay)
      .to(dot, {
        x:laneX * .92,
        y:travelSign * 42 + laneY * .22,
        duration:.46,
        ease:'sine.inOut'
      }, start + .78 + delay)
      .to(dot, {
        autoAlpha:0,
        x:laneX * .38,
        y:() => targetY() + laneY * .12,
        scale:.08,
        scaleX:.42,
        scaleY:2.8,
        filter:'blur(5px)',
        duration:.58,
        ease:'expo.in'
      }, start + 1.24 + delay);
  });
}

function destroyHotelStaffDialogue() {
  hotelStaffDialogueObserver?.disconnect();
  hotelStaffDialogueObserver = null;
  hotelStaffDialogueTimeline?.kill();
  hotelStaffDialogueTimeline = null;
  hotelEnergyGlassInstances.forEach(instance => instance.destroy());
  hotelEnergyGlassInstances = [];
  hotelEnergyLink?.classList.remove('is-packet-active', 'is-request-active', 'is-reply-active');
}

if (
  hotelAgentChat
  && hotelAgentRequestMessage
  && hotelAgentReplyMessage
  && hotelAgentRequestCopy
  && hotelAgentReplyCopy
  && hotelEnergyLink
  && hotelEnergyRequest
  && hotelEnergyReply
) {
  const [arrivalDialogue, eveningDialogue] = hotelStaffDialogues;
  initHotelEnergyLiquidGlass();

  const addDialogueScene = (timeline, dialogue, start) => {
    timeline
      .call(() => {
        hotelAgentRequestCopy.textContent = dialogue.request;
        hotelAgentReplyCopy.textContent = dialogue.reply;
        hotelEnergyRequest.querySelector('p').textContent = dialogue.requestPacket;
        hotelEnergyReply.querySelector('p').textContent = dialogue.replyPacket;
      }, null, start)
      .set(hotelAgentRequestMessage, {
        autoAlpha:1,
        y:0,
        scale:1,
        transformOrigin:'50% 50%'
      }, start)
      .set(hotelAgentReplyMessage, {autoAlpha:0, y:0, scale:1}, start)
      .set([hotelEnergyRequest, hotelEnergyReply], {autoAlpha:0}, start)
      .to(hotelAgentRequestMessage, {
        scale:.985,
        duration:.16,
        ease:'power2.inOut'
      }, start + 1.14)
      .to(hotelAgentRequestMessage, {
        scale:1,
        duration:.38,
        ease:'back.out(2.1)'
      }, start + 1.3);

    addHotelEnergyJourney(timeline, hotelEnergyRequest, 'down', start + 1.22);

    timeline
      .fromTo(hotelAgentReplyMessage,
        {autoAlpha:0, y:18, scale:.96},
        {autoAlpha:1, y:0, scale:1, duration:.5, ease:'power3.out'},
        start + 3.26
      )
      .to(hotelAgentReplyMessage, {
        scale:.985,
        duration:.16,
        ease:'power2.inOut'
      }, start + 4.18)
      .to(hotelAgentReplyMessage, {
        scale:1,
        duration:.38,
        ease:'back.out(2.1)'
      }, start + 4.34);

    addHotelEnergyJourney(timeline, hotelEnergyReply, 'up', start + 4.26);

    timeline.to([hotelAgentRequestMessage, hotelAgentReplyMessage], {
      autoAlpha:0,
      y:-14,
      duration:.48,
      ease:'power2.in'
    }, start + 7.86);
  };

  if (reduced) {
    hotelEnergySvg?.pauseAnimations?.();
    gsap.set([hotelAgentRequestMessage, hotelAgentReplyMessage], {
      autoAlpha:1,
      y:0,
      scale:1
    });
    gsap.set([hotelEnergyRequest, hotelEnergyReply, ...hotelEnergyDots], {autoAlpha:0});
    hotelAgentRequestCopy.textContent = arrivalDialogue.request;
    hotelAgentReplyCopy.textContent = arrivalDialogue.reply;
  } else {
    hotelStaffDialogueTimeline = gsap.timeline({
      repeat:-1,
      repeatDelay:0
    })
      .set(hotelAgentChat, {autoAlpha:1}, 0)
      .set(hotelEnergyDots, {autoAlpha:0}, 0);

    addDialogueScene(hotelStaffDialogueTimeline, arrivalDialogue, 0);
    addDialogueScene(hotelStaffDialogueTimeline, eveningDialogue, 8.62);
    hotelStaffDialogueTimeline.to({}, {duration:.28}, 17.24);

    hotelStaffDialogueObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        hotelEnergySvg?.unpauseAnimations?.();
        hotelStaffDialogueTimeline?.resume();
      } else {
        hotelEnergySvg?.pauseAnimations?.();
        hotelStaffDialogueTimeline?.pause();
      }
    }, {threshold:.01});
    hotelStaffDialogueObserver.observe(hotelAgentChat);
  }

  addEventListener('pagehide', destroyHotelStaffDialogue, {once:true});
}

if (!reduced) {
  gsap.from([heroTitle, heroCopy], {
    y:24,
    autoAlpha:0,
    duration:1,
    stagger:.12,
    ease:'expo.out'
  });
  gsap.from(heroDownload, {
    y:12,
    autoAlpha:0,
    duration:.6,
    delay:.5,
    ease:'power3.out'
  });
  gsap.from(scrollCue, {
    y:12,
    autoAlpha:0,
    duration:.6,
    delay:.57,
    ease:'power3.out'
  });
  gsap.from(hotelAgentChat, {
    x:48,
    scale:.95,
    autoAlpha:0,
    duration:1.1,
    delay:.16,
    ease:'expo.out'
  });
  const arrow = scrollCue?.querySelector('.scroll-chevron');
  if (arrow) {
    gsap.timeline({repeat:-1, repeatDelay:.42})
      .to(arrow, {y:-1, scaleX:1.15, scaleY:.68, duration:.16, ease:'power2.in'})
      .to(arrow, {y:0, scaleX:1, scaleY:1, duration:.78, ease:'elastic.out(1.25,.28)'});
  }
}

function buildHeroTransition() {
  if (reduced || !hero || !hotelAgentChat) return;

  const timeline = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:'.hotels-hero',
      start:'top top',
      end:'+=110%',
      scrub:.68,
      pin:true,
      pinSpacing:true,
      anticipatePin:1,
      invalidateOnRefresh:true
    }
  });

  timeline
    .to(hero, {
      autoAlpha:0,
      y:-60,
      duration:.28,
      overwrite:'auto'
    }, 0)
    .to([heroBand, heroParticles, heroCursorTrail], {
      autoAlpha:0,
      y:-90,
      duration:.48,
      overwrite:'auto'
    }, .08)
    .to(hotelAgentChat, {
      autoAlpha:0,
      x:() => innerWidth * .32,
      scale:1.12,
      rotation:3,
      duration:.58,
      ease:'power2.in',
      overwrite:'auto'
    }, .04);
}

buildHeroTransition();

scrollCue?.addEventListener('click', () => {
  document.getElementById('analysis')?.scrollIntoView({behavior:reduced ? 'auto' : 'smooth'});
});

const analysis = document.querySelector('.hotel-analysis');
const analysisStage = analysis?.querySelector('.hotel-analysis__stage');
const analysisContent = analysis?.querySelector('.hotel-analysis__content');
const analysisResultWave = analysis?.querySelector('[data-hotel-result-wave]');
const pageGradientHost = document.querySelector('[data-neat-gradient-host]');
const analysisPrompt = document.querySelector('.hotel-analysis__prompt');
const analysisForm = document.getElementById('hotelForm');
const analysisShell = analysisForm?.querySelector('.hotel-url__shell');
const hotelUrlInput = document.getElementById('hotelUrl');
const analysisRipple = document.querySelector('[data-hotel-url-ripple]');
const analysisStatusesRegion = document.querySelector('.hotel-analysis__statuses');
const analysisStatus = document.querySelector('.hotel-analysis__status');
const analysisFinalStatus = analysisStatus;
const analysisGlassPieces = gsap.utils.toArray('.hotel-analysis__glass-piece');
const analysisCardParallaxLayers = gsap.utils.toArray('.hotel-analysis-card-anchor');
const analysisStatusSteps = [
  {text:'Думаю', scale:1.32, rimDuration:2.2, rotation:-1.2},
  {text:'Открываю сайт', scale:1.68, rimDuration:1.75, rotation:1.25},
  {text:'Изучаю страницы', scale:2.04, rimDuration:1.35, rotation:-1.4},
  {text:'Собираю главное', scale:2.40, rimDuration:1, rotation:1.15},
  {text:'Все собрал', scale:2.78, rimDuration:.78, rotation:-.8}
];
const hotelUrlPreset = hotelUrlInput?.value || 'my-hotel.ru';
const hotelPillMeasureCanvas = document.createElement('canvas');
const hotelPillMeasureContext = hotelPillMeasureCanvas.getContext('2d');
const HOTEL_PILL_MIN_WIDTH = 280;
const HOTEL_PILL_MAX_WIDTH = 1080;
let unmountPageGradient = null;
let pageGradientActivation = null;
let pageIsLeaving = false;
let pageGradientLatched = false;
let pageGradientShouldBeVisible = false;
let pageGradientSuspendTimer = 0;
let pageGradientModule = null;
let analysisSequence = null;
let analysisReveal = null;
let analysisGradientTimer = 0;
let analysisExperience = null;
let analysisFlowStarted = false;
let analysisResultWaveTimeline = null;
let analysisFinalEffectTime = Number.POSITIVE_INFINITY;
let analysisFinalEffectReached = false;

function playAnalysisResultWave() {
  if (reduced || !analysisResultWave) return;
  analysisResultWaveTimeline?.kill();
  gsap.set(analysisResultWave, {autoAlpha:0});
  analysisResultWaveTimeline = gsap.timeline({
    onComplete:() => {
      gsap.set(analysisResultWave, {autoAlpha:0});
      analysisResultWaveTimeline = null;
    }
  })
    .to(analysisResultWave, {
      autoAlpha:.78,
      duration:1.05,
      ease:'sine.inOut'
    })
    .to({}, {duration:1.35})
    .to(analysisResultWave, {
      autoAlpha:0,
      duration:1.45,
      ease:'sine.inOut'
    });
}

function resetAnalysisResultWave() {
  analysisResultWaveTimeline?.kill();
  analysisResultWaveTimeline = null;
  if (analysisResultWave) gsap.set(analysisResultWave, {autoAlpha:0});
}

function syncAnalysisFinalEffect() {
  if (!analysisSequence || !Number.isFinite(analysisFinalEffectTime)) return;
  const finalEffectReached = analysisSequence.time() >= analysisFinalEffectTime - .01;
  analysis?.classList.toggle('is-analysis-final', finalEffectReached);

  if (finalEffectReached && !analysisFinalEffectReached) {
    analysisFinalEffectReached = true;
    playAnalysisResultWave();
    return;
  }

  if (!finalEffectReached) analysisFinalEffectReached = false;
}

if (!reduced
  && analysisStage
  && analysisCardParallaxLayers.length
  && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const parallaxDepths = [56, 48, 68, 52, 60];
  const parallaxControllers = analysisCardParallaxLayers.map((layer, index) => {
    const depth = parallaxDepths[index] || 24;
    gsap.set(layer, {
      transformPerspective:700,
      transformOrigin:'50% 50%',
      force3D:true
    });
    return {
      depth,
      x:gsap.quickTo(layer, 'x', {duration:.62, ease:'power3.out'}),
      y:gsap.quickTo(layer, 'y', {duration:.68, ease:'power3.out'}),
      rotationX:gsap.quickTo(layer, 'rotationX', {duration:.72, ease:'power3.out'}),
      rotationY:gsap.quickTo(layer, 'rotationY', {duration:.72, ease:'power3.out'})
    };
  });

  const resetAnalysisCardParallax = () => {
    parallaxControllers.forEach(controller => {
      controller.x(0);
      controller.y(0);
      controller.rotationX(0);
      controller.rotationY(0);
    });
  };

  const updateAnalysisCardParallax = event => {
    const rect = analysisStage.getBoundingClientRect();
    const finalSceneIsVisible = analysis?.classList.contains('is-analysis-final')
      && rect.bottom > 0
      && rect.top < innerHeight;

    if (!finalSceneIsVisible) {
      resetAnalysisCardParallax();
      return;
    }

    const pointerX = gsap.utils.clamp(-1, 1, ((event.clientX - rect.left) / rect.width - .5) * 2);
    const pointerY = gsap.utils.clamp(-1, 1, ((event.clientY - rect.top) / rect.height - .5) * 2);

    parallaxControllers.forEach(controller => {
      controller.x(-pointerX * controller.depth);
      controller.y(-pointerY * controller.depth * .34);
      controller.rotationX(pointerY * 5.6);
      controller.rotationY(-pointerX * 7.6);
    });
  };

  addEventListener('pointermove', updateAnalysisCardParallax, {passive:true, capture:true});
  addEventListener('blur', resetAnalysisCardParallax);
  document.documentElement.addEventListener('pointerleave', resetAnalysisCardParallax);
}

function measureHotelPillText(text, sourceElement) {
  if (!hotelPillMeasureContext || !hotelUrlInput) return 0;
  const style = getComputedStyle(sourceElement || hotelUrlInput);
  hotelPillMeasureContext.font = [
    style.fontStyle,
    style.fontVariant,
    style.fontWeight,
    style.fontSize,
    style.fontFamily
  ].join(' ');
  if ('fontStretch' in hotelPillMeasureContext) {
    hotelPillMeasureContext.fontStretch = style.fontStretch;
  }
  const letterSpacing = Number.parseFloat(style.letterSpacing) || 0;
  return hotelPillMeasureContext.measureText(text).width + Math.max(0, text.length - 1) * letterSpacing;
}

function getHotelPillWidth(text, sourceElement = hotelUrlInput) {
  if (!analysisForm || !hotelUrlInput) return HOTEL_PILL_MAX_WIDTH;
  const inputStyle = getComputedStyle(hotelUrlInput);
  const horizontalPadding =
    (Number.parseFloat(inputStyle.paddingLeft) || 0) +
    (Number.parseFloat(inputStyle.paddingRight) || 0) + 4;
  const availableWidth = Math.min(HOTEL_PILL_MAX_WIDTH, analysisForm.parentElement?.clientWidth || HOTEL_PILL_MAX_WIDTH);
  return Math.ceil(gsap.utils.clamp(
    Math.min(HOTEL_PILL_MIN_WIDTH, availableWidth),
    availableWidth,
    measureHotelPillText(text, sourceElement) + horizontalPadding
  ));
}

function getStatusPillWidth(text, sourceElement, visualScale = 1) {
  if (!analysisForm) return HOTEL_PILL_MAX_WIDTH;
  const visibleWidth = analysisForm.parentElement?.clientWidth || HOTEL_PILL_MAX_WIDTH;
  const maxScale = analysisStatusSteps[analysisStatusSteps.length - 1]?.scale || 1;
  return Math.ceil(Math.min(400, visibleWidth / maxScale));
}

function getStatusTextScale(text, sourceElement, pillScale = 1) {
  const scale = Math.max(pillScale, .001);
  const pillWidth = getStatusPillWidth(text, sourceElement, scale) * scale;
  const sidePadding = gsap.utils.clamp(38, 58, innerWidth * .03);
  const visualSidePadding = sidePadding * scale;
  const availableTextWidth = Math.max(1, pillWidth - visualSidePadding * 2);
  const textWidth = Math.max(1, measureHotelPillText(text, sourceElement));
  return Math.min(scale, availableTextWidth / textWidth);
}

if (!reduced && analysis) {
  hotelUrlInput.value = hotelUrlPreset;
  gsap.set(hotelUrlInput, {
    color:'#fff',
    textShadow:'none'
  });
  gsap.set(analysisForm, {
    pointerEvents:'none',
    rotation:0,
    width:() => getHotelPillWidth(hotelUrlPreset)
  });
  gsap.set(analysisPrompt, {autoAlpha:0});
  if (analysisRipple) gsap.set(analysisRipple, {width:() => getHotelPillWidth(hotelUrlPreset)});

  if (analysisContent) {
    gsap.set(analysisContent, {y:0});
  }

  analysisReveal = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:analysis,
      start:'top top',
      end:() => `+=${Math.round(innerHeight * .68)}`,
      scrub:true,
      invalidateOnRefresh:true
    }
  });

  const syncAnalysisCentered = centered => {
    analysis.classList.toggle('is-analysis-centered', centered);
  };

  ScrollTrigger.create({
    trigger:analysis,
    start:'top top',
    end:'bottom bottom',
    invalidateOnRefresh:true,
    onEnter:() => syncAnalysisCentered(true),
    onEnterBack:() => syncAnalysisCentered(true),
    onLeaveBack:() => syncAnalysisCentered(false),
    onRefresh:self => syncAnalysisCentered(self.scroll() >= self.start)
  });

  analysisReveal
    .to(analysisPrompt,
      {autoAlpha:1, duration:.40, ease:'sine.out'},
      0
    )
    .to(analysisForm, {
      duration:.34,
      onStart:() => {
        void scheduleAnalysisBackdrop();
      },
      onComplete:() => {
        gsap.set(analysisForm, {pointerEvents:'auto'});
      },
      onReverseComplete:() => {
        gsap.set(analysisForm, {pointerEvents:'none'});
      }
    }, .46);
  analysisReveal.eventCallback('onComplete', startAnalysisAfterBackdrop);
} else if (analysis) {
  ScrollTrigger.create({
    trigger:analysis,
    start:'top 70%',
    once:true,
    onEnter:startAnalysisAfterBackdrop
  });
}

async function activatePageGradient({reveal = true} = {}) {
  if (!pageGradientHost || pageIsLeaving) return false;
  if (pageGradientActivation) {
    const mounted = await pageGradientActivation;
    if (mounted && reveal && !pageIsLeaving) setPageGradientVisible(pageGradientShouldBeVisible);
    return mounted;
  }

  pageGradientModule ||= import('./page-gradient.js');
  pageGradientActivation = pageGradientModule
    .then(({ mountPageGradient }) => {
      if (pageIsLeaving) return;
      unmountPageGradient = mountPageGradient(pageGradientHost, { reduced });
      if (!unmountPageGradient) return false;
      pageGradientLatched = true;
      pageGradientHost.dataset.neatReady = 'true';
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
        resolve(!pageIsLeaving);
      })));
    })
    .catch(error => {
      pageGradientActivation = null;
      console.warn('Не удалось запустить NeatGradient.', error);
      return false;
    });

  const mounted = await pageGradientActivation;
  if (mounted && reveal && !pageIsLeaving) setPageGradientVisible(pageGradientShouldBeVisible);
  return mounted;
}

function prewarmPageGradient() {
  if (reduced || pageIsLeaving || pageGradientActivation) return;
  void activatePageGradient({reveal:false}).then(mounted => {
    if (!mounted || analysisFlowStarted || pageIsLeaving) return;
    document.body.classList.add(
      'hotel-neat-gradient-active',
      'hotel-neat-gradient-hidden',
      'hotel-neat-gradient-suspended'
    );
    unmountPageGradient?.pause?.();
  });
}

const schedulePageGradientPrewarm = () => {
  setTimeout(prewarmPageGradient, 180);
};

if (document.readyState === 'complete') schedulePageGradientPrewarm();
else addEventListener('load', schedulePageGradientPrewarm, {once:true});

function runAnalysisSequence() {
  analysisFinalEffectTime = Number.POSITIVE_INFINITY;
  analysisFinalEffectReached = false;
  analysis?.classList.remove('is-analysis-final');
  resetAnalysisResultWave();
  gsap.set(hotelUrlInput, {color:'#fff', textShadow:'none'});

  analysis?.classList.add('is-submitted');
  analysisForm.dataset.submitting = 'true';
  analysisForm.setAttribute('aria-busy', 'true');
  hotelUrlInput.readOnly = true;
  hotelUrlInput.tabIndex = -1;

  if (reduced) {
    gsap.set(analysisPrompt, {autoAlpha:0});
    analysis?.classList.add('is-prompt-hidden');
  } else {
    gsap.to(analysisPrompt, {
      autoAlpha:0,
      duration:.28,
      ease:'power2.out',
      onComplete:() => analysis?.classList.add('is-prompt-hidden')
    });
  }

  const statusStart = .32;
  const statusStep = 1.02;
  const finalStatusIndex = analysisStatusSteps.length - 1;
  const finalStatusStart = statusStart + finalStatusIndex * statusStep;
  let activeAnalysisStatusIndex = -1;
  let analysisBusyState = true;
  const showStatus = index => {
    const step = analysisStatusSteps[index];
    if (!analysisStatus || !step || index === activeAnalysisStatusIndex) return;
    activeAnalysisStatusIndex = index;
    analysisStatus.textContent = step.text;
    analysisStatus.dataset.status = String(index);
    analysisStatus.classList.toggle('is-final', index === finalStatusIndex);
    analysisStatus.setAttribute('aria-hidden', 'false');
    analysisStatusesRegion?.setAttribute('aria-label', step.text);
  };
  const setAnalysisSequenceActive = active => {
    analysis?.classList.toggle('is-analysis-sequence-active', active);
    if (active) return;

    activeAnalysisStatusIndex = -1;
    analysisBusyState = false;
    analysisStatus?.setAttribute('aria-hidden', 'true');
    analysisStatus?.classList.remove('is-final');
    analysisStatusesRegion?.removeAttribute('aria-label');
    analysisForm.setAttribute('aria-busy', 'false');
  };

  if (reduced) {
    setAnalysisSequenceActive(true);
    const finalStep = analysisStatusSteps[finalStatusIndex];
    showStatus(finalStatusIndex);
    gsap.set(analysisForm, {
      autoAlpha:1,
      pointerEvents:'none',
      width:() => getStatusPillWidth(finalStep.text, analysisStatus, finalStep.scale),
      scale:finalStep.scale,
      rotation:finalStep.rotation,
      force3D:false
    });
    gsap.set(hotelUrlInput, {color:'transparent', caretColor:'transparent'});
    gsap.set(analysisStatus, {
      autoAlpha:1,
      y:0,
      scale:() => getStatusTextScale(finalStep.text, analysisStatus, finalStep.scale),
      rotation:finalStep.rotation,
      force3D:false
    });
    analysis?.classList.add('is-analysis-final');
    analysisForm.setAttribute('aria-busy', 'false');
    return;
  }

  gsap.set(analysisStatus, {
    autoAlpha:0,
    y:0,
    scale:1,
    rotation:0,
    force3D:false,
    transformOrigin:'50% 50%'
  });
  gsap.set(analysisGlassPieces, {
    autoAlpha:0,
    x:0,
    y:0,
    scale:.18,
    rotation:0,
    transformOrigin:'50% 50%'
  });
  gsap.set(analysisResultWave, {
    autoAlpha:0
  });
  gsap.set(analysisForm, {pointerEvents:'none'});
  analysisSequence = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:analysis,
      start:() => `top+=${Math.round(innerHeight * .62)} top`,
      end:'bottom bottom',
      scrub:true,
      invalidateOnRefresh:true,
      onEnter:() => {
        setAnalysisSequenceActive(true);
        analysis?.classList.add('is-prompt-hidden');
        gsap.set(analysisPrompt, {autoAlpha:0});
      },
      onEnterBack:() => {
        setAnalysisSequenceActive(true);
        analysis?.classList.add('is-prompt-hidden');
        gsap.set(analysisPrompt, {autoAlpha:0});
      },
      onLeaveBack:() => {
        setAnalysisSequenceActive(false);
        analysis?.classList.remove('is-prompt-hidden');
        gsap.set(analysisPrompt, {autoAlpha:1});
      },
      onRefresh:self => {
        setAnalysisSequenceActive(self.progress > 0);
        requestAnimationFrame(syncAnalysisFinalEffect);
      },
      onUpdate:self => {
        syncAnalysisFinalEffect();
        if (self.progress <= 0) {
          setAnalysisSequenceActive(false);
          return;
        }
        setAnalysisSequenceActive(true);
        const activeIndex = Math.min(
          finalStatusIndex,
          Math.max(0, Math.floor((analysisSequence.time() - statusStart) / statusStep))
        );
        showStatus(activeIndex);
        const nextBusyState = self.progress < .985;
        if (nextBusyState !== analysisBusyState) {
          analysisBusyState = nextBusyState;
          analysisForm.setAttribute('aria-busy', String(nextBusyState));
        }
      }
    }
  })
    .to(hotelUrlInput, {
      color:'rgba(255,255,255,0)',
      caretColor:'transparent',
      duration:.22,
      ease:'power2.out'
    }, 0)
    .to(analysisForm, {
      scale:1,
      duration:.38,
      ease:'power2.out'
    }, 0);

  analysisFinalEffectTime = finalStatusStart;

  analysisSequence.to(analysisStatus, {
    autoAlpha:1,
    duration:.01,
    ease:'none'
  }, statusStart);

  analysisStatusSteps.forEach((step, index) => {
    const at = statusStart + index * statusStep;
    const morphAt = Math.max(.08, at - .24);

    analysisSequence
      .set(analysisShell, {
        '--hotel-rim-duration':`${step.rimDuration}s`
      }, morphAt)
      .to(analysisForm, {
        width:() => getStatusPillWidth(step.text, analysisStatus, step.scale),
        scale:step.scale,
        rotation:step.rotation,
        force3D:false,
        duration:.72,
        ease:'sine.inOut'
      }, morphAt)
      .to(analysisStatus, {
        y:0,
        scale:() => getStatusTextScale(step.text, analysisStatus, step.scale),
        rotation:step.rotation,
        force3D:false,
        duration:.72,
        ease:'sine.inOut'
      }, morphAt);
  });

  analysisSequence
    .to(analysisStatus, {
      autoAlpha:0,
      duration:.32,
      ease:'sine.inOut'
    }, finalStatusStart - .34)
    .to(analysisStatus, {
      autoAlpha:1,
      duration:.48,
      ease:'sine.inOut'
    }, finalStatusStart + .02);

  const cardFlightX = Math.min(500, innerWidth * .31);
  const cardFlightY = Math.min(230, innerHeight * .24);
  const wideCardFlightX = Math.min(560, innerWidth * .36);
  const glassFlights = [
    {x:-cardFlightX,y:-cardFlightY,rotation:-12,scale:1.18},
    {x:cardFlightX,y:-cardFlightY * .92,rotation:12,scale:.88},
    {x:0,y:cardFlightY * 1.25,rotation:-2.5,scale:1.06},
    {x:-wideCardFlightX,y:cardFlightY * .78,rotation:6.5,scale:.9},
    {x:wideCardFlightX,y:cardFlightY * .68,rotation:-7,scale:1.2}
  ];

  if (analysisGlassPieces.length) {
    analysisSequence.fromTo(analysisGlassPieces,
      {
        autoAlpha:0,
        x:index => (glassFlights[index]?.x || 0) * .58,
        y:index => (glassFlights[index]?.y || 0) * .58,
        scale:.76,
        rotation:index => (glassFlights[index]?.rotation || 0) * .58
      },
      {
        autoAlpha:1,
        x:index => glassFlights[index]?.x || 0,
        y:index => glassFlights[index]?.y || 0,
        scale:index => glassFlights[index]?.scale || 1,
        rotation:index => glassFlights[index]?.rotation || 0,
        duration:.3,
        stagger:.018,
        ease:'power3.out'
      },
      analysisFinalEffectTime
    );
  }

  analysisSequence.to({}, {duration:.92}, finalStatusStart + .865);

  requestAnimationFrame(() => {
    analysisSequence?.scrollTrigger?.update();
    syncAnalysisFinalEffect();
  });
}

function startAnalysisFlow() {
  if (analysisFlowStarted || pageIsLeaving) return;
  analysisFlowStarted = true;
  analysisReveal?.scrollTrigger?.kill();
  analysisReveal?.kill();
  analysisReveal = null;
  runAnalysisSequence();
}

function playAnalysisRipple() {
  if (reduced || !analysisRipple) return;
  analysisRipple.classList.remove('is-rippling');
  void analysisRipple.offsetWidth;
  analysisRipple.classList.add('is-rippling');
}

function scheduleAnalysisBackdrop() {
  if (pageIsLeaving) return Promise.resolve(false);
  if (analysisExperience) return analysisExperience;

  playAnalysisRipple();
  analysisExperience = (async () => {
    if (!reduced) {
      await new Promise(resolve => {
        analysisGradientTimer = setTimeout(() => {
          analysisGradientTimer = 0;
          resolve();
        }, 150);
      });
    }

    return activatePageGradient();
  })();

  return analysisExperience;
}

function startAnalysisAfterBackdrop() {
  void scheduleAnalysisBackdrop().then(mounted => {
    if (mounted) startAnalysisFlow();
  });
}

function setPageGradientVisible(visible) {
  pageGradientShouldBeVisible = visible;
  if (!pageGradientLatched || pageIsLeaving) return;

  if (pageGradientSuspendTimer) clearTimeout(pageGradientSuspendTimer);
  pageGradientSuspendTimer = 0;
  document.body.classList.add('hotel-neat-gradient-active');

  if (visible) {
    unmountPageGradient?.resume?.();
    document.body.classList.remove('hotel-neat-gradient-suspended');
  } else {
    pageGradientSuspendTimer = setTimeout(() => {
      pageGradientSuspendTimer = 0;
      if (!pageGradientShouldBeVisible && !pageIsLeaving) {
        document.body.classList.add('hotel-neat-gradient-suspended');
        unmountPageGradient?.pause?.();
      }
    }, 1650);
  }

  document.body.classList.toggle('hotel-neat-gradient-hidden', !visible);
}

analysisRipple?.addEventListener('animationend', () => {
  analysisRipple.classList.remove('is-rippling');
});

function destroyPageGradient() {
  pageIsLeaving = true;
  if (analysisGradientTimer) clearTimeout(analysisGradientTimer);
  analysisGradientTimer = 0;
  if (pageGradientSuspendTimer) clearTimeout(pageGradientSuspendTimer);
  pageGradientSuspendTimer = 0;
  document.body.classList.remove('hotel-neat-gradient-active');
  document.body.classList.remove('hotel-neat-gradient-hidden');
  document.body.classList.remove('hotel-neat-gradient-suspended');
  if (!pageGradientLatched) return;
  unmountPageGradient?.();
  unmountPageGradient = null;
  pageGradientLatched = false;
}

function destroyHotelGradients() {
  resetAnalysisResultWave();
  destroyPageGradient();
  destroyAgentMessageGradients();
}

addEventListener('pagehide', event => {
  if (event.persisted || document.visibilityState !== 'hidden') return;
  destroyHotelGradients();
});
addEventListener('beforeunload', destroyHotelGradients, {once:true});

function normalizeHotelUrl(value) {
  return value.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

analysisForm?.addEventListener('submit', event => {
  event.preventDefault();
  const normalized = normalizeHotelUrl(hotelUrlInput.value);
  if (!normalized) {
    hotelUrlInput.focus();
    return;
  }
  hotelUrlInput.value = normalized;
  startAnalysisAfterBackdrop();
});

hotelUrlInput?.addEventListener('keydown', event => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  analysisForm?.requestSubmit();
});

const dialogue = document.querySelector('[data-block="4"]');
const dialogueMessages = dialogue ? [...dialogue.querySelectorAll('.hotel-message')] : [];
const dialogueRows = dialogue ? [...dialogue.querySelectorAll('.hotel-message-row')] : [];
const dialogueAvatarRail = dialogue?.querySelector('[data-dialogue-avatar-rail]');
const dialogueSignalColor = 'rgba(255,255,255,.52)';
const storyHeading = document.querySelector('.hotel-story-heading');
const storyHeadingTitle = storyHeading?.querySelector('.hotel-story-heading__title');
const storyHeadingPrimary = storyHeading?.querySelector('.hotel-story-heading__part--primary');
const storyHeadingSecondary = storyHeading?.querySelector('.hotel-story-heading__part--secondary');

if (storyHeading && storyHeadingTitle && storyHeadingPrimary && storyHeadingSecondary) {
  if (reduced) {
    gsap.set([storyHeadingPrimary, storyHeadingSecondary], {autoAlpha:1});
  } else {
    gsap.set(storyHeadingPrimary, {autoAlpha:1});
    gsap.set(storyHeadingSecondary, {autoAlpha:0});
  }
}

dialogueMessages.forEach(message => {
  if (message.querySelector('.hotel-message__signal')) {
    message.classList.add('has-signal');
  }
});

function syncSingleLineMessages() {
  dialogueMessages.forEach(message => {
    const copy = message.querySelector('p');
    if (!copy || !message.classList.contains('hotel-message--user')) return;
    const lineHeight = Number.parseFloat(getComputedStyle(copy).lineHeight);
    const isSingleLine = Number.isFinite(lineHeight) && copy.scrollHeight <= lineHeight * 1.25;
    message.classList.toggle('is-single-line', isSingleLine);
  });
}

let dialogueLayoutFrame = 0;
function syncDialogueMessageLayout() {
  cancelAnimationFrame(dialogueLayoutFrame);
  dialogueMessages.forEach(message => message.style.removeProperty('width'));

  if (innerWidth <= 900) {
    syncSingleLineMessages();
    return;
  }

  dialogueLayoutFrame = requestAnimationFrame(() => {
    dialogueMessages.forEach(message => {
      const copy = message.querySelector('p');
      if (!copy) return;

      const animatedTransform = message.style.transform;
      message.style.transform = 'none';
      const range = document.createRange();
      range.selectNodeContents(copy);
      const lines = new Map();

      [...range.getClientRects()].forEach(rect => {
        const lineKey = Math.round(rect.top * 2) / 2;
        const line = lines.get(lineKey) || {left:rect.left, right:rect.right};
        line.left = Math.min(line.left, rect.left);
        line.right = Math.max(line.right, rect.right);
        lines.set(lineKey, line);
      });

      const widestLine = Math.max(0, ...[...lines.values()].map(line => line.right - line.left));
      if (!widestLine) {
        message.style.transform = animatedTransform;
        return;
      }

      const style = getComputedStyle(message);
      const horizontalChrome = Number.parseFloat(style.paddingLeft)
        + Number.parseFloat(style.paddingRight)
        + Number.parseFloat(style.borderLeftWidth)
        + Number.parseFloat(style.borderRightWidth);
      const naturalWidth = message.offsetWidth;
      const fittedWidth = Math.min(naturalWidth, Math.ceil(widestLine + horizontalChrome + 2));
      message.style.transform = animatedTransform;
      message.style.width = `${fittedWidth}px`;
    });

    syncSingleLineMessages();
  });
}

if (dialogueMessages.length) {
  syncDialogueMessageLayout();
  document.fonts?.ready.then(syncDialogueMessageLayout);
  addEventListener('resize', syncDialogueMessageLayout, {passive:true});
}

if (dialogueAvatarRail && dialogueMessages.length) {
  const firstDialogueRow = dialogueMessages[0].closest('.hotel-message-row');
  const lastDialogueRow = dialogueMessages.at(-1).closest('.hotel-message-row');
  let dialogueAvatarFrame = 0;

  const syncDialogueAvatarRail = () => {
    dialogueAvatarFrame = 0;
    const firstTop = firstDialogueRow.getBoundingClientRect().top;
    const lastBottom = lastDialogueRow.getBoundingClientRect().bottom;
    const messagesHaveStarted = firstTop <= innerHeight * .92;
    const messagesAreActive = lastBottom > 0;
    dialogueAvatarRail.classList.toggle('is-visible', messagesHaveStarted && messagesAreActive);
  };

  const scheduleDialogueAvatarRailSync = () => {
    if (dialogueAvatarFrame) return;
    dialogueAvatarFrame = requestAnimationFrame(syncDialogueAvatarRail);
  };

  syncDialogueAvatarRail();
  addEventListener('scroll', scheduleDialogueAvatarRailSync, {passive:true});
  addEventListener('resize', scheduleDialogueAvatarRailSync, {passive:true});
  addEventListener('load', scheduleDialogueAvatarRailSync, {once:true});
  addEventListener('pageshow', scheduleDialogueAvatarRailSync);
  document.addEventListener('visibilitychange', scheduleDialogueAvatarRailSync, {passive:true});
}

if (!reduced && dialogue && dialogueRows.length) {
  const dialoguePairs = [];
  for (let rowIndex = 0; rowIndex < dialogueRows.length; rowIndex += 2) {
    dialoguePairs.push(dialogueRows.slice(rowIndex, rowIndex + 2));
  }

  let dialogueFocusFrame = 0;
  let activeDialoguePair = -1;

  const syncDialoguePairFocus = () => {
    dialogueFocusFrame = 0;
    const viewportCenter = innerHeight * .5;
    let closestPairIndex = 0;
    let closestPairDistance = Number.POSITIVE_INFINITY;
    let closestPairCenter = viewportCenter;

    dialoguePairs.forEach((pair, pairIndex) => {
      const firstRect = pair[0].getBoundingClientRect();
      const lastRect = pair.at(-1).getBoundingClientRect();
      const currentFocusShift = Number.parseFloat(
        pair[0].style.getPropertyValue('--dialogue-focus-shift')
      ) || 0;
      const pairCenter = (firstRect.top + lastRect.bottom) / 2 - currentFocusShift;
      const pairDistance = Math.abs(pairCenter - viewportCenter);

      if (pairDistance < closestPairDistance) {
        closestPairIndex = pairIndex;
        closestPairDistance = pairDistance;
        closestPairCenter = pairCenter;
      }
    });

    const dialogueRect = dialogue.getBoundingClientRect();
    const dialogueIsVisible = dialogueRect.top <= viewportCenter
      && dialogueRect.bottom >= viewportCenter;
    const focusShift = viewportCenter - closestPairCenter;

    if (closestPairIndex !== activeDialoguePair) {
      activeDialoguePair = closestPairIndex;
    }

    dialoguePairs.forEach((pair, pairIndex) => {
      const isActive = dialogueIsVisible && pairIndex === activeDialoguePair;
      pair.forEach(row => {
        row.classList.toggle('is-dialogue-pair-active', isActive);
        row.style.setProperty('--dialogue-focus-shift', isActive ? `${focusShift}px` : '0px');
      });
    });
  };

  const scheduleDialoguePairFocus = () => {
    if (dialogueFocusFrame) return;
    dialogueFocusFrame = requestAnimationFrame(syncDialoguePairFocus);
  };

  dialogue.classList.add('has-pair-focus');
  syncDialoguePairFocus();
  addEventListener('scroll', scheduleDialoguePairFocus, {passive:true});
  addEventListener('resize', scheduleDialoguePairFocus, {passive:true});
  addEventListener('load', scheduleDialoguePairFocus, {once:true});
  addEventListener('pageshow', scheduleDialoguePairFocus);
  document.addEventListener('visibilitychange', scheduleDialoguePairFocus, {passive:true});
}

if (!reduced && dialogue) {
  dialogueMessages.forEach((message, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    const signals = [...message.querySelectorAll('.hotel-message__signal')];
    const agentState = message.querySelector('.hotel-message__agent-state');
    const agentReply = agentState ? message.querySelector(':scope > p') : null;

    gsap.fromTo(message,
      {
        y:32,
        scale:.98,
        rotation:direction * 1.6,
        transformOrigin:direction < 0 ? '18% 100%' : '82% 100%'
      },
      {
        y:0,
        scale:1,
        rotation:0,
        ease:'power2.out',
        scrollTrigger:{
          trigger:message,
          start:'top 90%',
          end:'top 68%',
          scrub:.32,
          invalidateOnRefresh:true
        }
      }
    );

    if (agentState && agentReply) {
      message.classList.add('hotel-message--stateful');
      gsap.set(agentState, {autoAlpha:0, y:10});
      gsap.set(agentReply, {autoAlpha:0, y:12});

      gsap.timeline({
        scrollTrigger:{
          trigger:message,
          start:'top 84%',
          end:'top 57%',
          scrub:.34,
          invalidateOnRefresh:true
        }
      })
        .to(agentState, {
          autoAlpha:1,
          y:0,
          duration:.22,
          ease:'power2.out'
        })
        .to(agentState, {
          autoAlpha:1,
          duration:.34
        })
        .to(agentState, {
          autoAlpha:0,
          y:-8,
          duration:.22,
          ease:'power2.in'
        })
        .to(agentReply, {
          autoAlpha:1,
          y:0,
          duration:.42,
          ease:'power2.out'
        }, '-=.05');
    }

    if (signals.length) {
      const signalRest = {
        color:dialogueSignalColor,
        textShadow:'0 0 0 rgba(255,255,255,0)',
        '--signal-bloom':0,
        '--signal-bloom-scale':.42,
        '--signal-spark-opacity':0,
        '--signal-spark-scale':.35,
        '--signal-spark-rotation':'0deg'
      };

      gsap.set(signals, signalRest);

      const signalFlash = gsap.timeline({paused:true});

      signals.forEach((signal, signalIndex) => {
        const signalStart = signalIndex * .14;

        signalFlash
          .set(signal, signalRest, 0)
          .to(signal, {
            color:'#fff',
            textShadow:'0 0 8px rgba(255,255,255,.98),0 0 26px rgba(124,157,255,.82)',
            '--signal-bloom':1,
            '--signal-bloom-scale':1,
            '--signal-spark-opacity':1,
            '--signal-spark-scale':1,
            '--signal-spark-rotation':'8deg',
            duration:.3,
            ease:'power3.out',
            overwrite:'auto'
          }, signalStart)
          .to(signal, {
            '--signal-bloom':0,
            '--signal-bloom-scale':1.72,
            '--signal-spark-opacity':0,
            '--signal-spark-scale':1.85,
            '--signal-spark-rotation':'24deg',
            textShadow:'0 0 7px rgba(255,255,255,.18),0 0 18px rgba(124,157,255,.12)',
            duration:.82,
            ease:'power2.out',
            overwrite:'auto'
          }, signalStart + .3);
      });

      const playSignalFlash = () => signalFlash.restart(true);
      const resetSignalFlash = () => {
        signalFlash.pause(0);
        gsap.set(signals, {...signalRest, overwrite:true});
      };

      ScrollTrigger.create({
        trigger:message,
        start:'top 64%',
        end:'bottom 14%',
        invalidateOnRefresh:true,
        onEnter:playSignalFlash,
        onEnterBack:playSignalFlash,
        onLeaveBack:resetSignalFlash
      });
    }

    const bonusOwner = message.closest('[data-bonus-message]');
    const bonuses = bonusOwner
      ? [...bonusOwner.querySelectorAll('[data-message-bonus]')]
      : [];
    if (!bonuses.length) return;

    const previousDialogueItem = bonusOwner.previousElementSibling;
    const sourceMessage = previousDialogueItem?.matches('.hotel-message--user')
      ? previousDialogueItem
      : previousDialogueItem?.querySelector('.hotel-message--user') || null;
    const sourceSignals = sourceMessage
      ? [...sourceMessage.querySelectorAll('.hotel-message__signal')]
      : [];

    const bonusPoses = bonuses.map((_, bonusIndex) => ({
      rotation:bonusIndex % 2 === 0 ? -4 : 2.5,
      y:0,
      x:bonusIndex % 2 === 0 ? -24 : 24
    }));

    gsap.set(bonuses, {
      autoAlpha:0,
      y:-54,
      scale:1,
      rotation:0,
      transformOrigin:'50% 50%'
    });

    let bonusDelay = null;

    const showBonus = () => {
      bonusDelay?.kill();
      bonusDelay = gsap.delayedCall(.04, () => {
        bonuses.forEach((bonus, bonusIndex) => {
          const pose = bonusPoses[bonusIndex];

          gsap.set(bonus, {
            x:0,
            y:pose.y,
            scale:1,
            rotation:pose.rotation
          });

          const bonusRect = bonus.getBoundingClientRect();
          const source = sourceSignals[bonusIndex]
            || sourceSignals[sourceSignals.length - 1]
            || sourceMessage;
          const sourceRect = source?.getBoundingClientRect();
          const originX = sourceRect
            ? sourceRect.left + sourceRect.width / 2 - (bonusRect.left + bonusRect.width / 2)
            : pose.x;
          const originY = sourceRect
            ? sourceRect.top + sourceRect.height / 2 - (bonusRect.top + bonusRect.height / 2)
            : -64;
          const arcY = Math.min(pose.y + originY, pose.y) - 42;

          gsap.killTweensOf(bonus);
          gsap.set(bonus, {
            autoAlpha:0,
            x:originX,
            y:pose.y + originY,
            scale:.96,
            rotation:0
          });

          gsap.timeline({ delay:bonusIndex * .14 })
            .to(bonus, {
              autoAlpha:1,
              scale:1,
              rotation:pose.rotation,
              duration:.5,
              ease:'power2.out'
            }, 0)
            .to(bonus, {
              x:0,
              duration:1.04,
              ease:'power3.inOut'
            }, 0)
            .to(bonus, {
              y:arcY,
              duration:.38,
              ease:'power2.out'
            }, 0)
            .to(bonus, {
              y:pose.y,
              duration:.66,
              ease:'power2.inOut'
            }, .38)
            .to(bonus, {
              y:pose.y - 3,
              duration:.14,
              ease:'power2.out'
            }, 1.04)
            .to(bonus, {
              y:pose.y,
              duration:.2,
              ease:'power2.inOut'
            }, 1.18);
        });
      });
    };

    const hideBonus = y => {
      bonusDelay?.kill();
      bonusDelay = null;
      gsap.to(bonuses, {
        autoAlpha:0,
        y,
        scale:1,
        rotation:0,
        duration:.34,
        stagger:.05,
        ease:'back.in(1.45)',
        overwrite:true
      });
    };

    ScrollTrigger.create({
      trigger:message,
      start:'top 66%',
      end:'bottom 18%',
      invalidateOnRefresh:true,
      onEnter:showBonus,
      onEnterBack:showBonus,
      onLeaveBack:() => hideBonus(24)
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh(), { once:true });
}

const hotelInfoCards = [...document.querySelectorAll('.hotel-info-card')];
const hotelData = document.querySelector('.hotel-data');
const hotelDataGrid = document.querySelector('.hotel-data__grid');
const hotelDataTrack = document.querySelector('.hotel-data__track');
const hotelCardPointerEnabled = !reduced
  && matchMedia('(hover:hover) and (pointer:fine)').matches;
let hotelCardsReveal = null;

function syncHotelResultsTransition(progress) {
  document.body.classList.toggle('hotel-results-transitioning', progress > .001);
  document.body.classList.toggle('hotel-results-transition-active', progress > .965);

  const shouldPauseGradient = progress > .045 && progress < .995;
  if (shouldPauseGradient) unmountPageGradient?.pause?.();
  else if (pageGradientShouldBeVisible) unmountPageGradient?.resume?.();
}

if (!reduced) {
  hotelData?.classList.add('is-transition-ready');

  const getHotelCardsTransitionStart = () => {
    const gridHeight = hotelDataGrid?.getBoundingClientRect().height || innerHeight * .75;
    const centeredTop = Math.max(0, (innerHeight - gridHeight) / 2);
    return `top ${Math.round(centeredTop)}px`;
  };

  const getHotelTrackStartX = () => {
    return innerWidth + Math.max(48, innerWidth * .045);
  };

  const getHotelTrackEndX = () => {
    const trackWidth = hotelDataTrack?.scrollWidth || innerWidth;
    const stageWidth = hotelDataGrid?.clientWidth || innerWidth;
    const endPadding = Math.max(48, innerWidth * .045);
    return stageWidth - trackWidth - endPadding;
  };

  hotelCardsReveal = gsap.timeline({
    scrollTrigger:{
      trigger:hotelDataGrid,
      start:getHotelCardsTransitionStart,
      end:() => `+=${Math.round(innerHeight * 2.65)}`,
      scrub:.3,
      pin:true,
      pinSpacing:true,
      anticipatePin:1,
      invalidateOnRefresh:true,
      onUpdate:self => syncHotelResultsTransition(self.progress),
      onRefresh:self => syncHotelResultsTransition(self.progress),
      onLeaveBack:() => syncHotelResultsTransition(0)
    }
  });

  const hotelResultScene = [analysisForm, analysisFinalStatus, ...analysisCardParallaxLayers]
    .filter(Boolean);

  if (storyHeading && storyHeadingPrimary && storyHeadingSecondary) {
    hotelCardsReveal.set(storyHeadingPrimary, {autoAlpha:1}, 0);
    hotelCardsReveal.set(storyHeadingSecondary, {autoAlpha:0}, 0);
    hotelCardsReveal.set(storyHeading, {
      autoAlpha:0,
      x:0,
      y:48
    }, 0);
  }

  if (hotelDataTrack) {
    hotelCardsReveal.set(hotelDataTrack, {
      autoAlpha:1,
      x:getHotelTrackStartX
    }, 0);
  }

  hotelCardsReveal.fromTo(hotelResultScene,
    {
      autoAlpha:1
    },
    {
      autoAlpha:0,
      duration:.72,
      stagger:{each:.025, from:'edges'},
      ease:'sine.inOut',
      immediateRender:false
    },
    0
  );

  if (storyHeading && storyHeadingPrimary && storyHeadingSecondary) {
    hotelCardsReveal.to(storyHeading,
      {
        autoAlpha:1,
        y:0,
        duration:.64,
        ease:'power2.out'
      },
      1.02
    );

    hotelCardsReveal.to(storyHeadingPrimary,
      {
        autoAlpha:0,
        duration:.36,
        ease:'sine.inOut'
      },
      4.12
    );

    hotelCardsReveal.to(storyHeading,
      {
        y:() => Math.min(220, innerHeight * .23),
        duration:.62,
        ease:'power2.inOut'
      },
      4.50
    );

    hotelCardsReveal.to(storyHeadingSecondary,
      {
        autoAlpha:1,
        duration:.62,
        ease:'power2.out'
      },
      4.50
    );
  }

  if (hotelDataTrack) {
    hotelCardsReveal.to(hotelDataTrack,
      {
        x:getHotelTrackEndX,
        duration:3.12,
        ease:'none'
      },
      1.18
    );
  }

  const hotelCardWaveDuration = .78;
  const hotelCardWaveStart = 1.18;
  const hotelCardWavePhases = [
    {phase:.62, strength:1},
    {phase:2.14, strength:.86},
    {phase:3.72, strength:.94}
  ];

  hotelCardWavePhases.forEach((pose, poseIndex) => {
    hotelCardsReveal.to(hotelInfoCards,
      {
        '--card-wave-y':index => `${(Math.sin(pose.phase + index * .92) * 16 * pose.strength).toFixed(2)}px`,
        '--card-wave-rz':index => `${(Math.sin(pose.phase + index * .92) * .7 * pose.strength).toFixed(3)}deg`,
        '--card-wave-skew':index => `${(Math.cos(pose.phase + index * .92) * .85 * pose.strength).toFixed(3)}deg`,
        '--card-wave-scale-x':index => (1 + Math.abs(Math.sin(pose.phase + index * .92)) * .008).toFixed(4),
        '--card-wave-scale-y':index => (1 - Math.abs(Math.sin(pose.phase + index * .92)) * .006).toFixed(4),
        duration:hotelCardWaveDuration,
        ease:'sine.inOut'
      },
      hotelCardWaveStart + poseIndex * hotelCardWaveDuration
    );
  });

  hotelCardsReveal.to(hotelInfoCards,
    {
      '--card-wave-y':'0px',
      '--card-wave-rz':'0deg',
      '--card-wave-skew':'0deg',
      '--card-wave-scale-x':1,
      '--card-wave-scale-y':1,
      duration:hotelCardWaveDuration,
      ease:'sine.inOut'
    },
    hotelCardWaveStart + hotelCardWavePhases.length * hotelCardWaveDuration
  );

  hotelCardsReveal.to(hotelInfoCards,
    {
      autoAlpha:0,
      duration:.24,
      stagger:{each:.02, from:'start'},
      ease:'sine.inOut'
    },
    4.28
  );

  hotelCardsReveal.to({}, {duration:.30}, 5.32);
} else {
  gsap.set(hotelDataTrack, {autoAlpha:1, x:0});
  gsap.set(hotelInfoCards, {
    autoAlpha:1,
    '--card-shift-x':'0px',
    '--card-shift-y':'0px',
    '--card-rx':'0deg',
    '--card-ry':'0deg',
    '--card-rz':'0deg',
    '--card-scale':1
  });
}

if (analysis) {
  ScrollTrigger.create({
    trigger:analysis,
    start:'top 38%',
    end:() => hotelCardsReveal?.scrollTrigger?.end
      ?? ((hotelData?.getBoundingClientRect().bottom || innerHeight) + scrollY - innerHeight),
    refreshPriority:-1,
    invalidateOnRefresh:true,
    onEnter:() => setPageGradientVisible(true),
    onEnterBack:() => setPageGradientVisible(true),
    onLeave:() => setPageGradientVisible(false),
    onLeaveBack:() => setPageGradientVisible(false),
    onRefresh:self => setPageGradientVisible(self.isActive)
  });
}

if (hotelCardPointerEnabled) {
  hotelInfoCards.forEach(card => {
    let pointerRect = null;
    const rotateXTo = gsap.quickTo(card, '--card-rx', {duration:.32, ease:'power2.out'});
    const rotateYTo = gsap.quickTo(card, '--card-ry', {duration:.32, ease:'power2.out'});

    const resetCard = () => {
      pointerRect = null;
      card.classList.remove('is-pointer-active');
      card.style.removeProperty('--card-mx');
      card.style.removeProperty('--card-my');
      card.style.removeProperty('--card-light-angle');
      rotateXTo('0deg');
      rotateYTo('0deg');
      gsap.to(card, {
        '--card-lift':'0px',
        '--card-scale':1,
        duration:.72,
        ease:'elastic.out(1,.48)',
        overwrite:'auto'
      });
    };

    card.addEventListener('pointerenter', () => {
      pointerRect = card.getBoundingClientRect();
      card.classList.add('is-pointer-active');
      gsap.to(card, {
        '--card-lift':'-12px',
        '--card-scale':1.035,
        duration:.5,
        ease:'power3.out',
        overwrite:'auto'
      });
    });

    card.addEventListener('pointermove', event => {
      const rect = pointerRect || card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const rotateX = (0.5 - y) * 7;
      const rotateY = (x - 0.5) * 9;
      const lightAngle = Math.atan2(y - .5, x - .5) * 180 / Math.PI + 90;

      card.style.setProperty('--card-mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--card-my', `${(y * 100).toFixed(1)}%`);
      card.style.setProperty('--card-light-angle', `${lightAngle.toFixed(1)}deg`);
      rotateXTo(`${rotateX.toFixed(2)}deg`);
      rotateYTo(`${rotateY.toFixed(2)}deg`);
    });

    card.addEventListener('pointerleave', resetCard);
    card.addEventListener('pointercancel', resetCard);
  });
}

const application = document.getElementById('hotel-application');
const applicationSticky = application?.querySelector('.hotel-application__sticky');
const applicationPanel = application?.querySelector('.hotel-application__panel');
const applicationContent = application?.querySelector('.hotel-application__content');
const applicationForm = document.getElementById('hotelApplicationForm');
const applicationStatus = document.getElementById('hotelApplicationStatus');
const applicationPhone = applicationForm?.elements.phone;
const footer = document.getElementById('footer');

const RUSSIAN_PHONE_PATTERN = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;

function formatRussianPhone(rawValue) {
  let digits = String(rawValue).replace(/\D/g, '');
  if (!digits) return '';

  if (digits[0] === '8') {
    digits = `7${digits.slice(1)}`;
  } else if (digits[0] !== '7') {
    digits = `7${digits}`;
  }

  const national = digits.slice(1, 11);
  let formatted = '+7';
  if (!national.length) return formatted;

  formatted += ` (${national.slice(0, 3)}`;
  if (national.length >= 3) formatted += ')';
  if (national.length > 3) formatted += ` ${national.slice(3, 6)}`;
  if (national.length > 6) formatted += `-${national.slice(6, 8)}`;
  if (national.length > 8) formatted += `-${national.slice(8, 10)}`;
  return formatted;
}

function syncPhoneValidity(showError = false) {
  if (!applicationPhone) return false;
  const isComplete = RUSSIAN_PHONE_PATTERN.test(applicationPhone.value);
  applicationPhone.setCustomValidity(
    applicationPhone.value && !isComplete
      ? 'Введите номер в формате +7 (987) 736-47-48'
      : ''
  );
  applicationPhone.classList.toggle('is-invalid', showError && !isComplete);
  return isComplete;
}

applicationPhone?.addEventListener('focus', () => {
  if (!applicationPhone.value) applicationPhone.value = '+7';
  applicationPhone.setSelectionRange(applicationPhone.value.length, applicationPhone.value.length);
});

applicationPhone?.addEventListener('input', () => {
  applicationPhone.value = formatRussianPhone(applicationPhone.value);
  syncPhoneValidity(false);
});

applicationPhone?.addEventListener('blur', () => {
  if (applicationPhone.value === '+7') applicationPhone.value = '';
  syncPhoneValidity(Boolean(applicationPhone.value));
});

applicationPhone?.addEventListener('invalid', () => {
  syncPhoneValidity(true);
  applicationStatus.textContent = 'Введите номер в формате +7 (987) 736-47-48.';
});

function mountHotelMagneticButton(zone, button, label, options = {}) {
  if (!zone || !button || !label || reduced || matchMedia('(hover: none)').matches) return null;
  const strength = .16;
  const labelStrength = .14;
  const wobbleStrength = options.wobble ?? (button.matches('.hero-download') ? .65 : 1);
  let disabled = Boolean(options.disabledWhen?.() || button.disabled);
  const makeMotion = () => ({
    buttonX:gsap.quickTo(button, 'x', {duration:.28, ease:'power3.out', overwrite:'auto'}),
    buttonY:gsap.quickTo(button, 'y', {duration:.28, ease:'power3.out', overwrite:'auto'}),
    labelX:gsap.quickTo(label, 'x', {duration:.34, ease:'power3.out', overwrite:'auto'}),
    labelY:gsap.quickTo(label, 'y', {duration:.34, ease:'power3.out', overwrite:'auto'})
  });
  let motion = makeMotion();

  const wobble = wobbleStrength
    ? gsap.timeline({repeat:-1, paused:disabled})
      .to(button, {rotation:1.05 * wobbleStrength, duration:1.15, ease:'sine.inOut'})
      .to(button, {rotation:-.8 * wobbleStrength, duration:1.4, ease:'sine.inOut'})
      .to(button, {rotation:.42 * wobbleStrength, duration:1.05, ease:'sine.inOut'})
      .to(button, {rotation:0, duration:.9, ease:'sine.inOut'})
    : null;

  const resetMotion = () => {
    Object.values(motion).forEach(move => move.tween.kill());
    gsap.set(button, {x:0, y:0, rotation:0});
    gsap.set(label, {x:0, y:0});
    motion = makeMotion();
  };

  zone.addEventListener('pointermove', event => {
    if (disabled || button.disabled) return;
    const rect = zone.getBoundingClientRect();
    const mapX = gsap.utils.clamp(-rect.width / 2, rect.width / 2, event.clientX - rect.left - rect.width / 2);
    const mapY = gsap.utils.clamp(-rect.height / 2, rect.height / 2, event.clientY - rect.top - rect.height / 2);
    motion.buttonX(mapX * strength);
    motion.buttonY(mapY * strength);
    motion.labelX(mapX * labelStrength);
    motion.labelY(mapY * labelStrength);
  });

  zone.addEventListener('pointerleave', () => {
    if (disabled || button.disabled) return;
    Object.values(motion).forEach(move => move.tween.kill());
    gsap.to(button, {x:0, y:0, duration:.7, ease:'elastic.out(1,.4)', overwrite:'auto'});
    gsap.to(label, {x:0, y:0, duration:.7, ease:'elastic.out(1,.4)', overwrite:true});
    motion = makeMotion();
  });

  return {
    disable() {
      disabled = true;
      wobble?.pause(0);
      resetMotion();
    }
  };
}

const applicationSubmit = applicationForm?.querySelector('.hotel-application__submit');
mountHotelMagneticButton(heroDownload, heroDownload, heroDownload?.querySelector('.hero-download__label'));
mountHotelMagneticButton(scrollCue, scrollCue, scrollCue?.querySelector('.scroll-cue-arrows'), {wobble:.65});
const headerDownload = document.getElementById('headerDownload');
mountHotelMagneticButton(headerDownload, headerDownload, headerDownload?.querySelector('span'), {wobble:0});

let headerDownloadVisible = false;
const setHeaderDownloadVisible = visible => {
  if (!headerDownload || visible === headerDownloadVisible) return;
  headerDownloadVisible = visible;
  headerDownload.classList.toggle('is-visible', visible);
  headerDownload.setAttribute('aria-hidden', String(!visible));
  headerDownload.tabIndex = visible ? 0 : -1;
};

if (headerDownload) {
  ScrollTrigger.create({
    trigger:'.hotels-hero',
    start:'top top',
    end:() => `+=${Math.round(innerHeight * .43)}`,
    invalidateOnRefresh:true,
    onUpdate:self => setHeaderDownloadVisible(self.progress >= 1)
  });

  headerDownload.addEventListener('click', event => {
    if (!application) return;
    event.preventDefault();
    application.scrollIntoView({behavior:reduced ? 'auto' : 'smooth'});
  });
}

const applicationButtonMotion = mountHotelMagneticButton(
  applicationSubmit,
  applicationSubmit,
  applicationSubmit?.querySelector('.hotel-application__submit-label')
);

document.querySelectorAll('[data-placeholder-link]').forEach(link => {
  link.addEventListener('click', event => event.preventDefault());
});

if (application && applicationPanel) {
  if (reduced) {
    gsap.set(applicationPanel, {scale:1, borderRadius:0});
  } else {
    if (applicationSticky && footer) {
      gsap.set(applicationSticky, {position:'relative', top:'auto'});
      ScrollTrigger.create({
        trigger:application,
        start:'top top',
        endTrigger:footer,
        end:'top top',
        pin:applicationSticky,
        pinSpacing:false,
        anticipatePin:1,
        invalidateOnRefresh:true
      });
    }

    gsap.to(applicationPanel, {
      scale:1,
      borderRadius:0,
      ease:'none',
      scrollTrigger:{
        trigger:application,
        start:'top 78%',
        end:'top 8%',
        scrub:.85,
        invalidateOnRefresh:true
      }
    });

    gsap.from(applicationContent, {
      autoAlpha:0,
      y:42,
      ease:'none',
      scrollTrigger:{
        trigger:application,
        start:'top 70%',
        end:'top 24%',
        scrub:.7,
        invalidateOnRefresh:true
      }
    });
  }
}

applicationForm?.addEventListener('submit', event => {
  event.preventDefault();
  const submitLabel = applicationSubmit.querySelector('.hotel-application__submit-label');
  submitLabel.textContent = 'Заявка принята';
  applicationSubmit.setAttribute('aria-label', 'Заявка принята');
  applicationSubmit.disabled = true;
  applicationButtonMotion?.disable();
  applicationStatus.textContent = 'Заявка принята. Мы свяжемся с вами.';
});

if (footer) {
  const footerTop = footer.querySelector('.foot-top');
  const footerLetters = footer.querySelectorAll('.foot-wordmark img');
  const syncFooterState = self => {
    document.body.classList.toggle('footer-active', self.isActive || self.progress === 1);
  };
  if (reduced) {
    ScrollTrigger.create({
      trigger:footer,
      start:'top bottom',
      end:'bottom top',
      onToggle:self => {
        document.body.classList.toggle('footer-active', self.isActive);
      }
    });
  } else {
    gsap.set(footerTop, {y:72, autoAlpha:.18});
    gsap.set(footerLetters, {
      scaleY:.08,
      yPercent:12,
      transformOrigin:'50% 100%'
    });

    const footerTimeline = gsap.timeline({
      defaults:{ease:'none'},
      scrollTrigger:{
        trigger:footer,
        start:'top bottom',
        end:'top top',
        scrub:.8,
        invalidateOnRefresh:true,
        onToggle:syncFooterState,
        onUpdate:syncFooterState
      }
    });

    footerTimeline
      .to(
        footerTop,
        {y:0, autoAlpha:1, duration:.62, immediateRender:false},
        0
      )
      .to(
        footerLetters,
        {scaleY:1, yPercent:0, duration:.58, stagger:.035, ease:'none', immediateRender:false},
        .42
      );
  }
}

const cursorTrail = document.getElementById('heroCursorTrail');
if (cursorTrail && !reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const trailItems = [...cursorTrail.querySelectorAll('i')].map((item, index) => {
    gsap.set(item, {xPercent:-50, yPercent:-50});
    return {
      setCss:gsap.quickSetter(item, 'css'),
      x:innerWidth * .5,
      y:innerHeight * .5,
      opacity:0,
      alpha:[.70, .58, .45][index],
      follow:[.18, .075, .028][index],
      scale:[1, .92, .84][index]
    };
  });
  let pointerX = innerWidth * .5;
  let pointerY = innerHeight * .5;
  let pointerSeen = false;

  addEventListener('pointermove', event => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerSeen = true;
  }, {passive:true});

  let lastDraw = -1;
  gsap.ticker.add(time => {
    if (time - lastDraw < 1 / 30) return;
    lastDraw = time;
    const active = pointerSeen && !document.hidden && scrollY < innerHeight;
    cursorTrail.classList.toggle('is-active', active);
    trailItems.forEach(item => {
      if (active) {
        item.x += (pointerX - item.x) * item.follow;
        item.y += (pointerY - item.y) * item.follow;
      }
      const targetOpacity = active ? item.alpha : 0;
      item.opacity += (targetOpacity - item.opacity) * .22;
      item.setCss({x:item.x, y:item.y, opacity:item.opacity, scale:item.scale});
    });
  });
}

const menu = document.getElementById('siteMenu');
const menuTrigger = document.getElementById('menuTrigger');
const menuClose = document.getElementById('menuClose');
const menuLinks = [...menu.querySelectorAll('[data-menu-close]')];
const languageButtons = [...menu.querySelectorAll('.menu-language')];

function setMenu(open) {
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menuTrigger.setAttribute('aria-expanded', String(open));
  menuTrigger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  document.body.classList.toggle('menu-open', open);
}

menuTrigger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menuClose.addEventListener('click', () => setMenu(false));
menuLinks.forEach(link => link.addEventListener('click', () => setMenu(false)));
languageButtons.forEach(button => button.addEventListener('click', () => {
  languageButtons.forEach(item => item.classList.toggle('is-on', item === button));
  document.documentElement.lang = button.dataset.language;
}));
addEventListener('keydown', event => {
  if (event.key === 'Escape') setMenu(false);
});

const rollTargets = document.querySelectorAll(`
  .site-header__audience-tab,
  .menu-business-link > span,
  .menu-links a:not(.menu-business-link):not(.menu-download-link),
  .hotel-application__legal-link,
  .foot a:not(.foot-business),
  .foot-business__label
`);
rollTargets.forEach(target => {
  const trigger = target.closest('a,button') || target;
  if (trigger.matches('button') || reduced) return;
  const label = target.textContent;
  if (!label.trim()) return;
  if (!trigger.hasAttribute('aria-label')) trigger.setAttribute('aria-label', label.trim());
  target.classList.add('letter-roll');
  target.textContent = '';
  [...label].forEach(character => {
    const wrapper = document.createElement('span');
    wrapper.className = 'roll-letter';
    const front = document.createElement('span');
    const back = document.createElement('span');
    front.className = 'roll-front';
    back.className = 'roll-back';
    front.textContent = character;
    back.textContent = character;
    wrapper.append(front, back);
    target.appendChild(wrapper);
  });
  const fronts = target.querySelectorAll('.roll-front');
  const backs = target.querySelectorAll('.roll-back');
  gsap.set(backs, {rotationX:72, transformOrigin:'50% 0%'});
  const timeline = gsap.timeline({paused:true, defaults:{duration:.48, ease:'power3.inOut'}})
    .to(fronts, {yPercent:-112, rotationX:-72, stagger:.024}, 0)
    .to(backs, {yPercent:-100, rotationX:0, stagger:.024}, 0);
  trigger.addEventListener('mouseenter', () => timeline.play());
  trigger.addEventListener('mouseleave', () => timeline.reverse());
  trigger.addEventListener('focus', () => timeline.play());
  trigger.addEventListener('blur', () => timeline.reverse());
});
