const canvas = document.querySelector('#pyramid');
const ctx = canvas.getContext('2d');

if (ctx) {
  const vertices = [
    [-1, -0.83, 1], [1, -0.83, 1], [1, -0.83, -1], [-1, -0.83, -1], [0, 1.72, 0],
  ];
  const faces = [
    { corners: [0, 1, 4], id: 'project', label: 'About', color: [142, 184, 232] },
    { corners: [1, 2, 4], id: 'contribution', label: 'Contribution', color: [184, 170, 231] },
    { corners: [2, 3, 4], id: 'rooms', label: 'Rooms', color: [147, 218, 198] },
    { corners: [3, 0, 4], id: 'installation', label: 'Installation', color: [125, 188, 226] },
    { corners: [0, 3, 2, 1], id: 'materials', label: 'Misc.', color: [184, 222, 242] },
  ];
  const distance = 6;
  let yaw = 0.42;
  let pitch = -0.35;
  let drag = null;
  let hover = null;
  let visible = [];
  let width = 0;
  let height = 0;

  const dot = (a, b) => a.reduce((sum, value, index) => sum + value * b[index], 0);
  const subtract = (a, b) => a.map((value, index) => value - b[index]);

  function center(points) {
    return points[0].map((_, index) => points.reduce((sum, point) => sum + point[index], 0) / points.length);
  }

  function rotate([x, y, z]) {
    const side = x * Math.cos(yaw) + z * Math.sin(yaw);
    const depth = z * Math.cos(yaw) - x * Math.sin(yaw);
    return [side, y * Math.cos(pitch) - depth * Math.sin(pitch), y * Math.sin(pitch) + depth * Math.cos(pitch)];
  }

  function project([x, y, z]) {
    const scale = Math.min(width, height) * 0.286 * distance / (distance - z);
    return [width / 2 + x * scale, height * 0.45 + y * scale];
  }

  function normal([a, b, c]) {
    const [ux, uy, uz] = subtract(b, a);
    const [vx, vy, vz] = subtract(c, a);
    const vector = [uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx];
    return vector.map((value) => value / Math.hypot(...vector));
  }

  function trace(polygon) {
    ctx.beginPath();
    polygon.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
  }

  function render() {
    if (!width || !height) return;
    const posed = vertices.map(rotate);
    visible = faces.map((face) => {
      const points = face.corners.map((index) => posed[index]);
      const direction = normal(points);
      const midpoint = center(points);
      const facing = dot(direction, subtract([0, 0, distance], midpoint)) / distance;
      return { ...face, midpoint, facing, polygon: points.map(project) };
    }).filter((face) => face.facing > 0.001);
    visible.sort((a, b) => a.midpoint[2] - b.midpoint[2]);

    ctx.clearRect(0, 0, width, height);
    for (const face of visible) {
      const active = face.id === hover;
      const [first] = face.polygon;
      const tip = face.polygon[2];
      const tint = face.color.join(', ');
      const wash = ctx.createLinearGradient(first[0], first[1], tip[0], tip[1]);
      wash.addColorStop(0, `rgba(${tint}, ${active ? 0.69 : 0.27 + face.facing * 0.30})`);
      wash.addColorStop(0.58, `rgba(${tint}, ${active ? 0.40 : 0.13 + face.facing * 0.16})`);
      wash.addColorStop(1, `rgba(${tint}, ${active ? 0.64 : 0.37})`);

      trace(face.polygon);
      ctx.fillStyle = wash;
      ctx.fill();
      ctx.lineWidth = active ? 2 : 1.1;
      ctx.strokeStyle = active ? '#a5ff77' : `rgba(${tint}, .86)`;
      ctx.stroke();

      if (face.facing > 0.12) {
        const [, y] = project(face.midpoint);
        const edges = face.polygon.flatMap(([ax, ay], index) => {
          const [bx, by] = face.polygon[(index + 1) % face.polygon.length];
          if ((ay > y) === (by > y)) return [];
          return [ax + ((y - ay) / (by - ay)) * (bx - ax)];
        });
        const left = Math.min(...edges);
        const right = Math.max(...edges);
        const labelWidth = right - left - 12;
        if (labelWidth < 40) continue;

        ctx.save();
        ctx.clip();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '17px Title1, sans-serif';
        ctx.fillStyle = active ? '#e5ffd8' : '#f2faff';
        ctx.fillText(face.label.toUpperCase(), (left + right) / 2, y, Math.min(145, labelWidth));
        ctx.restore();
      }
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    render();
  }

  function hitFace(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return [...visible].reverse().find(({ polygon }) => {
      const signs = polygon.map(([ax, ay], index) => {
        const [bx, by] = polygon[(index + 1) % polygon.length];
        return (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      });
      return signs.every((sign) => sign >= 0) || signs.every((sign) => sign <= 0);
    });
  }

  function highlight(id) {
    if (hover === id) return;
    hover = id;
    canvas.classList.toggle('over-face', Boolean(id));
    render();
  }

  function openFace(id) {
    document.querySelector(`[data-face="${id}"]`)?.click();
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (drag || event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, pitch, moved: false };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drag) {
      highlight(hitFace(event)?.id ?? null);
      return;
    }
    if (event.pointerId !== drag.id) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    highlight(null);
    canvas.classList.add('dragging');
    yaw = drag.yaw + 0.011 * dx;
    pitch = drag.pitch - 0.011 * dy;
    render();
  });

  canvas.addEventListener('pointerup', (event) => {
    if (drag?.id !== event.pointerId) return;
    const face = drag.moved ? null : hitFace(event);
    drag = null;
    canvas.classList.remove('dragging');
    if (face) openFace(face.id);
  });

  canvas.addEventListener('lostpointercapture', () => {
    drag = null;
    canvas.classList.remove('dragging');
  });
  canvas.addEventListener('pointerleave', () => highlight(null));

  canvas.addEventListener('keydown', (event) => {
    const step = 0.27;
    switch (event.key) {
      case 'ArrowLeft': yaw -= step; break;
      case 'ArrowRight': yaw += step; break;
      case 'ArrowUp': pitch += step; break;
      case 'ArrowDown': pitch -= step; break;
      case 'Enter': {
        const front = visible.reduce((best, face) => face.facing > (best?.facing ?? 0) ? face : best, null);
        if (front) openFace(front.id);
        break;
      }
      default: return;
    }
    event.preventDefault();
    render();
  });

  document.querySelectorAll('[data-face]').forEach((link) => {
    link.addEventListener('focus', () => highlight(link.dataset.face));
    link.addEventListener('blur', () => highlight(null));
    link.addEventListener('pointerenter', () => highlight(link.dataset.face));
    link.addEventListener('pointerleave', () => highlight(null));
  });

  canvas.closest('.model').classList.add('pyramid-ready');
  new ResizeObserver(resize).observe(canvas);
  document.fonts.load('17px Title1').then(render, render);
} else {
  canvas.hidden = true;
}
