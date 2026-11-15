(() => {
  'use strict';

  const root = document.querySelector('.atelier-demo');
  if (!root || !CSS.supports('position', 'sticky')) return;
  const sticky = root.querySelector('.atelier-demo-sticky');
  const canvas = root.querySelector('.atelier-demo-canvas');
  const actions = root.querySelector('.atelier-demo-actions');
  const ecommerce = root.querySelector('.atelier-demo-ecommerce');
  const context = canvas.getContext('2d');
  if (!context || !context.roundRect) return;

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const preview = new Image();
  const vybePhoto = new Image();
  const cream = '#f5f2eb';
  const atelierAt = 0.42;
  const laptopAt = 0.60;
  const openingAt = 0.77;
  const openAt = 0.92;
  const vybeImage = { x: 387, y: 112, width: 392, height: 316 };
  const vybeInk = '#101113';
  const vybeWhite = '#f4f4ef';
  const vybeOrange = '#ff593d';
  const vybeLime = '#d8ff38';
  let screens;
  let pendingFrame = 0;
  let lastFrame;

  function smooth(start, end, value) {
    const t = Math.min(1, Math.max(0, (value - start) / (end - start)));
    return t * t * (3 - 2 * t);
  }

  function mix(from, to, progress) {
    return from + (to - from) * progress;
  }

  function rounded(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function gradient(ctx, x0, y0, x1, y1, stops) {
    const fill = ctx.createLinearGradient(x0, y0, x1, y1);
    for (const [offset, color] of stops) fill.addColorStop(offset, color);
    return fill;
  }

  function line(ctx, x0, y0, x1, y1, color, width = 1) {
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineWidth = width;
    ctx.strokeStyle = color;
    ctx.stroke();
  }

  function write(ctx, text, x, y, font, color, align = 'left') {
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }

  function texture(width, height) {
    const image = document.createElement('canvas');
    image.width = width;
    image.height = height;
    return image;
  }

  function drawVybeHome(art) {
    const ctx = art.getContext('2d');
    const w = art.width;
    ctx.fillStyle = vybeInk;
    ctx.fillRect(0, 0, w, art.height);
    ctx.fillStyle = vybeOrange;
    ctx.fillRect(0, 0, w, 18);
    write(ctx, 'FREE SHIPPING OVER €100    ✳    FIND YOUR OWN RHYTHM', w / 2, 12,
      '800 8px Inter, Arial, sans-serif', vybeInk, 'center');
    write(ctx, 'VYBE', 41, 53, '900 29px Inter, Arial, sans-serif', vybeWhite);
    write(ctx, '®', 122, 34, '700 9px Inter, Arial, sans-serif', vybeOrange);
    write(ctx, 'SHOP ALL       HOODIES       T-SHIRTS       BOTTOMS', w / 2, 47,
      '700 10px Inter, Arial, sans-serif', vybeWhite, 'center');
    write(ctx, 'BAG (0)', 742, 47, '700 10px Inter, Arial, sans-serif', vybeLime);
    line(ctx, 0, 65, w, 65, '#333336');
    write(ctx, 'NEW SEASON / DROP 001', 42, 102, '700 9px Inter, Arial, sans-serif', '#b8b8b5');

    ctx.font = '900 72px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    const title = ['WEAR', 'YOUR', 'OWN', 'RHYTHM.'];
    title.forEach((word, row) => {
      ctx.fillStyle = row === title.length - 1 ? vybeOrange : vybeWhite;
      ctx.fillText(word, 39, 167 + row * 61, 322);
    });
    write(ctx, 'Streetwear essentials designed for everyday moves.', 42, 383,
      '500 12px Inter, Arial, sans-serif', '#b2b2b0');
    write(ctx, 'No rules. Just your vibe.', 42, 400, '500 12px Inter, Arial, sans-serif', '#b2b2b0');
    ctx.fillStyle = vybeLime;
    ctx.fillRect(42, 418, 133, 27);
    write(ctx, 'DISCOVER THE DROP ↗', 108.5, 435, '800 8px Inter, Arial, sans-serif', vybeInk, 'center');
    line(ctx, 0, 470, w, 470, '#333336');
    write(ctx, 'MADE TO MOVE  /  NO RULES', 42, 490, '700 8px Inter, Arial, sans-serif', '#aaa9a6');
    write(ctx, 'EVERYDAY UNIFORM  /  VYBE STUDIO', w - 41, 490,
      '700 8px Inter, Arial, sans-serif', '#aaa9a6', 'right');
  }

  function drawVybePhoto(art, seconds) {
    const ctx = art.getContext('2d');
    const { x, y, width, height } = vybeImage;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.fillStyle = '#26282a';
    ctx.fillRect(x, y, width, height);

    if (vybePhoto.naturalWidth) {
      // VYBE's heroFloat alternates from scale(1) to scale(1.035) over eight seconds.
      const zoom = 1 + 0.035 * (1 - Math.cos(seconds * Math.PI / 8)) / 2;
      const scale = zoom * Math.max(width / vybePhoto.naturalWidth, height / vybePhoto.naturalHeight);
      const photoWidth = vybePhoto.naturalWidth * scale;
      const photoHeight = vybePhoto.naturalHeight * scale;
      ctx.drawImage(vybePhoto, x + (width - photoWidth) / 2, y + (height - photoHeight) / 2,
        photoWidth, photoHeight);
    }

    const bob = (1 - Math.cos(seconds * 2 * Math.PI / 5)) / 2;
    ctx.translate(x + 20, y + 48 - 6 * bob);
    ctx.rotate(mix(-12, -5, bob) * Math.PI / 180);
    rounded(ctx, -32, -32, 64, 64, 32, vybeLime);
    write(ctx, 'FIND YOUR', 0, -2, '800 7px Inter, Arial, sans-serif', vybeInk, 'center');
    write(ctx, 'OWN RHYTHM', 0, 8, '800 7px Inter, Arial, sans-serif', vybeInk, 'center');
    ctx.restore();
  }

  function handheld(ctx, screen, { x, y, w, h, tilt, opacity }, phone) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    ctx.translate(-w / 2, -h / 2);
    const radius = phone ? w * 0.16 : 17;
    const bezel = phone ? w * 0.047 : 10;
    ctx.shadowColor = '#000b';
    ctx.shadowBlur = phone ? 26 : 40;
    ctx.shadowOffsetY = phone ? 13 : 22;
    rounded(ctx, 0, 0, w, h, radius, '#090e12');
    ctx.shadowColor = 'transparent';
    const metal = gradient(ctx, 0, 0, w, h, [
      [0, '#b0c0c2'], [0.26, '#526268'], [0.67, '#17232c'], [1, '#63767d'],
    ]);
    rounded(ctx, 0, 0, w, h, radius, metal);
    rounded(ctx, 1.55, 1.55, w - 3.1, h - 3.1, radius - 1.55, '#101619');
    ctx.save();
    rounded(ctx, bezel, bezel, w - 2 * bezel, h - 2 * bezel, radius - bezel + 1, cream);
    ctx.clip();
    ctx.drawImage(screen, bezel, bezel, w - 2 * bezel, h - 2 * bezel);
    ctx.restore();

    if (phone) {
      rounded(ctx, w * 0.352, bezel + 2.5, w * 0.296, w * 0.072, w * 0.04, '#121617');
      rounded(ctx, w * 0.60, bezel + 4.2, w * 0.026, w * 0.026, w * 0.013, '#3a545b');
      rounded(ctx, w * 0.32, h - bezel - 6, w * 0.36, 2.7, 1.35, '#f9faf4');
    } else {
      rounded(ctx, w / 2 - 1.65, 3.1, 3.3, 3.3, 1.65, '#49616a');
    }
    ctx.restore();
  }

  function polygon(ctx, points, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  function planeCorners(project, halfWidth, near, far, center = 0) {
    return [
      project(center - halfWidth, far), project(center + halfWidth, far),
      project(center + halfWidth, near), project(center - halfWidth, near),
    ];
  }

  function laptop(ctx, screen, { center, hinge, width, height, opening, opacity }) {
    if (opacity <= 0) return null;
    ctx.save();
    ctx.globalAlpha = opacity;
    const camera = 1840;
    const cameraTilt = 0.157;
    const angle = opening * Math.PI * 0.545;
    const half = width / 2;
    const project = (x, y, depth) => {
      const scale = camera / (camera + depth);
      return { x: center + x * scale, y: hinge - (y + depth * cameraTilt) * scale };
    };
    const base = (x, distance) => project(x, 0, -distance);
    const lid = (x, distance) => project(x, distance * Math.sin(angle), -distance * Math.cos(angle));
    const baseShape = planeCorners(base, half + 3, height, 0);
    const frontY = baseShape[2].y;
    const shadow = ctx.createRadialGradient(center, frontY - 1, 0, center, frontY - 1, width * 0.65);
    shadow.addColorStop(0, '#000b');
    shadow.addColorStop(1, '#0000');
    ctx.save();
    ctx.translate(center, frontY - 1);
    ctx.scale(1, 0.17);
    ctx.translate(-center, 1 - frontY);
    ctx.fillStyle = shadow;
    ctx.fillRect(center - width * 0.65, frontY - width * 0.65, width * 1.3, width * 1.3);
    ctx.restore();

    const [,, frontRight, frontLeft] = baseShape;
    const edge = gradient(ctx, 0, frontY, 0, frontY + 7, [[0, '#8fa1a5'], [0.37, '#4e6067'], [1, '#1d2b32']]);
    polygon(ctx, [frontLeft, frontRight, { x: frontRight.x - 6, y: frontY + 6 }, { x: frontLeft.x + 6, y: frontY + 6 }], edge);
    polygon(ctx, baseShape, gradient(ctx, 0, hinge, 0, frontY, [[0, '#3b4d55'], [1, '#829297']]), '#9aabad');

    // The keyboard and trackpad stay in the base plane as the lid rotates.
    polygon(ctx, planeCorners(base, half * 0.81, height * 0.55, height * 0.09), '#26353b');
    const keyWidth = width * 0.059;
    for (let row = 0; row < 4; row++) {
      const back = height * (0.13 + row * 0.102);
      for (let col = 0; col < 13; col++) {
        polygon(ctx, planeCorners(base, keyWidth * 0.43, back + height * 0.079, back, (col - 6) * keyWidth), '#131e23');
      }
    }
    polygon(ctx, planeCorners(base, half * 0.30, height * 0.89, height * 0.59), '#63777e', '#92a1a5');

    const lidShape = planeCorners(lid, half, 0, height);
    const lidTop = lid(0, height).y;
    let linkPosition = null;
    if (lidTop >= hinge - 1) {
      polygon(ctx, lidShape, gradient(ctx, 0, hinge, 0, frontY + 1, [[0, '#293941'], [0.55, '#536870'], [1, '#829497']]), '#a1afb0');
    } else {
      polygon(ctx, lidShape, '#11181d', '#6c838a');
      const frame = width * 0.021;
      const screenHalf = half - frame;
      const near = frame * 1.16;
      const far = height - frame;
      linkPosition = { anchor: lid(0, mix(far, near, 0.86)), bottom: lid(0, near).y };
      ctx.save();
      polygon(ctx, planeCorners(lid, screenHalf, near, far), '#15272c');
      ctx.clip();
      ctx.globalAlpha = opacity * smooth(0.15, 0.43, opening);
      // Horizontal strips preserve perspective on the screen throughout the opening.
      const strips = 36;
      for (let row = 0; row < strips; row++) {
        const t = row / strips;
        const next = (row + 1) / strips;
        const top = lid(-screenHalf, mix(far, near, t));
        const bottom = lid(screenHalf, mix(far, near, next));
        ctx.drawImage(screen, 0, t * screen.height, screen.width, screen.height / strips,
          top.x, top.y, bottom.x - top.x, bottom.y - top.y + 0.45);
      }
      ctx.restore();
      const cameraDot = lid(0, height - frame * 0.52);
      rounded(ctx, cameraDot.x - 1.5, cameraDot.y - 1.5, 3, 3, 1.5, '#66828c');
    }
    line(ctx, center - half + 3, hinge + 0.8, center + half - 3, hinge + 0.8, '#202c31', 1.5);
    ctx.restore();
    return linkPosition;
  }

  const wide = {
    width: 900, height: 500,
    tablet: [[34, 83, 510, 354, -0.058], [16, 122, 258, 181, -0.049]],
    phone: [[723, 151, 141, 301, 0.092], [437, 155, 76, 163, 0.071]],
    action: [[635, 290], [355, 230]],
    laptop: { center: 712, hinge: 360, width: 324, height: 198 },
  };
  const narrow = {
    width: 430, height: 550,
    tablet: [[18, 64, 326, 227, -0.042], [13, 38, 215, 150, -0.037]],
    phone: [[305, 301, 104, 217, 0.072], [307, 51, 100, 213, 0.06]],
    action: [[208, 338], [216, 217]],
    laptop: { center: 215, hinge: 462, width: 326, height: 202 },
  };

  function devicePose([start, end], arrange, entrance, drift) {
    const [x, y, w, h, tilt] = start.map((value, i) => mix(value, end[i], arrange));
    const scale = mix(0.9, 1, entrance);
    return {
      x: x + w * (1 - scale) / 2,
      y: y + h * (1 - scale) / 2 + drift * (1 - entrance),
      w: w * scale, h: h * scale, tilt,
      opacity: mix(0.85, 1, entrance),
    };
  }

  function drawScene(ctx, width, height, progress, placeAtelier, placeEcommerce) {
    ctx.clearRect(0, 0, width, height);

    const layout = width <= 600 && width <= height ? narrow : wide;
    const maxWidth = 1600;
    const scale = Math.min(width / layout.width, height / layout.height, maxWidth / layout.width);
    const left = (width - layout.width * scale) / 2;
    const top = (height - layout.height * scale) / 2;
    const arrange = smooth(laptopAt, 0.78, progress);
    const tabletIn = smooth(0, 0.31, progress);
    const phoneIn = smooth(0.07, atelierAt, progress);
    const laptopIn = smooth(laptopAt, 0.76, progress);
    const opening = smooth(openingAt, openAt, progress);

    ctx.save();
    ctx.translate(left, top);
    ctx.scale(scale, scale);
    handheld(ctx, screens.tablet, devicePose(layout.tablet, arrange, tabletIn, 32), false);
    const linkPosition = laptop(ctx, screens.laptop, {
      ...layout.laptop,
      hinge: layout.laptop.hinge + 30 * (1 - laptopIn),
      opening,
      opacity: laptopIn,
    });
    handheld(ctx, screens.phone, devicePose(layout.phone, arrange, phoneIn, 26), true);
    ctx.restore();

    if (placeAtelier) {
      const [x, y] = layout.action[placeEcommerce ? 1 : 0];
      root.style.setProperty('--atelier-action-x', `${left + x * scale}px`);
      root.style.setProperty('--atelier-action-y', `${top + y * scale}px`);
    }
    if (placeEcommerce && linkPosition) {
      const { anchor, bottom } = linkPosition;
      const y = Math.min(anchor.y * scale, bottom * scale - 24);
      root.style.setProperty('--atelier-ecommerce-x', `${left + anchor.x * scale}px`);
      root.style.setProperty('--atelier-ecommerce-y', `${top + y}px`);
    }
  }

  function render(time) {
    pendingFrame = 0;
    const { width, height, top, bottom } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const rect = root.getBoundingClientRect();
    const stickyTop = parseFloat(getComputedStyle(sticky).top);
    const travel = Math.max(1, rect.height - sticky.offsetHeight);
    const reduced = reducedMotion.matches;
    const progress = reduced ? 1 : Math.max(0, Math.min(1, (stickyTop - rect.top) / travel));
    const animateVybe = vybePhoto.naturalWidth > 0 && progress > openingAt && !reduced &&
      !document.hidden && bottom > stickyTop && top < innerHeight;
    if (animateVybe) requestFrame();

    const sameScene = lastFrame?.progress === progress && lastFrame.width === width &&
      lastFrame.height === height && lastFrame.dpr === dpr && lastFrame.reduced === reduced;
    if (sameScene && (!animateVybe || time - lastFrame.time < 32)) return;
    lastFrame = { progress, width, height, dpr, reduced, time };

    const pixelWidth = Math.round(width * dpr);
    const pixelHeight = Math.round(height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(pixelWidth / width, 0, 0, pixelHeight / height, 0, 0);

    const showEcommerce = progress >= openAt;
    const showAtelier = showEcommerce || (progress >= atelierAt && progress < laptopAt);
    if (progress > openingAt) drawVybePhoto(screens.laptop, reduced ? 0 : time / 1000);
    drawScene(context, width, height, progress, !sameScene && showAtelier, !sameScene && showEcommerce);
    if (!sameScene) {
      actions.hidden = !showAtelier;
      ecommerce.hidden = !showEcommerce;
    }
  }

  function requestFrame() {
    if (!pendingFrame) pendingFrame = requestAnimationFrame(render);
  }

  preview.addEventListener('load', () => {
    screens = { tablet: texture(820, 565), phone: texture(390, 820), laptop: texture(820, 510) };
    screens.tablet.getContext('2d').drawImage(preview, 0, 0, 820, 565, 0, 0, 820, 565);
    screens.phone.getContext('2d').drawImage(preview, 820, 0, 390, 820, 0, 0, 390, 820);
    drawVybeHome(screens.laptop);

    root.classList.add('is-animated');
    addEventListener('scroll', requestFrame, { passive: true });
    addEventListener('resize', requestFrame, { passive: true });
    addEventListener('pageshow', requestFrame);
    document.addEventListener('visibilitychange', requestFrame);
    reducedMotion.addEventListener('change', requestFrame);
    requestFrame();
  }, { once: true });
  vybePhoto.addEventListener('load', () => {
    if (!screens) return;
    lastFrame = null;
    requestFrame();
  }, { once: true });
  preview.src = new URL('assets/atelier27-preview.webp', document.currentScript.src).href;
  vybePhoto.src = new URL('assets/vybe-hero.webp', document.currentScript.src).href;
})();
