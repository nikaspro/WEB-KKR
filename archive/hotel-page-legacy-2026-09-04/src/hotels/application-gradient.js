import { NeatGradient } from '@firecms/neat';

const applicationGradientConfig = {
  colors:[
    {color:'#101012',enabled:true},
    {color:'#101012',enabled:true},
    {color:'#111A47',enabled:true},
    {color:'#123CFF',enabled:true},
    {color:'#167BFF',enabled:true},
    {color:'#16C8F4',enabled:true}
  ],
  speed:.72,
  horizontalPressure:2.6,
  verticalPressure:2.15,
  waveFrequencyX:.78,
  waveFrequencyY:1.12,
  waveAmplitude:2.8,
  secondaryWaveEnabled:true,
  secondaryWaveFrequencyX:1.45,
  secondaryWaveFrequencyY:.9,
  secondaryWaveAmplitude:2.25,
  secondaryWaveSpeed:.32,
  secondaryWaveAngle:.72,
  shadows:5,
  highlights:4,
  colorBrightness:.94,
  colorSaturation:5.8,
  wireframe:false,
  antialias:false,
  colorBlending:7,
  backgroundColor:'#101012',
  backgroundAlpha:1,
  grainScale:0,
  grainSparsity:0,
  grainIntensity:0,
  grainSpeed:0,
  resolution:.78,
  renderScale:.78,
  yOffset:-120,
  yOffsetWaveMultiplier:.86,
  yOffsetColorMultiplier:1.1,
  yOffsetFlowMultiplier:.9,
  flowDistortionA:.26,
  flowDistortionB:1.8,
  flowScale:2.25,
  flowEase:.68,
  flowEnabled:true,
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
  domainWarpEnabled:true,
  domainWarpIntensity:.34,
  domainWarpScale:2.2,
  vignetteIntensity:.48,
  vignetteRadius:.9,
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
  cameraZoom:5
};

export function initApplicationGradient(root = document, {reduced = false} = {}) {
  const documentRoot = root.ownerDocument || root;
  const panel = root.querySelector('.hotel-application__panel');
  let canvas = panel?.querySelector('.hotel-application__neat-gradient');

  if (!canvas && panel) {
    canvas = documentRoot.createElement('canvas');
    canvas.id = 'hotelApplicationGradient';
    canvas.className = 'hotel-application__neat-gradient';
    canvas.setAttribute('aria-hidden', 'true');
    panel.prepend(canvas);
  }

  if (!canvas) return () => {};

  panel.style.position = 'relative';

  const content = panel.querySelector('.hotel-application__content');
  if (content) {
    content.style.position = 'relative';
    content.style.zIndex = '2';
  }

  let gradient;

  try {
    gradient = new NeatGradient({
      ref:canvas,
      ...applicationGradientConfig,
      colors:applicationGradientConfig.colors.map(color => ({...color})),
      speed:reduced ? 0 : applicationGradientConfig.speed
    });
  } catch (error) {
    console.warn('Не удалось запустить NeatGradient для CTA.', error);
    return () => {};
  }

  let destroyed = false;

  return () => {
    if (destroyed) return;
    destroyed = true;
    gradient.destroy();
  };
}
