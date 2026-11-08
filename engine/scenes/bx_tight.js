// 八仙 · 民俗套色剪纸 —— 紧凑版八幕引擎（SCENES k1..k8）
// ---------------------------------------------------------------------------
// 片长 30.4s = 8 幕 × 3.8s，一句一幕硬契约：eras 的 dur 之和 = lines.total = 30.4，
// t1 严格对齐幕边界。故事链：修道→出窍→焚躯→借躯→点化→济世→立身→过海。
//
// 红线 01 落实：k2~k6 各幕 pose / tilt / 推近 / 前景四项至少换三项，杜绝「同一张图」。
// 红线 02 落实：屏幕空间裁剪只在 camera 之前做一次；前景函数内部不再 clip，避免两层求交吞掉。
// 红线 03 落实：窗纸帘 / 判词纸签 / 结句底全部在 camera restore() 之后画。
// 留白暗写：不画焚烧、不画病痛、不画血光；焚躯用上升纸灰 + 榻上余烬线侧写。
(() => {
  const B = window.BX, S = window.BX_SERIES;
  if (!S) {
    window.__bootErrors = (window.__bootErrors || []).concat(
      ['bx_tight.js: 缺 bx_series.js 的 window.BX_SERIES（SCENE_LIBS 顺序须为 common → figure → series → tight）']);
    return;
  }
  const { F, poly, htext, paper, jag, ss, clamp, pmod } = B;
  const P = S.P, CX = B.CX, BOX = B.BOX, ACT = S.ACT;
  const f = S.cfg();
  // 结句底 / 收束文字按当前片专色；铁拐李 f.pal 为空 → Q=P，逐像素零回归。
  const Q = f.pal || P;
  const PAPER = P.paper, INK = P.ink, MDK = Q.mainDk, GOLD = Q.gold;

  // ---------------------------------------------------------------- 幕内绘制
  function body(c, lt, t, n) {
    // 零回归扩展：bx_actors.js 在 SCENE_LIBS 里排在 series 之后、tight 之前。
    // 命中第二批人物片时整幕交出去；铁拐李没加载 actors → 下面原分支一字不改。
    const AX = window.BX_ACTORS;
    if (AX && AX.has(window.SERIES_KEY)) { AX.body(c, lt, t, n); return; }
    const u = clamp(lt / ACT);
    if (n === 1) {
      // ① 缘起：山门 + 香炉 + 打坐剪影。刻意不画完整立像，作为与后七幕的强对比。
      S.temple(c, t);
      S.hero(c, t, { pose: 'sit', tilt: 0.006 * Math.sin(t * 0.8) });
      return;
    }
    if (n === 2) {
      // ② 掀帘：元神离榻，纸鹤与云气，帘开到 0.9 不切人。
      S.cloud(c, t);
      S.bed(c, t);
      S.crane(c, t, CX - 250, 336, 1.15);
      S.crane(c, t, CX + 250, 286, 0.95);
      S.hero(c, t, { pose: 'spirit', ghost: true, alpha: 0.86 });
      return;
    }
    if (n === 3) {
      // ③ 转折：躯壳焚作纸灰（留白）。空榻 + 上升纸灰 + 侧后小影，不画火。
      S.ashes(c, t, u);
      S.hero(c, t, { pose: 'lost', alpha: 0.46 + 0.10 * Math.sin(t * 0.9) });
      return;
    }
    if (n === 4) {
      // ④ 显影：完整立像（封面帧）。地面纸带 + 两侧剪花 + 背后窗花环。
      S.ground(c, t);
      S.hero(c, t, { pose: 'stand', tilt: -0.018 + 0.016 * Math.sin(t * 0.9), lift: 4 + 6 * u });
      return;
    }
    if (n === 5) {
      // ⑤ 点化：镜头推到 1.20，云端只给手与拂尘，人物双臂上举、葫芦抬高。
      S.hero(c, t, { pose: 'bless', tilt: 0.030 + 0.012 * Math.sin(t * 1.05) });
      S.cloudHand(c, t, u);
      return;
    }
    if (n === 6) {
      // ⑥ 济世：倾葫芦 + 市井排队剪影 + 药碗，病苦一律留白侧写。
      S.bowlQueue(c, t, u);
      S.hero(c, t, { pose: 'heal', tilt: -0.062 + 0.014 * Math.sin(t * 0.8) });
      return;
    }
    if (n === 7) {
      // ⑦ 判词：拉回全景，人物淡到 0.5 让判词纸签成为主角。
      S.hero(c, t, { pose: 'fade', tilt: 0.012 * Math.sin(t * 0.7) });
      return;
    }
    // ⑧ 收束：人物从幕⑦的 0.5 连续淡出（不能硬回切 1.0），拄拐登舟。
    const fade = 0.5 - 0.5 * ss(0.04, 0.90, clamp(lt / 2.6));
    S.seaBoat(c, t, u);
    S.hero(c, t, { pose: 'go', alpha: fade, tilt: -0.095 + 0.012 * Math.sin(t * 0.7) });
  }

  // ---------------------------------------------------------------- 幕包装
  function act(c, lt, t, n) {
    const cam = S.camOf(n, lt, t);
    B.stage(c, t, S.stageOpt(n));

    // 屏幕空间只裁一次，再进 camera；前景函数内部不得再 clip。
    c.save();
    S.clipBox(c);
    c.translate(CX, 540);
    c.scale(cam.z, cam.z);
    c.translate(-CX + cam.dx, -540 + cam.dy);
    body(c, lt, t, n);
    c.restore();

    // 屏幕空间层：匾额（不随镜头缩放）
    c.save(); S.clipBox(c);
    // k7 匾额原来放中央 (CX,248) 会压在人物脸上（审片 P1）；改到左上角，
    // 且顶部横幅文案已改为「市井乞行」，不再与匾额同词重复。
    const px = [CX, BOX.x1 - 108, BOX.x0 + 108, BOX.x1 - 118,
                BOX.x0 + 108, BOX.x1 - 118, BOX.x0 + 108, BOX.x0 + 108][n - 1];
    const py = n === 1 ? 248 : 196;
    S.plaque(c, f.plaques[n - 1], px, py);
    c.restore();

    // 窗纸帘：屏幕空间层，必须在 camera restore 之后画，才盖得住演员。
    // H.ss(lo,hi,x) 是 smoothstep 阈值函数返回 0..1，不是区间插值；
    // 要得到 [a,b] 的连续值必须写 a + (b-a)*ss(0,1,x)。
    const q = ss(0, 1, clamp(lt / 2.4));
    if (n === 1) S.curtainScreen(c, t, 0.50 + 0.22 * q);
    if (n === 2) S.curtainScreen(c, t, 0.70 + 0.22 * q);

    S.motion(c, t, n === 7 ? 0.45 : (n === 8 ? 0.72 : 1));

    if (n === 7) {
      S.verdictPaper(c, t, ss(0.04, 0.88, clamp(lt / 1.9)), f);
      return;
    }
    if (n !== 8) return;

    // 判词纸签滑出（承接幕⑦）
    if (lt < 0.7)
      S.verdictPaper(c, t, 1 - ss(0.04, 0.92, clamp(lt / 0.7)), f);

    S.sealStamp(c, t, clamp(lt / 2.5), f);

    // 结句朱红纸片 + 纸白字，早现长持；浅窗纸底上不用半透明，否则对比被稀释。
    const a = ss(0.30, 1.0, clamp(lt / 2.2));
    c.save(); c.globalAlpha = a;
    paper(c, jag([[CX - 330, 650], [CX + 330, 650], [CX + 330, 812], [CX - 330, 812]], 9, 181, 4),
      MDK, { line: INK, lw: 3.2 });
    htext(c, f.ending, CX, 704, 58, PAPER, 0);
    htext(c, f.caption, CX, 772, 36, GOLD, 2);
    c.restore();
  }

  ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'k7', 'k8'].forEach((id, i) => {
    SCENES[id] = { draw(c, lt, t) { act(c, lt, t, i + 1); } };
  });
})();
