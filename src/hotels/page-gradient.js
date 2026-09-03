import { NeatGradient } from '@firecms/neat';

const pageGradientConfig = {
  colors:[
    {color:'#0400FA',enabled:true},
    {color:'#4CB4BB',enabled:true},
    {color:'#3439FF',enabled:true},
    {color:'#3672FF',enabled:true},
    {color:'#2E0EC7',enabled:true},
    {color:'#27AEF2',enabled:true}
  ],
  speed:4.8,
  horizontalPressure:3,
  verticalPressure:4,
  waveFrequencyX:2,
  waveFrequencyY:3,
  waveAmplitude:5,
  secondaryWaveEnabled:false,
  secondaryWaveFrequencyX:3,
  secondaryWaveFrequencyY:3,
  secondaryWaveAmplitude:5,
  secondaryWaveSpeed:.6,
  secondaryWaveAngle:1,
  shadows:1,
  highlights:5,
  colorBrightness:1,
  colorSaturation:7,
  wireframe:false,
  antialias:false,
  colorBlending:8,
  backgroundColor:'#171717',
  backgroundAlpha:1,
  grainScale:0,
  grainSparsity:0,
  grainIntensity:0,
  grainSpeed:1,
  resolution:.42,
  renderScale:.86,
  yOffset:100000,
  yOffsetWaveMultiplier:16.5,
  yOffsetColorMultiplier:0,
  yOffsetFlowMultiplier:18.5,
  flowDistortionA:.6,
  flowDistortionB:1.2,
  flowScale:1.2,
  flowEase:.15,
  flowEnabled:true,
  enableProceduralTexture:false,
  transparentTextureVoid:false,
  textureMode:'bitmap',
  bakeEdgeSoftness:1,
  textureVoidLikelihood:.45,
  textureVoidWidthMin:200,
  textureVoidWidthMax:486,
  textureBandDensity:2.15,
  textureColorBlending:.01,
  textureSeed:333,
  textureEase:.5,
  proceduralBackgroundColor:'#000000',
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
  shapeType:'torus',
  shapeRotationX:0,
  shapeRotationY:0,
  shapeRotationZ:0,
  shapeAutoRotateSpeedX:0,
  shapeAutoRotateSpeedY:0,
  sphereRadius:15,
  torusRadius:30,
  torusTube:8.2,
  cylinderRadius:10,
  cylinderHeight:40,
  planeBend:0,
  planeTwist:0,
  silhouetteFade:1,
  cylinderFade:.08,
  ribbonFade:.05,
  flatShading:false,
  cameraLock:false,
  cameraX:-1,
  cameraY:0,
  cameraZ:0,
  cameraRotationX:-.567,
  cameraRotationY:-.546,
  cameraRotationZ:0,
  cameraZoom:2.95
};

export function mountPageGradient(host, {reduced = false} = {}) {
  const canvas = document.createElement('canvas');
  canvas.className = 'hotel-neat-gradient__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.replaceChildren(canvas);

  let gradient;

  try {
    gradient = new NeatGradient({
      ref:canvas,
      ...pageGradientConfig,
      colors:pageGradientConfig.colors.map(color => ({...color})),
      speed:reduced ? 0 : pageGradientConfig.speed
    });
  } catch (error) {
    canvas.remove();
    console.warn('Не удалось запустить NeatGradient для фона страницы.', error);
    return null;
  }

  let destroyed = false;
  const pause = () => {
    if (destroyed || gradient._isVisible === false) return;
    gradient._isVisible = false;
    cancelAnimationFrame(gradient.requestRef);
  };
  const resume = () => {
    if (destroyed || gradient._isVisible !== false) return;
    gradient._visibilityHandler?.();
  };

  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    gradient.destroy();
    canvas.remove();
  };

  destroy.pause = pause;
  destroy.resume = resume;
  return destroy;
}
