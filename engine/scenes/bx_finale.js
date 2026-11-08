// 八仙 · 民俗套色剪纸 —— 系列收口片《蓬莱·各显神通》（SCENES f1..f8）
// ---------------------------------------------------------------------------
// 与人物片完全隔离：SCENE_LIBS 不加载 bx_series.js / bx_actors.js / bx_tight.js，
// 只靠 bx_common.js 的 window.BX 画整套，f1~f8 与 k1~k8 不共享任何场景 id。
//
// 视觉主张（文档第六节）：不画单人立像。八张一人一专色的纸片逐幕「贴」上窗纸，
// 每张带一件法宝剪影；海浪一层层涨；末幕八宝同框 + 朱红钤印 + 结句。
// 八人群像靠「剪影 + 法宝 + 专色」区分，不靠五官 —— 这里做实做验证。
//
// 红线：屏幕空间层（匾额 / 钤印 / 结句底）只在一次 clipBox 之内画，不叠 camera；
// 浅色纸片一律带 INK 描边；ss(0,1,x) 才是 0..1 插值。
(() => {
  const B = window.BX;
  if (!B) {
    window.__bootErrors = (window.__bootErrors || []).concat(['bx_finale.js: 缺 bx_common.js']);
    return;
  }
  const { poly, F, dot, jag, paper, carveLine, carveMoon, carveSaw, cutFlower,
          htext, ss, clamp, lerp, pmod, rng, step } = B;
  const CX = B.CX, BOX = B.BOX, ACT = 3.8, TAU = Math.PI * 2;
  const INK = '#33201a', PAPER = '#f8eed8', SKIN = '#f9e5c6';
  const GOLD = '#d6a544', GDK = '#a2762c', IND = '#3c5c86', JADE = '#3e7a62';
  const RED = '#c33b2a', REDDK = '#8e2419';

  // 收口片专用色板：窗纸框架走金，八张人物纸片各用自己的专色
  const FRAME = Object.assign({}, B.PAL.tieguali, {
    name: '八仙·八色同框', tag: '剪纸收口',
    main: GOLD, mainDk: GDK, mainHi: '#e8c977',
  });

  // 八人顺序 = 系列排产顺序；pal 直接取 bx_common.js 的八张专色色板
  const ORDER = [
    { key: 'tieguali',    label: '铁拐李', pal: B.PAL.tieguali },
    { key: 'zhongli',     label: '汉钟离', pal: B.PAL.zhongli },
    { key: 'lvzu',        label: '吕洞宾', pal: B.PAL.lvzu },
    { key: 'hexiangu',    label: '何仙姑', pal: B.PAL.hexiangu },
    { key: 'caoguojiu',   label: '曹国舅', pal: B.PAL.caoguojiu },
    { key: 'lancaihe',    label: '蓝采和', pal: B.PAL.lancaihe },
    { key: 'hanzhi',      label: '韩湘子', pal: B.PAL.hanzhi },
    { key: 'zhangguolao', label: '张果老', pal: B.PAL.zhangguolao },
  ];

  const PLAQUES = ['空窗', '朱红', '扇剑', '荷板', '篮箫', '潮声', '各显', '钤印'];
  const ENDING = '八仙过海 各显神通';
  const CAPTION = '八仙人物 · 系列收口';

  // ---------------------------------------------------------------- 八件法宝
  // 局部坐标以 (0,0) 为中心，约 ±40 × ±46；每张纸片右下角一枚，靠剪影区分。
  function treasure(c, i, t) {
    const C = ORDER[i].pal, MAIN = C.main, MDK = C.mainDk, MHI = C.mainHi;
    if (i === 0) {                       // 葫芦
      paper(c, jag([[-12, -34], [12, -34], [16, -12], [8, 0], [18, 12],
                    [16, 34], [-16, 34], [-18, 12], [-8, 0], [-16, -12]], 4, 7, 2),
        JADE, { line: INK, lw: 2.4 });
      carveLine(c, -14, 2, 14, 2, 3, PAPER);
      paper(c, [[-10, -40], [10, -40], [10, -32], [-10, -32]], GOLD,
        { shadow: null, edge: false, line: GDK, lw: 1.4 });
    } else if (i === 1) {                // 芭蕉扇
      paper(c, jag([[0, -38], [-30, -24], [-38, 8], [0, 34], [38, 8], [30, -24]], 6, 11, 2),
        JADE, { line: INK, lw: 2.4 });
      for (let k = -2; k <= 2; k++) carveLine(c, 0, 28, k * 14, -18, 2.4, PAPER);
      paper(c, [[-4, 32], [4, 32], [4, 44], [-4, 44]], GDK,
        { shadow: null, edge: false, line: INK, lw: 1.4 });
    } else if (i === 2) {                // 纯阳剑
      paper(c, [[-6, -42], [6, -42], [5, 16], [-5, 16]], PAPER, { line: INK, lw: 2.2 });
      carveLine(c, 0, -36, 0, 12, 2, MDK);
      paper(c, [[-20, 14], [20, 14], [20, 22], [-20, 22]], GOLD,
        { shadow: null, edge: false, line: INK, lw: 1.4 });
      paper(c, [[-5, 22], [5, 22], [5, 44], [-5, 44]], MDK,
        { shadow: null, edge: false, line: INK, lw: 1.4 });
    } else if (i === 3) {                // 荷花
      for (let k = -1; k <= 1; k++)
        paper(c, jag([[k * 18 - 12, 18], [k * 18 - 6, -24 + Math.abs(k) * 10],
                      [k * 18, -34 + Math.abs(k) * 12], [k * 18 + 6, -24 + Math.abs(k) * 10],
                      [k * 18 + 12, 18]], 4, 13 + k, 2), k ? MHI : MAIN,
          { line: INK, lw: 2 });
      dot(c, 0, 6, 9, GOLD, INK, 1.6);
      paper(c, [[-4, 18], [4, 18], [3, 44], [-3, 44]], JADE,
        { shadow: null, edge: false, line: INK, lw: 1.4 });
    } else if (i === 4) {                // 阴阳玉板
      for (const s of [-1, 1]) {
        paper(c, [[s * 16 - 10, -36], [s * 16 + 10, -36], [s * 16 + 9, 38], [s * 16 - 9, 38]],
          s < 0 ? PAPER : MHI, { line: INK, lw: 2.2 });
        carveSaw(c, s * 16 - 7, -22, s * 16 + 7, -22, 2, s < 0 ? MDK : PAPER, 6);
      }
    } else if (i === 5) {                // 花篮
      paper(c, jag([[-30, -4], [30, -4], [22, 38], [-22, 38]], 5, 17, 2), GDK,
        { line: INK, lw: 2.2 });
      for (let k = 0; k < 2; k++) carveLine(c, -26, 6 + k * 14, 26, 6 + k * 14, 3, PAPER);
      for (let k = -1; k <= 1; k++)
        cutFlower(c, k * 17, -14 - Math.abs(k) * 6, 10, C, t * 0.3 + k, 6, MHI, GOLD);
    } else if (i === 6) {                // 紫金箫
      paper(c, [[-8, -42], [8, -42], [8, 42], [-8, 42]], MDK, { line: INK, lw: 2.2 });
      for (let k = 0; k < 4; k++) dot(c, 0, -28 + k * 18, 3, PAPER, GDK, 1);
      for (const y of [-40, 32])
        paper(c, [[-10, y], [10, y], [10, y + 8], [-10, y + 8]], GOLD,
          { shadow: null, edge: false, line: GDK, lw: 1.2 });
    } else {                             // 渔鼓 + 纸驴耳（两笔带过）
      paper(c, [[-20, -34], [20, -34], [20, 34], [-20, 34]], PAPER, { line: INK, lw: 2.4 });
      for (const y of [-30, 24])
        paper(c, [[-23, y], [23, y], [23, y + 8], [-23, y + 8]], GOLD,
          { shadow: null, edge: false, line: GDK, lw: 1.2 });
      carveMoon(c, 0, -6, 12, MDK, 3.4, 0.3);
      for (const s of [-1, 1])
        paper(c, jag([[s * 22, -34], [s * 30, -48], [s * 34, -32]], 3, 19 + s, 1), MDK,
          { shadow: null, edge: false, line: INK, lw: 1.2 });
    }
  }

  // ---------------------------------------------------------------- 八人头饰
  // 八张卡片若只有颜色不同，同框就会读成「同一张纸片换色」（审片 P1）。
  // 这里给每人补一顶可辨认的剪纸头饰：蓬头 / 双丫髻 / 道冠 / 双鬟 /
  // 方翅官帽 / 乱发 / 儒巾 / 老叟巾，全部是独立纸片。
  function gear(c, i, t) {
    const C = ORDER[i].pal, MDK = C.mainDk, MHI = C.mainHi;
    if (i === 0) {                       // 铁拐李：蓬头 + 朱红勒带
      for (let k = 0; k < 5; k++)
        paper(c, jag([[-34 + k * 17, -50], [-30 + k * 17, -76 - (k % 2) * 10],
                      [-18 + k * 17, -50]], 4, 61 + k, 2), INK,
          { shadow: null, edge: false });
      paper(c, [[-32, -50], [32, -50], [32, -40], [-32, -40]], C.main,
        { shadow: null, edge: false, line: INK, lw: 1.6 });
    } else if (i === 1) {                // 汉钟离：双丫髻
      for (const s of [-1, 1])
        paper(c, jag([[s * 10, -50], [s * 18, -84], [s * 40, -78], [s * 36, -50]], 5, 67 + s, 2),
          INK, { line: INK, lw: 1.4 });
    } else if (i === 2) {                // 吕洞宾：道冠 + 横簪
      paper(c, [[-28, -84], [28, -84], [24, -46], [-24, -46]], MDK,
        { line: INK, lw: 2 });
      paper(c, [[-36, -62], [36, -62], [36, -54], [-36, -54]], GOLD,
        { shadow: null, edge: false, line: GDK, lw: 1.2 });
    } else if (i === 3) {                // 何仙姑：双鬟 + 花
      for (const s of [-1, 1])
        paper(c, jag([[s * 26, -50], [s * 46, -70], [s * 52, -44], [s * 36, -34]], 4, 71 + s, 2),
          INK, { line: INK, lw: 1.4 });
      cutFlower(c, 38, -60, 9, C, t * 0.3, 6, MHI, GOLD);
    } else if (i === 4) {                // 曹国舅：方翅官帽
      paper(c, [[-30, -76], [30, -76], [26, -46], [-26, -46]], INK,
        { line: GDK, lw: 1.6 });
      for (const s of [-1, 1])
        paper(c, [[s * 26, -66], [s * 70, -70], [s * 70, -58], [s * 26, -54]], INK,
          { line: GDK, lw: 1.4 });
    } else if (i === 5) {                // 蓝采和：乱发
      for (let k = 0; k < 5; k++)
        paper(c, jag([[-34 + k * 17, -48], [-32 + k * 17, -72 - (k % 3) * 8],
                      [-20 + k * 17, -48]], 3, 73 + k, 2), INK,
          { shadow: null, edge: false });
    } else if (i === 6) {                // 韩湘子：儒巾
      paper(c, [[-30, -72], [30, -72], [26, -46], [-26, -46]], MDK,
        { line: INK, lw: 2 });
      paper(c, jag([[-30, -72], [-14, -88], [14, -88], [30, -72]], 4, 79, 2), MDK,
        { line: INK, lw: 1.8 });
    } else {                             // 张果老：老叟巾 + 白须
      paper(c, jag([[-32, -58], [-20, -84], [20, -84], [32, -58], [24, -44], [-24, -44]], 5, 83, 2),
        IND, { line: INK, lw: 2 });
      for (let k = -1; k <= 1; k++)
        paper(c, [[k * 10 - 3, -18], [k * 10 + 3, -18], [k * 10 + 2, 12], [k * 10 - 2, 12]], PAPER,
          { shadow: null, edge: false, line: INK, lw: 1.2 });
    }
  }

  // ---------------------------------------------------------------- 一张专色纸片
  // 简化人形剪影：头（纸白）+ 袍（专色）+ 专属头饰 + 双臂 + 铆钉；法宝在右下角。
  function card(c, t, i, x, y, q) {
    if (q <= 0.001) return;
    const O = ORDER[i], C = O.pal, MAIN = C.main, MDK = C.mainDk, MHI = C.mainHi;
    const s = 0.86 + 0.14 * q;
    c.save();
    c.globalAlpha = q;
    c.translate(x + lerp(70, 0, q), y + lerp(-26, 0, q));
    c.rotate(lerp(-0.10, 0, q));
    c.scale(s, s);
    // 纸片底：锯齿边 + 贴片投影，八张同框时靠投影分出前后层次
    paper(c, jag([[-84, -112], [84, -112], [84, 112], [-84, 112]], 7, 23 + i, 4),
      PAPER, { shadow: 'rgba(74,42,26,.22)', dx: 7, dy: 9, line: INK, lw: 3 });
    carveSaw(c, -64, -96, 64, -96, 8, C.bg1, 8);
    carveSaw(c, -64, 96, 64, 96, 8, C.bg1, 8);
    // 人形剪影
    paper(c, jag([[-44, 18], [-54, 44], [-46, 92], [46, 92], [54, 44], [44, 18]], 5, 29 + i, 2),
      MAIN, { line: INK, lw: 2.6 });
    paper(c, [[-34, -22], [34, -22], [30, 22], [-30, 22]], SKIN,
      { line: INK, lw: 2.4 });
    paper(c, jag([[-38, -34], [-24, -54], [24, -54], [38, -34], [30, -18], [-30, -18]], 5, 31 + i, 2),
      MDK, { line: INK, lw: 2 });
    gear(c, i, t);
    for (const s2 of [-1, 1]) {
      paper(c, [[s2 * 44, 26], [s2 * 60, 30], [s2 * 62, 68], [s2 * 44, 64]], MAIN,
        { line: INK, lw: 2 });
      dot(c, s2 * 50, 30, 4.6, GOLD, INK, 1.2);
    }
    carveMoon(c, 0, 52, 20, PAPER, 4, 0.3);
    // 姓名纸签
    paper(c, [[-66, -106], [66, -106], [66, -76], [-66, -76]], MDK,
      { shadow: null, edge: false, line: INK, lw: 1.8 });
    htext(c, O.label, 0, -91, 26, PAPER, 2);
    // 法宝（右下，带一圈纸白镂空衬底避免与袍色糊在一起）；放大一档让八宝同框读得出
    c.save(); c.translate(46, 58); c.scale(0.76, 0.76);
    dot(c, 0, 0, 48, PAPER, GDK, 2);
    treasure(c, i, t);
    c.restore();
    c.restore();
  }

  // ---------------------------------------------------------------- 海浪
  function waves(c, t, n) {
    const L = n <= 3 ? 1 : n <= 6 ? 2 : 3;
    for (let k = 0; k < L; k++) {
      const y = 906 + k * 34;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = BOX.x0 + 20 + i * (BOX.x1 - BOX.x0 - 40) / 12;
        pts.push([x, y + (i % 2 ? -14 : 6) + Math.sin(t * 1.6 + i + k) * 6]);
      }
      pts.push([BOX.x1 - 20, 1010], [BOX.x0 + 20, 1010]);
      paper(c, jag(pts, 5, 37 + k, 2), k === 1 ? JADE : IND,
        { shadow: 'rgba(74,42,26,.14)', dx: 4, dy: 6, line: INK, lw: 2.2 });
    }
  }

  // ---------------------------------------------------------------- 匾额（屏幕空间）
  function plaque(c, text, x, y) {
    paper(c, jag([[x - 104, y], [x + 104, y], [x + 104, y + 58], [x - 104, y + 58]], 6, 41, 3),
      PAPER, { line: INK, lw: 3 });
    htext(c, text, x, y + 30, 38, INK, 4);
    carveSaw(c, x - 80, y + 8, x + 80, y + 8, 7, FRAME.bg1, 7);
  }

  // ---------------------------------------------------------------- 钤印
  function seal(c, t, q, x, y) {
    const a = ss(0.10, 0.86, q);
    if (a <= 0.001) return;
    const s = lerp(1.35, 1.0, a);
    c.save(); c.globalAlpha = a;
    // f8 的钤印落到结句横幅下方（原来 y=824 会被横幅压住半枚）
    c.translate(x === undefined ? CX + 306 : x, y === undefined ? 824 : y);
    c.scale(s, s); c.rotate(-0.06 + 0.02 * Math.sin(t));
    paper(c, [[-62, -62], [62, -62], [62, 62], [-62, 62]], RED,
      { shadow: 'rgba(74,42,26,.26)', dx: 8, dy: 10, line: REDDK, lw: 2 });
    F(c, poly([[-52, -52], [52, -52], [52, 52], [-52, 52]]), null, PAPER, 2.6);
    const txt = '八仙人物', m = Math.max(1, Math.ceil(clamp(q) * txt.length));
    htext(c, [...txt].slice(0, m).join(''), 0, -20, 34, PAPER, 2);
    htext(c, [...txt].slice(0, m).join(''), 0, 20, 34, PAPER, 2);
    c.restore();
  }

  // ---------------------------------------------------------------- 每幕包装
  function act(c, lt, t, n) {
    const q = ss(0, 1, clamp(lt / 1.7));
    // f8 结句横幅占 650..812；八张卡片随幕内进度整体上移 130px 让出位置，
    // 避免「下排四张被深红纸片整排盖住」（首轮审片 P1）。
    const lift = n === 8 ? 130 * q : 0;
    B.stage(c, t, {
      pal: FRAME, bgKey: 'bx_finale',
      name: '各显神通', title: '八仙人物',
      verdict: '八仙过海', verdict2: '各显神通',
      seal: ['八', '仙'], label: false, noHalo: true,
    });

    c.save();
    B.clipBox(c);

    // 八张纸片：4 列 × 2 行，逐幕多贴一张
    const cols = [CX - 318, CX - 106, CX + 106, CX + 318];
    for (let i = 0; i < 8; i++) {
      const x = cols[i % 4], y = 372 + Math.floor(i / 4) * 288 - lift;
      const v = i < n - 1 ? 1 : (i === n - 1 ? q : 0);
      card(c, t, i, x, y, v);
    }

    // 未贴上的位置给一枚浅金虚位纸框，读得出「还空着」
    if (n < 8) {
      for (let i = n; i < 8; i++) {
        const x = cols[i % 4], y = 372 + Math.floor(i / 4) * 288;
        c.save(); c.globalAlpha = 0.42 + 0.10 * Math.sin(t * 1.2 + i);
        F(c, poly(jag([[-84, -112], [84, -112], [84, 112], [-84, 112]], 6, 53 + i, 4)
          .map(([px, py]) => [x + px, y + py])), null, GDK, 2.4);
        cutFlower(c, x, y, 16, FRAME, t * 0.24 + i, 7, GOLD, JADE);
        c.restore();
      }
    }

    waves(c, t, n);
    c.restore();

    // 屏幕空间匾额：左上角，不压纸片。f8 卡片上移后会占到 y=130，
    // 匾额（196..254）会压住第一张卡，故末幕改由结句横幅承担文字，不另挂匾额。
    if (n !== 8) {
      c.save(); B.clipBox(c);
      plaque(c, PLAQUES[n - 1], BOX.x0 + 116, 196);
      c.restore();
    }

    B.motion(c, t, FRAME, n === 8 ? 0.8 : 1);

    if (n === 8) {
      seal(c, t, clamp(lt / 2.5), CX + 306, 900);
      // 横幅晚于卡片上移再显影，前 0.6s 不会出现「半透明横幅压着卡片」的脏叠；
      // 但必须在 lt≈1.9（审片帧 28.5s）之前完全显影，否则结句读不清。
      const a = ss(0.30, 0.85, clamp(lt / 1.9));
      c.save(); c.globalAlpha = a;
      paper(c, jag([[CX - 350, 650], [CX + 350, 650], [CX + 350, 812], [CX - 350, 812]], 9, 59, 4),
        REDDK, { line: INK, lw: 3.2 });
      htext(c, ENDING, CX, 704, 54, PAPER, 2);
      htext(c, CAPTION, CX, 772, 34, GOLD, 2);
      c.restore();
    }
  }

  ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8'].forEach((id, i) => {
    SCENES[id] = { draw(c, lt, t) { act(c, lt, t, i + 1); } };
  });

  window.BX_FINALE = { ORDER, treasure, card, act };
})();
