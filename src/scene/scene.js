import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
document.body.classList.add('is-loading');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

// Сквозной прогресс страницы: индикатор движется внутри безопасного fixed-трека.
// Используем общий GSAP ticker проекта вместо второго scroll-цикла/плагина.
const scrollIndicator = document.getElementById('scrollIndicator');
const scrollIndicatorMarker = document.getElementById('scrollIndicatorMarker');
const setScrollIndicatorY = scrollIndicatorMarker && gsap.quickSetter(scrollIndicatorMarker, 'y', 'px');
let scrollIndicatorRange = 0;
let scrollIndicatorProgress = 0;
let scrollIndicatorDrawn = -1;
function refreshScrollIndicator() {
  if (!scrollIndicator || !scrollIndicatorMarker) return;
  scrollIndicatorRange = Math.max(0, scrollIndicator.clientHeight - scrollIndicatorMarker.offsetHeight);
  scrollIndicatorDrawn = -1;
}
refreshScrollIndicator();
addEventListener('resize', refreshScrollIndicator, { passive:true });
addEventListener('load', refreshScrollIndicator, { once:true, passive:true });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshScrollIndicator);
gsap.ticker.add(() => {
  // У position:fixed offsetParent всегда null, поэтому видимость проверяем
  // по адаптивному брейкпоинту, а не по offsetParent.
  if (!setScrollIndicatorY || innerWidth <= 900) return;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const target = gsap.utils.clamp(0, 1, scrollY / maxScroll);
  scrollIndicatorProgress += (target - scrollIndicatorProgress) * (reduced ? 1 : 0.095);
  if (Math.abs(scrollIndicatorProgress - scrollIndicatorDrawn) < 0.00008) return;
  scrollIndicatorDrawn = scrollIndicatorProgress;
  setScrollIndicatorY(scrollIndicatorRange * scrollIndicatorProgress);
});

// Цвет единого хедера следует за активной сценой существующего scroll-сценария.
const siteHeader = document.getElementById('siteHeader');
function syncHeaderTheme() {
  if (!siteHeader) return;
  const dark = ['is-loading','is-dark','menu-on-dark','menu-open']
    .some(className => document.body.classList.contains(className));
  siteHeader.dataset.theme = dark ? 'dark' : 'light';
}
syncHeaderTheme();
addEventListener('scroll', syncHeaderTheme, { passive:true });
addEventListener('resize', syncHeaderTheme, { passive:true });
// Две стрелки пружинят на месте: короткое сжатие и мягкая GSAP-отдача.
const scrollCue = document.querySelector('.scroll-cue');
let scrollCueLoop = null;
if (scrollCue) {
  scrollCue.insertAdjacentHTML('afterbegin',
    '<svg class="scroll-cue-arrows" viewBox="0 0 40 31" aria-hidden="true"><path class="scroll-chevron" pathLength="1" d="M3 3.5L20 12L37 3.5"/><path class="scroll-chevron" pathLength="1" d="M3 16.5L20 25L37 16.5"/></svg>'
  );
  const cueArrows = scrollCue.querySelectorAll('.scroll-chevron');
  gsap.set(scrollCue, { autoAlpha: 0, y: 12 });
  if (reduced) {
    gsap.set(cueArrows, { opacity: .78, strokeDasharray: 1, strokeDashoffset: 0 });
  } else {
    gsap.set(cueArrows, {
      opacity: .84,
      strokeDasharray: 1,
      strokeDashoffset: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      transformOrigin: '50% 50%'
    });
    scrollCueLoop = gsap.timeline({ paused: true, repeat: -1, repeatDelay: .42 })
      .to(cueArrows[0], {
        opacity: 1, y: -1, scaleX: 1.15, scaleY: .68,
        duration: .16, ease: 'power2.in'
      }, 0)
      .to(cueArrows[0], {
        opacity: .84, y: 0, scaleX: 1, scaleY: 1,
        duration: .78, ease: 'elastic.out(1.25,.28)'
      }, .16)
      .to(cueArrows[1], {
        opacity: 1, y: -1, scaleX: 1.15, scaleY: .68,
        duration: .16, ease: 'power2.in'
      }, .12)
      .to(cueArrows[1], {
        opacity: .84, y: 0, scaleX: 1, scaleY: 1,
        duration: .78, ease: 'elastic.out(1.25,.28)'
      }, .28);
  }
}

const box = document.querySelector('.box');
// getPropertyValue у --d отдаёт строку calc(...), из неё число не достать.
// коэффициенты держим в JS рядом с теми же значениями в CSS
const RATIO = { w: 0.4840, d: 0.0620, r: 0.0694, inset: 0.0129 };   // d: было 0.0482, толще ради объёма
const sliceZ = [];       // целевые позиции слоёв торца, нужны для сборки в интро
let rimBuilt = false;    // после интро слои ставим сразу на место

// объём: стопка копий скруглённой формы. пересобирается при ресайзе,
// потому что толщина считается от высоты корпуса
function buildRim() {
  const D = box.offsetHeight * RATIO.d;
  const N = Math.max(8, Math.round(D / 3.8));   // шаг 3.8px, стыков не видно
  sliceZ.length = 0;
  let html = '';
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), z = -D / 2 + t * D;
    // шёлковый борт: ровный ход светлоты + узкий блик-фаска у лицевой кромки
    const l = 11 + t * 8 + 7 * Math.pow(t, 7);
    sliceZ.push(z);
    // до интро transform не ставим: слои разъезжаются по z через GSAP.
    // после интро сразу на место, иначе после ресайза торец схлопнется
    const tr = rimBuilt ? `transform:translateZ(${z.toFixed(2)}px);` : '';
    html += `<div class="slice" style="${tr}background:hsl(207 18% ${l.toFixed(1)}%)"></div>`;
  }
  document.querySelector('.rim').innerHTML = html;
}
buildRim();
addEventListener('resize', buildRim);

// Приложение из репозитория nikaspro/RD-APP (legacy/ChiposhPark.html).
// Отдельный HTML не блокирует разбор лендинга, а iframe изолирует стили.
const frame = document.getElementById('appFrame');
let screenP = -1;   // объявлено до healFrame: он сбрасывает прогресс при перезаписи
const APP_URL = '/assets/embedded/plan-app.html';
// SS=1: суперсемплинг ломал геометрию экрана. плотность растра добираем
// меньшим финальным масштабом, а не раздуванием документа
const SS = 1;
frame.style.width  = (393 * SS) + 'px';
frame.style.height = (812 * SS) + 'px';

let screenReady = false;
function writeApp() {
  screenReady = false;
  frame.src = APP_URL;
}
frame.addEventListener('load', () => {
  screenReady = true;
  screenP = -1;      // прогресс пошлём заново
  fitFrame();
});

// сторож: если кадр всё же оказался пустым, пишем заново.
// проверка дешёвая, поэтому живёт всю сессию, а не первые секунды
(function healFrame() {
  let pending = false;
  setInterval(() => {
    let alive = true;
    try {
      const d = frame.contentDocument;
      alive = !!(d && d.querySelector('.grp'));
    } catch (err) { alive = true; }   // кросс-ориджин: лечить нечего
    if (alive) { pending = false; return; }
    if (!screenReady) return;         // документ ещё грузится, мешать нельзя
    if (pending) return;              // одна перезапись за раз
    pending = true;
    writeApp();
  }, 600);
})();

function fitFrame() {
  const sc = document.querySelector('.screen');
  // сжимаем по ширине, высоту документа не растягиваем: иначе снизу белая полоса
  const k = sc.clientWidth / (393 * SS);
  frame.style.transform = 'scale(' + k + ')';
  frame.style.height = Math.max(812 * SS, sc.clientHeight / k) + 'px';
}
fitFrame();
addEventListener('resize', fitFrame);

// прелоадер уходит, когда готовы и страница, и экран внутри
const preStart = performance.now();
function tryFinish() {
  const wait = Math.max(0, 500 - (performance.now() - preStart));   // минимум 500мс
  setTimeout(() => { if (typeof finishPreloader === 'function') finishPreloader(); }, wait);
}
if (document.readyState === 'complete') tryFinish();
else addEventListener('load', tryFinish);
setTimeout(tryFinish, 6000);   // страховка: не залипать, если что-то не догрузилось

// Надписи: один paused-таймлайн GSAP, прогресс задаём сами из тикера.
// Важно: кадры дискретные — блок либо есть целиком, либо его уже нет.
// Так при скролле не остаются обрезанные или полупрозрачные слова.
// [0] после влёта карточек и появления плана, [3] — вход в зарядку
const CAP_START = [0.600, 0.832, 1.016, 1.240];
// длина таймлайна: позиции заданы в единицах старой шкалы p и уходят за 1.0,
// поэтому прогресс нормируем на эту длину, а не на единицу
const CAP_TL_LEN = 1.45;
const CAP_HOLD  = 0.070;
const CAP_HOLD0 = 0.120;   // «Куда сходить» остаётся читаемым дольше
const CAP_EXIT0 = 0.068;   // и уходит отдельным мягким GSAP-переходом
const CAP_HOLD2 = 0.105;   // «помощник» держится дольше: под ним закрывается чек-лист
const WEATHER_STAGE_IN = CAP_START[0] + CAP_HOLD0 + 0.008;
const WEATHER_STAGE_OUT = CAP_START[1] - 0.008;
const WEATHER_BLEND = 0.020;
const capTl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });

// текстовые узлы заголовка режем на слова в масках; em и чипсы не трогаем
function splitCapWords(el) {
  const out = [];
  const host = el.querySelector('.caption-heading') || el;
  [...host.childNodes].forEach(node => {
    if (node.nodeType !== 3) return;                 // только голый текст
    const words = node.textContent.trim().split(/\s+/).filter(Boolean);
    if (!words.length) { node.remove(); return; }
    const frag = document.createDocumentFragment();
    words.forEach((w, i) => {
      const m = document.createElement('span');
      m.className = 'cw';
      const inner = document.createElement('i');
      inner.textContent = w;
      m.appendChild(inner);
      frag.appendChild(m);
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
      out.push(inner);
    });
    host.replaceChild(frag, node);
  });
  return out;
}

CAP_START.forEach((at, i) => {
  if (i === 3) return;   // «заряжаем поездку» живёт своей фазой зарядки
  const el = document.getElementById('cap' + i);
  const ws = splitCapWords(el);
  const hold = i === 0 ? CAP_HOLD0 : (i === 2 ? CAP_HOLD2 : CAP_HOLD);
  const end = at + hold;
  gsap.set(el, { autoAlpha: 0 });
  gsap.set(ws, { yPercent: 0 });
  if (i === 0) {
    capTl.set(el, { autoAlpha: 1, x: 0, y: 0, scale: 1, filter: 'blur(0px)' }, at)
      .to(el, {
        autoAlpha: 0, x: -44, y: -18, scale: .985, filter: 'blur(11px)',
        duration: CAP_EXIT0, ease: 'power2.in'
      }, end);
  } else {
    capTl.set(el, { autoAlpha: 1 }, at)
      .set(el, { autoAlpha: 0 }, end);
  }
});
// длительность таймлайна прибиваем к 1.0: позиции выше заданы в единицах
// прогресса, и без этой заглушки они бы сжались под фактическую длину
// боковые блоки: тот же короткий ход
function capSide(sel, at, hold) {
  gsap.set(sel, { autoAlpha: 0 });
  capTl.set(sel, { autoAlpha: 1 }, at)
    .set(sel, { autoAlpha: 0 }, at + (hold || CAP_HOLD));
}
// чек-лист помощника: пункты приходят по одному и тут же зачёркиваются —
// помощник делает это за гостя, поэтому список закрывается сам
[...document.querySelectorAll('#side2 .tick')].forEach((el, i) => {
  const at = CAP_START[2] + 0.014 + i * 0.013;
  const cross = at + 0.048;   // сперва весь список прочитывается, потом закрывается
  capTl.fromTo(el, { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.024, ease: 'expo.out' }, at)
    // мятная заливка наезжает по пилюле
    .fromTo(el.querySelector('u'), { scaleX: 0 },
      { scaleX: 1, duration: 0.026, ease: 'power2.inOut' }, cross)
    // подпись переходит на тёмный по ходу заливки, галочка раскрывается
    .to(el.querySelector('b'), { color: '#14202A', duration: 0.022 }, cross + 0.008)
    .to(el.querySelector('s'), { width: 26, duration: 0.016, ease: 'power2.out' }, cross + 0.020);
});

function capExit0(sel, x, y) {
  const at = CAP_START[0], end = at + CAP_HOLD0;
  gsap.set(sel, { autoAlpha: 0 });
  capTl.set(sel, { autoAlpha: 1, x: 0, y: 0, filter: 'blur(0px)' }, at)
    .to(sel, {
      autoAlpha: 0, x, y, filter: 'blur(9px)',
      duration: CAP_EXIT0, ease: 'power2.in'
    }, end);
}
capExit0('#side0', -28, -10);
capExit0('#awave', 34, -8);
capSide('#side2', CAP_START[2], CAP_HOLD2);

// Облако тегов справа появляется и исчезает целиком вместе с надписью.
gsap.set('#ctags', { autoAlpha: 0 });
capTl.set('#ctags', { autoAlpha: 1, x: 0, y: 0, filter: 'blur(0px)' }, CAP_START[0])
  .to('#ctags', {
    autoAlpha: 0, x: 42, y: 10, filter: 'blur(9px)',
    duration: CAP_EXIT0, ease: 'power2.in'
  }, CAP_START[0] + CAP_HOLD0);


// реальный твин-заглушка держит длину: пустой set() длину не задаёт
capTl.to({ _: 0 }, { _: 1, duration: 0.001 }, CAP_TL_LEN);
capTl.progress(0).pause();

// стартовая поза берётся с кадра: крупно, наклон в плоскости, сдвиг вправо-вниз
const START = { rx: 22, ry: 0, rz: 0, sc: 1.58, x: 0, y: 220 };
// поза покоя: углы не уходят в ноль, иначе корпус читается плоским — торца не видно
const REST  = { rx: 3, ry: -14, rz: 0 };
// поза нырка и возврата: ракурс снизу, без бокового разворота и крена
const DIVE  = { rx: 15, ry: -2, rz: 0, x: 0, y: 120 };
const END_SCALE = 1.0;

let pTarget = 0, p = 0, vTarget = 0, v = 0;
let lastP = 0;

// ---- пятая фаза: шары, импульс, тёмная тема, финал ----
const ORBS_IN   = 0.90;   // шары выезжают под надписью «Заряжаем поездку»
const ORBS_OUT  = 0.945;   // и уходят вверх, освобождая кадр

const orbs = [...document.querySelectorAll('.orb')].map(el => ({
  el,
  speed: parseFloat(el.dataset.speed),
  setC: gsap.quickSetter(el, 'css')
}));

// ---- прелоадер ----
// пятна летят вверх по кругу, пока грузится; счётчик идёт к 100
const preEl  = document.getElementById('pre');
const preLogo = document.getElementById('preLogo');
// центровка живёт в трансформе GSAP, поэтому дальнейшие x/y её не затирают
gsap.set(preLogo, { xPercent: -50, yPercent: -50 });
const preBlobs = [
  { el: document.getElementById('pb0'), speed: 1.00, drift: -3 },
  { el: document.getElementById('pb1'), speed: 1.45, drift:  4 },
  { el: document.getElementById('pb2'), speed: 0.78, drift: -2 }
];
// каждое пятно крутит свой цикл: общий таймлайн синхронизировал бы их
// и параллакс пропал бы после первого повтора
preBlobs.forEach(b => {
  b.loop = gsap.fromTo(b.el,
    { y: 0, x: 0 },
    {
      y: () => -(innerHeight * 1.9),
      x: b.drift * 10,
      duration: 3.6 / b.speed,
      ease: 'none',
      repeat: -1
    });
});

// логотип чуть дышит, пока идёт загрузка
gsap.fromTo(preLogo, { scale: .985 }, {
  scale: 1.015, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1
});

// разбивка текста: строки в маски, внутри буквы. SplitText платный,
// поэтому режем руками — структура та же, что в Mask Reveal и Wave Up из библиотеки
function splitChars(el) {
  const lines = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = '';
  const chars = [];
  lines.forEach(line => {
    const mask = document.createElement('span');
    mask.className = 'm-line';
    const inner = document.createElement('span');
    [...line].forEach(ch => {
      const c = document.createElement('span');
      c.textContent = ch;
      c.style.display = 'inline-block';
      c.style.whiteSpace = 'pre';
      inner.appendChild(c);
      chars.push(c);
    });
    mask.appendChild(inner);
    el.appendChild(mask);
  });
  return chars;
}

// абзац: слова остаются неразрывными блоками, внутри буквы отдельно
function splitWordChars(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.innerHTML = '';
  const chars = [];
  words.forEach((w, i) => {
    const word = document.createElement('span');
    word.className = 'm-word';
    [...w].forEach(ch => {
      const c = document.createElement('span');
      c.textContent = ch;
      word.appendChild(c);
      chars.push(c);
    });
    el.appendChild(word);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
  return chars;
}

const logoSlot  = document.getElementById('logoSlot');
const introLayer = document.getElementById('introLayer');
const heroH1 = document.getElementById('heroH1');
const heroP  = document.getElementById('heroP');
const h1Chars = splitChars(heroH1);
const pChars  = splitWordChars(heroP);
// прячем заранее и анимируем через .to: у .from со стаггером буквы
// до своей очереди остаются в конечном состоянии, то есть уже видны
gsap.set(h1Chars, { yPercent: 118 });   // маска строки прячет их до подъёма
gsap.set(pChars,  { opacity: 0, y: 14 });
const hdrItems = ['hi0','hi2','menuTrigger'].map(id => document.getElementById(id)).filter(Boolean);
gsap.set(hdrItems, { y: -14 });   // .from здесь не годится: в CSS opacity уже 0

// телефон и текст ждут окончания интро
// корпус собирается по слоям, а не проявляется целиком
const faceBack  = document.querySelector('.face.back');
const faceFront = document.querySelector('.face.front');
const rimSlices = [...document.querySelectorAll('.slice')];
const screenEl  = document.querySelector('.screen');
const islandEl  = document.getElementById('island');

gsap.set(introLayer, { y: 150 });   // приезжает раньше: см. позицию build в таймлайне
gsap.set(faceBack,  { opacity: 0, scale: .88 });
gsap.set(rimSlices, { opacity: 0, z: 0 });
gsap.set(faceFront, { opacity: 0 });
gsap.set(screenEl,  { opacity: 0 });
gsap.set(islandEl,  { opacity: 0, scaleX: .28 });   // центр держит обёртка
const heroGlow = document.getElementById('heroGlow');
// тикер пишет прозрачность каждый кадр, поэтому интро крутит отдельный множитель
const glowIn = { v: 0, sc: 1.08 };

let loadDone = false;
function finishPreloader() {
  if (loadDone) return;
  loadDone = true;
  gsap.killTweensOf(preLogo);
  gsap.set(preLogo, { scale: 1 });   // без этого a.width берётся с дыхания и посадка уезжает

  // логотип переезжает из центра в шапку: считаем дельту между прямоугольниками,
  // двигаем трансформом, поэтому раскладка не пересчитывается
  const a = preLogo.getBoundingClientRect();
  const b = logoSlot.getBoundingClientRect();
  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  const k  = b.width / a.width;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.to(preBlobs.map(x => x.el), {
      y: () => -(innerHeight * 2.1), duration: 0.7, ease: 'power2.inOut', stagger: .04
    }, 0)
    .to(preLogo, { x: dx, y: dy, scale: k, duration: 0.6, ease: 'power4.inOut' }, .05)
    .add(() => {
      // подмена на статичный логотип шапки в момент совпадения геометрии
      logoSlot.style.opacity = 1;
      preLogo.style.opacity = 0;
      preBlobs.forEach(x => x.loop && x.loop.kill());
      preEl.remove();
      document.body.classList.remove('is-loading');
    })
    .to(hdrItems, { opacity: 1, y: 0, duration: .4, stagger: .05 }, '-=0.1')
    .to(glowIn, { v: 1, sc: 1, duration: 1.6, ease: 'power2.out' }, 0)
    .set([heroH1, heroP], { opacity: 1 })
    // мягкое проявление по буквам: только opacity, y и лёгкий блюр
    // подъём из-под маски: длинный expo.out и мелкий стаггер дают мягкий накат
    .to(h1Chars, {
      yPercent: 0,
      duration: 1.25, ease: 'expo.out', stagger: .026
    }, '-=0.2')
    .to(pChars, {
      opacity: 1, y: 0,
      duration: .9, ease: 'expo.out', stagger: .005
    }, '-=0.75')
    .addLabel('textDone')
    // сборка: спинка, торец слоями, лицо, экран, шторка
    .addLabel('build', '-=1.85')
    .to(introLayer, { y: 0, duration: 1.5, ease: 'power2.out' }, 'build')
    .to(faceBack, { opacity: 1, scale: 1, duration: .5, ease: 'power2.out' }, 'build')
    .to(rimSlices, {
      opacity: 1,
      z: i => sliceZ[i],
      duration: .55, ease: 'power2.out', stagger: .014
    }, 'build+=0.12')
    .to(faceFront, { opacity: 1, duration: .45, ease: 'power2.out' }, 'build+=0.5')
    .to(screenEl, { opacity: 1, duration: .5, ease: 'power2.out' }, 'build+=0.66')
    /* Верхний Dynamic Island теперь рисует оболочка Devices.css.
       Финальное уведомление #island остаётся скрытым до своей scroll-фазы. */
    .set(islandEl, { opacity: 0, scaleX: 1 }, 'build+=0.82')
    .add(() => {
      rimBuilt = true;   // дальше ресайз восстанавливает торец сразу на месте
      // после интро буквам ускорение не нужно, снимаем will-change и склеиваем слои
      gsap.set([...h1Chars, ...pChars], { clearProps: 'all' });
      heroH1.style.willChange = 'auto';
      heroP.style.willChange = 'auto';
    })
    // Подсказка появляется только после полного проявления описания.
    .to(scrollCue, {
      autoAlpha: 1, y: 0, duration: reduced ? .2 : .7, ease: 'power3.out'
    }, 'textDone+=.12')
    .add(() => { if (scrollCueLoop) scrollCueLoop.play(0); }, 'textDone+=.42');
}

// полноэкранное меню
(() => {
  const menu = document.getElementById('siteMenu');
  const trigger = document.getElementById('menuTrigger');
  const close = document.getElementById('menuClose');
  const links = [...menu.querySelectorAll('[data-menu-close]')];
  const languageButtons = [...menu.querySelectorAll('.menu-language')];
  let isOpen = false;
  let returnFocus = null;

  function setMenu(open) {
    if (open === isOpen) return;
    isOpen = open;
    if (open) returnFocus = document.activeElement;
    trigger.setAttribute('aria-expanded', String(open));
    trigger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    menu.setAttribute('aria-hidden', String(!open));
    menu.classList.toggle('is-open', open);
    document.body.classList.toggle('menu-open', open);
    document.body.classList.remove('header-hidden');
    syncHeaderTheme();
    if (open) setTimeout(() => {
      links[0]?.focus({ preventScroll:true });
      menu.scrollTop = 0;
    }, 180);
    else if (returnFocus instanceof HTMLElement) returnFocus.focus({ preventScroll:true });
  }

  trigger.addEventListener('click', () => setMenu(!isOpen));
  close.addEventListener('click', () => setMenu(false));
  links.forEach(link => link.addEventListener('click', () => setMenu(false)));
  languageButtons.forEach(button => button.addEventListener('click', () => {
    languageButtons.forEach(item => item.classList.toggle('is-on', item === button));
    document.documentElement.lang = button.dataset.language;
  }));
  menu.addEventListener('wheel', event => {
    if (event.deltaY > 8) setMenu(false);
  }, { passive: true });
  addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
    if (event.key !== 'Tab' || !isOpen) return;
    const focusable = [trigger, ...menu.querySelectorAll('a[href],button:not([disabled])')]
      .filter(element => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
  matchMedia('(min-width:761px)').addEventListener('change', event => {
    if (event.matches) setMenu(false);
  });
})();

// Посимвольный GSAP-roll для пунктов меню и ссылок в подвале.
// Верхняя строка уходит за маску, а её копия одним оборотом поднимается снизу.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rollLinks = document.querySelectorAll('a[href]');

  rollLinks.forEach(link => {
    if (link.closest('.site-header') || link.matches('.menu-business-link,.menu-download-link')) return;
    const label = link.textContent.trim();
    if (!label) return;

    link.setAttribute('aria-label', label);
    const line = document.createElement('span');
    line.className = 'letter-roll';

    Array.from(label).forEach(character => {
      const letter = document.createElement('span');
      letter.className = 'roll-letter';

      const front = document.createElement('span');
      front.className = 'roll-front';
      front.textContent = character === ' ' ? '\u00a0' : character;

      const back = document.createElement('span');
      back.className = 'roll-back';
      back.setAttribute('aria-hidden', 'true');
      back.textContent = character === ' ' ? '\u00a0' : character;

      letter.append(front, back);
      line.append(letter);
    });

    link.textContent = '';
    link.append(line);
    if (reduced) return;

    const fronts = line.querySelectorAll('.roll-front');
    const backs = line.querySelectorAll('.roll-back');
    gsap.set(backs, { yPercent: 0, rotationX: 72, transformOrigin: '50% 0%' });

    const roll = gsap.timeline({ paused: true, defaults: { duration: .48, ease: 'power3.inOut' } })
      .to(fronts, { yPercent: -112, rotationX: -72, stagger: .024 }, 0)
      .to(backs,  { yPercent: -100, rotationX: 0, stagger: .024 }, 0);

    link.addEventListener('mouseenter', () => roll.play());
    link.addEventListener('mouseleave', () => roll.reverse());
    link.addEventListener('focus', () => roll.play());
    link.addEventListener('blur', () => roll.reverse());
  });
})();

// магнит гигантской кнопки «Погнали»: тот же паттерн, что у кнопки шапки
// (overwrite:'auto' сохраняет покачивание), силы ужаты под размер
(() => {
  const zone = document.querySelector('.go-band');
  const btn = document.querySelector('.go-btn');
  if (!zone || !btn || matchMedia('(hover: none)').matches) return;
  const label = btn.querySelector('.go-t');

  const STRENGTH = 0.06;
  const LABEL_STRENGTH = 0.035;

  gsap.to(btn, {
    keyframes: { rotation: [1.6, -1.2, 0.9, -0.6, 0.4, -0.25, 0.12, -0.06, 0] },
    duration: 1.5,
    repeat: -1,
    ease: 'none'
  });

  zone.addEventListener('mousemove', e => {
    const r = zone.getBoundingClientRect();
    const mapX = gsap.utils.mapRange(r.left, r.right, -r.width / 2, r.width / 2, e.clientX);
    const mapY = gsap.utils.mapRange(r.top, r.bottom, -r.height / 2, r.height / 2, e.clientY);
    gsap.to(btn,   { x: mapX * STRENGTH, y: mapY * STRENGTH, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    gsap.to(label, { x: mapX * LABEL_STRENGTH, y: mapY * LABEL_STRENGTH, duration: 0.4, ease: 'power2.out', overwrite: true });
  });
  zone.addEventListener('mouseleave', () => {
    gsap.to(btn,   { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: 'auto' });
    gsap.to(label, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)', overwrite: true });
  });
})();

// тёмная тема и магический свет включаются на разделе «ИИ-идеи»
const DARK_IN = 0.964;   // фон дотемняет к 0.988, «помощник» выходит с 1.016   // зазор между надписями: фон меняется на пустом кадре
const setVeil = gsap.quickSetter('#veil', 'opacity');
const setInflow = gsap.quickSetter('#inflow', 'opacity');

// ---- поток по рамке корпуса ----
// путь строим из размеров корпуса: от низа по стороне вверх к центру верхней кромки.
// два пути, правый и левый, поэтому свет стягивается к верху с обеих сторон
const flowEl = document.getElementById('flow');
const flowDots = [...flowEl.querySelectorAll('i')];
const setFlowOp = gsap.quickSetter(flowEl, 'opacity');
const dotSet = flowDots.map(el => ({
  el,
  setD: gsap.quickSetter(el, 'offsetDistance'),
  setO: gsap.quickSetter(el, 'opacity'),
  setS: gsap.quickSetter(el, 'scale')
}));

function framePaths() {
  const w = box.offsetWidth, h = box.offsetHeight;
  const r = h * RATIO.r;
  // правый: низ-центр -> правый борт -> верх-центр
  const right = `path('M ${w/2} ${h} L ${w-r} ${h} Q ${w} ${h} ${w} ${h-r} L ${w} ${r} Q ${w} 0 ${w-r} 0 L ${w/2} 0')`;
  // левый: зеркально
  const left  = `path('M ${w/2} ${h} L ${r} ${h} Q 0 ${h} 0 ${h-r} L 0 ${r} Q 0 0 ${r} 0 L ${w/2} 0')`;
  flowDots.forEach((el, i) => {
    el.style.offsetPath = i % 2 ? left : right;
  });
}
framePaths();
addEventListener('resize', framePaths);
// поза под поток: телефон принимает свет сверху, значит откинут назад
const FLOW = { rx: 13, ry: 10, rz: 6 };
const setAura = gsap.quickSetter('#aura', 'opacity');
let isDark = false;
let menuOnDark = false;

let tagsDirty = true, orbsDirty = true;   // один прогон после выхода из фазы
const scrollLayerEl = document.querySelector('.scroll-layer');
const rollLayerEl = document.getElementById('rollLayer');
let isSharp = false;                      // класс .sharp снимает will-change в финале

// v2: корпус уходит вниз, на пустом экране печатается промт,
// потом текст сгружается в корпус, который приезжает снизу, и идёт загрузка
const UP_IN   = 0.02, UP_OUT  = 0.11;   // прячется вниз до входа тегов
const PR_IN   = 0.21, PR_OUT  = 0.29;   // промт: коротко удерживается перед возвратом телефона
const BACK_IN = 0.26, BACK_OUT= 0.38;   // возврат снизу начинается раньше
const LOAD_IN = 0.44, LOAD_OUT= 0.556;   // «собираю план» держится весь влёт карточек

const PROMPT_TEXT = 'Еду в Санкт-Петербург с ребёнком';

const tagsLayer = document.getElementById('tags');

// облако тегов: направление разлёта считается от центра сцены один раз
const TAGS_IN = 0.08, TAGS_SPREAD = 0.30, TAGS_OUT = 0.30;
const tags = [...document.querySelectorAll('.tag-pos')].map(pos => {
  const el = pos.firstElementChild;
  const px = parseFloat(pos.style.left) / 100;
  const py = parseFloat(pos.style.top) / 100;
  let vx = px - 0.5, vy = py - 0.5;
  const len = Math.hypot(vx, vy) || 1;
  return {
    setC: gsap.quickSetter(el, 'css'),
    pos,
    vx: vx / len,                 // единичный вектор от центра
    vy: vy / len,
    near: 1 - Math.min(1, len / 0.62),   // чем ближе к центру, тем дальше улетает
    seed: Math.random() * Math.PI * 2,
    px, py,
    cursorX: 0, cursorY: 0,
    cursorVX: 0, cursorVY: 0,
    homeX: 0, homeY: 0,
    depth: el.classList.contains('tag-small') ? .78 : 1
  };
});
const refreshTagCenters = () => tags.forEach(t => {
  const r = t.pos.getBoundingClientRect();
  t.homeX = r.left + r.width / 2;
  t.homeY = r.top + r.height / 2;
});
requestAnimationFrame(refreshTagCenters);
document.fonts && document.fonts.ready.then(refreshTagCenters);
addEventListener('resize', refreshTagCenters, { passive: true });
const promptEl = document.getElementById('prompt');
const promptQ  = document.getElementById('promptQ');
const promptTextEl = document.getElementById('promptText');

const loaderEl = document.getElementById('loader');
const setPrompt = gsap.quickSetter(promptEl, 'css');
const setPromptQ = gsap.quickSetter(promptQ, 'css');
const setPromptText = gsap.quickSetter(promptTextEl, 'css');
const setLoader = gsap.quickSetter(loaderEl, 'opacity');
const setHint   = gsap.quickSetter('#hintMove', 'css');
let typedShown = -1;
// финал: корпус наезжает на камеру, шторка раскрывается
// надпись уходит к 0.86, шары к 0.90 — только после этого корпус приближается
const FIN_IN = 9;      // старый финал отключён: зарядка проходит p>0.965, рост не нужен
const FIN_END = 9.02;        // пара к FIN_IN, оба за шкалой
const FIN_SCALE = 1.7;        // во сколько раз крупнее к концу
// ---- сцена-проезд: макро-ракурс вдоль корпуса, камера едет по длине ----
// Старые фазы читают прежние абсолютные позиции через p = q * TRV_K.
// Более короткий спейсер быстрее переводит к следующему экрану.
const TRV_K   = 1.9;
const OLD_END = 1.70;    // зарядке 900vh скролла
const TRV_IN  = OLD_END / TRV_K;
const TRV_RX  = 62;    // макро-питч: взгляд вдоль корпуса от нижнего торца
const TRV_SC0 = 1.12;  // умеренный масштаб: растр экрана не мылится
// финал проезда: корпус не выпрямляется во фронт, а остаётся в лёгком развороте,
// поверх экрана появляется подтверждение «Поездка готова!»
const TRV_END = { rx: 6, ry: -14, rz: -4, sc: 1.32 };
const ISL = { w: 127, h: 37, w2: 268, h2: 74 };   // поля по бокам поджаты
const setIsland = gsap.quickSetter('#island', 'css');
const setIslandIn = gsap.quickSetter('#islandIn', 'opacity');
// нижнее пятно поднимается и растёт, пока идут надписи-бенефиты
const BOT_IN = 0.44, BOT_FULL = 0.90;   // приходит после возврата корпуса: фаза промта чистая
const setBot = gsap.quickSetter('#botGlow', 'css');

// ---- фаза зарядки: скролл заливает текст, фон желтеет, частицы летят в корпус ----
const CHG_IN = 1.240, CHG_OUT = 1.695;   // старт позже: перед ней успевает пройти помощник
const setChargeBg = gsap.quickSetter('#chargeBg', 'opacity');
const setPulse    = gsap.quickSetter('#pulseWhite', 'css');
const cap3El  = document.getElementById('cap3');
const setCap3 = gsap.quickSetter('#cap3', 'css');
let isCharge = false;
const vibes = [...document.querySelectorAll('.vibes span')].map((el, i) => ({
  setC: gsap.quickSetter(el, 'css'),
  at: 0.08 + i * 0.15                      // вайбы приходят один за другим по скроллу
}));

// ---- эффект 002 по исходнику туториала mwg_free_002 ----
// картинка рождается под курсором, когда накопленный путь мыши превысил порог,
// падает вниз, отскакивает и удаляется. никакой сетки, всё живёт по требованию
const sceneEl = document.querySelector('.scene');
const fallEl = document.getElementById('fall');
const FALL_CLASSES = ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12', 'f13'];   // превью мест, фон задан в CSS
// порядок перемешиваем один раз: иначе при каждом проходе одна и та же цепочка
FALL_CLASSES.sort(() => Math.random() - 0.5);

let incr = 0, oldIncrX = 0, oldIncrY = 0, firstMove = true, indexImg = 0;
let fallActive = false;                           // включается только на фазе загрузки

const coarse = matchMedia('(hover: none)').matches;
const resetDist = () => innerWidth / (coarse ? 6 : 9);

function spawnFall(x, y, dx, dy) {
  const H = sceneEl.clientHeight;
  if (y > H - 120) return;                        // у самой кромки не рождаем


  const el = document.createElement('div');
  // без .gimg: он задаёт background-size:contain и перебил бы cover карточки
  el.className = 'fall-img ' + FALL_CLASSES[indexImg];
  fallEl.appendChild(el);

  const tl = gsap.timeline({
    onComplete: () => { el.remove(); tl.kill(); }
  });

  // проявление: мягкий выход из прозрачности.
  // в оригинале карточка возникала мгновенно, отсюда резкость
  tl.fromTo(el, { opacity: 0 }, {
    opacity: 1, ease: 'sine.out', duration: 0.55
  }, 0);

  // посадка масштаба: пружина мягче, чем elastic.out(2, 0.6) в оригинале
  tl.fromTo(el, {
    xPercent: -50 + (Math.random() - 0.5) * 24,
    yPercent: -50 + (Math.random() - 0.5) * 10,
    scaleX: 1.18, scaleY: 1.18,
    rotation: (Math.random() - 0.5) * 20
  }, {
    scaleX: 1, scaleY: 1,
    ease: 'elastic.out(0.9, 0.55)', duration: 0.85
  }, 0);

  // снос от рывка мыши почти убран: раньше dx * 2 уносило карточку в сторону.
  // остаётся микросмещение с потолком в 26px, чтобы падение не было линейкой
  const drift = gsap.utils.clamp(-26, 26, dx * 0.18);
  tl.fromTo(el, { x }, {
    x: '+=' + drift, rotation: 0,
    ease: 'sine.inOut', duration: 0.85
  }, 0);

  // падение: разгон плавный, нижний край встаёт ровно у низа кадра
  tl.fromTo(el, { y }, {
    y: '+=' + (H - y), scale: 0.9, yPercent: -95,
    ease: 'power2.in', duration: 0.85
  }, 0);

  // отскок: тоже без бокового выноса
  tl.to(el, {
    x: '+=' + drift * 0.5,
    rotation: (Math.random() - 0.5) * 18,
    ease: 'sine.in', duration: 0.5
  });
  tl.to(el, {
    yPercent: 150,
    ease: 'power2.in',
    duration: 0.5
  }, '<');
  tl.to(el, {
    opacity: 0, ease: 'sine.in', duration: 0.32
  }, '-=0.32');

  indexImg = (indexImg + 1) % FALL_CLASSES.length;
}

function fallMove(clientX, clientY) {
  if (!fallActive) { firstMove = true; return; }
  const r = sceneEl.getBoundingClientRect();
  const valX = gsap.utils.clamp(0, sceneEl.clientWidth, clientX - r.left);
  const valY = gsap.utils.clamp(0, sceneEl.clientHeight, clientY - r.top);

  if (firstMove) { firstMove = false; oldIncrX = valX; oldIncrY = valY; return; }

  // порог по суммарному пути: карточки появляются через равные отрезки движения
  incr += Math.abs(valX - oldIncrX) + Math.abs(valY - oldIncrY);
  if (incr > resetDist()) {
    incr = 0;
    spawnFall(valX, valY, valX - oldIncrX, valY - oldIncrY);
  }
  oldIncrX = valX;
  oldIncrY = valY;
}

addEventListener('mousemove', e => fallMove(e.clientX, e.clientY));
addEventListener('touchmove', e => {
  if (e.touches && e.touches[0]) fallMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

// ---- поток превью в корпус ----
// Фотографии мест и пользовательские PNG смешаны в одном потоке с обеих сторон.
// Форму не ломаем — только равномерно уменьшаем к экрану телефона.
const INF_IN = 0.440, INF_OUT = 0.610;
const INF_ITEM_WINDOW = 0.34;
const influxEl = document.getElementById('influx');
const INF_N = 192;
const PLAN_ASSETS = [
  '/assets/plan-build/clothes.webp',
  '/assets/plan-build/burger.webp',
  '/assets/plan-build/croissant.webp',
  '/assets/plan-build/bust.webp',
  '/assets/plan-build/shell.webp'
];
// В кульминации собранного плана эти же объекты вылетают из телефона.
const explosionEl = document.getElementById('planExplosion');
const explosionItems = Array.from({ length: 30 }, (_, i) => {
  const el = document.createElement('img');
  el.src = PLAN_ASSETS[i % PLAN_ASSETS.length];
  el.alt = '';
  el.decoding = 'async';
  explosionEl.appendChild(el);
  return {
    setC: gsap.quickSetter(el, 'css'),
    angle: (i / 30) * Math.PI * 2 + (i % 3) * 0.18,
    phase: i / 30,
    reach: 0.88 + (i % 7) * 0.045,
    size: 0.58 + (i % 6) * 0.14,
    rot: -54 + (i * 47) % 116
  };
});
gsap.set(explosionEl.children, { xPercent: -50, yPercent: -50, opacity: 0 });
// Сильный перепад размеров создаёт глубину без деформации самих картинок.
const INF_SCALES = [
  .24,.34,.42,.52,.62,.76,.90,1.05,.30,.46,
  .68,1.25,.38,.58,.82,1.50,.28,.50,.72,1.00,
  .36,.64,.88,1.82,.32,.55,.78,1.12,.44,2.15
];
const influx = (() => {
  const out = [];
  for (let i = 0; i < INF_N; i++) {
    const el = document.createElement('i');
    // Один индекс задаёт и очередь пролёта, и тип изображения. Поэтому в
    // каждом видимом отрезке потока есть все фотографии и все PNG-объекты.
    // Левая и правая копии пары проходят сцену одновременно. Раньше их
    // задержки отличались, поэтому в случайных кадрах вся масса оказывалась справа.
    const pairIndex = Math.floor(i / 2);
    const flowIndex = (pairIndex * 67) % (INF_N / 2);
    // В каждом левом и правом потоке поровну фотографий и PNG-объектов.
    const isPhoto = i % 4 === 0 || i % 4 === 3;
    if (isPhoto) {
      el.className = `is-photo ${FALL_CLASSES[flowIndex % FALL_CLASSES.length]}`;
    } else {
      el.className = 'is-object';
      el.style.backgroundImage = `url('${PLAN_ASSETS[flowIndex % PLAN_ASSETS.length]}')`;
    }
    influxEl.appendChild(el);
    out.push({
      setC: gsap.quickSetter(el, 'css'),
      side: i % 2 ? 1 : -1,
      row: 0.12 + ((i * 37) % 101) / 100 * 0.76,
      lane: ((i * 53) % 97) / 96 * .11,
      // Одинаковый масштаб для левого и правого элемента пары: крупные
      // значения больше не скапливаются только с одной стороны экрана.
      size: INF_SCALES[Math.floor(i / 2) % INF_SCALES.length],
      // Перемешанные сменяющиеся группы: за весь проход прилетают все 192,
      // но в одном кадре они не образуют сплошную стену.
      // Последняя картинка должна полностью завершить путь к w=1.
      lag: (flowIndex / (INF_N / 2)) * (1 - INF_ITEM_WINDOW),
      rot: (i % 2 ? 1 : -1) * (5 + (i % 5) * 3),
      visible: false
    });
  }
  gsap.set(influxEl.children, { xPercent: -50, yPercent: -50 });
  return out;
})();
let influxDirty = true;

// стартовое видео в корпусе: видно только на первом экране,
// гаснет к нырку и ставится на паузу, чтобы не жечь кадры за кадром
const heroVid = document.getElementById('heroVid');
const setVid = gsap.quickSetter(heroVid, 'css');
let vidOn = true;
const VIDEO_CUT = 0.060;

// Отдельный MP4 поддерживает range-запросы и не требует синхронного base64-декодирования.
(function mountVideo() {
  const kick = () => heroVid.play().catch(() => {});
  heroVid.addEventListener('loadeddata', kick);
  heroVid.addEventListener('canplay', kick);
  // если автоплей всё же заблокирован — стартуем на первом касании
  ['pointerdown', 'keydown', 'touchstart'].forEach(ev =>
    addEventListener(ev, kick, { once: true, passive: true }));
  kick();
})();

const setHero = gsap.quickSetter('.hero', 'css');
const setGlow2 = gsap.quickSetter('#heroGlow', 'css');
const setPhoneGlow = gsap.quickSetter('#phoneGlow', 'css');
const setBand  = gsap.quickSetter('#heroBand', 'css');   // градиентная полоса главного экрана
const setRoll     = gsap.quickSetter('#rollLayer', 'css');
const setScroll   = gsap.quickSetter('.scroll-layer', 'css');
const setTiltZ    = gsap.quickSetter('.tilt-layer', 'rotateZ', 'deg');

const pEl = document.getElementById('p');
const smooth = t => t * t * (3 - 2 * t);
const clamp01 = t => gsap.utils.clamp(0, 1, t);

const spacerEl = document.querySelector('.spacer');
let spacerHeight = 1;
function refreshProgressMetrics() {
  spacerHeight = Math.max(1, spacerEl ? spacerEl.offsetHeight : 1);
}
refreshProgressMetrics();
addEventListener('resize', refreshProgressMetrics, { passive: true });
function readProgress() {
  return clamp01(scrollY / spacerHeight);
}
p = pTarget = readProgress();

let pDrawn = -1, pShown = '';
gsap.ticker.add(() => {
  pTarget = readProgress();
  p += (pTarget - p) * (reduced ? 1 : 0.072);

  // корпус успокоился и курсор не двигается: писать нечего.
  // интро — исключение: пока glowIn крутится, фон и свечение надо писать
  // каждый кадр, иначе цвет появлялся только после первого скролла
  const moved = Math.abs(p - pDrawn) > 0.00006 || Math.abs(v) > 0.005 || glowIn.v < 0.999;
  if (!moved) return;
  pDrawn = p;

  // сквозной прогресс новой высоты и локальный прогресс проезда.
  // p ниже — старая шкала, чтобы не трогать все фазовые окна
  const pq  = p;
  const trv = clamp01((pq - TRV_IN) / (1 - TRV_IN));
  p = Math.min(pq * TRV_K, OLD_END);

  // поза едет от геройской к ровной по центру
  // в v2 корпус улетает за кадр, поэтому выпрямление привязано к возврату снизу
  const ez = smooth(clamp01(p / 0.16));
  const fin = smooth(clamp01((p - FIN_IN) / (FIN_END - FIN_IN)));

  // к финалу углы выпрямляются, корпус наезжает и верх кадра держится у шапки
  // корпус нырнул вниз и оттуда же вернулся: за кадром между 0.20 и 0.36
  const up   = smooth(clamp01((p - UP_IN)   / (UP_OUT - UP_IN)));
  const back = smooth(clamp01((p - BACK_IN) / (BACK_OUT - BACK_IN)));
  const away = up * (1 - back);
  const yStage = p < BACK_IN
    ? up * innerHeight * 1.25                  // нырок за нижний край
    : (1 - back) * innerHeight * 1.25;         // возврат оттуда же

  // на нырке и возврате никаких сопутствующих движений: только вертикаль.
  // still = 1 пока корпус в пути, поза держится ровной
  // still гасит дрейф на всём пути. поза при нырке остаётся геройской
  const still = smooth(clamp01((p - 0.02) / 0.05)) * (1 - smooth(clamp01((p - BACK_OUT) / 0.04)));
  // retn включает ракурс снизу только на возврате, когда корпус уже за кадром
  const retn = smooth(clamp01((p - BACK_IN) / 0.04)) * (1 - smooth(clamp01((p - BACK_OUT) / 0.05)));

  // Исходное облако тегов: разлетается радиально под растущую строку запроса.
  const tagsPhase = p > TAGS_IN - 0.02 && p < TAGS_OUT + 0.06;
  if (tagsPhase || tagsDirty) {
  const tIn  = smooth(clamp01((p - TAGS_IN) / 0.05));
  const tSp  = smooth(clamp01((p - 0.215) / (TAGS_SPREAD - 0.215)));
  // гаснут до конца набора промта: к полной строке кадр должен быть чистым
  const tOut = smooth(clamp01((p - TAGS_OUT) / 0.035));
  tags.forEach(t => {
    const push = (240 + 620 * t.near) * tSp;
    t.setC({
      opacity: tIn * (1 - tOut) * (1 - 0.55 * tSp),
      x: t.vx * push,
      y: t.vy * push + Math.sin(p * 6 + t.seed) * 5 * tIn,
      scale: 0.9 + 0.1 * tIn - 0.06 * tSp
    });
  });
  tagsDirty = tagsPhase;   // один сброс после выхода из фазы
  }

  // До точки переключения виден исключительно MP4. Затем кадр меняется
  // целиком: видео исчезает, а приложение появляется без наложения слоёв.
  const wantVid = p < VIDEO_CUT;
  setVid({ opacity: wantVid ? 1 : 0 });
  if (wantVid !== vidOn) {
    vidOn = wantVid;
    heroVid.style.visibility = vidOn ? 'visible' : 'hidden';
    if (vidOn) heroVid.play().catch(() => {}); else heroVid.pause();
  }

  // поток превью: летят к корпусу и гаснут у кромки
  const infPhase = p > INF_IN - 0.01 && p < INF_OUT + 0.03;
  if (infPhase || influxDirty) {
    const w = clamp01((p - INF_IN) / (INF_OUT - INF_IN));
    influx.forEach(o => {
      const rawT = (w - o.lag) / INF_ITEM_WINDOW;
      // В каждый момент пересчитываем только активную треть потока. При
      // выходе из своего окна элемент гарантированно скрывается, поэтому
      // фотографии больше не могут остаться висеть после завершения фазы.
      if (rawT <= 0 || rawT >= 1) {
        if (o.visible) {
          o.visible = false;
          o.setC({ opacity: 0 });
        }
        return;
      }
      o.visible = true;
      const t = rawT;
      const e = Math.pow(t, 1.7);                      // ускорение к телефону
      const fadeIn  = smooth(clamp01(t / 0.10));
      const fadeOut = smooth(clamp01((t - 0.90) / 0.10));
      const shrink = 1 - 0.76 * e;
      const sceneFit = gsap.utils.clamp(.72, 1.12, Math.min(innerWidth / 1440, innerHeight / 820));
      const objectScale = o.size * sceneFit * shrink;
      o.setC({
        opacity: fadeIn * (1 - fadeOut),
        x: o.side * innerWidth * ((0.58 + o.lane) * (1 - e) + 0.012 * e),
        y: (o.row - 0.5) * innerHeight * (1 - 0.88 * e) + innerHeight * 0.02 * e,
        rotation: o.rot * (1 - e),
        scale: objectScale,
        skewX: 0,
        skewY: 0
      });
    });
    influxDirty = infPhase;
  }

  // Промт снова остаётся ровной капсулой: без морфинга, хвоста и деформации.
  // После набора он просто уменьшается и опускается к телефону, как раньше.
  const prIn  = smooth(clamp01((p - PR_IN) / 0.025));
  const prOut = smooth(clamp01((p - PR_OUT) / 0.06));
  setPrompt({
    opacity: prIn * (1 - prOut),
    x: 0,
    y: prOut * innerHeight * 0.30,
    rotation: 0,
    scale: 1 - 0.42 * prOut
  });
  setPromptQ({
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    borderRadius: '1000px',
    filter: 'none'
  });
  setPromptText({
    opacity: 1,
    filter: 'none',
    letterSpacing: '-.03em'
  });

  // набор текста по прогрессу
  const typed = clamp01((p - (PR_IN + 0.005)) / 0.085);
  const n = Math.round(typed * PROMPT_TEXT.length);
  if (n !== typedShown) { typedShown = n; promptTextEl.textContent = PROMPT_TEXT.slice(0, n); }

  // загрузка внутри экрана
  const loadVis = smooth(clamp01((p - LOAD_IN) / 0.03)) - smooth(clamp01((p - LOAD_OUT) / 0.022));
  setLoader(loadVis);

  // подсказка про курсор: тот же рисунок движения, что у надписей
  const hIn  = smooth(clamp01((p - (LOAD_IN - 0.05)) / 0.03));
  const hOut = smooth(clamp01((p - (LOAD_OUT - 0.01)) / 0.035));
  setHint({ opacity: hIn * (1 - hOut), y: (1 - hIn) * 46 - hOut * 36 });

  // эффект-002 (карточки под курсором) выключен: вместо него поток влёта.
  // вернуть — снять false
  const fallPhase = false && p > LOAD_IN - 0.08 && p < LOAD_OUT + 0.05;
  if (fallPhase !== fallActive) {
    fallActive = fallPhase;
    firstMove = true;               // после паузы путь мыши считаем заново
    if (!fallPhase) fallEl.replaceChildren();   // уходя, снимаем всё лишнее
  }

  // тёмная тема: с «ИИ-идей» и до конца. свет по периметру приходит чуть позже
  const dk = smooth(clamp01((p - DARK_IN) / 0.024));
  // setVeil ниже, в блоке зарядки: ему нужен chgY
  setAura(0);   // градиент по краям убран; было smooth((p-DARK_IN-0.02)/0.05)*0.75

  // fl: общая громкость эффекта. появление света на рамке
  const fl = smooth(clamp01((p - (DARK_IN + 0.01)) / 0.05));
  setFlowOp(0);   // пятна на рамке убраны; вернуть: setFlowOp(fl)

  // t: путь пятен по рамке снизу вверх. 0 — низ, 1 — центр верхней кромки
  const t = smooth(clamp01((p - (DARK_IN + 0.02)) / 0.09));   // путь короче: пятна наверху к 0.805
  // suck: втягивание внутрь экрана, начинается когда свет собрался сверху
  const suck = smooth(clamp01((p - (DARK_IN + 0.065)) / 0.045));  // втянулись к 0.81, до «Заряжаем»

  dotSet.forEach((d, i) => {
    const lag = (i >> 1) * 0.16;                 // хвост: пары идут с задержкой
    const tt = clamp01((t - lag * (1 - t)) / (1 - lag * (1 - t) || 1));
    d.setD((tt * 100).toFixed(2) + '%');
    // у верхней кромки пятна укрупняются, потом гаснут, уходя в экран
    d.setO((0.35 + 0.65 * tt) * (1 - suck) * (i >> 1 ? 0.6 : 1));
    d.setS(0.7 + 0.5 * tt + 0.35 * suck);
  });

  // внутри экрана поток появляется ровно тогда, когда рамка отдаёт свет
  setInflow(0);   // волна в экране убрана; вернуть: suck * 0.95 * (1 - smooth((p-0.80)/0.045))
  // зарядка: chg — заливка текста и плотность частиц, chgY — жёлтый фон
  const chg  = clamp01((p - CHG_IN) / (CHG_OUT - CHG_IN));
  // Смена тёмной сцены на жёлтую почти мгновенная: смешанный серо-зелёный
  // кадр не задерживается при медленном скролле.
  const chgY = smooth(clamp01(chg / 0.018));
  setChargeBg(chgY);

  setVeil(dk * (1 - Math.min(1, chgY * 2.2)));   // вуаль уходит с опережением: смеси нет
  cap3El.style.setProperty('--chg', ((1 - chg) * 100).toFixed(1) + '%');
  const c3in  = smooth(clamp01((p - CHG_IN) / 0.02));
  const c3out = smooth(clamp01((trv - 0.14) / 0.16));   // заголовок уносит белой волной
  setCap3({ opacity: c3in * (1 - c3out), y: (1 - c3in) * 120 - c3out * 90 });
  const vGone = smooth(clamp01((trv - 0.12) / 0.16));   // белая волна уносит подписи
  vibes.forEach(o => {
    const vo = smooth(clamp01((chg - o.at) / 0.10)) * (1 - c3out) * (1 - vGone);
    o.setC({ opacity: vo, y: (1 - vo) * 28 - vGone * 40 });
  });

  const wantDark = dk > 0.5 && chgY < 0.5;
  if (wantDark !== isDark) {
    isDark = wantDark;
    document.body.classList.toggle('is-dark', isDark);
  }
  if ((chgY > 0.5) !== isCharge) {
    isCharge = chgY > 0.5;
    document.body.classList.toggle('is-charge', isCharge);   // частицы на жёлтом без screen-блендинга
  }

  // раздел «Чем заняться»: корпус уходит влево и разворачивается в обратную сторону.
  // окно совпадает с окном второй надписи, поэтому кадр собирается как в макете
  const MIRROR = { at: 0.730, len: 0.232 };   // поза встаёт до смены контента и держится весь текст
  // рампы шире (0.05 вместо 0.035): вход и выход позы без рывка
  const mir = smooth(clamp01((p - MIRROR.at) / 0.05))
            * (1 - smooth(clamp01((p - (MIRROR.at + MIRROR.len)) / 0.05)));
  // поза снята с фото: телефон в руке слева, низ уходит за кадр.
  // верх смещён влево, низ вправо -> rotateZ отрицательный.
  // видна левая боковая грань -> rotateY положительный.
  // низ ближе к камере -> rotateX положительный
  const mirX  = -innerWidth * 0.14 * mir;   // было 0.20: слева встают карточки
  const mirY  =  innerHeight * 0.03 * mir;   // нижний торец в кадре целиком
  // угол повторяет фото: почти фронтально, верх чуть левее, низ чуть правее
  const mirRY =  32 * mir;   // yaw: правый борт сильно вдавлен в экран
  // знак крена в одном месте: +1 наклоняет по часовой, -1 против.
  // менять только эту цифру, остальное не тронется
  const ROLL_SIGN = -1;
  const mirRZ = ROLL_SIGN * 9 * mir;   // лёгкий наклон: верх чуть левее, низ правее
  const mirRX =   7 * mir;   // pitch мягче: не вытягивает правый низ обратно
  const mirSc =  1 + 0.28 * mir;   // крупный план; уход в глубину (mirZ) съедает часть прироста

  // ракурс ходит влево-вправо: разворот и снос в противофазе, отсюда облёт по дуге.
  // gate держит дрейф в нуле на первом кадре, чтобы геройская поза не менялась
  const gate = smooth(clamp01((p - BACK_OUT) / 0.08));   // дрейф только после возврата
  const drift = (1 - fin) * gate * (1 - mir);
  const pDrift = Math.min(p, 1.240);   // на зарядке фаза дрейфа заморожена
  const swing = Math.sin(pDrift * Math.PI * 2.0);
  const dY = swing * 11 * drift;                             // разворот по вертикальной оси
  const dPx = -swing * 44 * drift;                           // снос против разворота
  const dZ = Math.sin(pDrift * Math.PI * 0.9) * 1.1 * drift;      // крен в плоскости
  const dX = (3.5 + Math.cos(pDrift * Math.PI * 1.3) * 4.5) * drift;   // нижний край чуть выше
  const dPy = Math.sin(pDrift * Math.PI * 1.6) * 18 * drift;      // подъём-опускание

  // во время нырка поза геройская целиком: ez прижимается к нулю,
  // поэтому START.y не гасится и корпус не уезжает вверх
  const ezEff = ez * (1 - still);
  const invEff = 1 - ezEff;
  const sc = (START.sc + (END_SCALE - START.sc) * ezEff) * (1 + (FIN_SCALE - 1) * fin) * mirSc;
  // рост от верхнего края: компенсация ровно на половину прироста высоты.
  // корпус увеличивается на месте, никуда не переезжает
  const boxH = box.offsetHeight;
  const yFin = (boxH / 2) * (sc - 1) + innerHeight * 0.20 * fin;   // плюс сдвиг вниз

  // вдавливание в зеркале: yaw и pitch как будто вращают вокруг левого нижнего угла.
  // компенсация уводит корпус в глубину: левый низ стоит на месте,
  // правый верх тонет вдвое дальше — это вдавливание, а не поворот
  const mirZ = -(box.offsetWidth  * sc / 2) * Math.sin(mirRY * Math.PI / 180)
               -(boxH             * sc / 2) * Math.sin(mirRX * Math.PI / 180);

  // roll на внешнем слое: применяется в системе экрана, после yaw и pitch
  let rzV = (START.rz * invEff + REST.rz * ezEff) * (1 - fin) * (1 - retn) + dZ + mirRZ + FLOW.rz * fl;
  // нырок идёт в геройской позе, ракурс снизу включается только на возврате
  let rxV = (START.rx * invEff + REST.rx * ezEff) * (1 - fin) * (1 - retn) + dX + DIVE.rx * retn + mirRX + FLOW.rx * fl;
  let ryV = (START.ry * invEff + REST.ry * ezEff) * (1 - fin) * (1 - retn) + dY + DIVE.ry * retn + mirRY + FLOW.ry * fl;
  const heroPhoneY = Math.max(300, innerHeight * 0.24);
  let xV  = START.x * invEff * (1 - fin) * (1 - retn) + dPx + mirX;
  let yV  = heroPhoneY * invEff * (1 - fin) * (1 - retn) + dPy + DIVE.y * retn + yFin + yStage + mirY
          + innerHeight * 0.01 * fl;   // тёмная фаза: низ в кадре целиком
  let zV  = mirZ;
  let scV = sc;

  // На экране сборки корпус остаётся в геометрическом центре. Дополнительный
  // сдвиг вправо ломал композицию на широких окнах и стягивал поток в одну сторону.

  // проезд: w вводит в макро, e ведёт камеру вдоль корпуса и выпрямляет перспективу.
  // корпус скользит вниз сквозь кадр — это и есть движение камеры вдоль длины
  if (trv > 0) {
    // сперва импульс, потом корпус стоит; под конец медленно уплывает вверх —
    // страница скроллится быстрее него, отсюда параллакс на выходе из сцены
    const pop = Math.sin(clamp01((trv - 0.10) / 0.16) * Math.PI);
    scV += pop * 0.03;
    yV += -smooth(clamp01((trv - 0.62) / 0.38)) * innerHeight * 0.10;
  }

  // Погодный экран продолжает движение того же DOM-телефона. На входе он
  // мягко встаёт по центру и выпрямляется, поэтому между сценами нет дубля.
  if (!reduced) {
    const weatherEnter = smooth(clamp01(
      (p - (WEATHER_STAGE_IN - WEATHER_BLEND)) / (WEATHER_BLEND * 2)
    ));
    const weatherLeave = 1 - smooth(clamp01(
      (p - (WEATHER_STAGE_OUT - WEATHER_BLEND)) / (WEATHER_BLEND * 2)
    ));
    const weatherPhone = weatherEnter * weatherLeave;
    if (weatherPhone > 0.0001) {
      const weatherScale = innerWidth <= 520 ? 0.68 : innerWidth <= 900 ? 0.76 : 0.86;
      rzV += (0 - rzV) * weatherPhone;
      rxV += (0 - rxV) * weatherPhone;
      ryV += (0 - ryV) * weatherPhone;
      xV  += (0 - xV) * weatherPhone;
      yV  += ((innerWidth <= 900 ? innerHeight * 0.025 : 0) - yV) * weatherPhone;
      zV  += (0 - zV) * weatherPhone;
      scV += (weatherScale - scV) * weatherPhone;
    }
  }
  // белая волна: круг растёт из корпуса сразу за импульсом
  setPulse({ scale: smooth(clamp01((trv - 0.12) / 0.22)) });

  setRoll({ rotateZ: rzV });
  setScroll({
    rotateX: rxV,
    rotateY: ryV,
    x: xV,
    y: yV,
    z: zV,
    opacity: 1 - smooth(clamp01((away - 0.55) / 0.35)),
    scale: scV
  });

  // в приближении снимаем ускорение слоя: иначе текст внутри мылится.
  // переключаем один раз на смене состояния, а не каждый кадр
  // с зарядки поза заморожена: снимаем will-change, слой перерастрируется
  // в текущем масштабе и экран резкий. до этого слой держим на GPU ради скролла
  // со входа в раздел «куда сходить» слой снимается с GPU: растр пересчитывается
  // в текущем масштабе, поэтому экран внутри корпуса резкий, а не пиксельный
  const wantSharp = p > 0.49;   // p здесь уже в старой шкале
  if (wantSharp !== isSharp) {
    isSharp = wantSharp;
    scrollLayerEl.classList.toggle('sharp', isSharp);
    rollLayerEl.classList.toggle('sharp', isSharp);
  }

  // Подтверждение появляется поверх экрана без имитации Dynamic Island.
  const isl = smooth(clamp01((trv - 0.36) / 0.20));   // уведомление после импульса и остановки
  const toast = clamp01((isl - 0.34) / 0.34);
  setIsland({
    width:  ISL.w + (ISL.w2 - ISL.w) * isl,
    height: ISL.h + (ISL.h2 - ISL.h) * isl,
    borderRadius: (18 + 24 * isl) + 'px',
    opacity: toast,
    y: (1 - toast) * -12
  });
  setIslandIn(clamp01((isl - 0.45) / 0.4));

  vTarget = gsap.utils.clamp(-9, 9, (p - lastP) * 340);
  lastP = p;
  v += (vTarget - v) * 0.07;   // догоняет медленнее, отсюда ощущение веса
  setTiltZ(v);

  // герой уходит, пока телефон едет к центру
  const hero = 1 - smooth(clamp01((p - 0.012) / 0.055));   // уходит до появления тегов: пересечения нет
  setHero({ opacity: hero, y: (1 - hero) * -60 });
  const wantMenuOnDark = hero > .42 || wantDark;
  if (wantMenuOnDark !== menuOnDark) {
    menuOnDark = wantMenuOnDark;
    document.body.classList.toggle('menu-on-dark', menuOnDark);
  }
  setGlow2({
    opacity: Math.min(1, hero * glowIn.v * 1.25) * (1 - dk),
    scale: glowIn.sc,
    y: (1 - hero) * -120
  });
  // полоса живёт вместе с героем: тот же вход и тот же уход
  setBand({ opacity: hero * glowIn.v * (1 - dk), y: (1 - hero) * -90 });
  setPhoneGlow({
    opacity: hero * glowIn.v * (1 - dk) * .9,
    y: (1 - hero) * 34,
    scale: .96 + glowIn.v * .04
  });

  // растёт от четверти до полного размера, дальше держится
  const bg = smooth(clamp01((p - BOT_IN) / (BOT_FULL - BOT_IN)));
  // пятно уходит заранее, к 0.68: на входе в «ИИ-идеи» жёлтого уже нет
  const botOut = smooth(clamp01((p - 0.86) / 0.05));
  setBot({
    // на тёмной теме пятна гасим: их жёлто-зелёный оттенок пробивался сквозь вуаль
    opacity: Math.min(1, bg * 1.35) * (1 - dk) * (1 - botOut),
    scale: .12 + .88 * bg              // раздувается из центра, без сдвига
  });

  capTl.time(gsap.utils.clamp(0, CAP_TL_LEN, p));   // абсолютная позиция, не доля

  // шары вайбов убраны из сценария; вернуть — снять false и display:none у .orb
  const orbsPhase = false && p > ORBS_IN - 0.02;
  if (orbsPhase || orbsDirty) {
  const ob = clamp01((p - ORBS_IN) / (ORBS_OUT - ORBS_IN));
  // затухание укладывается до начала приближения: иначе шары остаются
  // поверх корпуса в финальном кадре
  const obOut = smooth(clamp01((p - ORBS_OUT) / 0.02));
  orbs.forEach(o => {
    const t = smooth(clamp01(ob * o.speed));
    o.setC({
      opacity: t * (1 - obOut) * 0.88,
      y: (1 - t) * 620 * o.speed - obOut * 420 * o.speed
    });
  });
  orbsDirty = orbsPhase;
  }

  // прогресс внутрь экрана: прямой вызов, postMessage как запасной путь
  if (screenReady && Math.abs(p - screenP) > 0.0008) {
    screenP = p;
    try {
      const w = frame.contentWindow;
      if (w && typeof w.__draw === 'function') w.__draw(p);
      else if (w) w.postMessage({ p: p }, '*');
    } catch (err) {
      frame.contentWindow.postMessage({ p: p }, '*');
    }
  }

  const nextShown = pq.toFixed(2);
  if (nextShown !== pShown) {
    pShown = nextShown;
    pEl.textContent = nextShown;
  }
  p = pq;   // сглаживание наверху работает в шкале q
});

// После завершения белой волны объекты непрерывно рождаются внутри телефона
// и летят к рамке. Перспектива строится только масштабом: рядом с источником
// объект почти точка, у края экрана он становится в несколько раз крупнее.
let explosionLoopOn = false;
gsap.ticker.add(() => {
  const travelP = clamp01((p - TRV_IN) / (1 - TRV_IN));
  const whiteReady = reduced ? 0 : smooth(clamp01((travelP - 0.36) / 0.07));

  if (whiteReady <= 0.001) {
    if (explosionLoopOn) {
      explosionLoopOn = false;
      explosionItems.forEach((item) => item.setC({ opacity: 0 }));
    }
    return;
  }

  explosionLoopOn = true;
  const phoneRect = box.getBoundingClientRect();
  const sourceX = phoneRect.left + phoneRect.width * 0.5 - innerWidth * 0.5;
  const sourceY = phoneRect.top + phoneRect.height * 0.47 - innerHeight * 0.5;
  const clock = performance.now() / 4600;

  explosionItems.forEach((item) => {
    const life = (clock + item.phase) % 1;
    const travel = life * life * (3 - 2 * life);
    const born = smooth(clamp01(life / 0.09));
    const gone = smooth(clamp01((life - 0.91) / 0.09));
    const depth = Math.pow(life, 1.72);
    item.setC({
      x: sourceX + Math.cos(item.angle) * innerWidth * 0.62 * item.reach * travel,
      y: sourceY + Math.sin(item.angle) * innerHeight * 0.78 * item.reach * travel,
      rotation: item.rot * travel,
      scale: item.size * (0.08 + depth * 2.72),
      opacity: whiteReady * born * (1 - gone)
    });
  });
});

// ---- демонстрация жеста на фазе карточек ----
// полупрозрачный кружок ходит восьмёркой (лиссажу 1:2): «поводите мышкой».
// свой тикер: движение живёт и без скролла; p здесь в сквозной шкале q
const demoEl = document.getElementById('demoCursor');
const setDemo = gsap.quickSetter(demoEl, 'css');
let demoOn = false;
const DEMO_ON = false;   // кружок-восьмёрка убран вместе с эффектом-002
let userMoved = false;
addEventListener('mousemove', () => { userMoved = true; }, { once: true, passive: true });
if (DEMO_ON) gsap.ticker.add(() => {
  if (!DEMO_ON) { if (demoOn) { demoOn = false; setDemo({ opacity: 0 }); } return; }
  if (userMoved) {
    if (demoOn) { demoOn = false; setDemo({ opacity: 0 }); }
    return;
  }
  const pOldD = Math.min(p * TRV_K, OLD_END);
  const w = smooth(clamp01((pOldD - (LOAD_IN - 0.05)) / 0.03))
          * (1 - smooth(clamp01((pOldD - (LOAD_OUT - 0.01)) / 0.035)));
  if (w <= 0.001) {
    if (demoOn) { demoOn = false; setDemo({ opacity: 0 }); }
    return;
  }
  demoOn = true;
  const tD = reduced ? 0 : performance.now() / 1000 * 1.8;
  setDemo({
    opacity: w,
    x: Math.sin(tD) * innerWidth * 0.16,
    y: Math.sin(tD * 2) * innerHeight * 0.09
  });
});

// ---- струя шариков на «ИИ-идеях» ----
// шарики льются сверху и въезжают в корпус; каждый на входе зажигает
// пятно подсветки в своём цвете внутри экрана. курсор расталкивает поток.
// свой тикер добавлен после основного, поэтому p здесь в сквозной шкале q
const swarmEl  = document.getElementById('swarm');
const chargeEl = document.getElementById('chargeGlow');
let mxS = innerWidth / 2, myS = innerHeight / 2;
addEventListener('mousemove', e => { mxS = e.clientX; myS = e.clientY; });
const SWARM_N = 176;  // плотность сохраняется, но DOM и расчётов заметно меньше
const swarm = [];
let swarmBuilt = false, swarmOn = false;
// удары частиц: дрожь корпуса и вспышка обводки
let shakeAmp = 0;
const setShake = gsap.quickSetter('.tilt-layer', 'css');   // rotateZ там же пишет тикер крена, gsap их сливает
const setRim   = gsap.quickSetter('#rimPulse', 'opacity');

function buildSwarm() {
  swarmBuilt = true;
  for (let i = 0; i < SWARM_N; i++) {
    const el = document.createElement('i');
    const size = 14 + Math.random() * 44;    // только мелкие: крупные убраны
    el.style.width = el.style.height = size.toFixed(0) + 'px';
    el.style.margin = (-size / 2).toFixed(0) + 'px 0 0 ' + (-size / 2).toFixed(0) + 'px';
    swarmEl.appendChild(el);
    // точка входа на экране корпуса, в долях его площади
    const fx = 0.18 + Math.random() * 0.64;
    const fy = 0.12 + Math.random() * 0.55;
    const g = document.createElement('i');
    g.style.left = (fx * 100).toFixed(1) + '%';
    g.style.top  = (fy * 100).toFixed(1) + '%';
    chargeEl.appendChild(g);
    swarm.push({
      setC: gsap.quickSetter(el, 'css'),
      setG: gsap.quickSetter(g, 'opacity'),
      side: Math.random() < 0.5 ? -1 : 1,   // поток слева или справа
      sy: 0.08 + Math.random() * 0.72,      // высота точки вылета на своей стороне
      wob: (Math.random() - 0.5) * 0.22,    // снос дуги
      fx, fy,
      spd: 0.16 + Math.random() * 0.15,     // циклов в секунду
      seed: Math.random(),
      px: null, py: null, vx: 0, vy: 0, glow: 0, glowDrawn: -1,
      // фоновый режим тёмной фазы: своя орбита вокруг корпуса
      ang2: Math.random() * Math.PI * 2,
      orx: 0.16 + Math.random() * 0.34,
      ory: 0.14 + Math.random() * 0.30,
      spd2: 0.3 + Math.random() * 0.8
    });
  }
}

gsap.ticker.add((time, deltaMS) => {
  const pOld = Math.min(p * TRV_K, OLD_END);
  const on = pOld > DARK_IN - 0.01 && pOld < 1.72;
  if (!on) {
    if (swarmOn) {
      swarmOn = false;
      swarm.forEach(o => { o.setC({ opacity: 0 }); o.glowDrawn = 0; o.setG(0); });
      shakeAmp = 0;
      setShake({ x: 0, y: 0 });
      setRim(0);
    }
    return;
  }
  if (!swarmBuilt) buildSwarm();
  swarmOn = true;

  const t = performance.now() / 1000;
  const vis = smooth(clamp01((pOld - DARK_IN) / 0.03))
            * (1 - smooth(clamp01((pOld - 1.672) / 0.025)));
  // mSt: 0 — тёмная фаза, светлячки дрейфуют за корпусом; 1 — жёлтая, струя сверху
  const mSt = smooth(clamp01((pOld - CHG_IN) / 0.035));
  // на жёлтом плотность растёт со скроллом; на тёмной светятся все
  const act = (1 - mSt) + mSt * (0.25 + 0.75 * clamp01((pOld - 1.240) / 0.455));
  const bx = box.getBoundingClientRect();
  const cx = bx.left + bx.width / 2;      // честный центр корпуса: он ездит по скроллу
  const cy = bx.top + bx.height / 2;
  const bw = box.offsetWidth, bh = box.offsetHeight;

  let hits = 0;   // сколько частиц въехало в корпус на этом кадре
  // пылесос: одно правило на всех. Вдали частица вяло дрейфует у своей домашней
  // точки; тяга к корпусу растёт обратно квадрату расстояния, поэтому чем ближе,
  // тем быстрее её засасывает. У самого экрана — захват, вспышка и респаун
  const dt = Math.min(2, Math.max(0.5, deltaMS / 16.7));
  const suckK = (34000 + 46000 * clamp01((pOld - 1.240) / 0.455)) * mSt;
  swarm.forEach(o => {
    // домашняя точка: медленное блуждание вокруг корпуса
    const ax = cx + Math.cos(o.ang2 + t * 0.05 * o.spd2) * o.orx * innerWidth
                  + Math.sin(t * o.spd2 + o.seed * 6) * 16;
    const ay = cy + Math.sin(o.ang2 + t * 0.07 * o.spd2) * o.ory * innerHeight
                  + Math.cos(t * 0.8 * o.spd2 + o.seed * 6) * 12;
    if (o.px === null || reduced) { o.px = ax; o.py = ay; }

    const eligible = o.seed <= act ? 1 : 0;
    // точка входа этой частицы на экране корпуса
    const tx = cx + (o.fx - 0.5) * bw * 0.92;
    const ty = cy + (o.fy - 0.5) * bh * 0.92;

    if (!reduced) {
      // пружина к дому: слабеет, когда частицу разрешено засасывать
      const homeK = 0.004 * (1 - 0.9 * mSt * eligible);
      o.vx += (ax - o.px) * homeK * dt;
      o.vy += (ay - o.py) * homeK * dt;
      // тяга пылесоса
      const sdx = tx - o.px, sdy = ty - o.py;
      const sd = Math.hypot(sdx, sdy) || 1;
      const acc = suckK * eligible / ((sd + 90) * (sd + 90)) * dt;
      o.vx += sdx / sd * acc;
      o.vy += sdy / sd * acc;
      // курсор расталкивает
      const dx = o.px - mxS, dy = o.py - myS, d = Math.hypot(dx, dy) || 1;
      if (d < 220) { const f = (220 - d) / 220 * 1.5 * dt; o.vx += dx / d * f; o.vy += dy / d * f; }
      // трение и шаг
      o.vx *= Math.pow(0.93, dt); o.vy *= Math.pow(0.93, dt);
      o.px += o.vx * dt; o.py += o.vy * dt;

      // захват у экрана: вспышка, удар, респаун у своей домашней точки
      const cdx = tx - o.px, cdy = ty - o.py;
      if (eligible && mSt > 0.5 && Math.hypot(cdx, cdy) < 42) {
        o.glow = 1;
        if (vis > 0.05) hits += 1;
        o.px = ax + (Math.random() - 0.5) * 80;
        o.py = ay + (Math.random() - 0.5) * 80;
        o.vx = o.vy = 0;
      }
    }

    o.glow *= Math.pow(0.90, dt);
    const glowNow = vis * (o.glow * 0.95 + 0.06 * mSt * eligible);
    if (Math.abs(glowNow - o.glowDrawn) > .012 || glowNow === 0) {
      o.glowDrawn = glowNow;
      o.setG(glowNow);
    }
    const spdNow = Math.hypot(o.vx, o.vy);
    o.setC({
      x: o.px - innerWidth / 2,
      y: o.py - innerHeight / 2,
      opacity: vis * (0.55 + Math.min(0.4, spdNow * 0.03)),   // разгон подсвечивает
      scale: 0.9 + 0.25 * Math.sin(t * o.spd2 + o.seed * 9) * (1 - mSt * eligible)
           + Math.min(0.25, spdNow * 0.015)
    });
  });

  // дрожь корпуса и вспышка обводки: только от ударов струи на жёлтом
  shakeAmp = Math.min(6, shakeAmp * 0.86 + hits * 1.6) ;
  const jx = (Math.random() - 0.5) * 2 * shakeAmp;
  const jy = (Math.random() - 0.5) * 1.4 * shakeAmp;
  setShake({ x: jx, y: jy });
  setRim(Math.min(0.55, shakeAmp / 4.5) * vis);   // приглушено: гало не раздувает силуэт
});

// ---- блок «рутина»: веер карточек по скроллу ----
// секция со своим стики-окном; прогресс = положение секции, сглаживается лерпом.
// карты раскрываются веером вокруг далёкой нижней оси (transform-origin 50% 380%)
// логотип на тёмном: difference гасился контекстами наложения, поэтому
// пересечение с тёмной кнопкой считаем честно и вешаем класс на body
const goBtnEl = document.querySelector('.go-btn');
const logoEl  = document.getElementById('logoSlot');
let logoInv = false;
let logoCheckPending = false;
function updateLogoOverlap() {
  logoCheckPending = false;
  if (!goBtnEl || !logoEl) return;
  const r = goBtnEl.getBoundingClientRect();
  const L = logoEl.getBoundingClientRect();
  const over = r.top < L.bottom + 2 && r.bottom > L.top - 2;
  if (over !== logoInv) {
    logoInv = over;
    document.body.classList.toggle('logo-inv', over);
  }
}
function scheduleLogoOverlap() {
  if (logoCheckPending) return;
  logoCheckPending = true;
  requestAnimationFrame(updateLogoOverlap);
}
addEventListener('scroll', scheduleLogoOverlap, { passive: true });
addEventListener('resize', scheduleLogoOverlap, { passive: true });
scheduleLogoOverlap();

// заголовок «рутины»: слова выезжают из-под маски по одному, когда блок входит
// в кадр. IntersectionObserver вместо тикера: срабатывает один раз
(() => {
  const h2 = document.getElementById('rutH2');
  const sub = document.getElementById('rutSub');
  if (!h2) return;
  const words = [...h2.querySelectorAll('.w')].map(w => {
    const i = document.createElement('i');
    i.textContent = w.textContent;
    w.textContent = '';
    w.appendChild(i);
    return i;
  });
  if (reduced) {
    gsap.set(words, { y: 0, rotate: 0, opacity: 1 });
    gsap.set(sub, { opacity: 1 });
    return;
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      io.disconnect();
      gsap.to(words, {
        y: 0, rotate: 0, opacity: 1,
        duration: 0.9,
        stagger: 0.085,
        ease: 'expo.out'
      });
      gsap.to(sub, { opacity: 1, y: 0, duration: 0.7, delay: 0.34, ease: 'power2.out' });
    });
  }, { threshold: 0.25 });
  gsap.set(sub, { y: 18 });
  io.observe(h2);
})();

// Невидимые длинные секции не участвуют в глобальном GSAP-цикле.
const sectionVisibility = new WeakMap();
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    sectionVisibility.set(entry.target, entry.isIntersecting);
  });
}, { rootMargin: '20% 0px' });
function watchAnimatedSection(el) {
  if (!el) return;
  sectionVisibility.set(el, false);
  sectionObserver.observe(el);
}
// Погодная глава встроена в ту же sticky-сцену: фон сменяется под уже
// существующим телефоном, а ScrollTrigger отвечает только за драматургию слоя.
const weatherSec = document.getElementById('weatherStory');
const weatherPicture = weatherSec && weatherSec.querySelector('.weather-picture');
const weatherRain = document.getElementById('weatherRain');
const weatherTemp = weatherSec && weatherSec.querySelector('.weather-temp');
const weatherTempOld = weatherSec && weatherSec.querySelector('.weather-temp-old');
const weatherTempNew = weatherSec && weatherSec.querySelector('.weather-temp-new');
const weatherTitle = weatherSec && weatherSec.querySelector('.weather-title');

if (weatherSec) {
  gsap.set(weatherSec, {autoAlpha:0});
  gsap.set([weatherTemp, weatherTitle], {autoAlpha:0});
  gsap.set(weatherTempNew, {autoAlpha:0, y:18});
  gsap.set(weatherRain, {opacity:0});

  const weatherStart = () => spacerHeight * (WEATHER_STAGE_IN / TRV_K);
  const weatherEnd = () => spacerHeight * (WEATHER_STAGE_OUT / TRV_K);
  const weatherTl = gsap.timeline({
    defaults:{ease:'none'},
    scrollTrigger:{
      trigger:'.stage',
      start:() => `top+=${weatherStart()} top`,
      end:() => `top+=${weatherEnd()} top`,
      scrub:reduced ? false : 1.15,
      invalidateOnRefresh:true,
      onEnter:() => gsap.killTweensOf(weatherSec),
      onEnterBack:() => {
        gsap.killTweensOf(weatherSec);
        gsap.set(weatherSec,{autoAlpha:1,visibility:'visible'});
      },
      onLeave:() => gsap.to(weatherSec,{autoAlpha:0,duration:.24,ease:'power2.inOut',overwrite:true}),
      onLeaveBack:() => gsap.to(weatherSec,{autoAlpha:0,duration:.20,ease:'power2.inOut',overwrite:true}),
      snap:reduced ? false : {
        // Средний стоп удерживает полноценный погодный кадр, а крайние
        // состояния отвечают за чистый вход и выход без зависших полуслов.
        snapTo:[0,.70,1],
        duration:{min:.25,max:.7},
        delay:.08,
        ease:'power2.inOut',
        directional:true
      }
    }
  });

  weatherTl
    .set(weatherSec,{visibility:'visible'},0)
    .to(weatherSec,{autoAlpha:1,duration:.14,ease:'power2.out'},0)
    .fromTo(weatherPicture,{scale:1.035},{scale:1.012,duration:.82,ease:'sine.out'},0)
    .fromTo(weatherTemp,{autoAlpha:0,x:-34},{autoAlpha:1,x:0,duration:.25,ease:'power2.out'},.11)
    .fromTo(weatherTitle,{autoAlpha:0,x:36},{autoAlpha:1,x:0,duration:.28,ease:'power2.out'},.14)
    .to(weatherTempOld,{autoAlpha:0,y:-18,duration:.18,ease:'power2.inOut'},.46)
    .to(weatherTempNew,{autoAlpha:1,y:0,duration:.20,ease:'power2.inOut'},.47)
    .to(weatherRain,{opacity:.42,duration:.53,ease:'sine.inOut'},.47);

  if (reduced) {
    weatherTl.progress(.56).pause();
  }

  const weatherImg = weatherSec.querySelector('img');
  if (weatherImg && weatherImg.decode) {
    weatherImg.decode().catch(() => {}).finally(() => ScrollTrigger.refresh());
  }
}

const rutSec = document.querySelector('.routine');
watchAnimatedSection(rutSec);
const rutCards = [...document.querySelectorAll('.fcard')].map(el => ({
  setC: gsap.quickSetter(el, 'css')
}));
let rutP = 0, rutDrawn = -1;
const FAN_N = rutCards.length, FAN_STEP = 13;
// back-out: карта проскакивает слот и упруго встаёт — баунс на появлении
const backOut = t => { const c1 = 1.70158, c3 = c1 + 1, x = t - 1; return 1 + c3*x*x*x + c1*x*x; };

gsap.ticker.add(() => {
  if (!rutSec || !sectionVisibility.get(rutSec)) return;
  const r = rutSec.getBoundingClientRect();
  if (r.top > innerHeight || r.bottom < 0) return;      // секция не в кадре
  const raw = clamp01(-r.top / (r.height - innerHeight));
  rutP += (raw - rutP) * (reduced ? 1 : 0.09);
  if (Math.abs(rutP - rutDrawn) < 0.0006) return;
  rutDrawn = rutP;

  // v: сколько карт в веере, непрерывно; первая тоже въезжает, а не ждёт готовой
  const v  = rutP * (FAN_N + 0.25);
  const vc = Math.min(v, FAN_N);
  rutCards.forEach((c, k) => {
    const rk = clamp01(v - k);                     // раскрытие карты k
    const rb = backOut(rk);                        // с упругим перелётом
    const ang = (k - (vc - 1) / 2) * FAN_STEP;
    c.setC({
      rotation: ang + (1 - rb) * 16,
      x: (1 - rb) * 34,
      y: (1 - rb) * 22,
      opacity: clamp01(rk * 2.6),
      scale: 0.92 + 0.08 * rb
    });
  });
});
