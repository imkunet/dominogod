const isFirefox = /firefox/i.test(navigator.userAgent);

const playPlaceSound = (ctx: AudioContext | null, high: boolean) => {
  if (ctx == null) return;
  const oscillator = ctx.createOscillator();

  oscillator.type = 'sine';
  oscillator.frequency.value = high ? 400 : 200;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(isFirefox ? 4 : 0.25, ctx.currentTime);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1e-6, ctx.currentTime + 0.04);
  oscillator.stop(ctx.currentTime + 0.04);
};

const playDingSound = (ctx: AudioContext | null) => {
  if (ctx == null) return;

  const oscillator = ctx.createOscillator();
  oscillator.frequency.value = 2000;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.1, ctx.currentTime);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(1e-6, ctx.currentTime + 0.5);
  oscillator.stop(ctx.currentTime + 0.5);
};

export { playPlaceSound, playDingSound };
