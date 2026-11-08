// 八仙 · 民俗套色剪纸 —— 三幕静帧样张（15s，不是成片，只用于钉风格）
// ① 华山修道（帘半掩 + 打坐剪影） ② 元神出窍（纸鹤 + 离榻） ③ 借躯显影（完整立像）
// 样张判三件事：一眼认得出是民间剪纸吗？人物与窗纸舞台融吗？纸片有没有分层而不是贴纸？
(() => {
  const B = window.BX, FIG = window.BX_FIGURE;
  if (!B || !FIG) { window.__bootErrors = (window.__bootErrors || []).concat(['bx_sample.js: 缺 bx_common.js 或 bx_figure.js']); return; }
  const { poly, F, ell, dot, htext, jag, paper, carveLine, carveSaw, cutFlower, pmod } = B;
  const S = B.PAL.tieguali, CX = B.CX, BOX = B.BOX;
  const INK = S.ink, PAPER = S.paper, MAIN = S.main, MDK = S.mainDk;
  const JADE = S.jade, GOLD = S.gold, GDK = S.goldDk;

  const opt = (name, extra) => Object.assign({ pal: S, bgKey: 'bx_sample', name,
    title: '八仙人物', verdict: '莫笑蓬头跛足', verdict2: '壶中自有乾坤',
    seal: ['铁', '拐'], label: true }, extra || {});

  // 匾额：锯齿边纸牌
  function plaque(c, text, x, y) {
    paper(c, jag([[x - 104, y], [x + 104, y], [x + 104, y + 58], [x - 104, y + 58]], 6, 71, 3),
      PAPER, { line: INK, lw: 3 });
    htext(c, text, x, y + 30, 38, INK, 4);
    carveSaw(c, x - 80, y + 8, x + 80, y + 8, 7, S.bg1, 7);
  }
  // 华山道观：山门横檐 + 双柱放在人物「头顶上方」，不被身体/帘吞掉；香炉三缕烟做连续活气
  function temple(c, t) {
    paper(c, jag([[BOX.x0 + 46, 200], [BOX.x0 + 82, 158], [CX, 130],
                  [BOX.x1 - 82, 158], [BOX.x1 - 46, 200]], 8, 73, 3), MDK,
      { line: INK, lw: 3 });
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
    // 香炉 + 三缕纸白烟（浅窗纸底上用朱红细线，才看得见）
    paper(c, jag([[CX - 330, 720], [CX - 250, 720], [CX - 260, 776], [CX - 320, 776]], 5, 75, 2),
      GOLD, { line: INK, lw: 2.4 });
    for (let k = 0; k < 3; k++) {
      c.beginPath(); c.moveTo(CX - 306 + k * 18, 716);
      c.bezierCurveTo(CX - 320 + k * 22, 660 - Math.sin(t * 1.2 + k) * 12,
                      CX - 280 + k * 20, 620, CX - 300 + k * 24, 568);
      c.strokeStyle = k % 2 ? MAIN : MDK; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();
    }
    // 山石只在下缘，不压头
    paper(c, jag([[BOX.x0 + 20, 980], [BOX.x0 + 110, 918], [CX - 180, 938],
                  [CX + 40, 916], [CX + 250, 942], [BOX.x1 - 90, 910], [BOX.x1 - 20, 980]], 12, 79, 3),
      JADE, { line: INK, lw: 3 });
    for (let k = 0; k < 6; k++)
      carveLine(c, BOX.x0 + 150 + k * 130, 962, BOX.x0 + 190 + k * 130, 930, 3.4, PAPER);
  }
  // 纸鹤：两片三角纸 + 锯齿翼
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
  // 云气纸片
  function cloud(c, t) {
    for (let k = 0; k < 4; k++) {
      const x = BOX.x0 + 100 + pmod(k * 240 + t * 26, BOX.x1 - BOX.x0 - 200);
      const y = 210 + k * 66 + Math.sin(t * 0.8 + k) * 8;
      paper(c, jag([[x - 70, y + 22], [x - 44, y - 12], [x + 6, y - 22],
                    [x + 58, y], [x + 76, y + 24], [x - 20, y + 32]], 6, 101 + k, 2),
        PAPER, { shadow: 'rgba(74,42,26,.10)', dx: 4, dy: 5, line: GDK, lw: 1.8 });
    }
  }

  SCENES['s1'] = { draw(c, lt, t) {
    B.stage(c, t, opt('华山修道', { noHalo: true }));   // 缘起幕关掉人头后的窗花，让山门读得出来
    c.save(); B.clipBox(c); temple(c, t); c.restore();
    FIG.drawTieguaili(c, { pose: 'sit', t, tilt: 0.006 * Math.sin(t * 0.8) });
    c.save(); B.clipBox(c); plaque(c, '华山', CX, 248); c.restore();
    B.curtainScreen(c, t, 0.52 + 0.20 * B.ss(0, 1, lt / 3), { pal: S });
    B.motion(c, t, S, 0.8);
  } };

  SCENES['s2'] = { draw(c, lt, t) {
    B.stage(c, t, opt('元神出窍'));
    c.save(); B.clipBox(c);
    cloud(c, t);
    // 空榻：床面 + 两条床腿 + 一端纸枕，才读得出是「榻」而不是一条红杠
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
    crane(c, t, CX - 250, 336, 1.15);
    crane(c, t, CX + 250, 286, 0.95);
    c.restore();
    FIG.drawTieguaili(c, { pose: 'spirit', t, ghost: true });
    c.save(); B.clipBox(c); plaque(c, '出窍', BOX.x1 - 108, 196); c.restore();
    B.curtainScreen(c, t, 0.74 + 0.18 * B.ss(0, 1, lt / 3), { pal: S });
    B.motion(c, t, S, 1);
  } };

  SCENES['s3'] = { draw(c, lt, t) {
    B.stage(c, t, opt('铁拐李'));
    c.save(); B.clipBox(c);
    // 显影幕：地面纸带 + 两侧法宝剪影作呼应
    paper(c, jag([[BOX.x0 + 26, 946], [BOX.x1 - 26, 946], [BOX.x1 - 26, 990], [BOX.x0 + 26, 990]], 9, 113, 3),
      GDK, { line: INK, lw: 2.6 });
    carveSaw(c, BOX.x0 + 60, 966, BOX.x1 - 60, 966, 18, PAPER, 9);
    for (const s of [-1, 1])
      cutFlower(c, CX + s * 344, 760, 26, S, t * 0.2 * s, 7, MAIN, JADE);
    c.restore();
    FIG.drawTieguaili(c, { pose: 'stand', t, tilt: -0.02 * Math.sin(t * 0.9) });
    c.save(); B.clipBox(c); plaque(c, '壶中天', BOX.x1 - 118, 196); c.restore();
    B.motion(c, t, S, 1);
  } };
})();
