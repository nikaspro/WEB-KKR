import { NeatGradient } from '@firecms/neat';

const agentGradientConfig = {
  colors:[
    {color:'#0400FA',enabled:true},
    {color:'#3439FF',enabled:true},
    {color:'#1C1D1D',enabled:true},
    {color:'#5C78FF',enabled:true},
    {color:'#3672FF',enabled:true},
    {color:'#AEBEFF',enabled:false}
  ],
  speed:2,
  horizontalPressure:4,
  verticalPressure:3,
  waveFrequencyX:0,
  waveFrequencyY:0,
  waveAmplitude:0,
  secondaryWaveEnabled:false,
  secondaryWaveFrequencyX:3,
  secondaryWaveFrequencyY:3,
  secondaryWaveAmplitude:5,
  secondaryWaveSpeed:.6,
  secondaryWaveAngle:1,
  shadows:2,
  highlights:7,
  colorBrightness:1,
  colorSaturation:8,
  wireframe:false,
  antialias:false,
  colorBlending:5,
  backgroundColor:'#FF0000',
  backgroundAlpha:1,
  grainScale:0,
  grainSparsity:0,
  grainIntensity:0,
  grainSpeed:0,
  resolution:.7,
  renderScale:.7,
  yOffset:0,
  yOffsetWaveMultiplier:1.5,
  yOffsetColorMultiplier:1.8,
  yOffsetFlowMultiplier:2,
  flowDistortionA:.4,
  flowDistortionB:3,
  flowScale:3.3,
  flowEase:.53,
  flowEnabled:false,
  enableProceduralTexture:false,
  transparentTextureVoid:false,
  textureMode:'bitmap',
  bakeEdgeSoftness:1,
  textureVoidLikelihood:.06,
  textureVoidWidthMin:10,
  textureVoidWidthMax:500,
  textureBandDensity:.8,
  textureColorBlending:.06,
  textureSeed:333,
  textureEase:.75,
  proceduralBackgroundColor:'#003FFF',
  textureShapeTriangles:20,
  textureShapeCircles:15,
  textureShapeBars:15,
  textureShapeSquiggles:10,
  domainWarpEnabled:false,
  domainWarpIntensity:0,
  domainWarpScale:3,
  vignetteIntensity:0,
  vignetteRadius:.8,
  fresnelEnabled:false,
  fresnelPower:2,
  fresnelIntensity:.5,
  fresnelColor:'#FFFFFF',
  iridescenceEnabled:false,
  iridescenceIntensity:.5,
  iridescenceSpeed:1,
  prismEdgeEnabled:false,
  prismEdgeIntensity:.5,
  prismEdgeThinness:3,
  prismEdgeSpread:1,
  prismEdgeSpeed:.5,
  prismEdgeRipple:1,
  bloomIntensity:0,
  bloomThreshold:.7,
  chromaticAberration:0,
  shapeType:'plane',
  shapeRotationX:0,
  shapeRotationY:0,
  shapeRotationZ:0,
  shapeAutoRotateSpeedX:0,
  shapeAutoRotateSpeedY:0,
  sphereRadius:15,
  torusRadius:15,
  torusTube:5,
  cylinderRadius:10,
  cylinderHeight:40,
  planeBend:0,
  planeTwist:0,
  silhouetteFade:.25,
  cylinderFade:.08,
  ribbonFade:.05,
  flatShading:true,
  cameraLock:true,
  cameraX:0,
  cameraY:0,
  cameraZ:0,
  cameraRotationX:0,
  cameraRotationY:0,
  cameraRotationZ:0,
  cameraZoom:1
};

export function initAgentMessageGradients(root = document, { reduced = false } = {}) {
  const cards = [...root.querySelectorAll('.hotel-message--agent')];
  const entries = [];
  let scrollFrame = 0;
  let destroyed = false;

  cards.forEach(card => {
    if (card.dataset.neatReady === 'true') return;

    const canvas = document.createElement('canvas');
    canvas.className = 'hotel-message__neat-gradient';
    canvas.setAttribute('aria-hidden', 'true');
    card.prepend(canvas);

    try {
      const gradient = new NeatGradient({
        ref:canvas,
        ...agentGradientConfig,
        colors:agentGradientConfig.colors.map(color => ({...color})),
        speed:reduced ? 0 : agentGradientConfig.speed
      });

      card.dataset.neatReady = 'true';
      entries.push({card, canvas, gradient});
    } catch (error) {
      canvas.remove();
      console.warn('Не удалось запустить NeatGradient для сообщения AI.', error);
    }
  });

  const visibilityObserver = reduced || !entries.length
    ? null
    : new IntersectionObserver(observed => {
        observed.forEach(item => {
          const entry = entries.find(candidate => candidate.card === item.target);
          if (entry) entry.gradient.speed = item.isIntersecting ? agentGradientConfig.speed : 0;
        });
      }, {rootMargin:'240px 0px'});

  entries.forEach(entry => visibilityObserver?.observe(entry.card));

  const syncScrollOffset = () => {
    scrollFrame = 0;
    entries.forEach(entry => {
      entry.gradient.yOffset = scrollY;
    });
  };

  const handleScroll = () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(syncScrollOffset);
  };

  if (!reduced && entries.length) {
    addEventListener('scroll', handleScroll, {passive:true});
    syncScrollOffset();
  }

  return () => {
    if (destroyed) return;
    destroyed = true;
    visibilityObserver?.disconnect();
    removeEventListener('scroll', handleScroll);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);

    entries.forEach(({card, canvas, gradient}) => {
      gradient.destroy();
      canvas.remove();
      delete card.dataset.neatReady;
    });
  };
}
