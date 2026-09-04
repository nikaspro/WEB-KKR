import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAgentMessageGradients } from './agent-message-gradients.js';
import { initHotelSalesSection } from './sections/sales-section.js';

gsap.registerPlugin(ScrollTrigger);
initHotelSalesSection();

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let pageIsLeaving = false;
let pageGradientLatched = false;
let pageGradientShouldBeVisible = false;
const destroyAgentMessageGradients = initAgentMessageGradients(document, {reduced});
const heroScene = document.querySelector('.hotels-hero');
const hero = document.querySelector('.hotels-hero .hero');
const heroTitle = document.getElementById('heroH1');
const heroCopy = document.getElementById('heroP');
const heroDownload = document.querySelector('.hero-download');
const scrollCue = document.querySelector('.hero-scroll');
const heroBand = document.getElementById('heroBand');
const heroBackdrop = document.getElementById('heroBackdrop');
const heroFlightMask = heroBand?.querySelector('.hotel-hero-flight-mask');
const heroParticles = document.getElementById('heroParticles');
const heroAxisLabels = {
  top:document.querySelector('.hotel-hero-axis-label--top'),
  bottom:document.querySelector('.hotel-hero-axis-label--bottom')
};
let heroIsScrollingOut = false;
let stopHeroMotion = () => {};
let startHeroMotion = () => {};
const setHeroScrollFading = active => {
  if (heroIsScrollingOut === active) return;
  heroIsScrollingOut = active;
  heroScene?.classList.toggle('is-scroll-fading', active);

  if (active) stopHeroMotion();
  else startHeroMotion();
};
document.body.classList.add('hotels-enhanced');
heroBand?.classList.add('is-motion-paused');
heroBackdrop?.classList.add('is-motion-paused');

// Один тег последовательно показывает разные пары просьба/ответ.
const heroVisibleTagCount = 1;
const heroTagMessages = [
  {
    request:'Нужен ранний заезд к 9:00',
    response:'Оформил ранний заезд'
  },
  {
    request:'Закажи еду в номер',
    response:'Еда будет в номере через 20 минут'
  },
  {
    request:'Закажи трансфер до аэропорта',
    response:'Трансфер забронирован на 7:30'
  },
  {
    request:'Где можно погулять рядом с отелем?',
    response:'Подсказываю маршрут для прогулки'
  }
];
const heroFlyingTagTracks = heroTagMessages.map(({request}, index) => {
  const track = document.createElement('div');
  track.className = 'hotel-hero-flying-track';
  track.setAttribute('aria-hidden', 'true');
  track.hidden = index >= heroVisibleTagCount;

  const tag = document.createElement('div');
  tag.className = 'hotel-message__bonus hotel-hero-flying-tag font-nunito-light-wide';
  tag.textContent = request;
  track.appendChild(tag);
  (heroFlightMask || heroBand)?.appendChild(track);

  return track;
});
const activeHeroFlyingTagTracks = heroFlyingTagTracks.slice(0, heroVisibleTagCount);
const heroRewardRain = document.createElement('div');
heroRewardRain.className = 'hotel-hero-reward-rain';
heroRewardRain.setAttribute('aria-hidden', 'true');
const heroRewardTags = [...document.querySelectorAll('.hotel-dialogue [data-message-bonus]')]
  .map(source => {
    const tag = source.cloneNode(true);
    tag.classList.add('hotel-hero-reward-tag');
    tag.removeAttribute('data-message-bonus');
    heroRewardRain.appendChild(tag);
    return tag;
  });
if (heroRewardTags.length) heroBand?.appendChild(heroRewardRain);

if (heroParticles) {
  const stars = document.createDocumentFragment();
  heroParticles.classList.add('is-paused');

  for (let index = 0; index < 24; index += 1) {
    const star = document.createElement('i');
    star.className = 'hotel-hero-star';
    star.style.left = `${38 + Math.random() * 58}%`;
    star.style.top = `${-100 + Math.random() * 100}%`;
    star.style.setProperty('--star-size', `${1.2 + Math.random() * 2.8}px`);
    star.style.setProperty('--star-opacity', (0.30 + Math.random() * 0.62).toFixed(2));
    star.style.setProperty('--star-drift', `${6 + Math.random() * 16}px`);
    const starDuration = 10 + Math.random() * 5;
    star.style.setProperty('--star-duration', `${starDuration.toFixed(2)}s`);
    star.style.animationDelay = `${(-Math.random() * starDuration).toFixed(2)}s`;
    stars.appendChild(star);
  }

  heroParticles.appendChild(stars);
}

const heroCursorParticles = [];
if (heroParticles && !reduced && matchMedia('(hover:hover) and (pointer:fine)').matches) {
  const cursorParticleFragment = document.createDocumentFragment();
  const cursorParticlePoolSize = 56;
  for (let index = 0; index < cursorParticlePoolSize; index += 1) {
    const particle = document.createElement('i');
    particle.className = 'hotel-hero-cursor-particle';
    particle.setAttribute('aria-hidden', 'true');
    cursorParticleFragment.appendChild(particle);
    gsap.set(particle, {xPercent:-50, yPercent:-50, opacity:0});
    heroCursorParticles.push(particle);
  }
  heroParticles.appendChild(cursorParticleFragment);

  let cursorParticleIndex = 0;
  let cursorTrailX = 0;
  let cursorTrailY = 0;
  let cursorTrailDistance = 0;
  let cursorTrailHasPoint = false;

  const spawnCursorParticle = (
    x,
    y,
    angle = Math.random() * Math.PI * 2,
    burstRadius = 30 + Math.random() * 66
  ) => {
    const particle = heroCursorParticles[cursorParticleIndex];
    cursorParticleIndex = (cursorParticleIndex + 1) % heroCursorParticles.length;
    const startRadius = Math.random() * 7;
    const startX = x + Math.cos(angle) * startRadius;
    const startY = y + Math.sin(angle) * startRadius;
    const settleX = x + Math.cos(angle) * burstRadius;
    const settleY = y + Math.sin(angle) * burstRadius;
    const riseX = settleX + (Math.random() - .5) * 36;
    const riseY = settleY - (64 + Math.random() * 82);
    const duration = 1.18 + Math.random() * .5;
    const peakOpacity = .42 + Math.random() * .2;

    gsap.killTweensOf(particle);
    gsap.set(particle, {
      x:startX,
      y:startY,
      scale:.06 + Math.random() * .12,
      opacity:0
    });
    gsap.to(particle, {
      keyframes:[
        {
          x:settleX,
          y:settleY,
          scale:1,
          opacity:peakOpacity,
          duration:.34,
          ease:'sine.out'
        },
        {
          x:riseX,
          y:riseY,
          scale:.16,
          opacity:0,
          duration,
          ease:'power2.out'
        }
      ],
      overwrite:true
    });
  };

  addEventListener('pointermove', event => {
    if (heroParticles.classList.contains('is-paused') || heroIsScrollingOut) {
      cursorTrailHasPoint = false;
      cursorTrailDistance = 0;
      return;
    }

    const bounds = heroParticles.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (!cursorTrailHasPoint) {
      cursorTrailX = x;
      cursorTrailY = y;
      cursorTrailHasPoint = true;
      return;
    }

    const deltaX = x - cursorTrailX;
    const deltaY = y - cursorTrailY;
    const distance = Math.hypot(deltaX, deltaY);
    cursorTrailDistance += distance;
    const spawnDistance = 24;
    const spawnCount = Math.min(8, Math.floor(cursorTrailDistance / spawnDistance));
    if (spawnCount) {
      cursorTrailDistance %= spawnDistance;
      for (let index = 1; index <= spawnCount; index += 1) {
        const progress = index / spawnCount;
        spawnCursorParticle(
          cursorTrailX + deltaX * progress,
          cursorTrailY + deltaY * progress
        );
      }
    }
    cursorTrailX = x;
    cursorTrailY = y;
  }, {passive:true});

  addEventListener('click', event => {
    if (heroParticles.classList.contains('is-paused') || heroIsScrollingOut) return;
    if (event.target.closest(
      'a,button,input,textarea,select,[role="button"],h1,p,.hotel-hero-axis-label,.site-header'
    )) return;

    const bounds = heroParticles.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    if (x < 0 || x > bounds.width || y < 0 || y > bounds.height) return;

    const burstCount = 20;
    const angleStep = (Math.PI * 2) / burstCount;
    for (let index = 0; index < burstCount; index += 1) {
      const angle = index * angleStep + (Math.random() - .5) * .22;
      spawnCursorParticle(x, y, angle, 42 + Math.random() * 72);
    }
  });
}

try {
  sessionStorage.setItem('luna:intro-seen', '1');
} catch (err) {
  // Страница остаётся рабочей, даже если браузер блокирует sessionStorage.
}

if (!reduced) {
  const heroAxisLetters = Object.fromEntries(
    Object.entries(heroAxisLabels).map(([position, label]) => {
      if (!label) return [position, []];
      const fragment = document.createDocumentFragment();
      const letters = [...label.textContent].map(character => {
        const letter = document.createElement('span');
        letter.className = 'hotel-hero-axis-letter';
        letter.textContent = character === ' ' ? '\u00a0' : character;
        fragment.appendChild(letter);
        return letter;
      });
      label.replaceChildren(fragment);
      return [position, letters];
    })
  );
  const heroAxisWaves = Object.fromEntries(
    Object.entries(heroAxisLetters).map(([position, letters]) => {
      const timeline = gsap.timeline({paused:true});
      letters.forEach((letter, index) => {
        const start = index * .045;
        timeline
          .to(letter, {
            y:-8,
            scaleY:1.04,
            duration:.13,
            ease:'power3.out',
            overwrite:true
          }, start)
          .to(letter, {
            y:0,
            scaleY:1,
            duration:.22,
            ease:'power2.in',
            overwrite:'auto'
          }, start + .13);
      });
      return [position, timeline];
    })
  );
  const playHeroAxisWave = position => heroAxisWaves[position]?.restart(true);

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

  if (heroBand) {
    const initialYFactors = [-.31, -.02, .28];
    const initialSpeeds = [172, 152, 163];
    const floatAmplitudeX = 18;
    const floatAmplitudeY = 11;
    const floatTilt = 13;
    const suctionScaleLoss = .16;
    const flightFadeStart = .18;
    const flightFadeEnd = .28;
    const initialDirections = activeHeroFlyingTagTracks.map(
      () => Math.random() < .5 ? -1 : 1
    );
    if (initialDirections.length === 1) {
      initialDirections[0] = 1;
    } else if (initialDirections.every(direction => direction === initialDirections[0])) {
      initialDirections[1] *= -1;
    }
    const collisionCooldowns = new Map();
    let flyingTagActive = false;
    let rewardRainTimeline = null;

    const playHeroRewardRain = (messageIndex = 0) => {
      if (!heroRewardTags.length) return;
      rewardRainTimeline?.kill();
      gsap.killTweensOf(heroRewardTags);
      gsap.set(heroRewardTags, {autoAlpha:0});

      const rewardProfiles = [
        [heroRewardTags[0]],
        [heroRewardTags[2]],
        [heroRewardTags[1]],
        []
      ];
      const visibleTags = rewardProfiles[messageIndex % rewardProfiles.length]
        .filter(Boolean);
      if (!visibleTags.length) return;

      const spread = Math.min(innerWidth * .085, 124);
      const drop = Math.min(innerHeight * .38, 360);
      const middle = (visibleTags.length - 1) * .5;
      const poses = visibleTags.map((_, index) => {
        const slot = index - middle;
        const startX = slot * spread;
        return {
          startX,
          endX:startX + (slot < 0 ? -32 : 32) + slot * 10,
          endY:drop + Math.abs(slot) * 24,
          rotation:slot * 7
        };
      });

      gsap.set(visibleTags, {
        autoAlpha:0,
        x:index => poses[index].startX,
        y:index => -28 - Math.abs(index - middle) * 12,
        xPercent:-50,
        yPercent:-50,
        scale:.72,
        rotation:index => poses[index].rotation * -.35
      });

      rewardRainTimeline = gsap.timeline({
        onComplete:() => { rewardRainTimeline = null; }
      })
        .to(visibleTags, {
          autoAlpha:.86,
          y:index => 24 + Math.abs(index - middle) * 10,
          scale:1,
          duration:.34,
          stagger:.055,
          ease:'power2.out',
          overwrite:true
        })
        .to(visibleTags, {
          autoAlpha:0,
          x:index => poses[index].endX,
          y:index => poses[index].endY,
          scale:.9,
          rotation:index => poses[index].rotation,
          duration:1.35,
          stagger:.07,
          ease:'power1.in',
          overwrite:'auto'
        }, '>-.04');
    };

    const flyingTagStates = activeHeroFlyingTagTracks.map((track, index) => {
      const tag = track.firstElementChild;
      const copy = heroTagMessages[index];
      const direction = initialDirections[index];
      const isResponse = direction < 0;
      const speed = initialSpeeds[index] + (Math.random() - .5) * 12;
      tag.textContent = isResponse ? copy.response : copy.request;
      tag.classList.toggle('is-response', isResponse);

      return {
        track,
        tag,
        copy,
        messageIndex:index % heroTagMessages.length,
        direction,
        isResponse,
        axisWaveArmed:direction < 0 ? 'bottom' : 'top',
        rewardDropArmed:direction < 0,
        y:innerHeight * initialYFactors[index],
        x:0,
        vx:0,
        vy:0,
        flowVelocityY:direction * speed,
        speed,
        phase:index * 2.15,
        spin:0,
        renderX:null,
        renderY:null,
        renderScale:null,
        renderRotation:null,
        renderOpacity:null,
        width:0,
        height:0,
        suctionOffset:0,
        exitOffset:0,
        origin:'',
        setX:gsap.quickSetter(track, 'x', 'px'),
        setY:gsap.quickSetter(track, 'y', 'px'),
        setScale:gsap.quickSetter(track, 'scale'),
        setRotation:gsap.quickSetter(track, 'rotation', 'deg'),
        setOpacity:gsap.quickSetter(track, 'opacity')
      };
    });

    gsap.set(activeHeroFlyingTagTracks, {yPercent:-50});

    const measureFlyingTags = preservePosition => {
      flyingTagStates.forEach((state, index) => {
        const previousExit = state.exitOffset;
        state.width = state.track.offsetWidth;
        state.height = state.track.offsetHeight;
        state.suctionOffset = Math.max(
          innerHeight * .16,
          innerHeight * .5 - state.height * 2.25
        ) * .5;
        // Разворачиваем плашку до того, как она успевает уйти в полную
        // прозрачность: так смена направления выглядит как отскок.
        state.exitOffset = Math.max(
          innerHeight * .2,
          innerHeight * (.5 - flightFadeEnd) + state.height * .5
        );

        if (preservePosition && previousExit) {
          state.y = state.y / previousExit * state.exitOffset;
        } else if (!preservePosition) {
          state.y = innerHeight * initialYFactors[index];
        }
      });
    };

    let measureFrame = 0;
    const scheduleFlyingTagMeasure = () => {
      cancelAnimationFrame(measureFrame);
      measureFrame = requestAnimationFrame(() => measureFlyingTags(true));
    };

    const setFlyingTagState = (state, messageIndex, isResponse) => {
      if (state.messageIndex === messageIndex && state.isResponse === isResponse) return;
      state.messageIndex = messageIndex;
      state.copy = heroTagMessages[messageIndex];
      state.isResponse = isResponse;
      state.tag.textContent = isResponse ? state.copy.response : state.copy.request;
      state.tag.classList.toggle('is-response', isResponse);
      scheduleFlyingTagMeasure();
    };

    const getFlyingTagSuction = state => {
      const edgeDistance = Math.abs(state.y);
      const edgeRange = Math.max(1, state.exitOffset - state.suctionOffset);
      const rawSuction = Math.min(1, Math.max(0,
        (edgeDistance - state.suctionOffset) / edgeRange
      ));
      return Math.pow(rawSuction, .68);
    };

    const getFlyingTagLaneOpacity = state => {
      const center = innerHeight * .5 + state.y;
      const topEdge = center - state.height * .5;
      const bottomEdge = center + state.height * .5;
      const fadeDistance = Math.max(1,
        innerHeight * (flightFadeEnd - flightFadeStart)
      );
      const topOpacity = Math.min(1, Math.max(0,
        (bottomEdge - innerHeight * flightFadeStart) / fadeDistance
      ));
      const bottomOpacity = Math.min(1, Math.max(0,
        (innerHeight * (1 - flightFadeStart) - topEdge) / fadeDistance
      ));
      const opacity = Math.min(topOpacity, bottomOpacity);
      return opacity * opacity * (3 - 2 * opacity);
    };

    const renderFlyingTag = (state, time, delta = 1) => {
      const suction = getFlyingTagSuction(state);
      const origin = state.y < 0 ? '50% 0%' : '50% 100%';

      if (state.origin !== origin) {
        state.origin = origin;
        state.track.style.transformOrigin = origin;
      }

      const targetX = state.x + Math.sin(time * .82 + state.phase) * floatAmplitudeX;
      const targetY = state.y + Math.cos(time * 1.04 + state.phase) * floatAmplitudeY;
      const targetScale = 1 - suction * suctionScaleLoss;
      const targetRotation = (
        state.spin + Math.sin(time * .58 + state.phase) * floatTilt
      ) * (1 - suction);
      const targetOpacity = getFlyingTagLaneOpacity(state);
      const smoothing = 1 - Math.exp(-Math.min(delta, .05) / .1);

      if (state.renderX === null) {
        state.renderX = targetX;
        state.renderY = targetY;
        state.renderScale = targetScale;
        state.renderRotation = targetRotation;
        state.renderOpacity = targetOpacity;
      } else {
        state.renderX += (targetX - state.renderX) * smoothing;
        state.renderY += (targetY - state.renderY) * smoothing;
        state.renderScale += (targetScale - state.renderScale) * smoothing;
        state.renderRotation += (targetRotation - state.renderRotation) * smoothing;
        state.renderOpacity += (targetOpacity - state.renderOpacity) * smoothing;
      }

      state.setX(state.renderX);
      state.setY(state.renderY);
      state.setScale(state.renderScale);
      state.setRotation(state.renderRotation);
      state.setOpacity(state.renderOpacity);
    };

    const clampCollisionVelocity = state => {
      const maxCollisionSpeed = 28;
      const velocity = Math.hypot(state.vx, state.vy);
      if (velocity <= maxCollisionSpeed) return;
      const scale = maxCollisionSpeed / velocity;
      state.vx *= scale;
      state.vy *= scale;
    };

    const getFlyingTagCollisionBounds = (state, time) => {
      const floatX = Math.sin(time * .82 + state.phase) * floatAmplitudeX;
      const floatY = Math.cos(time * 1.04 + state.phase) * floatAmplitudeY;
      const suction = getFlyingTagSuction(state);
      const scale = 1 - suction * suctionScaleLoss;
      const rotation = (
        (state.spin + Math.sin(time * .58 + state.phase) * floatTilt) * (1 - suction)
      ) * Math.PI / 180;
      const cosine = Math.abs(Math.cos(rotation));
      const sine = Math.abs(Math.sin(rotation));

      return {
        centerX:state.x + floatX + state.width * .5,
        centerY:state.y + floatY,
        halfWidth:(state.width * .5 * cosine + state.height * .5 * sine) * scale,
        halfHeight:(state.width * .5 * sine + state.height * .5 * cosine) * scale
      };
    };

    const resolveFlyingTagCollisions = (delta, time) => {
      collisionCooldowns.forEach((cooldown, pair) => {
        const nextCooldown = cooldown - delta;
        if (nextCooldown <= 0) collisionCooldowns.delete(pair);
        else collisionCooldowns.set(pair, nextCooldown);
      });

      for (let iteration = 0; iteration < 3; iteration += 1) {
        for (let first = 0; first < flyingTagStates.length; first += 1) {
          for (let second = first + 1; second < flyingTagStates.length; second += 1) {
            const pair = `${first}:${second}`;
            const a = flyingTagStates[first];
            const b = flyingTagStates[second];
            const boundsA = getFlyingTagCollisionBounds(a, time);
            const boundsB = getFlyingTagCollisionBounds(b, time);
            const centerDeltaX = boundsB.centerX - boundsA.centerX;
            const centerDeltaY = boundsB.centerY - boundsA.centerY;
            const overlapX = boundsA.halfWidth + boundsB.halfWidth
              - Math.abs(centerDeltaX);
            const overlapY = boundsA.halfHeight + boundsB.halfHeight
              - Math.abs(centerDeltaY);
            const tagsAreVisible = getFlyingTagSuction(a) < .82
              && getFlyingTagSuction(b) < .82;

            if (!tagsAreVisible || overlapX <= 0 || overlapY <= 0) continue;

            const useHorizontalNormal = overlapX < overlapY;
            const normalX = useHorizontalNormal
              ? Math.sign(centerDeltaX || second - first)
              : 0;
            const normalY = useHorizontalNormal
              ? 0
              : Math.sign(centerDeltaY || second - first);
            const overlap = useHorizontalNormal ? overlapX : overlapY;
            const correction = (overlap + 1.25) * .5;

            a.x -= normalX * correction;
            a.y -= normalY * correction;
            b.x += normalX * correction;
            b.y += normalY * correction;

            if (collisionCooldowns.has(pair)) continue;

            const relativeVelocityX = b.vx - a.vx;
            const relativeVelocityY = b.flowVelocityY + b.vy
              - a.flowVelocityY - a.vy;
            const velocityAlongNormal = relativeVelocityX * normalX
              + relativeVelocityY * normalY;

            if (velocityAlongNormal >= 0) continue;

            const restitution = .18;
            const impulseMultiplier = .45;
            const impulse = Math.min(
              22,
              -(1 + restitution) * velocityAlongNormal * .5 * impulseMultiplier
            );
            const impulseX = impulse * normalX;
            const impulseY = impulse * normalY;

            a.vx -= impulseX;
            a.vy -= impulseY;
            b.vx += impulseX;
            b.vy += impulseY;

            const tangentX = -normalY;
            const tangentY = normalX;
            const velocityAlongTangent = relativeVelocityX * tangentX
              + relativeVelocityY * tangentY;
            const frictionImpulse = Math.max(-3, Math.min(3,
              -velocityAlongTangent * .04
            ));
            a.vx -= frictionImpulse * tangentX;
            a.vy -= frictionImpulse * tangentY;
            b.vx += frictionImpulse * tangentX;
            b.vy += frictionImpulse * tangentY;

            const torqueDirection = Math.sign(
              velocityAlongTangent || centerDeltaX || normalY || 1
            );
            const angularImpulse = Math.min(2.2, impulse * .04);
            a.spin = Math.max(-4, Math.min(4,
              a.spin - torqueDirection * angularImpulse
            ));
            b.spin = Math.max(-4, Math.min(4,
              b.spin + torqueDirection * angularImpulse
            ));

            clampCollisionVelocity(a);
            clampCollisionVelocity(b);
            collisionCooldowns.set(pair, .22);
          }
        }
      }
    };

    const updateFlyingTags = (time, deltaTime) => {
      if (!flyingTagActive || heroIsScrollingOut) return;

      const delta = Math.min(deltaTime / 1000, .05);

      flyingTagStates.forEach(state => {
        const suctionAcceleration = 1 + getFlyingTagSuction(state) * 3.2;
        const targetFlowVelocityY = state.direction * state.speed * suctionAcceleration;
        const flowSmoothing = 1 - Math.exp(-delta / .12);
        state.flowVelocityY += (targetFlowVelocityY - state.flowVelocityY) * flowSmoothing;
        state.y += (state.flowVelocityY + state.vy) * delta;
        state.x += state.vx * delta;
        state.vx *= Math.pow(.18, delta);
        state.vy *= Math.pow(.18, delta);
        state.spin *= Math.pow(.34, delta);

        if (state.x < -58 || state.x > 58) {
          state.x = Math.max(-58, Math.min(58, state.x));
          state.vx *= -.58;
        }

        if (state.direction > 0 && state.y > state.exitOffset) {
          state.y = state.exitOffset;
          state.direction = -1;
          state.rewardDropArmed = true;
          state.x = (Math.random() - .5) * 28;
          state.flowVelocityY = 0;
          state.vy = 0;
          setFlyingTagState(state, state.messageIndex, true);
          state.axisWaveArmed = 'bottom';
        } else if (state.direction < 0 && state.y < -state.exitOffset) {
          state.y = -state.exitOffset;
          state.direction = 1;
          state.x = (Math.random() - .5) * 28;
          state.flowVelocityY = 0;
          state.vy = 0;
          setFlyingTagState(
            state,
            (state.messageIndex + 1) % heroTagMessages.length,
            false
          );
          state.axisWaveArmed = 'top';
        }

        if (state.axisWaveArmed === 'top'
          && state.direction > 0
          && state.y + state.height * .5
            >= -innerHeight * (.5 - flightFadeStart)) {
          state.axisWaveArmed = null;
          playHeroAxisWave('top');
        } else if (state.axisWaveArmed === 'bottom'
          && state.direction < 0
          && state.y - state.height * .5
            <= innerHeight * (.5 - flightFadeStart)) {
          state.axisWaveArmed = null;
          playHeroAxisWave('bottom');
        }

        if (state.direction < 0
          && state.rewardDropArmed
          && state.y <= innerHeight * .08) {
          state.rewardDropArmed = false;
          playHeroRewardRain(state.messageIndex);
        }
      });

      resolveFlyingTagCollisions(delta, time);
      flyingTagStates.forEach(state => renderFlyingTag(state, time, delta));
    };

    measureFlyingTags(false);
    flyingTagStates.forEach(state => renderFlyingTag(state, 0));
    addEventListener('resize', scheduleFlyingTagMeasure, {passive:true});

    const setFlyingTagActive = active => {
      flyingTagActive = active;
      heroParticles?.classList.toggle('is-paused', !flyingTagActive);
      heroBand.classList.toggle('is-motion-active', flyingTagActive);
      heroBand.classList.toggle('is-motion-paused', !flyingTagActive);
      heroBackdrop?.classList.toggle('is-motion-active', flyingTagActive);
      heroBackdrop?.classList.toggle('is-motion-paused', !flyingTagActive);
    };

    let heroTickerRunning = false;
    startHeroMotion = () => {
      if (heroIsScrollingOut) return;
      setFlyingTagActive(true);
      if (heroTickerRunning) return;
      gsap.ticker.add(updateFlyingTags);
      heroTickerRunning = true;
    };
    stopHeroMotion = () => {
      setFlyingTagActive(false);
      if (heroTickerRunning) {
        gsap.ticker.remove(updateFlyingTags);
        heroTickerRunning = false;
      }
      rewardRainTimeline?.kill();
      Object.values(heroAxisWaves).forEach(timeline => timeline.pause());
      gsap.set(Object.values(heroAxisLetters).flat(), {y:0, scaleY:1});
      gsap.set(heroRewardTags, {autoAlpha:0});
    };

    const flyingTagActivity = ScrollTrigger.create({
      trigger:'.hotels-hero',
      start:'top bottom',
      end:'bottom top',
      onToggle:self => {
        if (self.isActive) startHeroMotion();
        else stopHeroMotion();
      }
    });

    if (flyingTagActivity.isActive) startHeroMotion();
  }
} else if (heroBand) {
  activeHeroFlyingTagTracks.forEach((track, index) => {
    const spacing = Math.min(innerHeight * .16, track.offsetHeight * 1.25);
    gsap.set(track, {
      y:(index - (activeHeroFlyingTagTracks.length - 1) * .5) * spacing,
      yPercent:-50,
      autoAlpha:1
    });
  });
}

function buildHeroTransition() {
  if (reduced || !hero) return;

  const timeline = gsap.timeline({
    defaults:{ ease:'none' },
    scrollTrigger:{
      trigger:'.hotels-hero',
      start:'top top',
      end:'+=80%',
      // Фон точно следует скроллу, чтобы не оставаться поверх следующей сцены.
      scrub:true,
      pin:true,
      pinSpacing:true,
      anticipatePin:1,
      invalidateOnRefresh:true,
      onUpdate:self => {
        // Не останавливаем плашку, пока она ещё видима в переходе.
        setHeroScrollFading(self.progress > .96);
      }
    }
  });

  timeline
    .to(hero, {
      autoAlpha:0,
      y:-32,
      duration:.52,
      ease:'power1.inOut',
      overwrite:'auto'
    }, 0)
    .to([
      heroFlightMask,
      ...Object.values(heroAxisLabels),
      heroRewardRain,
      heroParticles
    ], {
      autoAlpha:0,
      y:-16,
      duration:.68,
      ease:'power1.inOut',
      overwrite:'auto'
    }, .08)
    .to(heroBackdrop, {
      autoAlpha:0,
      duration:.64,
      ease:'sine.inOut',
      overwrite:'auto'
    }, .28);
}

buildHeroTransition();

scrollCue?.addEventListener('click', () => {
  document.getElementById('analysis')?.scrollIntoView({behavior:reduced ? 'auto' : 'smooth'});
});

const analysis = document.querySelector('.hotel-analysis');
const analysisStage = document.querySelector('.hotel-analysis__stage');
const analysisContent = document.querySelector('.hotel-analysis__content');
const pageGradientHost = document.querySelector('[data-neat-gradient-host]');
const analysisPrompt = document.querySelector('.hotel-analysis__prompt');
const analysisAction = document.querySelector('.hotel-analysis__action');
const analysisForm = document.getElementById('hotelForm');
const hotelUrlInput = document.getElementById('hotelUrl');
const analysisRipple = document.querySelector('[data-hotel-url-ripple]');
const analysisResultWave = document.querySelector('.hotel-analysis__result-wave');
const analysisStatusesRegion = document.querySelector('.hotel-analysis__statuses');
const analysisStatuses = gsap.utils.toArray('.hotel-analysis__status');
const analysisCards = gsap.utils.toArray('.hotel-analysis-card');
const analysisCardAnchors = gsap.utils.toArray('.hotel-analysis-card-anchor');
const hotelUrlPreset = hotelUrlInput?.value || 'my-hotel.ru';
const hotelUrlTyping = {characters:0};
let unmountPageGradient = null;
let pageGradientActivation = null;
let pageGradientModule = null;
let analysisSequence = null;
let analysisReveal = null;
let analysisGradientTimer = 0;
let analysisExperience = null;
let analysisFlowStarted = false;
let analysisResultWaveTimeline = null;
let analysisRimAnimations = [];
let analysisTextFlowAnimations = [];
let analysisMotionAnimationsReady = false;

function syncAnalysisMotionSpeed(progress) {
  if (!analysisMotionAnimationsReady) {
    const animations = analysisAction?.getAnimations?.({subtree:true}) || [];
    analysisRimAnimations = animations.filter(animation => animation.animationName === 'hotelRimRun');
    analysisTextFlowAnimations = animations.filter(animation => animation.animationName === 'hotelStatusTextFlow');
    analysisMotionAnimationsReady = true;
  }

  const rimRate = gsap.utils.interpolate(2, 8.4, progress);
  const textFlowRate = gsap.utils.interpolate(1, 3.4, progress);

  analysisRimAnimations.forEach(animation => {
    if (typeof animation.updatePlaybackRate === 'function') animation.updatePlaybackRate(rimRate);
    else animation.playbackRate = rimRate;
  });
  analysisTextFlowAnimations.forEach(animation => {
    if (typeof animation.updatePlaybackRate === 'function') animation.updatePlaybackRate(textFlowRate);
    else animation.playbackRate = textFlowRate;
  });
}

function getAnalysisCardFlights() {
  const x = Math.min(500, innerWidth * .31);
  const y = Math.min(230, innerHeight * .24);
  const wideX = Math.min(560, innerWidth * .36);

  return [
    {x:-x, y:-y, z:80, rotation:-12, scale:1.2},
    {x, y:-y * .92, z:-65, rotation:12, scale:.86},
    {x:0, y:y * 1.25, z:35, rotation:-2.5, scale:1.08},
    {x:-wideX, y:y * .78, z:-30, rotation:6.5, scale:.92},
    {x:wideX, y:y * .68, z:70, rotation:-7, scale:1.18}
  ];
}

function getAnalysisActionCenterY() {
  if (!analysisStage || !analysisContent || !analysisAction) return 0;
  const actionCenter = analysisContent.offsetTop
    + analysisAction.offsetTop
    + analysisAction.offsetHeight * .5;
  return analysisStage.clientHeight * .5 - actionCenter;
}

function enableAnalysisCardParallax() {
  if (!analysis || !analysisCardAnchors.length
    || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;

  const depths = [56, 48, 68, 52, 60];
  const controllers = analysisCardAnchors.map((anchor, index) => ({
    x:gsap.quickTo(anchor, 'x', {duration:.62, ease:'power3.out'}),
    y:gsap.quickTo(anchor, 'y', {duration:.68, ease:'power3.out'}),
    rotationX:gsap.quickTo(anchor, 'rotationX', {duration:.72, ease:'power3.out'}),
    rotationY:gsap.quickTo(anchor, 'rotationY', {duration:.72, ease:'power3.out'}),
    depth:depths[index]
  }));

  addEventListener('pointermove', event => {
    const sectionBounds = analysis.getBoundingClientRect();
    if (sectionBounds.bottom <= 0 || sectionBounds.top >= innerHeight) return;

    const x = gsap.utils.clamp(-1, 1, (event.clientX / innerWidth - .5) * 2);
    const y = gsap.utils.clamp(-1, 1, (event.clientY / innerHeight - .5) * 2);

    controllers.forEach(controller => {
      controller.x(-x * controller.depth);
      controller.y(-y * controller.depth * .34);
      controller.rotationX(y * 5.6);
      controller.rotationY(-x * 7.6);
    });
  }, {passive:true});
}

function playAnalysisResultWave() {
  if (!analysisResultWave) return;
  analysisResultWaveTimeline?.kill();
  gsap.set(analysisResultWave, {autoAlpha:0, scale:.92});
  analysisResultWaveTimeline = gsap.timeline({
    onComplete:() => {
      analysisResultWaveTimeline = null;
    }
  })
    .to(analysisResultWave, {
      autoAlpha:.86,
      scale:1.03,
      duration:.35,
      ease:'sine.inOut'
    })
    .to({}, {duration:.85})
    .to(analysisResultWave, {
      autoAlpha:0,
      scale:1.12,
      duration:.8,
      ease:'sine.inOut'
    });
}

if (!reduced && analysis) {
  enableAnalysisCardParallax();
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
  gsap.set(analysisCards, {
    autoAlpha:0,
    x:0,
    y:0,
    z:0,
    scale:.18,
    rotation:0,
    transformOrigin:'50% 50%'
  });
  gsap.set(analysisResultWave, {autoAlpha:0, scale:.92, transformOrigin:'50% 50%'});
  gsap.set(analysisAction, {scale:1, rotation:0, y:0, transformOrigin:'50% 50%'});
  syncAnalysisMotionSpeed(0);
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
        syncAnalysisMotionSpeed(self.progress);
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
  const completeStatusIndex = analysisStatuses.findIndex(
    status => status.classList.contains('hotel-analysis__status--complete')
  );
  const completeStatusHold = 1.1;
  const getStatusStart = index => statusStart + index * statusStep
    + (index > completeStatusIndex ? completeStatusHold : 0);
  const finalStatusStart = getStatusStart(finalStatusIndex);
  const completeStatusStart = getStatusStart(completeStatusIndex);

  analysisSequence.to(analysisAction, {
    rotation:-4,
    duration:completeStatusStart,
    ease:'none'
  }, 0);

  analysisSequence.to(hotelUrlInput, {
    backgroundColor:'#120be3',
    '--hotel-fill-highlight':'rgba(255,255,255,.18)',
    '--hotel-fill-glow':'rgba(54,78,255,.74)',
    '--hotel-fill-depth':'rgba(0,0,92,.38)',
    boxShadow:'inset 0 1px 0 rgba(255,255,255,.32), inset 0 -24px 48px rgba(0,0,82,.34), inset 22px 0 44px rgba(83,96,255,.16)',
    duration:.48,
    ease:'power2.inOut'
  }, completeStatusStart - .48);

  analysisSequence.to(analysisAction, {
    y:getAnalysisActionCenterY,
    duration:.72,
    ease:'sine.inOut'
  }, completeStatusStart - .72);

  analysisSequence.fromTo(analysisCards,
    {
      autoAlpha:0,
      x:index => getAnalysisCardFlights()[index].x * .58,
      y:index => getAnalysisCardFlights()[index].y * .58,
      z:index => getAnalysisCardFlights()[index].z * .58,
      scale:.76,
      rotation:index => getAnalysisCardFlights()[index].rotation * .58
    },
    {
      autoAlpha:1,
      x:index => getAnalysisCardFlights()[index].x,
      y:index => getAnalysisCardFlights()[index].y,
      z:index => getAnalysisCardFlights()[index].z,
      scale:index => getAnalysisCardFlights()[index].scale,
      rotation:index => getAnalysisCardFlights()[index].rotation,
      duration:.3,
      stagger:.018,
      ease:'power3.out',
      onStart:playAnalysisResultWave
    },
    completeStatusStart
  );

  analysisSequence.to(analysisCards, {
    autoAlpha:0,
    duration:.28,
    stagger:{each:.012, from:'end'},
    ease:'power2.in'
  }, finalStatusStart - .38);

  analysisSequence.to(analysisForm, {
    autoAlpha:0,
    scale:.985,
    duration:.34,
    ease:'power2.out'
  }, finalStatusStart - .36);

  analysisSequence.to(analysisAction, {
    rotation:0,
    duration:.34,
    ease:'power2.inOut'
  }, finalStatusStart - .36);

  analysisStatuses.forEach((status, index) => {
    const at = getStatusStart(index);
    const isFinal = index === finalStatusIndex;
    const isComplete = status.classList.contains('hotel-analysis__status--complete');

    analysisSequence.fromTo(status,
      {
        autoAlpha:0,
        y:isFinal ? 12 : 34,
        scale:isFinal ? .985 : .94,
        rotationX:isFinal ? 0 : -10,
        filter:isComplete ? 'blur(0px)' : `blur(${isFinal ? 6 : 12}px)`
      },
      {
        autoAlpha:1,
        y:0,
        scale:1,
        rotationX:0,
        filter:'blur(0px)',
        duration:isFinal ? .62 : .34,
        ease:isFinal ? 'sine.out' : 'power2.out'
      },
      at
    );

    if (index < analysisStatuses.length - 1) {
      analysisSequence.to(status, {
        autoAlpha:0,
        y:-34,
        scale:1.04,
        rotationX:10,
        filter:isComplete ? 'blur(0px)' : 'blur(12px)',
        duration:.32,
        ease:'power2.in'
      }, at + .70 + (isComplete ? completeStatusHold : 0));
    }
  });

  analysisSequence.to({}, {duration:.92});
  analysisSequence.to(analysisAction, {
    scale:1.7,
    duration:analysisSequence.duration(),
    ease:'none'
  }, 0);
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
