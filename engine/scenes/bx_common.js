// 八仙 · 民俗套色剪纸 —— 公共绘制库（window.BX）
// ---------------------------------------------------------------------------
// 依据 1988 上美影《八仙与跳蚤》的剪纸民俗语言（高马得 / 陈汝勤造型、昆曲身段、
// 民间单色剪纸、一人一代表色），但不复刻任何具体造型或图案，全部重新以几何路径绘制。
//
// 把物理制作过程写成渲染器：剪（jag 锯齿剪口）→ 刻（carve 镂空）→ 贴（paper 分片平涂
// + 投影 + 纸边毛刺）→ 揭（curtainScreen 窗纸帘）。所有形都是独立纸片，没有渐变笔触。
// 角色也要过材料处理：衣、发、须、葫芦、拐杖一律是 paper() 纸片 + jag() 剪口 + carve() 刻纹。
//
// 坐标沿用系列契约：1920×1080，中央竖幅窗纸 516..1404 × 34..1046，人物中心 x=960，脚底 y=980。
// 红线：H.ss(lo,hi,x) 是 smoothstep 阈值函数返回 0..1，不是区间插值；
// 屏幕空间覆盖层（窗纸帘 / 判词纸签 / 结句底）必须在 camera restore() 之后画。
(() => {
  const W = 1920, H = 1080, TAU = Math.PI * 2;
  const { clamp, lerp, ss, rng } = U;
  const P = window.PAINT;
  const pmod = (a, n) => ((a % n) + n) % n;

  const BOX = { x0: 516, y0: 34, x1: 1404, y1: 1046 };
  const CX = 960, GY = 980;
  const FONT = 'LXGWWenKai-500';
  const SHADOW = 'rgba(74,42,26,.24)';

  // ---------- 一人一专色：八张色板，共用同一套剪纸材质 ----------
  // 1988 版每人一个代表色（何仙姑粉 / 曹国舅橘 / 蓝采和紫），这里按八人各配一色。
  const BASE = {
    bg0: '#f3e6c9', bg1: '#e6d3ad', bg2: '#f3e6c9',
    paper: '#f8eed8', ink: '#33201a',
    jade: '#3e7a62', jadeDk: '#285241',
    indigo: '#3c5c86', gold: '#d6a544', goldDk: '#a2762c',
    skin: '#f9e5c6', lip: '#a8372a',
    lw: 3.0,
  };
  const makePal = (name, tag, main, mainDk, mainHi) => Object.assign({}, BASE,
    { name, tag, main, mainDk, mainHi });
  const PAL = {
    tieguali:   makePal('铁拐李·朱砂赭', '剪纸一', '#c33b2a', '#8e2419', '#e5734b'),
    zhongli:    makePal('钟离权·赭黄',   '剪纸二', '#c67b2c', '#8c5018', '#e8a95c'),
    lvzu:       makePal('吕洞宾·石青',   '剪纸三', '#2f6f86', '#1d4a5c', '#68a8bc'),
    hexiangu:   makePal('何仙姑·藕粉',   '剪纸四', '#d5788e', '#9c4760', '#eda9b8'),
    caoguojiu:  makePal('曹国舅·橘红',   '剪纸五', '#d98a3c', '#a15a1e', '#f0b76e'),
    lancaihe:   makePal('蓝采和·茄紫',   '剪纸六', '#7d5794', '#523466', '#ac87bd'),
  hanzhi:     makePal('韩湘子·竹青',   '剪纸七', '#4a8368', '#2b573f', '#84b897'),
    zhangguolao:makePal('张果老·靛蓝',   '剪纸八', '#425f92', '#283c66', '#7d96bd'),
  };

  // ---------- 基础几何 ----------
  const poly = (pts, close = true) => {
    const p = new Path2D(); pts.forEach((q, i) => i ? p.lineTo(q[0], q[1]) : p.moveTo(q[0], q[1]));
    if (close) p.closePath(); return p;
  };
  const F = (g, p, fill, line, lw = 2) => {
    if (!p) return;
    if (fill) { g.fillStyle = fill; g.fill(p); }
    if (line && lw) { g.strokeStyle = line; g.lineWidth = lw; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(p); }
  };
  const ell = (x, y, rx, ry, rot = 0) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  const dot = (g, x, y, r, fill, line, lw = 1.4) => F(g, ell(x, y, r, r), fill, line, lw);
  const bez = (d) => { const p = new Path2D(); d.forEach(s => {
    if (s[0] === 'M') p.moveTo(s[1], s[2]);
    else if (s[0] === 'L') p.lineTo(s[1], s[2]);
    else if (s[0] === 'C') p.bezierCurveTo(s[1], s[2], s[3], s[4], s[5], s[6]);
    else if (s[0] === 'Q') p.quadraticCurveTo(s[1], s[2], s[3], s[4]);
    else if (s[0] === 'Z') p.closePath();
  }); return p; };
  function vtext(g, str, x, y, size, col, gap = 1.16) {
    g.save(); g.font = `${size}px "${FONT}"`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
    [...str].forEach((ch, i) => g.fillText(ch, x, y + i * size * gap));
    g.restore();
  }
  function htext(g, str, x, y, size, col, spacing = 0, align = 'center') {
    g.save(); g.font = `${size}px "${FONT}"`; g.fillStyle = col; g.textAlign = align; g.textBaseline = 'middle';
    if (!spacing) g.fillText(str, x, y);
    else { const chars = [...str], total = chars.length * size + (chars.length - 1) * spacing;
      let sx = align === 'center' ? x - total / 2 : x;
      g.textAlign = 'left';
      chars.forEach(ch => { g.fillText(ch, sx, y); sx += size + spacing; }); }
    g.restore();
  }

  // ---------- 剪 / 刻 / 贴：三种纸片材料操作 ----------
  // 剪刀折线：每条边插入锯齿中点，得到硬边「剪口」。per=每边插入点数，amp=齿深。
  function jag(pts, amp = 6, seed = 1, per = 3, close = true) {
    const n = close ? pts.length : pts.length - 1, out = [];
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      out.push(a);
      const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L, ny = dx / L;
      for (let k = 1; k <= per; k++) {
        const u = k / (per + 1);
        const s = Math.abs(Math.sin(seed * 12.9898 + i * 7.13 + k * 2.7));
        const off = (k % 2 ? 1 : -1) * amp * (0.55 + 0.45 * s);
        out.push([a[0] + dx * u + nx * off, a[1] + dy * u + ny * off]);
      }
    }
    if (!close) out.push(pts[pts.length - 1]);
    return out;
  }

  // 贴：独立纸片 = 偏移投影 + 平涂 + 纸边毛刺。没有渐变，没有笔触。
  function paper(g, pts, col, opt = {}) {
    const p = poly(pts);
    const sh = opt.shadow === undefined ? SHADOW : opt.shadow;
    const dx = opt.dx === undefined ? 8 : opt.dx, dy = opt.dy === undefined ? 10 : opt.dy;
    if (sh) { g.save(); g.translate(dx, dy); g.fillStyle = sh; g.fill(p); g.restore(); }
    F(g, p, col, opt.line || null, opt.lw || 0);
    if (opt.edge !== false) {
      g.save(); g.globalAlpha = 0.42; F(g, p, null, 'rgba(255,249,230,.85)', 1.3); g.restore();
    }
    return p;
  }

  // 刻：镂空用「窗纸色」画在纸片上，视觉上等于把纸刻穿。
  const carveLine = (g, x1, y1, x2, y2, w, col) => {
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke();
  };
  function carveMoon(g, x, y, r, col, w = 5, rot = 0) {
    g.save(); g.translate(x, y); g.rotate(rot);
    g.beginPath(); g.arc(0, 0, r, Math.PI * 0.15, Math.PI * 0.85);
    g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke();
    g.restore();
  }
  function carveSaw(g, x0, y0, x1, y1, n, col, size = 8) {
    for (let k = 0; k < n; k++) {
      const u = (k + 0.5) / n, x = lerp(x0, x1, u), y = lerp(y0, y1, u);
      F(g, poly([[x - size / 2, y - size / 2], [x + size / 2, y - size / 2], [x, y + size / 2]]), col, null);
    }
  }

  // 剪纸团花：n 瓣锯齿纸片 + 中心镂空。用于窗花 / 角花 / 窗纸帘上的纹样。
  function cutFlower(g, x, y, r, S, rot = 0, n = 8, colA, colB) {
    g.save(); g.translate(x, y); g.rotate(rot);
    for (let k = 0; k < n; k++) {
      const a = k / n * TAU;
      const tip = [Math.cos(a) * r, Math.sin(a) * r];
      const l = [Math.cos(a - 0.30) * r * 0.42, Math.sin(a - 0.30) * r * 0.42];
      const rr = [Math.cos(a + 0.30) * r * 0.42, Math.sin(a + 0.30) * r * 0.42];
      paper(g, jag([[0, 0], l, tip, rr], 3, k + 1, 2),
        k % 2 ? (colA || S.main) : (colB || S.gold), { shadow: null, edge: false });
    }
    dot(g, 0, 0, r * 0.22, S.paper, S.ink, 2);
    dot(g, 0, 0, r * 0.10, S.mainDk);
    g.restore();
  }

  // 12fps 步进：只给纸片颤动 / 纸屑，不整屏换种子（整屏低帧率会读成闪）。
  const step = (t, fps = 12) => Math.floor(t * fps) / fps;

  function clipBox(g, pad = 12) {
    g.beginPath();
    g.rect(BOX.x0 + pad, BOX.y0 + pad, BOX.x1 - BOX.x0 - pad * 2, BOX.y1 - BOX.y0 - pad * 2);
    g.clip();
  }

  // ---------- 窗纸舞台 ----------
  function stage(g, t, opt = {}) {
    const S = opt.pal || PAL.tieguali;
    const bg = P.cached('bx_bg_' + (opt.bgKey || 'tieguali'), W, H, (k) => {
      const gr = k.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, S.bg0); gr.addColorStop(0.55, S.bg1); gr.addColorStop(1, S.bg2);
      k.fillStyle = gr; k.fillRect(0, 0, W, H);
      const r = rng(37);
      // 纸纤维（只在背景层，做旧不上身）
      for (let i = 0; i < 1700; i++) {
        const x = r() * W, y = r() * H, rr = 1 + r() * 8;
        k.fillStyle = `rgba(${r() > 0.5 ? '150,112,66' : '255,250,232'},${0.02 + r() * 0.05})`;
        k.fillRect(x, y, rr, 1 + r() * 2);
      }
      k.strokeStyle = S.ink; k.lineWidth = 8; k.strokeRect(20, 20, W - 40, H - 40);
      k.strokeStyle = S.gold; k.lineWidth = 3; k.strokeRect(32, 32, W - 64, H - 64);
      // 中央竖幅窗纸
      k.fillStyle = S.paper;
      k.fillRect(BOX.x0 - 10, BOX.y0 - 10, BOX.x1 - BOX.x0 + 20, BOX.y1 - BOX.y0 + 20);
      k.strokeStyle = S.ink; k.lineWidth = 7;
      k.strokeRect(BOX.x0 - 10, BOX.y0 - 10, BOX.x1 - BOX.x0 + 20, BOX.y1 - BOX.y0 + 20);
      k.strokeStyle = S.goldDk; k.lineWidth = 2.4;
      k.strokeRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0);
      // 窗棂：只做上下横带与两侧窄格，中央人物保护区留白
      k.strokeStyle = 'rgba(140,96,52,.30)'; k.lineWidth = 3;
      for (let x = BOX.x0 + 26; x < BOX.x1 - 20; x += 54) {
        k.beginPath(); k.moveTo(x, BOX.y0 + 14); k.lineTo(x, BOX.y0 + 128); k.stroke();
        k.beginPath(); k.moveTo(x, BOX.y1 - 14); k.lineTo(x, BOX.y1 - 142); k.stroke();
      }
      for (const y0 of [BOX.y0 + 14, BOX.y1 - 142]) {
        for (let j = 0; j <= 3; j++) {
          const y = y0 + j * 38;
          k.beginPath(); k.moveTo(BOX.x0 + 16, y); k.lineTo(BOX.x1 - 16, y); k.stroke();
        }
      }
    });
    g.drawImage(bg, 0, 0);

    g.save(); clipBox(g);
    // 窗纸透光：随时间脉动，避免静帧
    const lg = g.createRadialGradient(CX, 430, 40, CX, 430, 560);
    // 窗纸透光脉动：亮窗纸是整幅画面最大的连续运动面，振幅/频率提一档让幕内活气达标
    const pulse = 0.12 + 0.10 * Math.sin(t * 1.8);
    lg.addColorStop(0, `rgba(255,252,235,${pulse + 0.18})`);
    lg.addColorStop(1, 'rgba(255,252,235,0)');
    g.fillStyle = lg; g.fillRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0);

    // 背后剪纸窗花：锯齿同心环 + 12 枚「镂空花瓣」（不是彩旗三角），缓慢反向转。
    // opt.noHalo 给缘起幕用：让道观屋檐 / 山石成为主角，不与人头后的窗花打架。
    if (!opt.noHalo) {
      g.save(); g.translate(CX, 372);
      for (let k = 0; k < 3; k++) {
        const rr = 176 + k * 26;
        const pts = [];
        for (let i = 0; i < 36; i++) {
          const a = i / 36 * TAU + t * (k % 2 ? -0.18 : 0.14);
          const q = rr + (i % 2 ? 9 : -9);
          pts.push([Math.cos(a) * q, Math.sin(a) * q]);
        }
        F(g, poly(pts), null, k === 1 ? S.gold : S.mainHi, k === 0 ? 5 : 2.6);
      }
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * TAU - t * 0.26;
        g.save(); g.translate(Math.cos(a) * 236, Math.sin(a) * 236); g.rotate(a + Math.PI / 2);
        paper(g, jag([[-11, -24], [0, -32], [11, -24], [11, 18], [0, 28], [-11, 18]], 3, i + 1, 1),
          i % 2 ? S.main : S.gold, { shadow: null, edge: false });
        dot(g, 0, 0, 5.5, S.paper, S.mainDk, 1.4);
        g.restore();
      }
      g.restore();
    }

    // 四角剪花
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      cutFlower(g, CX + sx * 384, 540 + sy * 424, 34, S, t * 0.12 * sx * sy, 7,
        S.main, S.jade);
    }
    g.restore();

    sideCols(g, S, t, opt);
  }

  function sideCols(g, S, t, opt) {
    const title = opt.title || '八仙人物';
    const name = opt.name || '铁拐李';
    const v1 = opt.verdict || '莫笑蓬头跛足';
    const v2 = opt.verdict2 || '壶中自有乾坤';
    const seal = opt.seal || ['铁', '拐'];
    const ink = S.ink;
    // 左：花签（锯齿边纸条）
    g.save();
    paper(g, jag([[88, 130], [388, 130], [388, 950], [88, 950]], 7, 3, 5),
      S.paper, { shadow: 'rgba(74,42,26,.16)', dx: 6, dy: 8, line: S.ink, lw: 3 });
    carveSaw(g, 116, 158, 360, 158, 9, S.bg1, 10);
    carveSaw(g, 116, 922, 360, 922, 9, S.bg1, 10);
    for (let i = 0; i < 6; i++) {
      cutFlower(g, 238, 236 + i * 116, 15, S, t * 0.18 + i, 6, S.main, S.gold);
    }
    vtext(g, title, 238, 218, 44, ink, 1.30);
    g.restore();
    // 右：判词 + 朱红钤印
    g.save();
    paper(g, jag([[1532, 130], [1832, 130], [1832, 950], [1532, 950]], 7, 9, 5),
      S.paper, { shadow: 'rgba(74,42,26,.16)', dx: 6, dy: 8, line: S.ink, lw: 3 });
    carveSaw(g, 1560, 158, 1804, 158, 9, S.bg1, 10);
    carveSaw(g, 1560, 922, 1804, 922, 9, S.bg1, 10);
    if (!opt.hideVerdict) {
      vtext(g, v1, 1618, 196, 42, ink, 1.26);
      vtext(g, v2, 1742, 196, 42, ink, 1.26);
    }
    // 钤印：朱红纸片 + 纸白字
    paper(g, [[1596, 820], [1696, 820], [1696, 920], [1596, 920]], S.main,
      { shadow: null, edge: false, line: S.mainDk, lw: 2 });
    F(g, poly([[1606, 830], [1686, 830], [1686, 910], [1606, 910]]), null, S.paper, 2.4);
    htext(g, seal[0], 1646, 854, 30, S.paper); htext(g, seal[1], 1646, 888, 30, S.paper);
    g.restore();
    // 画框顶部横幅：不透明纸片压住身后窗花，保证字不被刻线穿过
    g.save();
    paper(g, jag([[CX - 186, 44], [CX + 186, 44], [CX + 186, 106], [CX - 186, 106]], 5, 5, 4),
      S.paper, { shadow: null, line: S.goldDk, lw: 2.6 });
    htext(g, name, CX, 76, 52, S.ink, 10);
    carveLine(g, CX - 150, 118, CX + 150, 118, 3, S.goldDk);
    g.restore();
    if (opt.label) {
      g.save(); g.fillStyle = 'rgba(51,32,26,.86)'; g.fillRect(60, 986, 420, 58);
      htext(g, `${S.tag} · ${S.name}`, 270, 1015, 30, S.paper, 2); g.restore();
    }
  }

  // ---------- 窗纸帘（屏幕空间层，必须在 camera restore 之后画） ----------
  function curtainScreen(g, t, open, opt = {}) {
    const S = opt.pal || PAL.tieguali;
    const half = (BOX.x1 - BOX.x0) / 2, o = clamp(open);
    if (o > 0.985) return;
    // 帘缝透光：脉动，前两幕不能是一张静帧
    const gap = 12 + Math.sin(t * 1.6) * 6;
    const lg = g.createLinearGradient(CX - gap * 4, 0, CX + gap * 4, 0);
    lg.addColorStop(0, 'rgba(255,246,214,0)');
    lg.addColorStop(0.5, `rgba(255,246,214,${0.34 + 0.16 * Math.sin(t * 2.2)})`);
    lg.addColorStop(1, 'rgba(255,246,214,0)');
    g.save(); clipBox(g);
    g.fillStyle = lg; g.fillRect(CX - gap * 4, BOX.y0, gap * 8, BOX.y1 - BOX.y0);
    g.restore();

    for (const side of [-1, 1]) {
      const w = half * (1 - o) + Math.sin(t * 1.1 + (side < 0 ? 0 : 1.4)) * 5;
      const x0 = side < 0 ? BOX.x0 : CX + half * o;
      g.save(); clipBox(g);
      // 窗纸帘：米白纸片 + 锯齿内缘 + 镂空窗花 + 朱红剪花
      const inner = x0 + (side < 0 ? w : 0);
      const pts = side < 0
        ? [[x0, BOX.y0], [inner, BOX.y0], [inner - 8, 260], [inner + 12, 520],
           [inner - 8, 780], [inner, BOX.y1], [x0, BOX.y1]]
        : [[inner, BOX.y0], [x0 + w, BOX.y0], [x0 + w, BOX.y1], [inner, BOX.y1],
           [inner + 8, 780], [inner - 12, 520], [inner + 8, 260]];
      paper(g, jag(pts, 8, side + 4, 3), S.paper,
        { shadow: 'rgba(74,42,26,.18)', dx: side * 8, dy: 6, line: S.goldDk, lw: 2.4 });
      for (let row = 0; row < 4; row++) {
        const fx = x0 + w * 0.5, fy = 200 + row * 224;
        cutFlower(g, fx, fy + Math.sin(t * 0.9 + row) * 4, 26, S,
          t * 0.16 + row, 7, S.main, S.jade);
      }
      for (let k = 0; k < 5; k++) {
        const yy = 150 + k * 190;
        carveLine(g, x0 + 14, yy, x0 + w - 14, yy, 4, S.bg1);
      }
      g.restore();
    }
  }

  // ---------- 判词纸签（屏幕空间层） ----------
  function verdictPaper(g, t, p, opt = {}) {
    const S = opt.pal || PAL.tieguali;
    const q = ss(0, 1, p);
    if (q <= 0.001) return;
    const x = 1170, y = 150, w = 560, h = 760;
    g.save(); g.globalAlpha = q; g.translate(lerp(520, 0, q), 0);
    paper(g, jag([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], 9, 11, 6),
      S.paper, { shadow: 'rgba(51,32,26,.30)', dx: 14, dy: 16, line: S.ink, lw: 4 });
    carveSaw(g, x + 30, y + 30, x + w - 30, y + 30, 12, S.bg1, 11);
    carveSaw(g, x + 30, y + h - 30, x + w - 30, y + h - 30, 12, S.bg1, 11);
    for (let i = 0; i < 4; i++)
      cutFlower(g, x + 78 + i * 134, y + 76, 18, S, t * 0.2 + i, 7, S.main, S.gold);
    vtext(g, opt.v1 || '莫笑蓬头跛足', x + 190, y + 160, 56, S.ink, 1.22);
    vtext(g, opt.v2 || '壶中自有乾坤', x + 366, y + 160, 56, S.ink, 1.22);
    // 纸面扫光：让停留窗口里也有活气
    const sweep = pmod(t * 260, 900) - 220;
    const lg = g.createLinearGradient(x + sweep, 0, x + sweep + 170, 0);
    lg.addColorStop(0, 'rgba(255,250,225,0)'); lg.addColorStop(.5, 'rgba(255,250,225,.55)');
    lg.addColorStop(1, 'rgba(255,250,225,0)');
    g.fillStyle = lg; g.fillRect(x, y, w, h);
    htext(g, '八仙 · 人物签', x + w / 2, y + 700, 34, S.goldDk, 4);
    g.restore();
  }

  // ---------- 幕内通用运动：扫光 + 纸屑（12fps 步进） + 纸片颤动 ----------
  function motion(g, t, S, amp = 1) {
    // 斜向扫光（纸面反光），弱且连续，不做整屏闪烁
    const sweep = pmod(t * 210, 1500) - 300;
    const lg = g.createLinearGradient(sweep, 0, sweep + 230, H);
    lg.addColorStop(0, 'rgba(255,250,230,0)');
    lg.addColorStop(.5, `rgba(255,250,230,${0.19 * amp})`);
    lg.addColorStop(1, 'rgba(255,250,230,0)');
    g.save(); clipBox(g); g.fillStyle = lg;
    g.fillRect(BOX.x0, BOX.y0, BOX.x1 - BOX.x0, BOX.y1 - BOX.y0); g.restore();

    // 纸屑：34 片小方纸，12fps 步进下落 + 自身旋转（数量/尺寸提一档保证幕内活气 ≥8%）
    const st = step(t, 12);
    const r = rng(91);
    for (let i = 0; i < 34; i++) {
      const x = BOX.x0 + 30 + r() * (BOX.x1 - BOX.x0 - 60);
      const y = BOX.y0 + 20 + pmod(r() * 1000 - st * (26 + (i % 4) * 13), BOX.y1 - BOX.y0 - 40);
      const s = 7 + (i % 3) * 4;
      g.save(); g.translate(x, y); g.rotate(st * 1.1 + i);
      F(g, poly([[-s, -s * 0.5], [s, -s * 0.5], [s, s * 0.5], [-s, s * 0.5]]),
        i % 3 === 0 ? S.gold : i % 3 === 1 ? S.main : S.jade, null);
      g.restore();
    }
  }

  window.BX = { W, H, BOX, CX, GY, PAL, FONT, SHADOW,
    poly, F, ell, dot, bez, vtext, htext, pmod, ss, clamp, lerp, rng,
    jag, paper, carveLine, carveMoon, carveSaw, cutFlower, step,
    clipBox, stage, sideCols, curtainScreen, verdictPaper, motion };
})();
