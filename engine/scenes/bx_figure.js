// 八仙 · 铁拐李 —— 纸片分件铰接 rig（window.BX_FIGURE）
// ---------------------------------------------------------------------------
// 全代码几何纸片，不复用仕女 / 猴王 / 神魔任何骨架。
// 辨识度靠「剪影 + 法宝 + 专色」：蓬头虬髯、佝偻破衲、右腿跛、左提葫芦、右拄铁拐。
// 每个部件都是独立纸片（paper + jag 剪口 + carve 刻纹 + 铆钉铰接），并整体过 12fps 步进颤动。
// opt: { pose, t, alpha, tilt, lift, dx, scale, ghost }
(() => {
  const B = window.BX;
  if (!B) { window.__bootErrors = (window.__bootErrors || []).concat(['bx_figure.js: 缺 bx_common.js']); return; }
  const { poly, F, ell, dot, bez, jag, paper, carveLine, carveMoon, carveSaw, step } = B;
  const S = B.PAL.tieguali;
  const INK = S.ink, PAPER = S.paper, SKIN = S.skin;
  const MAIN = S.main, MDK = S.mainDk, MHI = S.mainHi;
  const JADE = S.jade, JDK = S.jadeDk, IND = S.indigo, GOLD = S.gold, GDK = S.goldDk;

  // 八组姿态：每幕至少换「人物尺度 / 倾斜 / 手臂 / 葫芦 / 拐 / 腿」中的三项，杜绝同一张图
  const POSES = {
    // k1 打坐修道（远景剪影）
    sit:    { scale: 0.74, lift: 56, dx: -8,  tilt: 0.008, armL: 0.22, armR: -0.18,
              gourd: 0.10, crutch: 0.34, leg: 0.72, alpha: 1.00, sit: true },
    // k2 元神出窍（离榻浮起、无拐）
    spirit: { scale: 0.88, lift: -92, dx: 26, tilt: -0.055, armL: -0.46, armR: -0.40,
              gourd: 0.20, crutch: 0.00, leg: 0.20, alpha: 0.86 },
    // k3 归来无依（侧后小影）
    lost:   { scale: 0.66, lift: 34, dx: 218, tilt: 0.070, armL: 0.12, armR: 0.30,
              gourd: -0.22, crutch: 0.22, leg: 0.60, alpha: 0.50 },
    // k4 显影（完整立像，封面帧）
    stand:  { scale: 1.00, lift: 0,  dx: 0,   tilt: -0.018, armL: -0.10, armR: 0.06,
              gourd: -0.06, crutch: -0.04, leg: 0.00, alpha: 1.00 },
    // k5 受点化（双臂上举、葫芦抬高）
    // lift 用正值把人往下压：负值会让蓬头越过顶部横幅（k5/k6 审片 P1）
    bless:  { scale: 1.02, lift: 18, dx: -14, tilt: 0.030, armL: -0.72, armR: -0.58,
              gourd: -0.52, crutch: 0.16, leg: 0.08, alpha: 1.00 },
    // k6 倾葫芦济世
    heal:   { scale: 1.03, lift: 16, dx: 20, tilt: -0.062, armL: -0.30, armR: 0.34,
              gourd: -1.02, crutch: -0.16, leg: 0.04, alpha: 1.00 },
    // k7 判词（人物退到半透）
    fade:   { scale: 1.00, lift: 0,  dx: 0,   tilt: 0.012, armL: -0.06, armR: 0.04,
              gourd: -0.04, crutch: -0.02, leg: 0.00, alpha: 0.50 },
    // k8 拄拐登舟（侧身前倾，拐前探）
    go:     { scale: 1.00, lift: -6, dx: 34, tilt: -0.095, armL: 0.10, armR: 0.48,
              gourd: 0.14, crutch: -0.42, leg: 0.26, alpha: 1.00 },
  };

  function ribbon(g, pts, col, t, k) {
    // 飘带：纸片随风整体轻摆，末端用锯齿剪口
    const sw = Math.sin(t * 1.15 + k) * 9;
    const p = pts.map(([x, y], i) => [x + sw * (0.25 + i * 0.18), y]);
    paper(g, jag(p, 5, k + 2, 2), col, { shadow: 'rgba(74,42,26,.18)', dx: 5, dy: 6, line: GDK, lw: 1.8 });
  }

  function crutch(g, t, a) {
    // 铁拐：分成三张纸片（横把 / 左垂钩 / 杖身），中间留出窗纸空隙，
    // 这样顶端读得出「拐」而不是一坨黑色剪影。a 为绕握点的倾斜。
    g.save(); g.translate(216, 700); g.rotate(a); g.translate(-216, -700);
    paper(g, [[206, 414], [230, 414], [236, 972], [210, 972]], INK, { line: GDK, lw: 1.6 });
    paper(g, jag([[126, 388], [230, 388], [230, 414], [126, 414]], 4, 7, 2),
      INK, { line: GDK, lw: 1.8 });
    paper(g, jag([[126, 388], [154, 388], [154, 464], [126, 464]], 4, 9, 2),
      INK, { line: GDK, lw: 1.8 });
    paper(g, [[198, 408], [238, 408], [238, 424], [198, 424]], GOLD,
      { shadow: null, edge: false, line: GDK, lw: 1.6 });
    for (const y of [500, 592, 684, 776, 868]) {
      paper(g, [[204, y], [232, y], [232, y + 13], [204, y + 13]], GOLD,
        { shadow: null, edge: false });
    }
    for (let k = 0; k < 4; k++)
      carveLine(g, 214, 540 + k * 96, 224, 566 + k * 96, 2.6, 'rgba(248,238,216,.55)');
    dot(g, 140, 458, 8, GOLD, GDK, 1.6);
    g.restore();
  }

  // 葫芦背带：组合道具必须补连接件，否则葫芦会像悬在腰间的一团绿叶。
  function gourdCord(g, t) {
    carveLine(g, -76, 466, -186, 596, 7, MAIN);
    carveLine(g, -70, 472, -180, 602, 3, MHI);
    dot(g, -80, 470, 8, GOLD, INK, 1.6);
    for (let k = 0; k < 3; k++) dot(g, -112 - k * 26, 500 + k * 34, 4.5, GOLD, INK, 1.2);
  }

  function gourd(g, t, a, opt) {
    // 葫芦：一整张「束腰」纸片剪成上下两瓣，中间明显收窄，才读得出是葫芦而不是绿团。
    // 金口 / 朱红绳 / 月牙镂空 / 握持的手，全部是同一套纸片材料。a 为倾倒角。
    g.save(); g.translate(-196, 646); g.rotate(a); g.translate(196, -646);
    const G = [[-196, 548], [-164, 556], [-152, 586], [-166, 614], [-160, 624],
               [-128, 648], [-120, 694], [-148, 732], [-196, 744], [-244, 732],
               [-272, 694], [-264, 648], [-232, 624], [-224, 614], [-240, 586], [-228, 556]];
    paper(g, jag(G, 5, 13, 2), JADE, { line: JDK, lw: 2.6 });
    // 束腰：一道窗纸色横刻，把上下两瓣明确分开
    carveLine(g, -224, 622, -168, 622, 6, PAPER);
    carveMoon(g, -196, 686, 32, PAPER, 6, 0.2);
    carveMoon(g, -196, 686, 19, PAPER, 4, 0.2);
    dot(g, -196, 662, 7, PAPER, JDK, 1.6);
    // 金口 + 朱红绳结
    paper(g, [[-214, 534], [-178, 534], [-174, 554], [-218, 554]], GOLD,
      { shadow: null, edge: false, line: GDK, lw: 1.8 });
    carveLine(g, -214, 562, -176, 574, 5, MAIN);
    carveLine(g, -214, 570, -176, 582, 3, MHI);
    dot(g, -196, 570, 6, MAIN, MDK, 1.4);
    // 握持的手（压在葫芦颈上，补上「谁拿着它」的连接）
    paper(g, [[-168, 586], [-140, 580], [-132, 610], [-162, 620]], SKIN,
      { shadow: null, edge: false, line: INK, lw: 2.2 });
    // 倾葫芦时落下三滴纸白丹丸
    if (opt.pour) {
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.9 + k * 0.33) % 1;
        dot(g, -118 + ph * 26, 636 + ph * 96, 6 - k, PAPER, GDK, 1.4);
      }
    }
    g.restore();
  }

  function head(g, t, blink, ghost) {
    const hair = ghost ? 'rgba(51,32,26,.86)' : INK;
    const face = ghost ? PAPER : SKIN;
    // 蓬头：大块锯齿墨纸，剪口向外炸
    paper(g, jag([[-88, 292], [-96, 236], [-64, 196], [-18, 182], [28, 186], [76, 206],
                  [96, 250], [88, 306], [66, 282], [30, 268], [-30, 270], [-66, 286]], 12, 23, 3),
      hair, { line: hair, lw: 1.6 });
    // 脸：硬边折线侧平视（不用贝塞尔，保留剪纸的剪刀味）
    paper(g, [[-58, 258], [46, 250], [70, 278], [66, 322], [82, 340], [66, 356],
              [58, 388], [22, 416], [-26, 412], [-58, 382], [-66, 320]],
      face, { line: hair, lw: 3.2 });
    // 虬髯：三簇锯齿墨纸，遮住下半脸
    paper(g, jag([[-64, 350], [-52, 396], [-16, 432], [24, 438], [62, 404], [68, 352],
                  [40, 368], [8, 376], [-26, 368]], 10, 29, 3),
      hair, { shadow: 'rgba(74,42,26,.14)', dx: 4, dy: 5 });
    for (let k = 0; k < 3; k++)
      carveLine(g, -34 + k * 26, 388, -24 + k * 24, 424, 3, 'rgba(248,238,216,.42)');
    // 浓眉 + 环眼（镂空眼白 + 墨瞳）
    for (const s of [-1, 1]) {
      paper(g, jag([[s * 12, 296], [s * 54, 286], [s * 62, 302], [s * 16, 308]], 3, 31 + s, 2),
        hair, { shadow: null, edge: false });
      const ey = 322 - blink * 9;
      paper(g, [[s * 14, ey - 8], [s * 56, ey - 10], [s * 60, ey], [s * 16, ey + 9]],
        PAPER, { shadow: null, edge: false, line: hair, lw: 2.4 });
      if (blink < 0.6) dot(g, s * 38, ey - 1, 6.5, hair);
    }
    // 鼻：一道折线
    carveLine(g, 4, 322, -6, 356, 3, ghost ? 'rgba(51,32,26,.45)' : GDK);
    // 额上勒带：朱红纸片 + 镂空锯齿
    paper(g, jag([[-66, 252], [54, 244], [60, 266], [-62, 274]], 4, 37, 2), MAIN,
      { shadow: null, edge: false, line: MDK, lw: 1.8 });
    carveSaw(g, -52, 262, 46, 256, 8, PAPER, 7);
    // 鬓角两绺
    for (const s of [-1, 1])
      paper(g, jag([[s * 68, 268], [s * 94, 300], [s * 86, 356], [s * 66, 330]], 7, 41 + s, 2),
        hair, { shadow: null, edge: false });
  }

  function body(g, t, K, opt) {
    const main = opt.ghost ? PAPER : MAIN;
    const mdk = opt.ghost ? GDK : MDK;
    const mhi = opt.ghost ? PAPER : MHI;
    // 飘带（先画，压在人物后面）
    ribbon(g, [[-96, 470], [-150, 566], [-176, 690], [-142, 826], [-196, 946]], IND, t, 1);
    ribbon(g, [[96, 470], [142, 560], [166, 684], [136, 820], [188, 942]], GOLD, t, 2);

    if (K.sit) {
      // 打坐：蒲团 + 两条交叠盘腿，明确不是「站着缩小一号的同一张立像」
      paper(g, jag([[-186, 872], [-140, 846], [140, 846], [186, 872], [186, 936],
                    [140, 962], [-140, 962], [-186, 936]], 7, 67, 2), GOLD, { line: INK, lw: 2.8 });
      carveSaw(g, -150, 906, 150, 906, 14, PAPER, 10);
      paper(g, [[-120, 836], [26, 826], [64, 878], [-96, 892]], mdk, { line: INK, lw: 2.4 });
      paper(g, [[-26, 826], [124, 838], [96, 892], [-60, 878]], main, { line: INK, lw: 2.4 });
      dot(g, 0, 858, 7, GOLD, INK, 1.6);
    } else {
      // 左腿直立撑地
      paper(g, [[-72, 806], [-12, 806], [-8, 962], [-84, 962]], mdk, { line: INK, lw: 2.4 });
      paper(g, [[-96, 962], [8, 962], [14, 986], [-104, 986]], GDK, { line: INK, lw: 2.2 });
      // 右腿跛：髋→膝→短小腿→悬空脚，三段都有纸片连接 + 膝部铆钉，不再读成「断掉的一块」
      const bend = K.leg * 34, kx = 108 + bend * 0.4, ky = 866 - bend;
      paper(g, [[20, 806], [84, 800], [kx, ky], [74, 884], [14, 848]], main, { line: INK, lw: 2.4 });
      paper(g, [[74, 872], [kx, ky], [kx - 8, ky + 52], [70, 922]], mdk, { line: INK, lw: 2.4 });
      paper(g, jag([[kx - 44, ky + 38], [kx + 28, ky + 34], [kx + 38, ky + 62], [kx - 40, ky + 66]], 5, 43, 2),
        GDK, { line: INK, lw: 2.2 });
      dot(g, kx - 12, ky + 4, 6.5, GOLD, INK, 1.6);
    }

    // 破衲衣身：佝偻，右肩高一截
    paper(g, jag([[-104, 446], [-150, 500], [-164, 620], [-148, 780], [-166, 852],
                  [-88, 866], [96, 858], [142, 790], [132, 616], [112, 486], [58, 436], [-40, 430]],
      9, 47, 3), main, { line: INK, lw: 3.2 });
    // 衣摆锯齿剪口
    carveSaw(g, -136, 842, 118, 842, 13, PAPER, 12);
    // 靛青补丁 + 刻纹（镂空用窗纸色）
    paper(g, jag([[-116, 580], [-52, 566], [-44, 636], [-112, 650]], 5, 53, 2), IND,
      { shadow: null, edge: false, line: INK, lw: 2 });
    carveLine(g, -104, 592, -60, 582, 4, PAPER);
    carveLine(g, -104, 612, -56, 604, 4, PAPER);
    paper(g, [[62, 690], [118, 682], [124, 740], [66, 748]], mhi,
      { shadow: null, edge: false, line: INK, lw: 2 });
    carveMoon(g, 92, 714, 20, PAPER, 5, 0.5);
    for (let k = 0; k < 4; k++)
      carveMoon(g, -18 + k * 34, 700 + (k % 2) * 24, 18, PAPER, 4, 0.3);
    // 领口：交叉襟
    paper(g, [[-52, 436], [4, 500], [-30, 566], [-78, 470]], PAPER,
      { shadow: null, edge: false, line: INK, lw: 2.4 });
    paper(g, [[52, 430], [-4, 500], [34, 566], [82, 466]], mdk,
      { shadow: null, edge: false, line: INK, lw: 2.4 });

    // 袖与手：角度由 pose 驱动
    g.save(); g.translate(-118, 486); g.rotate(K.armL); g.translate(118, -486);
    paper(g, jag([[-112, 456], [-176, 500], [-206, 596], [-168, 626], [-116, 570]], 8, 59, 3),
      main, { line: INK, lw: 2.8 });
    paper(g, [[-196, 596], [-160, 588], [-148, 620], [-184, 632]], SKIN,
      { shadow: null, edge: false, line: INK, lw: 2.2 });
    g.restore();
    g.save(); g.translate(116, 482); g.rotate(K.armR); g.translate(-116, -482);
    paper(g, jag([[110, 452], [172, 490], [202, 588], [166, 620], [112, 566]], 8, 61, 3),
      main, { line: INK, lw: 2.8 });
    paper(g, [[168, 588], [204, 580], [216, 612], [178, 626]], SKIN,
      { shadow: null, edge: false, line: INK, lw: 2.2 });
    g.restore();

    // 铆钉：肩 / 肘 / 膝，分件铰接的视觉证据
    for (const [x, y] of [[-112, 470], [112, 466], [-190, 596], [190, 590], [-48, 824], [58, 820]])
      dot(g, x, y, 6.5, GOLD, INK, 1.6);
  }

  // ---------------------------------------------------------------- 主入口
  function drawTieguaili(c, opt = {}) {
    const K = Object.assign({}, POSES[opt.pose] || POSES.stand,
      opt.tilt !== undefined ? { tilt: opt.tilt } : {},
      opt.lift !== undefined ? { lift: opt.lift } : {},
      opt.dx !== undefined ? { dx: opt.dx } : {},
      opt.alpha !== undefined ? { alpha: opt.alpha } : {});
    const t = opt.t || 0;
    const A = K.alpha;
    if (A <= 0.001) return;
    const st = step(t, 12);
    const flutter = Math.sin(st * 7.1) * 2.2;   // 纸片颤动，12fps 步进
    const blink = ((st * 2.4) % 1) < 0.09 ? 1 : 0;
    const ghost = !!opt.ghost;

    c.save();
    c.globalAlpha = A;
    c.translate(B.CX + K.dx + flutter, K.lift);
    c.translate(0, 720); c.rotate(K.tilt); c.scale(K.scale, K.scale); c.translate(0, -720);

    crutch(c, t, K.crutch);                 // 铁拐先画，握在右手之后仍可见
    body(c, t, K, { ghost });
    gourdCord(c, t);                        // 背带是葫芦与人之间的连接件
    gourd(c, t, K.gourd, { pour: opt.pose === 'heal' });
    head(c, t, blink, ghost);

    // 元神态：一圈纸白镂空光边，明确「出窍」而非普通人影
    if (ghost) {
      c.save(); c.globalAlpha = A * 0.8;
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2 + t * 0.35;
        dot(c, Math.cos(a) * 150, 500 + Math.sin(a) * 280, 5, PAPER, GDK, 1.2);
      }
      c.restore();
    }
    c.restore();
  }

  window.BX_FIGURE = { POSES, drawTieguaili };
})();
