const frameCount = 83;
const desktopFrameDir = "new003-webp-desktop";
const mobileFrameDir = "new003-webp-mobile";

const stage = document.querySelector(".sequence-stage");
const canvas = document.querySelector(".sequence-canvas");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
const heroCopy = document.querySelector(".hero-copy");
const loaderText = document.querySelector(".loader-bubble__text");
const scrollCue = document.querySelector(".scroll-cue");
const greetings = ["Hello", "สวัสดี", "Hola", "Bonjour", "Ciao", "Hallo", "こんにちは", "안녕하세요", "你好", "Olá", "नमस्ते"];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

document.body.classList.add("is-loading");

let frameDir = "";
let framePaths = [];
let sourceImages = [];
let frameCache = new Map();
let sequenceReady = false;
let targetProgress = 0;
let smoothProgress = 0;
let lastDrawKey = "";
let resizeTimer = 0;
let warmIndex = 0;
let greetingTimer = 0;
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - clamp(value), 3);
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function isCompactHero() {
  return window.matchMedia("(max-width: 760px)").matches;
}

function buildFramePaths(dir) {
  return Array.from({ length: frameCount }, (_, index) => {
    return `${dir}/frame-${String(index + 1).padStart(3, "0")}.webp`;
  });
}

function getScrollProgress(element) {
  if (!element) return 0;

  const rect = element.getBoundingClientRect();
  const distance = rect.height - window.innerHeight;
  if (distance <= 0) return 0;
  return clamp(-rect.top / distance);
}

function getCanvasRatio() {
  const dpr = window.devicePixelRatio || 1;
  const mobile = isMobileViewport();
  const maxPixelsPerFrame = mobile ? 1250000 : 2800000;
  const memoryCap = Math.sqrt(maxPixelsPerFrame / Math.max(window.innerWidth * window.innerHeight, 1));
  const deviceCap = mobile ? 1.35 : 1.85;
  return Math.max(1, Math.min(dpr, deviceCap, memoryCap));
}

function maxCachedFrames() {
  return isMobileViewport() ? 22 : 34;
}

function resizeCanvas() {
  const ratio = getCanvasRatio();
  const width = Math.round(window.innerWidth * ratio);
  const height = Math.round(window.innerHeight * ratio);

  if (canvas.width === width && canvas.height === height) return;

  canvas.width = width;
  canvas.height = height;
  frameCache.clear();
  lastDrawKey = "";

  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    drawSequenceFrame(smoothProgress);
    warmNearbyFrames(smoothProgress, true);
  }, 120);
}

function loadImage(src, index) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = index < 14 ? "high" : "auto";

    const finish = async () => {
      try {
        if (image.decode) {
          await image.decode();
        }
      } catch {
        // Decoded WebP frames are still drawable even if decode rejects for a cached asset.
      }

      sourceImages[index] = image;
      resolve(image);
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", () => resolve(null), { once: true });
    image.src = src;
    sourceImages[index] = image;
  });
}

async function prepareSequence() {
  const nextDir = isMobileViewport() ? mobileFrameDir : desktopFrameDir;
  if (nextDir === frameDir && sequenceReady) return;

  frameDir = nextDir;
  framePaths = buildFramePaths(frameDir);
  sourceImages = [];
  frameCache.clear();
  sequenceReady = false;
  canvas.classList.remove("is-ready");

  await Promise.all(framePaths.map(loadImage));
  sequenceReady = sourceImages.every((image) => image?.complete && image.naturalWidth);
  drawSequenceFrame(smoothProgress);
  warmNearbyFrames(smoothProgress, true);
  canvas.classList.add("is-ready");
  startGreetingBadge();
}

function startGreetingBadge() {
  if (!loaderText || document.body.classList.contains("sequence-ready")) return;

  document.body.classList.remove("is-loading");
  document.body.classList.add("sequence-ready");

  if (isCompactHero()) {
    document.body.classList.add("mobile-sequence-ready");
    window.clearInterval(greetingTimer);
    loaderText.textContent = "Hi";
    return;
  }

  document.body.classList.remove("mobile-sequence-ready");
  loaderText.textContent = "Hello";

  let index = 1;
  window.clearInterval(greetingTimer);
  greetingTimer = window.setInterval(() => {
    loaderText.textContent = greetings[index % greetings.length];
    index += 1;
  }, 1200);
}

function syncBubbleMode() {
  if (!loaderText || !document.body.classList.contains("sequence-ready")) return;

  if (isCompactHero()) {
    document.body.classList.add("mobile-sequence-ready");
    window.clearInterval(greetingTimer);
    loaderText.textContent = "Hi";
  } else if (document.body.classList.contains("mobile-sequence-ready")) {
    document.body.classList.remove("mobile-sequence-ready");
    document.body.classList.remove("sequence-ready");
    startGreetingBadge();
  }
}

function drawImageCover(targetContext, image, width, height) {
  const targetRatio = width / height;
  const imageRatio = image.naturalWidth / image.naturalHeight;
  let drawWidth = width;
  let drawHeight = height;

  if (imageRatio > targetRatio) {
    drawHeight = height;
    drawWidth = drawHeight * imageRatio;
  } else {
    drawWidth = width;
    drawHeight = drawWidth / imageRatio;
  }

  targetContext.clearRect(0, 0, width, height);
  targetContext.imageSmoothingEnabled = true;
  targetContext.imageSmoothingQuality = "high";
  targetContext.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function renderFrame(index) {
  const cached = frameCache.get(index);
  if (cached) {
    frameCache.delete(index);
    frameCache.set(index, cached);
    return cached;
  }

  const image = sourceImages[index];
  if (!image?.complete || !image.naturalWidth || !canvas.width || !canvas.height) return null;

  const frame = document.createElement("canvas");
  frame.width = canvas.width;
  frame.height = canvas.height;
  drawImageCover(frame.getContext("2d", { alpha: false }), image, frame.width, frame.height);
  frameCache.set(index, frame);

  while (frameCache.size > maxCachedFrames()) {
    const oldestKey = frameCache.keys().next().value;
    frameCache.delete(oldestKey);
  }

  return frame;
}

function getNearestCachedFrame(index) {
  if (frameCache.has(index)) return frameCache.get(index);

  for (let offset = 1; offset <= 6; offset += 1) {
    const previous = index - offset;
    const next = index + offset;
    if (frameCache.has(previous)) return frameCache.get(previous);
    if (frameCache.has(next)) return frameCache.get(next);
  }

  return null;
}

function warmNearbyFrames(progress, immediate = false) {
  if (!sequenceReady) return;

  const center = Math.round(clamp(progress) * (frameCount - 1));
  const offsets = [
    0,
    1, -1,
    2, -2,
    3, -3,
    4, -4,
    5, -5,
    6, -6,
    7, -7,
    8, -8,
    9, -9,
    10, -10,
    11, -11,
    12, -12,
  ];
  const work = () => {
    let rendered = 0;
    while (warmIndex < offsets.length && rendered < (immediate ? 13 : 4)) {
      const index = center + offsets[warmIndex];
      warmIndex += 1;
      if (index >= 0 && index < frameCount && !frameCache.has(index)) {
        renderFrame(index);
        rendered += 1;
      }
    }
    if (warmIndex >= offsets.length) {
      warmIndex = 0;
    }
  };

  if (immediate) {
    work();
  } else if ("requestIdleCallback" in window) {
    window.requestIdleCallback(work, { timeout: 80 });
  } else {
    requestAnimationFrame(work);
  }
}

function drawSequenceFrame(progress) {
  if (!sequenceReady) return;

  const sequenceProgress = clamp(progress / 0.9);
  const exactFrame = sequenceProgress * (frameCount - 1);
  const currentIndex = Math.floor(exactFrame);
  const nextIndex = Math.min(currentIndex + 1, frameCount - 1);
  const blend = exactFrame - currentIndex;
  const current = renderFrame(currentIndex) || getNearestCachedFrame(currentIndex);
  const next = renderFrame(nextIndex) || getNearestCachedFrame(nextIndex);
  const drawKey = `${currentIndex}:${nextIndex}:${blend.toFixed(3)}:${canvas.width}x${canvas.height}:${frameDir}`;

  if (!current || drawKey === lastDrawKey) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(current, 0, 0);

  if (next && blend > 0.01) {
    ctx.globalAlpha = blend;
    ctx.drawImage(next, 0, 0);
    ctx.globalAlpha = 1;
  }

  lastDrawKey = drawKey;
  warmNearbyFrames(sequenceProgress);
}

function updateHeroContent(progress) {
  const copyProgress = easeOutCubic(progress / 0.18);
  const remaining = 1 - copyProgress;
  const copyX = isCompactHero() ? 0 : 112 * remaining;
  const copyY = isCompactHero() ? 12 * remaining : -8 * remaining;
  const opacity = clamp(copyProgress * 1.25);

  if (heroCopy) {
    heroCopy.style.opacity = opacity;
    heroCopy.style.setProperty("--copy-x", `${copyX}vw`);
    heroCopy.style.setProperty("--copy-y", `${copyY}px`);
  }

  if (scrollCue) {
    scrollCue.classList.toggle("is-visible", progress >= 0.18);
  }
}

function tick() {
  targetProgress = getScrollProgress(stage);
  const easing = reduceMotion ? 1 : 0.34;
  smoothProgress += (targetProgress - smoothProgress) * easing;

  if (Math.abs(targetProgress - smoothProgress) < 0.001) {
    smoothProgress = targetProgress;
  }

  drawSequenceFrame(smoothProgress);
  updateHeroContent(targetProgress);
  requestAnimationFrame(tick);
}

window.addEventListener("resize", () => {
  resizeCanvas();
  prepareSequence();
  syncBubbleMode();
  updateHeroContent(targetProgress);
}, { passive: true });

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (event) => {
  reduceMotion = event.matches;
});

resizeCanvas();
prepareSequence();
updateHeroContent(0);
requestAnimationFrame(tick);
