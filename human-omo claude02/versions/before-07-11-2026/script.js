const frameCount = 83;
const desktopFrameDir = "new003-webp-desktop";
const mobileFrameDir = "new003-webp-mobile";

const stage = document.querySelector(".sequence-stage");
const canvas = document.querySelector(".sequence-canvas");
const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
const heroCopy = document.querySelector(".hero-copy");
const scrollCue = document.querySelector(".scroll-cue");
const loaderText = document.querySelector(".loader-bubble__text");
const chalkSection = document.querySelector(".chalk-section");
const chalkCanvas = document.querySelector(".chalk-canvas");
const chalkCtx = chalkCanvas.getContext("2d", { alpha: true });
const chalkSentence = document.querySelector(".chalk-sentence");
const galleryTrack = document.querySelector(".gallery-track");
const galleryPagination = document.querySelector(".gallery-pagination");
const readCursor = document.querySelector(".read-cursor");
const readCursorDot = document.querySelector(".read-cursor-dot");
const pencilCursor = document.querySelector(".pencil-cursor");
const chalkEraser = document.querySelector(".chalk-eraser");
const chalkPaletteButtons = [...document.querySelectorAll(".chalk-color")];
const siteNav = document.querySelector(".site-nav");
const gallerySection = document.querySelector(".gallery-section");
const whySection = document.querySelector(".why-me");
const contactSection = document.querySelector(".contact-section");
const timelineItems = [...document.querySelectorAll(".section-timeline__item")];
const timelineTargets = timelineItems.map((item) => {
  return {
    id: item.dataset.sectionTarget,
    item,
    section: document.getElementById(item.dataset.sectionTarget),
  };
}).filter((entry) => {
  return entry.section && !entry.item.hidden && entry.section.dataset.sectionHidden !== "true";
});

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
let reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let activeGalleryIndex = 0;
let galleryTimer = 0;
let galleryPaused = false;
let isDraggingGallery = false;
let galleryDragStart = 0;
let galleryDragDelta = 0;
let galleryDidDrag = false;
let readActive = false;
let pointerX = window.innerWidth / 2;
let pointerY = window.innerHeight / 2;
let cursorX = pointerX;
let cursorY = pointerY;
let dotX = pointerX;
let dotY = pointerY;
let dotAngle = 0;
let lastChalkPoint = null;
let activeChalkGradient = "blue";

const galleryImages = [
  "gallery/gal_01.jpg",
  "gallery/gal_02.jpg",
  "gallery/gal_03.jpg",
  "gallery/gal_04.jpg",
  "gallery/gal_05.jpg",
  "gallery/gal_06.jpg",
  "gallery/gal_07.jpg",
  "gallery/gal_08.jpg",
  "gallery/gal_09.jpg",
  "gallery/gal_10.jpg",
  "gallery/gal_11.jpg",
  "gallery/gal_12.jpg",
];

const chalkWords = "Design is creative problem-solving—whether refining the old or inventing the new. When it is right, it is naturally beautiful".split(" ");
const chalkGradients = {
  blue: ["#7b5cff", "#35c8ff", "rgba(53, 200, 255, 0.54)"],
  fire: ["#ff3d5a", "#ff9d2f", "rgba(255, 116, 47, 0.52)"],
  green: ["#16c784", "#d9ff6a", "rgba(104, 230, 102, 0.5)"],
  mono: ["#ffffff", "#0b0b0f", "rgba(255, 255, 255, 0.48)"],
};

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - clamp(value), 3);
}

function easeInOutCubic(value) {
  const progress = clamp(value);
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function isMobileViewport() {
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

function getElementProgress(element) {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const distance = rect.height + window.innerHeight;
  return clamp((window.innerHeight - rect.top) / distance);
}

function getSectionProgress(element) {
  if (!element) return 0;
  const rect = element.getBoundingClientRect();
  const distance = Math.max(rect.height - window.innerHeight, window.innerHeight);
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

function resizeChalkCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
  const rect = chalkSection.getBoundingClientRect();
  chalkCanvas.width = Math.max(1, Math.round(rect.width * ratio));
  chalkCanvas.height = Math.max(1, Math.round(rect.height * ratio));
  chalkCanvas.style.width = `${rect.width}px`;
  chalkCanvas.style.height = `${rect.height}px`;
  chalkCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function loadImage(src, index) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.fetchPriority = index < 14 ? "high" : "auto";
    const finish = async () => {
      try {
        if (image.decode) await image.decode();
      } catch {
        // Cached decoded assets can still draw even when decode rejects.
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
  startLoaderReveal();
}

function startLoaderReveal() {
  if (!loaderText || document.body.classList.contains("sequence-ready")) return;
  loaderText.textContent = "Hi";
  document.body.classList.remove("is-loading");
  document.body.classList.add("sequence-ready");
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
    frameCache.delete(frameCache.keys().next().value);
  }
  return frame;
}

function getNearestCachedFrame(index) {
  if (frameCache.has(index)) return frameCache.get(index);
  for (let offset = 1; offset <= 6; offset += 1) {
    if (frameCache.has(index - offset)) return frameCache.get(index - offset);
    if (frameCache.has(index + offset)) return frameCache.get(index + offset);
  }
  return null;
}

function warmNearbyFrames(progress, immediate = false) {
  if (!sequenceReady) return;
  const center = Math.round(clamp(progress) * (frameCount - 1));
  const offsets = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8, -8, 9, -9, 10, -10, 11, -11, 12, -12];
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
    if (warmIndex >= offsets.length) warmIndex = 0;
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
  const copyX = isMobileViewport() ? 0 : 112 * remaining;
  const copyY = isMobileViewport() ? 12 * remaining : -8 * remaining;
  if (heroCopy) {
    heroCopy.style.opacity = clamp(copyProgress * 1.25);
    heroCopy.style.setProperty("--copy-x", `${copyX}vw`);
    heroCopy.style.setProperty("--copy-y", `${copyY}px`);
  }
  if (scrollCue) scrollCue.classList.toggle("is-visible", progress >= 0.18);
}

function setupChalkWords() {
  chalkSentence.innerHTML = "";
  chalkWords.forEach((word, index) => {
    const span = document.createElement("span");
    span.className = "chalk-word";
    span.textContent = word;
    const direction = index % 8;
    const sideX = direction === 0 || direction === 5 ? -window.innerWidth * 0.95 : direction === 2 || direction === 6 ? window.innerWidth * 0.95 : Math.sin(index * 11.7) * window.innerWidth * 0.7;
    const sideY = direction === 1 || direction === 6 ? -window.innerHeight * 0.8 : direction === 3 || direction === 7 ? window.innerHeight * 0.8 : Math.cos(index * 17.1) * window.innerHeight * 0.58;
    span.style.setProperty("--from-x", `${Math.round(sideX)}px`);
    span.style.setProperty("--from-y", `${Math.round(sideY)}px`);
    span.style.setProperty("--from-r", `${Math.round(Math.sin(index * 17.5) * 32)}deg`);
    chalkSentence.append(span, document.createTextNode(" "));
  });
}

function updateChalkWords() {
  const raw = getSectionProgress(chalkSection);
  const rect = chalkSection.getBoundingClientRect();
  const nextStopSection = whySection?.dataset.sectionHidden === "true" ? contactSection : whySection;
  const nextRect = nextStopSection?.getBoundingClientRect();
  const nextSectionEntering = nextRect ? nextRect.top <= window.innerHeight : false;
  const paletteVisible = rect.top < window.innerHeight - 16 && rect.bottom > 64 && !nextSectionEntering;
  document.body.classList.toggle("is-in-chalk", paletteVisible);
  const progress = easeOutCubic(clamp(raw / 0.62));
  document.querySelectorAll(".chalk-word").forEach((word) => {
    const fromX = parseFloat(word.style.getPropertyValue("--from-x"));
    const fromY = parseFloat(word.style.getPropertyValue("--from-y"));
    const fromR = parseFloat(word.style.getPropertyValue("--from-r"));
    word.style.transform = `translate3d(${fromX * (1 - progress)}px, ${fromY * (1 - progress)}px, 0) rotate(${fromR * (1 - progress)}deg)`;
    word.style.opacity = 0.08 + progress * 0.92;
  });

  if (chalkEraser) {
    const eraserProgress = easeInOutCubic(clamp((raw - 0.5) / 0.22));
    const eraserFloat = Math.sin(eraserProgress * Math.PI) * -8;
    chalkEraser.style.setProperty("--eraser-x", `${eraserProgress * 135}%`);
    chalkEraser.style.setProperty("--eraser-y", `${eraserFloat}px`);
    chalkEraser.style.setProperty("--eraser-opacity", eraserProgress > 0.02 && paletteVisible ? "1" : "0");
  }
}

function drawChalkLine(x, y) {
  const rect = chalkSection.getBoundingClientRect();
  const localX = x - rect.left;
  const localY = y - rect.top;
  if (!lastChalkPoint) {
    lastChalkPoint = { x: localX, y: localY };
    return;
  }
  const distance = Math.hypot(localX - lastChalkPoint.x, localY - lastChalkPoint.y);
  if (distance < 1.5) return;
  const [startColor, endColor, shadowColor] = chalkGradients[activeChalkGradient] || chalkGradients.blue;
  const gradient = chalkCtx.createLinearGradient(lastChalkPoint.x - 90, lastChalkPoint.y, localX + 90, localY);
  gradient.addColorStop(0, startColor);
  gradient.addColorStop(1, endColor);
  chalkCtx.save();
  chalkCtx.globalAlpha = 0.9;
  chalkCtx.lineCap = "round";
  chalkCtx.lineJoin = "round";
  chalkCtx.lineWidth = 9;
  chalkCtx.shadowBlur = 2;
  chalkCtx.shadowColor = shadowColor;
  chalkCtx.strokeStyle = gradient;
  chalkCtx.beginPath();
  chalkCtx.moveTo(lastChalkPoint.x, lastChalkPoint.y);
  const midX = (lastChalkPoint.x + localX) / 2;
  const midY = (lastChalkPoint.y + localY) / 2;
  chalkCtx.quadraticCurveTo(lastChalkPoint.x, lastChalkPoint.y, midX, midY);
  chalkCtx.stroke();
  chalkCtx.restore();
  lastChalkPoint = { x: midX, y: midY };
}

function setupGallery() {
  if (!galleryTrack) return;
  galleryImages.forEach((src, index) => {
    const card = document.createElement("button");
    card.className = "gallery-card";
    card.type = "button";
    card.setAttribute("aria-label", `Show gallery image ${index + 1}`);
    const img = document.createElement("img");
    img.src = src;
    img.alt = "";
    card.append(img);
    card.addEventListener("click", () => {
      activeGalleryIndex = index;
      renderGallery();
    });
    galleryTrack.append(card);

    const dot = document.createElement("button");
    dot.className = "gallery-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Show gallery image ${index + 1}`);
    dot.addEventListener("click", () => {
      activeGalleryIndex = index;
      renderGallery();
    });
    galleryPagination?.append(dot);
  });
  renderGallery();
  galleryTimer = window.setInterval(() => {
    if (!galleryPaused && !isDraggingGallery) {
      activeGalleryIndex = (activeGalleryIndex + 1) % galleryImages.length;
      renderGallery();
    }
  }, 1250);
}

function renderGallery() {
  const cards = [...galleryTrack.querySelectorAll(".gallery-card")];
  const dots = [...(galleryPagination?.querySelectorAll(".gallery-dot") || [])];
  const previousIndex = (activeGalleryIndex - 1 + cards.length) % cards.length;
  const nextIndex = (activeGalleryIndex + 1) % cards.length;
  cards.forEach((card, index) => {
    card.classList.remove("is-prev", "is-active", "is-next");
    card.classList.toggle("is-active", index === activeGalleryIndex);
    card.classList.toggle("is-prev", index === previousIndex);
    card.classList.toggle("is-next", index === nextIndex);
  });
  dots.forEach((dot, index) => {
    const active = index === activeGalleryIndex;
    dot.classList.toggle("is-active", active);
    dot.setAttribute("aria-current", active ? "true" : "false");
  });
}

function setGalleryDrag(delta) {
  if (!galleryTrack) return;
  const limit = Math.min(window.innerWidth * 0.18, 180);
  galleryDragDelta = Math.max(-limit, Math.min(limit, delta));
  galleryTrack.style.setProperty("--gallery-drag-x", `${galleryDragDelta}px`);
}

function updateCardStack() {
  document.querySelectorAll(".main-card").forEach((card) => {
    const rect = card.getBoundingClientRect();
    const touch = clamp((window.innerHeight * 0.55 - rect.top) / (window.innerHeight * 0.65));
    const tilt = parseFloat(card.dataset.tilt || 0);
    card.style.transform = `rotate(${tilt * touch}deg) translate3d(0, ${-touch * 14}px, 0)`;
  });
}

function setupReadCursor() {
  document.querySelectorAll(".read-target").forEach((target) => {
    target.addEventListener("pointerenter", () => {
      readActive = true;
      document.body.classList.add("has-read-cursor");
    });
    target.addEventListener("pointerleave", () => {
      readActive = false;
      document.body.classList.remove("has-read-cursor");
    });
  });
}

function updateCursors() {
  cursorX += (pointerX - cursorX) * 0.28;
  cursorY += (pointerY - cursorY) * 0.28;
  dotAngle += readActive ? 0.07 : 0.02;
  const orbitX = pointerX + Math.cos(dotAngle) * 52 + Math.sin(dotAngle * 1.9) * 12;
  const orbitY = pointerY + Math.sin(dotAngle) * 52 + Math.cos(dotAngle * 1.4) * 12;
  dotX += (orbitX - dotX) * 0.16;
  dotY += (orbitY - dotY) * 0.16;
  readCursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0) translate3d(-50%, -50%, 0)`;
  readCursorDot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate3d(-50%, -50%, 0)`;
  pencilCursor.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate3d(-50%, -50%, 0) scaleX(-1)`;
}

function setupSideCards() {
  const cards = [...document.querySelectorAll(".side-card")];
  cards.forEach((card) => {
    card.addEventListener("pointerenter", () => {
      cards.forEach((item) => item.classList.toggle("side-card--active", item === card));
    });
  });
  document.querySelector(".side-projects")?.addEventListener("pointerleave", () => {
    cards.forEach((item, index) => item.classList.toggle("side-card--active", index === 0));
  });
}

function updateWhyMotion() {
  const section = document.querySelector(".why-me");
  const progress = easeOutCubic(getElementProgress(section));
  document.querySelectorAll(".bento-card img").forEach((image, index) => {
    const speeds = [-34, -52, -27, -44, -62];
    const delay = index * 0.08;
    const y = speeds[index % speeds.length] * clamp((progress - delay) / 0.72);
    image.style.setProperty("--why-y", `${y}px`);
  });
}

function setDepth(element, name, amount) {
  if (element) element.style.setProperty(name, `${amount.toFixed(2)}px`);
}

function updateParallaxDepth() {
  const side = document.querySelector(".side-projects");
  const chalk = document.querySelector(".chalk-section");
  const gallery = document.querySelector(".gallery-section");
  const why = document.querySelector(".why-me");
  const contact = document.querySelector(".contact-section");

  const sideProgress = getElementProgress(side);
  const chalkProgress = getElementProgress(chalk);
  const galleryProgress = getElementProgress(gallery);
  const whyProgress = getElementProgress(why);
  const contactProgress = getElementProgress(contact);
  const sideRect = side?.getBoundingClientRect();
  const sideCoverProgress = sideRect ? easeOutCubic(clamp((window.innerHeight - sideRect.top) / window.innerHeight)) : 0;

  setDepth(side, "--side-cover-y", (1 - sideCoverProgress) * window.innerHeight * 0.56);
  document.querySelectorAll(".side-card").forEach((card, index) => {
    setDepth(card, "--side-depth", (0.5 - sideProgress) * (index + 1) * 9);
  });
  setDepth(chalkSentence, "--chalk-depth", (0.5 - chalkProgress) * 20);
  setDepth(galleryTrack, "--gallery-depth", (0.5 - galleryProgress) * 26);
  setDepth(document.querySelector(".why-layout"), "--why-depth", (0.5 - whyProgress) * 30);
  setDepth(document.querySelector(".contact-copy"), "--contact-depth", (0.5 - contactProgress) * 22);
}

function colorBrightness(color) {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return 255;
  const [, r, g, b] = match.map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

function styleBrightness(style) {
  const colors = `${style.backgroundColor} ${style.backgroundImage}`.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g);
  const values = [...colors].map((match) => {
    const [, r, g, b] = match.map(Number);
    return (r * 299 + g * 587 + b * 114) / 1000;
  });
  return values.length ? Math.min(...values) : 255;
}

function canvasBrightnessAt(canvasElement, x, y) {
  try {
    const rect = canvasElement.getBoundingClientRect();
    const sampleX = Math.round(((x - rect.left) / rect.width) * canvasElement.width);
    const sampleY = Math.round(((y - rect.top) / rect.height) * canvasElement.height);
    const sample = canvasElement.getContext("2d").getImageData(sampleX, sampleY, 1, 1).data;
    return (sample[0] * 299 + sample[1] * 587 + sample[2] * 114) / 1000;
  } catch {
    return 255;
  }
}

function updateNavTint() {
  if (!siteNav) return;
  siteNav.style.setProperty("--nav-ink", "#000");
  siteNav.classList.remove("logo-on-dark");
}

function updateSectionTimeline() {
  if (!timelineTargets.length) return;
  const marker = window.scrollY + window.innerHeight * 0.42;
  let active = timelineTargets[0];
  timelineTargets.forEach((entry) => {
    if (entry.section.offsetTop <= marker) active = entry;
  });
  timelineItems.forEach((item) => {
    const isActive = item === active.item;
    item.classList.toggle("is-active", isActive);
    item.setAttribute("aria-current", isActive ? "true" : "false");
  });
}

function getTimelineScrollTarget(id, section) {
  if (id === "playground") {
    return section.offsetTop + window.innerHeight * 0.06;
  }
  if (id === "chalk-board") {
    const distance = Math.max(section.offsetHeight - window.innerHeight, window.innerHeight);
    return section.offsetTop + distance * 0.72;
  }
  if (id === "gallery") {
    const centerOffset = Math.max(0, (section.offsetHeight - window.innerHeight) / 2);
    return section.offsetTop + centerOffset + 24;
  }
  if (id === "contact") {
    return section.offsetTop - window.innerHeight * 0.08;
  }
  return section.offsetTop;
}

function setupTimelineNavigation() {
  timelineTargets.forEach(({ id, item, section }) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const target = Math.max(0, getTimelineScrollTarget(id, section));
      window.scrollTo({
        top: target,
        behavior: reduceMotion ? "auto" : "smooth",
      });
      timelineItems.forEach((timelineItem) => {
        const isActive = timelineItem === item;
        timelineItem.classList.toggle("is-active", isActive);
        timelineItem.setAttribute("aria-current", isActive ? "true" : "false");
      });
      if (history.replaceState) history.replaceState(null, "", `#${id}`);
    });
  });
}

function setupBentoReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("is-visible");
    });
  }, { threshold: 0.24 });
  document.querySelectorAll(".bento-card").forEach((card, index) => {
    card.style.transitionDelay = `${index * 90}ms`;
    observer.observe(card);
  });
}

function tick() {
  targetProgress = getScrollProgress(stage);
  const easing = reduceMotion ? 1 : 0.34;
  smoothProgress += (targetProgress - smoothProgress) * easing;
  if (Math.abs(targetProgress - smoothProgress) < 0.001) smoothProgress = targetProgress;
  drawSequenceFrame(smoothProgress);
  updateHeroContent(targetProgress);
  updateChalkWords();
  updateCardStack();
  updateWhyMotion();
  updateParallaxDepth();
  updateNavTint();
  updateSectionTimeline();
  updateCursors();
  requestAnimationFrame(tick);
}

window.addEventListener("pointermove", (event) => {
  pointerX = event.clientX;
  pointerY = event.clientY;
}, { passive: true });

chalkSection.addEventListener("pointerenter", () => {
  document.body.classList.add("has-pencil");
});

chalkSection.addEventListener("pointerleave", () => {
  document.body.classList.remove("has-pencil");
  lastChalkPoint = null;
});

chalkSection.addEventListener("pointermove", (event) => {
  if (event.target.closest(".chalk-palette")) {
    lastChalkPoint = null;
    return;
  }
  drawChalkLine(event.clientX, event.clientY);
}, { passive: true });

chalkEraser?.addEventListener("click", () => {
  chalkCtx.clearRect(0, 0, chalkCanvas.width, chalkCanvas.height);
  lastChalkPoint = null;
});

chalkPaletteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeChalkGradient = button.dataset.chalkGradient || "blue";
    chalkPaletteButtons.forEach((paletteButton) => {
      const isActive = paletteButton === button;
      paletteButton.classList.toggle("is-active", isActive);
      paletteButton.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
    lastChalkPoint = null;
  });
});

galleryTrack?.addEventListener("pointerenter", () => {
  galleryPaused = true;
});

galleryTrack?.addEventListener("pointerleave", () => {
  galleryPaused = false;
  isDraggingGallery = false;
  galleryTrack.classList.remove("is-dragging");
  setGalleryDrag(0);
});

galleryTrack?.addEventListener("pointerdown", (event) => {
  isDraggingGallery = true;
  galleryDragStart = event.clientX;
  galleryDragDelta = 0;
  galleryDidDrag = false;
  galleryPaused = true;
  galleryTrack.classList.add("is-dragging");
  galleryTrack.setPointerCapture(event.pointerId);
});

galleryTrack?.addEventListener("pointermove", (event) => {
  if (!isDraggingGallery) return;
  const delta = event.clientX - galleryDragStart;
  if (Math.abs(delta) > 4) galleryDidDrag = true;
  setGalleryDrag(delta);
});

galleryTrack?.addEventListener("pointerup", (event) => {
  if (!isDraggingGallery) return;
  const delta = event.clientX - galleryDragStart;
  if (Math.abs(delta) > 36) {
    activeGalleryIndex = (activeGalleryIndex + (delta < 0 ? 1 : -1) + galleryImages.length) % galleryImages.length;
    renderGallery();
  }
  isDraggingGallery = false;
  galleryTrack.classList.remove("is-dragging");
  setGalleryDrag(0);
  window.setTimeout(() => {
    galleryDidDrag = false;
  }, 0);
});

galleryTrack?.addEventListener("pointercancel", () => {
  isDraggingGallery = false;
  galleryTrack.classList.remove("is-dragging");
  setGalleryDrag(0);
});

galleryTrack?.addEventListener("click", (event) => {
  if (!galleryDidDrag) return;
  event.preventDefault();
  event.stopPropagation();
}, true);

galleryTrack?.addEventListener("lostpointercapture", () => {
  if (!isDraggingGallery) return;
  isDraggingGallery = false;
  galleryTrack.classList.remove("is-dragging");
  setGalleryDrag(0);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  resizeChalkCanvas();
  setupChalkWords();
  prepareSequence();
  updateHeroContent(targetProgress);
}, { passive: true });

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", (event) => {
  reduceMotion = event.matches;
});

resizeCanvas();
setupChalkWords();
resizeChalkCanvas();
setupGallery();
setupSideCards();
setupReadCursor();
setupTimelineNavigation();
setupBentoReveal();
prepareSequence();
updateHeroContent(0);
requestAnimationFrame(tick);
