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

  window.__draw = draw;
  window.addEventListener('message', function(e){
    if (e.data && typeof e.data.p === 'number') draw(e.data.p);
  });

  measure(); draw(0);
  window.addEventListener('load', function(){ measure(); draw(last); });
  var n = 0, iv = setInterval(function(){
    measure(); draw(last);
    if (++n > 12) clearInterval(iv);
  }, 250);
})();
