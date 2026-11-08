// 八仙 · 民俗套色剪纸 —— 共享模板层（window.BX_SERIES）
// ---------------------------------------------------------------------------
// 镜头表 / 匾额 / 每幕专属前景 / 收印 / 配置。bx_tight.js 只做「8 幕包装 + 分派」。
// 所有前景都是纸片：paper() 平涂 + jag() 剪口 + carve() 镂空 + 贴片投影。
// 红线：屏幕空间层（帘 / 判词纸签 / 结句底）在 bx_tight.js 的 camera restore 之后画。
(() => {
  const B = window.BX, FIG = window.BX_FIGURE;
  if (!B || !FIG) {
    window.__bootErrors = (window.__bootErrors || []).concat(
      ['bx_series.js: 缺 bx_common.js / bx_figure.js（SCENE_LIBS 顺序须为 common → figure → series → tight）']);
    return;
  }
  const { poly, F, ell, dot, htext, jag, paper, carveLine, carveMoon, carveSaw,
          cutFlower, pmod, ss, clamp, lerp, rng } = B;
  const P = B.PAL.tieguali, CX = B.CX, BOX = B.BOX, ACT = 3.8;
  const INK = P.ink, PAPER = P.paper, MAIN = P.main, MDK = P.mainDk, MHI = P.mainHi;
  const JADE = P.jade, GOLD = P.gold, GDK = P.goldDk, IND = P.indigo;

  const FILMS = {
    tieguali_v2: {
      name: '铁拐李·借躯还魂·紧凑版',
      ending: '跛足亦成仙',
      caption: '八仙人物 · 铁拐李',
      v1: '莫笑蓬头跛足', v2: '壶中自有乾坤',
      plaques: ['华山', '出窍', '纸灰', '壶中天', '点化', '济世', '立身', '过海'],
      names: ['华山修道', '元神出窍', '躯壳化灰', '铁拐李',
              '老君点化', '壶丹济世', '市井乞行', '过海'],
    },
  };
  const cfg = () => FILMS[window.SERIES_KEY] || FILMS.tieguali_v2;

  // 幕内镜头：逐幕推近，第⑤⑥幕给到法宝 / 内心特写，第⑦⑧幕拉回收束
  const CAM = [
    { z: 1.00, dx: 0,   dy: 0 },
    { z: 1.05, dx: -18, dy: 0 },
    { z: 1.08, dx: 0,   dy: -14 },
    { z: 1.12, dx: 26,  dy: 8 },
    // k5/k6 原 z=1.20/1.16 + 负 dy 会把蓬头推进顶部横幅（审片 P1）；
    // 降到 1.10/1.09 并取消负 dy，推近改由 dx 与前景尺度承担。
    { z: 1.10, dx: 44,  dy: 0 },
    { z: 1.09, dx: -40, dy: 0 },
    { z: 1.00, dx: 0,   dy: 0 },
    { z: 1.04, dx: 0,   dy: 0 },
  ];
  const camOf = (n, lt, t) => {
    const c = CAM[n - 1];
    return { z: c.z + 0.006 * Math.sin(t * 0.7), dx: c.dx + 2.4 * Math.sin(t * 0.5), dy: c.dy };
  };
  const clipBox = (c) => B.clipBox(c);

  function stageOpt(n) {
    const f = cfg();
    // 零回归扩展：f.pal / f.seal 只有第二批人物片才有；铁拐李条目不设这两项，
    // 回落到 P 与 ['铁','拐']，与接入前逐字节等价。
    return {
      pal: f.pal || P, bgKey: 'bx_' + (window.SERIES_KEY || 'tieguali_v2'),
      name: f.names[n - 1], title: '八仙人物',
      verdict: f.v1, verdict2: f.v2, seal: f.seal || ['铁', '拐'],
      label: n === 4,
      noHalo: n === 1 || n === 3,      // 缘起 / 转折幕不画人头后的窗花，让场景元素读得出来
      hideVerdict: n === 7,            // 判词纸签压入时隐藏右栏原判词，避免同句重复
    };
  }

  function hero(c, t, opt) { FIG.drawTieguaili(c, Object.assign({ t }, opt)); }
  // 第二批人物片的一人一专色：色板只在运动层 / 帘 / 判词纸签上换，
  // 首支 cfg().pal 为空 → 仍取 P，逐像素零回归。
  const curPal = () => cfg().pal || P;
  const motion = (c, t, amp) => B.motion(c, t, curPal(), amp === undefined ? 1 : amp);
  const curtainScreen = (c, t, open) => B.curtainScreen(c, t, open, { pal: curPal() });
  const verdictPaper = (c, t, p, f) => B.verdictPaper(c, t, p, { pal: curPal(), v1: f.v1, v2: f.v2 });

  // ---------------------------------------------------------------- 通用纸片
  function plaque(c, text, x, y) {
    paper(c, jag([[x - 104, y], [x + 104, y], [x + 104, y + 58], [x - 104, y + 58]], 6, 71, 3),
      PAPER, { line: INK, lw: 3 });
    htext(c, text, x, y + 30, 38, INK, 4);
    carveSaw(c, x - 80, y + 8, x + 80, y + 8, 7, P.bg1, 7);
  }

  // 华山道观：山门横檐 + 双柱 + 香炉三缕烟 + 下缘山石（全部在人物头顶 / 脚下，不压脸）
  function temple(c, t) {
    paper(c, jag([[BOX.x0 + 46, 200], [BOX.x0 + 82, 158], [CX, 130],
                  [BOX.x1 - 82, 158], [BOX.x1 - 46, 200]], 8, 73, 3), MDK, { line: INK, lw: 3 });
    paper(c, [[BOX.x0 + 74, 200], [BOX.x1 - 74, 200], [BOX.x1 - 74, 224], [BOX.x0 + 74, 224]],
      GOLD, { line: INK, lw: 2.4 });
    carveSaw(c, BOX.x0 + 110, 212, BOX.x1 - 110, 212, 16, PAPER, 9);
    for (const s of [-1, 1]) {
      const x = CX + s * 250;
      paper(c, [[x - 26, 224], [x + 26, 224], [x + 26, 452], [x - 26, 452]], MAIN,
        { shadow: 'rgba(74,42,26,.12)', dx: 4, dy: 5, line: INK, lw: 2.2 });
      carveSaw(c, x - 18, 300, x + 18, 300, 3, PAPER, 8);
      carveSaw(c, x - 18, 380, x + 18, 380, 3, PAPER, 8);
      paper(c, [[x - 40, 444], [x + 40, 444], [x + 40, 464], [x - 40, 464]], GDK,
        { shadow: null, edge: false, line: INK, lw: 1.8 });
    }
    paper(c, jag([[CX - 330, 720], [CX - 250, 720], [CX - 260, 776], [CX - 320, 776]], 5, 75, 2),
      GOLD, { line: INK, lw: 2.4 });
    for (let k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(CX - 306 + k * 18, 716);
      c.bezierCurveTo(CX - 320 + k * 22, 660 - Math.sin(t * 1.2 + k) * 12,
                      CX - 280 + k * 20, 620, CX - 300 + k * 24, 568);
      c.strokeStyle = k % 2 ? MAIN : MDK; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();
    }
    paper(c, jag([[BOX.x0 + 20, 980], [BOX.x0 + 110, 918], [CX - 180, 938],
                  [CX + 40, 916], [CX + 250, 942], [BOX.x1 - 90, 910], [BOX.x1 - 20, 980]], 12, 79, 3),
      JADE, { line: INK, lw: 3 });
    for (let k = 0; k < 6; k++)
      carveLine(c, BOX.x0 + 150 + k * 130, 962, BOX.x0 + 190 + k * 130, 930, 3.4, PAPER);
  }

  function crane(c, t, x, y, s) {
    c.save(); c.translate(x, y + Math.sin(t * 1.4) * 14); c.scale(s, s);
    paper(c, jag([[-90, 0], [-18, -30], [86, -10], [22, 24], [-30, 20]], 7, 83, 2), PAPER,
      { line: INK, lw: 2.6 });
    paper(c, jag([[-18, -30], [-46, -96], [10, -56], [30, -18]], 7, 89, 2), MAIN,
      { line: INK, lw: 2.2 });
    paper(c, jag([[-46, -96], [22, -84], [10, -56]], 6, 97, 2), GOLD,
      { shadow: null, edge: false, line: INK, lw: 1.8 });
    dot(c, 68, -8, 4, INK);
    c.restore();
  }

  function cloud(c, t) {
    for (let k = 0; k < 4; k++) {
      const x = BOX.x0 + 100 + pmod(k * 240 + t * 26, BOX.x1 - BOX.x0 - 200);
      const y = 210 + k * 66 + Math.sin(t * 0.8 + k) * 8;
      paper(c, jag([[x - 70, y + 22], [x - 44, y - 12], [x + 6, y - 22],
                    [x + 58, y], [x + 76, y + 24], [x - 20, y + 32]], 6, 101 + k, 2),
        PAPER, { shadow: 'rgba(74,42,26,.10)', dx: 4, dy: 5, line: GDK, lw: 1.8 });
    }
  }

  // 空榻：床面 + 两条床腿 + 一端纸枕（缺腿会读成一条红杠，已踩坑）
  function bed(c, t) {
    paper(c, jag([[CX - 250, 872], [CX + 250, 872], [CX + 250, 914], [CX - 250, 914]], 7, 107, 3),
      MDK, { line: INK, lw: 2.6 });
    carveSaw(c, CX - 220, 894, CX + 220, 894, 14, PAPER, 9);
    for (const s of [-1, 1]) {
      const x = CX + s * 214;
      paper(c, [[x - 15, 914], [x + 15, 914], [x + 15, 976], [x - 15, 976]], MDK,
        { line: INK, lw: 2.2 });
    }
    paper(c, jag([[CX - 244, 872], [CX - 148, 838], [CX - 140, 872]], 5, 109, 2), PAPER,
      { line: INK, lw: 2.2 });
  }

  // k3 转折：留白暗写「焚躯」——不画火，只画上升纸灰、榻上余烬线、飞离的纸鹤
  function ashes(c, t, u) {
    bed(c, t);
    for (let k = 0; k < 26; k++) {
      const r = rng(157 + k);
      const x = CX - 210 + r() * 420;
      const y = 872 - pmod(r() * 700 + t * (36 + (k % 4) * 16), 640);
      const s = 4 + (k % 3) * 3;
      c.save(); c.translate(x, y); c.rotate(t * 0.9 + k);
      F(c, poly([[-s, -s * 0.6], [s, -s * 0.5], [s * 0.8, s * 0.6], [-s * 0.8, s * 0.5]]),
        k % 3 === 0 ? PAPER : k % 3 === 1 ? GOLD : MHI, k % 3 === 0 ? GDK : null, 1.4);
      c.restore();
    }
    // 榻上一缕纸白余烬线（浅底上用朱红 / 深金，浅色线会消失）
    for (let k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(CX - 60 + k * 60, 868);
      c.bezierCurveTo(CX - 90 + k * 64, 800 - Math.sin(t * 1.1 + k) * 14,
                      CX - 20 + k * 60, 760, CX - 64 + k * 64, 706);
      c.strokeStyle = k % 2 ? MHI : MDK; c.lineWidth = 4.4; c.lineCap = 'round'; c.stroke();
    }
    crane(c, t, CX + 300 - u * 120, 300 - u * 70, 0.82);
  }

  // k4 显影：地面锯齿纸带 + 两侧剪花
  function ground(c, t) {
    paper(c, jag([[BOX.x0 + 26, 946], [BOX.x1 - 26, 946], [BOX.x1 - 26, 990], [BOX.x0 + 26, 990]], 9, 113, 3),
      GDK, { line: INK, lw: 2.6 });
    carveSaw(c, BOX.x0 + 60, 966, BOX.x1 - 60, 966, 18, PAPER, 9);
    for (const s of [-1, 1]) cutFlower(c, CX + s * 344, 760, 26, P, t * 0.2 * s, 7, MAIN, JADE);
  }

  // k5 点化：云端只给「一只手 + 拂尘 + 落下的金丹」，不画老君全身
  function cloudHand(c, t, u) {
    // 裁剪由 bx_tight.js 在 camera 之前的屏幕空间统一做；此处再 clip 会形成两层求交吞掉前景
    // 整组左移下移：原坐标在 z 推近后会被 BOX 右缘裁掉，只剩一截蓝袖口（审片 P1）
    c.save(); c.translate(-110, 30);
    for (let k = 0; k < 3; k++) {
      const x = CX + 190 + k * 74 + pmod(t * 16 + k * 120, 220) - 110;
      const y = 190 + k * 54;
      paper(c, jag([[x - 74, y + 20], [x - 40, y - 14], [x + 20, y - 22],
                    [x + 68, y], [x + 78, y + 24], [x - 20, y + 32]], 7, 131 + k, 2),
        PAPER, { shadow: 'rgba(74,42,26,.12)', dx: 5, dy: 6, line: GDK, lw: 2 });
    }
    // 袖口 + 手（剪影，只露一截）
    paper(c, jag([[CX + 250, 130], [CX + 400, 130], [CX + 386, 268], [CX + 246, 254]], 8, 137, 3), IND,
      { line: INK, lw: 2.8 });
    paper(c, [[CX + 258, 254], [CX + 330, 250], [CX + 322, 302], [CX + 252, 296]], PAPER,
      { line: INK, lw: 2.4 });
    // 拂尘柄 + 六缕纸白长穗（浅底上用深金描边才看得见）
    paper(c, [[CX + 286, 282], [CX + 302, 282], [CX + 278, 456], [CX + 262, 452]], GDK,
      { shadow: null, edge: false, line: INK, lw: 2 });
    for (let k = 0; k < 6; k++) {
      c.beginPath(); c.moveTo(CX + 270, 452);
      c.quadraticCurveTo(CX + 226 + k * 18 + Math.sin(t * 1.3 + k) * 10, 520,
                         CX + 214 + k * 22, 596 + k * 8);
      c.strokeStyle = k % 2 ? PAPER : GOLD; c.lineWidth = 3.6; c.lineCap = 'round'; c.stroke();
    }
    // 金丹逐枚落下
    for (let k = 0; k < 7; k++) {
      const ph = pmod(t * 0.42 + k / 7, 1);
      dot(c, CX - 120 + k * 46 + Math.sin(t + k) * 8, 300 + ph * 330,
          7, ph < 0.8 ? GOLD : PAPER, GDK, 1.6);
    }
    c.restore();
  }

  // k6 济世：市井排队剪影 + 药碗 + 蒸汽（病苦留白暗写，不画面部痛苦 / 血光）
  function bowlQueue(c, t, u) {
    for (let k = 0; k < 3; k++) {
      const x = BOX.x0 + 92 + k * 92, y = 908 - k * 12;
      const s = 0.60 + k * 0.06;
      c.save(); c.translate(x, y); c.scale(s, s);
      paper(c, [[-34, -26], [34, -26], [34, 6], [-34, 6]], k === 1 ? IND : MDK,
        { line: INK, lw: 2.2 });
      dot(c, 0, -44, 20, PAPER, INK, 2.2);
      paper(c, [[-40, 6], [40, 6], [46, 120], [-46, 120]], k === 2 ? JADE : MAIN,
        { line: INK, lw: 2.4 });
      carveSaw(c, -30, 70, 30, 70, 4, PAPER, 8);
      c.restore();
    }
    // 药碗 + 三缕蒸汽
    paper(c, jag([[CX + 190, 856], [CX + 322, 856], [CX + 306, 922], [CX + 206, 922]], 6, 149, 2),
      PAPER, { line: INK, lw: 2.8 });
    carveLine(c, CX + 204, 880, CX + 310, 880, 5, GDK);
    for (let k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(CX + 226 + k * 34, 852);
      c.bezierCurveTo(CX + 210 + k * 36, 810 - Math.sin(t * 1.2 + k) * 10,
                      CX + 244 + k * 34, 780, CX + 222 + k * 36, 744);
      c.strokeStyle = k % 2 ? MAIN : GDK; c.lineWidth = 3.8; c.lineCap = 'round'; c.stroke();
    }
  }

  // k8 过海：三层锯齿浪 + 一叶舟（人物登舟收束）
  function seaBoat(c, t, u) {
    for (let k = 0; k < 3; k++) {
      const y = 872 + k * 40;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = BOX.x0 + 20 + i * (BOX.x1 - BOX.x0 - 40) / 12;
        pts.push([x, y + (i % 2 ? -16 : 6) + Math.sin(t * 1.6 + i + k) * 5]);
      }
      pts.push([BOX.x1 - 20, 1010], [BOX.x0 + 20, 1010]);
      paper(c, jag(pts, 5, 151 + k, 2), k === 1 ? JADE : IND,
        { shadow: 'rgba(74,42,26,.14)', dx: 4, dy: 6, line: INK, lw: 2.2 });
    }
    const bx = CX + lerp(180, 40, clamp(u));
    paper(c, jag([[bx - 150, 906], [bx + 150, 906], [bx + 106, 962], [bx - 108, 962]], 7, 157, 2),
      GDK, { line: INK, lw: 2.8 });
    carveSaw(c, bx - 118, 932, bx + 118, 932, 12, PAPER, 9);
    paper(c, [[bx - 4, 906], [bx + 4, 906], [bx + 4, 762], [bx - 4, 762]], INK,
      { shadow: null, edge: false });
    paper(c, jag([[bx + 4, 768], [bx + 92, 792], [bx + 4, 856]], 6, 163, 2), PAPER,
      { line: INK, lw: 2.2 });
  }

  // 收印：朱红钤印按 q 逐字显影（q<1 只显前缀字符，钤印收尾才完整）
  function sealStamp(c, t, q, f) {
    const a = ss(0.10, 0.82, q);
    if (a <= 0.001) return;
    const Q = curPal();
    const s = lerp(1.35, 1.0, a);
    c.save(); c.globalAlpha = a;
    c.translate(CX + 300, 812); c.scale(s, s); c.rotate(-0.06 + 0.02 * Math.sin(t));
    paper(c, [[-62, -62], [62, -62], [62, 62], [-62, 62]], Q.main,
      { shadow: 'rgba(74,42,26,.26)', dx: 8, dy: 10, line: Q.mainDk, lw: 2 });
    F(c, poly([[-52, -52], [52, -52], [52, 52], [-52, 52]]), null, PAPER, 2.6);
    const txt = '八仙人物';
    const n = Math.max(1, Math.ceil(clamp(q) * txt.length));
    htext(c, [...txt].slice(0, n).join(''), 0, -20, 34, PAPER, 2);
    htext(c, [...txt].slice(0, n).join(''), 0, 20, 34, PAPER, 2);
    c.restore();
  }

  window.BX_SERIES = { P, ACT, FILMS, cfg, CAM, camOf, clipBox, stageOpt,
    plaque, hero, motion, curtainScreen, verdictPaper,
    temple, crane, cloud, bed, ashes, ground, cloudHand, bowlQueue, seaBoat, sealStamp,
    ss, clamp, pmod };
})();
