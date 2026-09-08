// новые события берут картинки у уже загруженных: base64 не дублируется
(function(){
  var srcs = [].map.call(document.querySelectorAll('img[src]'), function(i){
    return i.getAttribute('src');
  });
  if (!srcs.length) return;
  [].forEach.call(document.querySelectorAll('img[data-clone]'), function(i){
    var n = parseInt(i.getAttribute('data-clone'), 10) || 0;
    i.src = srcs[n % srcs.length];
  });
})();

(function(){
  var track = document.getElementById('track');
  var grps  = Array.prototype.slice.call(document.querySelectorAll('.grp'));
  // точки совпадают с паузами между надписями лендинга:
  // 0.598 — зазор cap0→cap1, 0.700 — зазор cap1→cap2, 0.802 — вход в зарядку
  var START = [-0.10, 0.786, 0.972, 1.196];
  var RISE  = 0.036;   // смена мягкая, целиком укладывается в паузу между надписями
  var H = START.map(function(){ return 0; });
  var last = 0;
  var vis0 = START.map(function(){ return 0; });   // прошлое состояние видимости

  function clamp(x){ return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function smooth(x){ x = clamp(x); return x * x * (3 - 2 * x); }
  function measure(){ H = grps.map(function(el){ return el.offsetHeight; }); }

  function draw(p){
    last = p;
    var hide = smooth((p - 0.10) / 0.02) * (1 - smooth((p - 0.580) / 0.012));
    var vis = 1 - hide;
    var y = 0;
    for (var k = 0; k < grps.length; k++){
      var a = smooth((p - START[k]) / RISE) * vis;
      var el = grps[k];
      var on = a > 0.001 ? 1 : 0;
      if (on !== vis0[k]) { el.classList.toggle('on', !!on); vis0[k] = on; }
      if (on) {
        el.style.opacity = a;
        el.style.transform = 'translate3d(0,' + ((1 - a) * 40).toFixed(2) + 'px,0)';
      }
      if (k > 0) y -= H[k - 1] * a;
    }
    track.style.transform = 'translate3d(0,' + y.toFixed(2) + 'px,0)';
  }

  var weatherGroup = grps[0];
  var weatherSec = weatherGroup && weatherGroup.querySelector('.sec');
  var weatherCards = weatherGroup
    ? Array.prototype.slice.call(weatherGroup.querySelectorAll('.ev'))
    : [];
  var weatherOriginal = weatherCards.map(function(card){
    var title = card.querySelector('.ev-t');
    var desc = card.querySelector('.ev-d');
    var img = card.querySelector('.media img');
    return {
      title:title ? title.textContent : '',
      desc:desc ? desc.textContent : '',
      src:img ? img.getAttribute('src') : null
    };
  });
  var weatherColdEvents = [
    { title:'Русский музей', desc:'Семейный маршрут по залам русского искусства', src:'./media/b3db02f2646f.webp' },
    { title:'Планетарий №1', desc:'Космическая программа под крупнейшим куполом города', src:'./media/9f7539acfe2d.webp' },
    { title:'Оранжерея Таврического сада', desc:'Тропические растения и тёплые галереи в центре Петербурга', src:'./media/8048767ed9f9.webp' },
    { title:'Музей железных дорог России', desc:'Интерактивная экспозиция и исторические локомотивы', src:'./media/a5fb787e6d13.webp' }
  ];
  var weatherCold = false;
  var weatherSwapTimer = 0;
  var weatherSwapToken = 0;

  function applyWeatherEvents(cold){
    var data = cold ? weatherColdEvents : weatherOriginal;
    if (weatherSec) weatherSec.textContent = cold ? 'План на дождь' : 'Утро';
    weatherCards.forEach(function(card, i){
      var item = data[i];
      if (!item) return;
      var title = card.querySelector('.ev-t');
      var desc = card.querySelector('.ev-d');
      var img = card.querySelector('.media img');
      if (title) title.textContent = item.title;
      if (desc) desc.textContent = item.desc;
      if (img && item.src) img.src = item.src;
    });
    weatherGroup.classList.toggle('weather-cold', cold);
    measure();
    draw(last);
  }

  function setWeatherEvents(cold){
    cold = !!cold;
    if (!weatherGroup || (cold === weatherCold && !weatherSwapTimer)) return;
    weatherCold = cold;
    weatherSwapToken += 1;
    var token = weatherSwapToken;
    clearTimeout(weatherSwapTimer);
    weatherGroup.classList.remove('weather-swap-in');
    weatherGroup.classList.add('weather-swap-out');
    weatherSwapTimer = setTimeout(function(){
      if (token !== weatherSwapToken) return;
      applyWeatherEvents(cold);
      weatherGroup.classList.remove('weather-swap-out');
      weatherGroup.classList.add('weather-swap-in');
      weatherSwapTimer = setTimeout(function(){
        if (token !== weatherSwapToken) return;
        weatherGroup.classList.remove('weather-swap-in');
        weatherSwapTimer = 0;
      }, 380);
    }, 150);
  }

  window.__draw = draw;
  window.__setWeatherEvents = setWeatherEvents;
  window.addEventListener('message', function(e){
    if (e.data && typeof e.data.p === 'number') draw(e.data.p);
    if (e.data && typeof e.data.weatherCold === 'boolean') setWeatherEvents(e.data.weatherCold);
  });

  measure(); draw(0);
  window.addEventListener('load', function(){ measure(); draw(last); });
  var n = 0, iv = setInterval(function(){
    measure(); draw(last);
    if (++n > 12) clearInterval(iv);
  }, 250);
})();
