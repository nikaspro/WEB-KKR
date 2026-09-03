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
const device = document.querySelector('.hotels-device');
const scrollLayer = device.querySelector('.scroll-layer');
const heroBand = document.getElementById('heroBand');
const heroParticles = document.getElementById('heroParticles');
document.body.classList.add('hotels-enhanced');

try {
  sessionStorage.setItem('luna:intro-seen', '1');
} catch (err) {
  // Страница остаётся рабочей, даже если браузер блокирует sessionStorage.
}

function getDevicePose() {
  const desktop = innerWidth > 900;
  const scale = desktop ? 1.386 : 1.58;
  const baseY = desktop ? innerHeight * .045 : Math.max(520, innerHeight * .50);
  const scaleFromTopCompensation = device.querySelector('.box').offsetHeight * (scale - 1) / 2;
  return {
    desktop,
    rotateZ:desktop ? 6 : 0,
    rotateX:desktop ? 6 : 22,
    rotateY:desktop ? -6 : 0,
    x:desktop ? innerWidth * .20 : 0,
    y:baseY + scaleFromTopCompensation,
    scale
  };
}

function setDevicePose() {
  const pose = getDevicePose();
  gsap.set(device, { rotateZ:pose.rotateZ });
  gsap.set(scrollLayer, {
    rotateX:pose.rotateX,
    rotateY:pose.rotateY,
    x:pose.x,
    y:pose.y,
    scale:pose.scale
  });
}

setDevicePose();
addEventListener('resize', setDevicePose, {passive:true});

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
  const arrow = scrollCue?.querySelector('.scroll-chevron');
  if (arrow) {
    gsap.timeline({repeat:-1, repeatDelay:.42})
      .to(arrow, {y:-1, scaleX:1.15, scaleY:.68, duration:.16, ease:'power2.in'})
      .to(arrow, {y:0, scaleX:1, scaleY:1, duration:.78, ease:'elastic.out(1.25,.28)'});
  }
}

function buildHeroTransition() {
  if (reduced || !hero || !device || !scrollLayer) return;

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
    .to([heroBand, heroParticles], {
      autoAlpha:0,
      y:-90,
      duration:.48,
      overwrite:'auto'
    }, .08)
    .to(scrollLayer, {
      rotateY:() => getDevicePose().rotateY - 24,
      x:() => innerWidth * .82,
      y:() => getDevicePose().y - innerHeight * .08,
      scale:() => getDevicePose().scale + .26,
      duration:.34,
      ease:'power1.in'
    }, .04)
    .to(scrollLayer, {
      rotateY:() => getDevicePose().rotateY - 48,
      x:() => innerWidth * 1.5,
      y:() => getDevicePose().y,
      scale:() => getDevicePose().scale + .52,
      duration:.34,
      ease:'power1.out'
    }, .38);
}

buildHeroTransition();

scrollCue?.addEventListener('click', () => {
  document.getElementById('analysis')?.scrollIntoView({behavior:reduced ? 'auto' : 'smooth'});
});

const analysis = document.querySelector('.hotel-analysis');
const pageGradientHost = document.querySelector('[data-neat-gradient-host]');
const analysisPrompt = document.querySelector('.hotel-analysis__prompt');
const analysisForm = document.getElementById('hotelForm');
const hotelUrlInput = document.getElementById('hotelUrl');
const analysisRipple = document.querySelector('[data-hotel-url-ripple]');
const analysisStatusesRegion = document.querySelector('.hotel-analysis__statuses');
const analysisStatuses = gsap.utils.toArray('.hotel-analysis__status');
const hotelUrlPreset = hotelUrlInput?.value || 'my-hotel.ru';
const hotelUrlTyping = {characters:0};
let unmountPageGradient = null;
let pageGradientActivation = null;
let pageIsLeaving = false;
let pageGradientLatched = false;
let pageGradientShouldBeVisible = true;
let pageGradientModule = null;
let analysisSequence = null;
let analysisReveal = null;
let analysisGradientTimer = 0;
let analysisExperience = null;
let analysisFlowStarted = false;

if (!reduced && analysis) {
  hotelUrlInput.value = '';
  gsap.set(hotelUrlInput, {
    color:'#fff',
    textShadow:'none'
  });
  gsap.set(analysisForm, {pointerEvents:'none'});

  analysisReveal = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:analysis,
      start:'top top',
      end:() => `+=${Math.round(innerHeight * .60)}`,
      scrub:.58,
      invalidateOnRefresh:true
    }
  });

  analysisReveal
    .fromTo(analysisPrompt,
      {autoAlpha:0},
      {autoAlpha:1, duration:.3},
      0
    )
    .fromTo(analysisForm,
      {autoAlpha:0, y:12, scale:.965},
      {
        autoAlpha:1,
        y:0,
        scale:1,
        duration:.34,
        ease:'power2.out'
      },
      .16
    )
    .to(hotelUrlTyping, {
      characters:hotelUrlPreset.length,
      duration:.34,
      ease:`steps(${hotelUrlPreset.length})`,
      onStart:() => {
        void scheduleAnalysisBackdrop();
      },
      onUpdate:() => {
        const length = Math.round(hotelUrlTyping.characters);
        hotelUrlInput.value = hotelUrlPreset.slice(0, length);
      },
      onComplete:() => {
        hotelUrlInput.value = hotelUrlPreset;
        gsap.set(analysisForm, {pointerEvents:'auto'});
      },
      onReverseComplete:() => {
        hotelUrlInput.value = '';
        gsap.set(analysisForm, {pointerEvents:'none'});
      }
    }, .62);
  analysisReveal.eventCallback('onComplete', startAnalysisAfterBackdrop);
} else if (analysis) {
  ScrollTrigger.create({
    trigger:analysis,
    start:'top 70%',
    once:true,
    onEnter:startAnalysisAfterBackdrop
  });
}

async function activatePageGradient() {
  if (!pageGradientHost || pageIsLeaving) return false;
  if (pageGradientActivation) return pageGradientActivation;

  pageGradientModule ||= import('./page-gradient.js');
  pageGradientActivation = pageGradientModule
    .then(({ mountPageGradient }) => {
      if (pageIsLeaving) return;
      unmountPageGradient = mountPageGradient(pageGradientHost, { reduced });
      if (!unmountPageGradient) return false;
      pageGradientLatched = true;
      pageGradientHost.dataset.neatReady = 'true';
      return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!pageIsLeaving) setPageGradientVisible(pageGradientShouldBeVisible);
        resolve(!pageIsLeaving);
      })));
    })
    .catch(error => {
      pageGradientActivation = null;
      console.warn('Не удалось запустить NeatGradient.', error);
      return false;
    });

  return pageGradientActivation;
}

function runAnalysisSequence() {
  analysisReveal?.scrollTrigger?.kill();
  analysisReveal?.kill();
  analysisReveal = null;
  gsap.killTweensOf([analysisForm, hotelUrlInput, analysisPrompt]);
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

  const showStatus = status => {
    analysisStatuses.forEach(item => item.setAttribute('aria-hidden', String(item !== status)));
    analysisStatusesRegion?.setAttribute('aria-label', status.textContent.trim());
  };

  if (reduced) {
    gsap.set(analysisForm, {autoAlpha:0, pointerEvents:'none'});
    gsap.set(hotelUrlInput, {color:'transparent', caretColor:'transparent'});
    gsap.set(analysisStatuses, {autoAlpha:0});
    const finalStatus = analysisStatuses.at(-1);
    finalStatus?.classList.add('is-final');
    if (finalStatus) showStatus(finalStatus);
    analysisForm.setAttribute('aria-busy', 'false');
    return;
  }

  gsap.set(analysisStatuses, {
    autoAlpha:0,
    y:34,
    scale:.94,
    rotationX:-10,
    filter:'blur(12px)',
    transformOrigin:'50% 50%'
  });
  gsap.set(analysisForm, {autoAlpha:1, pointerEvents:'none'});
  analysisSequence = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:analysis,
      start:() => `top+=${Math.round(innerHeight * .62)} top`,
      end:'bottom bottom',
      scrub:.82,
      invalidateOnRefresh:true,
      onUpdate:self => {
        const statusProgress = gsap.utils.clamp(0, .999, (self.progress - .06) / .94);
        const activeIndex = Math.min(
          analysisStatuses.length - 1,
          Math.floor(statusProgress * analysisStatuses.length)
        );
        const activeStatus = analysisStatuses[activeIndex];
        if (activeStatus) showStatus(activeStatus);
        analysisForm.setAttribute('aria-busy', String(self.progress < .985));
      }
    }
  })
    .to(hotelUrlInput, {
      color:'rgba(255,255,255,0)',
      caretColor:'transparent',
      duration:.38,
      ease:'power2.out'
    }, 0)
    .to(analysisForm, {
      scale:.985,
      duration:.38,
      ease:'power2.out'
    }, 0);

  const statusStart = .32;
  const statusStep = 1.02;
  const finalStatusIndex = analysisStatuses.length - 1;
  const finalStatusStart = statusStart + finalStatusIndex * statusStep;

  analysisSequence.to(analysisForm, {
    autoAlpha:0,
    scale:.985,
    duration:.34,
    ease:'power2.out'
  }, finalStatusStart - .36);

  analysisStatuses.forEach((status, index) => {
    const at = statusStart + index * statusStep;
    const isFinal = index === finalStatusIndex;

    analysisSequence.fromTo(status,
      {
        autoAlpha:0,
        y:isFinal ? 0 : 34,
        scale:isFinal ? 1 : .94,
        rotationX:isFinal ? 0 : -10,
        filter:'blur(12px)'
      },
      {
        autoAlpha:1,
        y:0,
        scale:1,
        rotationX:0,
        filter:'blur(0px)',
        duration:.34,
        ease:'power2.out'
      },
      at
    );

    if (index < analysisStatuses.length - 1) {
      analysisSequence.to(status, {
        autoAlpha:0,
        y:-34,
        scale:1.04,
        rotationX:10,
        filter:'blur(12px)',
        duration:.32,
        ease:'power2.in'
      }, at + .70);
    }
  });

  analysisSequence.to({}, {duration:.92});
}

function startAnalysisFlow() {
  if (analysisFlowStarted || pageIsLeaving) return;
  analysisFlowStarted = true;
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
  document.body.classList.add('hotel-neat-gradient-active');
  document.body.classList.toggle('hotel-neat-gradient-hidden', !visible);
}

analysisRipple?.addEventListener('animationend', () => {
  analysisRipple.classList.remove('is-rippling');
});

function destroyPageGradient() {
  pageIsLeaving = true;
  if (analysisGradientTimer) clearTimeout(analysisGradientTimer);
  analysisGradientTimer = 0;
  document.body.classList.remove('hotel-neat-gradient-active');
  document.body.classList.remove('hotel-neat-gradient-hidden');
  if (!pageGradientLatched) return;
  unmountPageGradient?.();
  unmountPageGradient = null;
  pageGradientLatched = false;
}

function destroyHotelGradients() {
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
const dialogueTitle = document.getElementById('hotelDialogueTitle');
const dialogueMessages = dialogue ? [...dialogue.querySelectorAll('.hotel-message')] : [];
const dialogueSignalColor = 'rgba(255,255,255,.52)';

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

if (dialogueMessages.length) {
  requestAnimationFrame(syncSingleLineMessages);
  document.fonts?.ready.then(syncSingleLineMessages);
  addEventListener('resize', syncSingleLineMessages, {passive:true});
}

if (!reduced && dialogue) {
  if (dialogueTitle) {
    gsap.fromTo(dialogueTitle,
      { autoAlpha:0, y:42, scale:.97 },
      {
        autoAlpha:1,
        y:0,
        scale:1,
        ease:'power2.out',
        scrollTrigger:{
          trigger:dialogueTitle,
          start:'top 92%',
          end:'top 68%',
          scrub:.6,
          invalidateOnRefresh:true
        }
      }
    );
  }

  dialogueMessages.forEach((message, index) => {
    const direction = index % 2 === 0 ? -1 : 1;
    const signals = [...message.querySelectorAll('.hotel-message__signal')];

    gsap.fromTo(message,
      {
        autoAlpha:0,
        y:72,
        scale:.94,
        rotation:direction * 1.6,
        transformOrigin:direction < 0 ? '18% 100%' : '82% 100%'
      },
      {
        autoAlpha:1,
        y:0,
        scale:1,
        rotation:0,
        ease:'power2.out',
        scrollTrigger:{
          trigger:message,
          start:'top 96%',
          end:'top 66%',
          scrub:1.05,
          invalidateOnRefresh:true
        }
      }
    );

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

    const bonusPoses = bonuses.map((_, bonusIndex) => ({
      rotation:bonusIndex % 2 === 0 ? -6 : 5,
      y:bonusIndex % 2 === 0 ? -7 : 7,
      x:bonusIndex % 2 === 0 ? -24 : 24
    }));

    gsap.set(bonuses, {
      autoAlpha:0,
      y:-54,
      scale:.66,
      transformOrigin:'50% 50%'
    });

    let bonusDelay = null;

    const showBonus = () => {
      bonusDelay?.kill();
      bonusDelay = gsap.delayedCall(.04, () => {
        bonuses.forEach((bonus, bonusIndex) => {
          const pose = bonusPoses[bonusIndex];
          gsap.timeline({ delay:bonusIndex * .11 })
            .fromTo(bonus, {
              autoAlpha:0,
              x:pose.x,
              y:-64,
              scale:.62,
              rotation:pose.rotation * 2.4
            }, {
              autoAlpha:1,
              x:0,
              y:pose.y,
              scale:1.1,
              rotation:pose.rotation * .72,
              duration:.5,
              ease:'back.out(2.5)',
              overwrite:true
            })
            .to(bonus, {
              scale:1,
              rotation:pose.rotation,
              duration:.28,
              ease:'power2.out',
              overwrite:'auto'
            });
        });
      });
    };

    const hideBonus = y => {
      bonusDelay?.kill();
      bonusDelay = null;
      gsap.to(bonuses, {
        autoAlpha:0,
        y,
        scale:.82,
        rotation:index => bonusPoses[index].rotation * 1.55,
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
      onLeave:() => hideBonus(-28),
      onLeaveBack:() => hideBonus(24)
    });
  });

  addEventListener('load', () => ScrollTrigger.refresh(), { once:true });
}

const hotelInfoCards = [...document.querySelectorAll('.hotel-info-card')];
const hotelCardPointerEnabled = !reduced
  && matchMedia('(hover:hover) and (pointer:fine)').matches;

if (!reduced) {
  hotelInfoCards.forEach((card, index) => {
    const isRightColumn = index % 2 === 1;

    gsap.fromTo(card,
      {
        autoAlpha:0,
        '--card-shift-y':`${160 + (index % 2) * 28}px`
      },
      {
        autoAlpha:1,
        '--card-shift-y':'0px',
        ease:'none',
        scrollTrigger:{
          trigger:card,
          start:`top ${isRightColumn ? 106 : 112}%`,
          end:`top ${isRightColumn ? 58 : 64}%`,
          scrub:.78,
          invalidateOnRefresh:true
        }
      }
    );
  });
} else {
  gsap.set(hotelInfoCards, {autoAlpha:1, '--card-shift-y':'0px'});
}

if (hotelCardPointerEnabled) {
  hotelInfoCards.forEach(card => {
    const resetCard = () => {
      card.classList.remove('is-pointer-active');
      gsap.to(card, {
        '--card-lift':'0px',
        '--card-rx':'0deg',
        '--card-ry':'0deg',
        '--card-scale':1,
        duration:.72,
        ease:'elastic.out(1,.48)',
        overwrite:'auto'
      });
    };

    card.addEventListener('pointerenter', () => {
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
      const rect = card.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height));
      const rotateX = (0.5 - y) * 7;
      const rotateY = (x - 0.5) * 9;
      const lightAngle = Math.atan2(y - .5, x - .5) * 180 / Math.PI + 90;

      card.style.setProperty('--card-mx', `${(x * 100).toFixed(1)}%`);
      card.style.setProperty('--card-my', `${(y * 100).toFixed(1)}%`);
      card.style.setProperty('--card-light-angle', `${lightAngle.toFixed(1)}deg`);
      gsap.to(card, {
        '--card-rx':`${rotateX.toFixed(2)}deg`,
        '--card-ry':`${rotateY.toFixed(2)}deg`,
        duration:.32,
        ease:'power2.out',
        overwrite:'auto'
      });
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
  const syncPageGradientAtFooter = self => {
    setPageGradientVisible(scrollY < self.start);
  };

  ScrollTrigger.create({
    trigger:footer,
    start:'top 5%',
    end:'bottom top',
    invalidateOnRefresh:true,
    onEnter:() => setPageGradientVisible(false),
    onEnterBack:() => setPageGradientVisible(false),
    onLeave:() => setPageGradientVisible(false),
    onLeaveBack:() => setPageGradientVisible(true),
    onUpdate:syncPageGradientAtFooter,
    onRefresh:syncPageGradientAtFooter
  });

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
