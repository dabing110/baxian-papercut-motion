// 八仙 · 民俗套色剪纸 —— 第二批七位人物 rig + 八幕专属前景（window.BX_ACTORS）
// ---------------------------------------------------------------------------
// 零回归扩展：铁拐李片一行不改。本文件在 SCENE_LIBS 里排在 series 之后、tight 之前，
// 只做三件事：① 把自己的 FILMS 配置 Object.assign 进 S.FILMS；
// ② 向 bx_tight.js 的 body() 暴露 has()/body()，命中时整幕交出去；
// ③ 提供收口片复用的 propShape()/miniFigure()。
//
// 七人共用一套「纸片分件铰接」骨架，但头饰 / 须发 / 袍身 / 法宝 / 专色全部独立配置，
// 辨识度靠「剪影 + 法宝 + 一人一专色」，不靠五官。所有形都过 jag 剪口 / carve 刻纹 /
// paper 贴片投影，没有渐变笔触。
//
// 红线：① body() 内部不得再 clipBox（bx_tight.js 在 camera 之前只裁一次）；
// ② ss(lo,hi,x) 是阈值函数返回 0..1，区间插值必须写 a+(b-a)*ss(0,1,x)；
// ③ 浅色纸片画在浅窗纸上必须带 INK 描边，否则降采样后消失。
(() => {
  const B = window.BX, S = window.BX_SERIES;
  if (!B || !S) {
    window.__bootErrors = (window.__bootErrors || []).concat(
      ['bx_actors.js: 缺 bx_common.js / bx_series.js（SCENE_LIBS 须为 common → figure → series → actors → tight）']);
    return;
  }
  const { poly, F, dot, jag, paper, carveLine, carveMoon, carveSaw, cutFlower,
          htext, ss, clamp, lerp, pmod, rng, step } = B;
  const CX = B.CX, BOX = B.BOX, ACT = S.ACT;
  const INK = '#33201a', PAPER = '#f8eed8', SKIN = '#f9e5c6';
  const GOLD = '#d6a544', GDK = '#a2762c', IND = '#3c5c86', JADE = '#3e7a62', JDK = '#285241';
  const TAU = Math.PI * 2;

  // ============================================================ 一、七人配置
  // pal 用 bx_common.js 里已备好的八张「一人一专色」色板，铁拐李那张留给首支不动。
  const A = {
    zhongli_v2: {
      col: B.PAL.zhongli, name: '汉钟离', label: '钟离权',
      gear: 'yaji', beard: 'luosai', robe: 'belly', prop: 'fan', propSide: -1,
      wide: 1.16, ending: '一扇扫尽浮名', caption: '八仙人物 · 汉钟离',
      v1: '将门一梦终醒', v2: '扇底自有清风', seal: ['钟', '离'],
      plaques: ['边关', '终南', '授扇', '袒腹', '黄粱', '一摇', '同归', '芭蕉'],
      names: ['将门失意', '终南独坐', '老君授扇', '汉钟离',
              '客栈黄粱', '扇底荣枯', '书生弃名', '过海'],
    },
    lvzu_v2: {
      col: B.PAL.lvzu, name: '吕洞宾', label: '吕岩',
      gear: 'daoguan', beard: 'wuliu', robe: 'daopao', prop: 'sword', propSide: 1,
      wide: 0.96, ending: '剑收心上妄', caption: '八仙人物 · 吕洞宾',
      v1: '黄粱一枕方醒', v2: '纯阳不斩人间', seal: ['纯', '阳'],
      plaques: ['长安', '黄粱', '炊烟', '弃儒', '纯阳', '岳阳', '少贪', '收剑'],
      names: ['科场失意', '黄粱一梦', '饭犹未熟', '吕洞宾',
              '纯阳剑出', '岳阳三醉', '不谈长生', '过海'],
    },
    hexiangu_v2: {
      col: B.PAL.hexiangu, name: '何仙姑', label: '何琼',
      gear: 'shuanghuan', beard: 'none', robe: 'skirt', prop: 'lotus', propSide: -1,
      wide: 1.02, ending: '荷花不肯谢', caption: '八仙人物 · 何仙姑',
      v1: '云母溪边少女', v2: '一枝荷花开久', seal: ['仙', '姑'],
      plaques: ['云母溪', '异人', '云母粉', '荷花', '议亲', '采药', '不问', '不谢'],
      names: ['溪边挑水', '溪上遇人', '服粉不饥', '何仙姑',
              '家里议亲', '替人采药', '灵验之说', '过海'],
    },
    caoguojiu_v2: {
      col: B.PAL.caoguojiu, name: '曹国舅', label: '曹景休',
      gear: 'guanmao', beard: 'duanxu', robe: 'guanpao', prop: 'board', propSide: 1,
      wide: 1.08, ending: '弃爵方得自在', caption: '八仙人物 · 曹国舅',
      v1: '朝冠搁在案上', v2: '玉板敲开云路', seal: ['国', '舅'],
      plaques: ['京城', '弟过', '搁冠', '橘袍', '问来意', '玉板', '不提', '拍板'],
      names: ['一门显贵', '幼弟伤人', '朝冠搁案', '曹国舅',
              '钟离问意', '玉板云路', '不提爵位', '过海'],
    },
    lancaihe_v2: {
      col: B.PAL.lancaihe, name: '蓝采和', label: '蓝采和',
      gear: 'luanfa', beard: 'none', robe: 'lanshan', prop: 'basket', propSide: -1,
      wide: 0.92, ending: '踏歌不肯落幕', caption: '八仙人物 · 蓝采和',
      v1: '一脚跛着踏歌', v2: '花篮四季不空', seal: ['采', '和'],
      plaques: ['市井', '拍板', '散钱', '花篮', '酒楼', '鹤声', '踏云', '栏边'],
      names: ['市井歌者', '沿街踏歌', '散钱与人', '蓝采和',
              '酒楼一笑', '鹤声过檐', '跛足踏云', '过海'],
    },
    hanxiangzi_v2: {
      col: B.PAL.hanzhi, name: '韩湘子', label: '韩湘',
      gear: 'rujin', beard: 'none', robe: 'qingshan', prop: 'flute', propSide: 1,
      wide: 0.90, ending: '一箫吹散蓝关雪', caption: '八仙人物 · 韩湘子',
      v1: '顷刻花开瓣上', v2: '雪拥蓝关有声', seal: ['湘', '子'],
      plaques: ['韩愈家', '紫金箫', '顷刻花', '瓣上字', '谏表', '蓝关', '吹雪', '秦岭'],
      names: ['不爱读书', '箫引牡丹', '花开见字', '韩湘子',
              '一封谏表', '雪没马蹄', '不道姓名', '过海'],
    },
    zhangguolao_v2: {
      col: B.PAL.zhangguolao, name: '张果老', label: '张果',
      gear: 'laosou', beard: 'baixu', robe: 'laopao', prop: 'drum', propSide: -1,
      wide: 1.06, ending: '倒骑看人间', caption: '八仙人物 · 张果老',
      v1: '纸驴折进袖里', v2: '倒骑才看得清', seal: ['果', '老'],
      plaques: ['中条山', '纸驴', '渔鼓', '玄宗', '问寿', '化纸', '一盏茶', '来路'],
      names: ['倒骑白驴', '纸驴藏袖', '渔鼓踏歌', '张果老',
              '玄宗问寿', '殿上化纸', '不留封号', '过海'],
    },
  };

  // 合并进共享 FILMS：铁拐李条目完全不碰（首支零回归），只追加七条。
  const CFG = {};
  Object.keys(A).forEach(k => {
    const a = A[k];
    CFG[k] = {
      name: a.name + '·紧凑版', ending: a.ending, caption: a.caption,
      v1: a.v1, v2: a.v2, seal: a.seal, pal: a.col,
      plaques: a.plaques, names: a.names,
    };
  });
  Object.assign(S.FILMS, CFG);

  // ============================================================ 二、八组姿态
  const POSES = {
    sit:    { scale: 0.76, lift: 58, dx: -8,  tilt: 0.008,  armL: 0.22,  armR: -0.18,
              prop: 0.10, alpha: 1.00, sit: true },
    spirit: { scale: 0.88, lift: -84, dx: 24, tilt: -0.050, armL: -0.44, armR: -0.38,
              prop: 0.24, alpha: 0.86 },
    lost:   { scale: 0.68, lift: 32, dx: 208, tilt: 0.070,  armL: 0.12,  armR: 0.30,
              prop: -0.20, alpha: 0.52 },
    stand:  { scale: 1.00, lift: 0,  dx: 0,  tilt: -0.018, armL: -0.10, armR: 0.06,
              prop: -0.06, alpha: 1.00 },
    bless:  { scale: 1.02, lift: 16, dx: -14, tilt: 0.030,  armL: -0.70, armR: -0.56,
              prop: -0.52, alpha: 1.00 },
    heal:   { scale: 1.03, lift: 14, dx: 20,  tilt: -0.060, armL: -0.28, armR: 0.34,
              prop: -1.00, alpha: 1.00 },
    fade:   { scale: 1.00, lift: 0,  dx: 0,  tilt: 0.012,  armL: -0.06, armR: 0.04,
              prop: -0.04, alpha: 0.50 },
    go:     { scale: 1.00, lift: -6, dx: 32,  tilt: -0.090, armL: 0.10,  armR: 0.48,
              prop: 0.14, alpha: 1.00 },
  };

  // ============================================================ 三、七件法宝
  // 局部坐标以 (0,0) 为中心，约 ±90 × ±110；既贴在人物手上，也能放大做前景特写。
  function propShape(g, t, a) {
    const C = a.col, MAIN = C.main, MDK = C.mainDk, MHI = C.mainHi;
    const sw = Math.sin(t * 1.3) * 3;
    if (a.prop === 'fan') {
      // 芭蕉扇：扇面一张锯齿纸片 + 放射扇骨（窗纸色刻线）+ 木柄
      paper(g, jag([[-9, 118], [9, 118], [11, 24], [-11, 24]], 4, 5, 2), GDK,
        { line: INK, lw: 2.2 });
      paper(g, jag([[0, -100], [-58, -78], [-88, -14], [-70, 50], [0, 84],
                    [70, 50], [88, -14], [58, -78]], 8, 7, 3), JADE,
        { line: INK, lw: 3 });
      for (let k = -3; k <= 3; k++)
        carveLine(g, 0, 72, k * 26, -56 + Math.abs(k) * 12, 3.4, PAPER);
      carveMoon(g, 0, 6, 30, PAPER, 5, 0.4);
      dot(g, 0, 116, 7, GOLD, INK, 1.6);
      return;
    }
    if (a.prop === 'sword') {
      // 纯阳剑：纸白剑身必须带深墨描边，否则在浅窗纸上消失
      paper(g, [[-10, -112], [10, -112], [8, 38], [-8, 38]], PAPER,
        { line: INK, lw: 3 });
      carveLine(g, 0, -98, 0, 30, 3, MDK);
      paper(g, jag([[-42, 30], [42, 30], [42, 50], [-42, 50]], 5, 11, 2), GOLD,
        { line: INK, lw: 2.4 });
      paper(g, [[-9, 50], [9, 50], [9, 108], [-9, 108]], MDK,
        { line: INK, lw: 2.2 });
      for (let k = 0; k < 3; k++) carveSaw(g, -8, 62 + k * 16, 8, 62 + k * 16, 1, GOLD, 6);
      for (let k = 0; k < 3; k++) {
        g.beginPath(); g.moveTo(0, 108);
        g.quadraticCurveTo(-14 + k * 14 + sw, 132, -20 + k * 20, 154);
        g.strokeStyle = MAIN; g.lineWidth = 3.4; g.lineCap = 'round'; g.stroke();
      }
      return;
    }
    if (a.prop === 'lotus') {
      // 荷花：长茎 + 五瓣锯齿纸片 + 金蕊；瓣用专色，花心用纸白
      paper(g, [[-7, 6], [7, 6], [5, 118], [-5, 118]], JADE, { line: INK, lw: 2.2 });
      for (let k = -2; k <= 2; k++) {
        const x = k * 26, yy = -Math.abs(k) * 10;
        paper(g, jag([[x - 20, 20], [x - 12, yy - 46 + Math.abs(k) * 8],
                      [x, yy - 74 + Math.abs(k) * 12],
                      [x + 12, yy - 46 + Math.abs(k) * 8], [x + 20, 20]], 5, 17 + k, 2),
          k % 2 ? MAIN : MHI, { line: INK, lw: 2.4 });
      }
      dot(g, 0, -4, 17, GOLD, INK, 2);
      for (let k = 0; k < 5; k++) dot(g, -8 + k * 4, -8 + (k % 2) * 5, 2.6, PAPER);
      return;
    }
    if (a.prop === 'board') {
      // 阴阳玉板：两块带锯齿边的笏板，一阴一阳用深浅专色区分
      for (const s of [-1, 1]) {
        const x = s * 34;
        paper(g, jag([[x - 24, -96], [x + 24, -96], [x + 20, 100], [x - 20, 100]], 5, 23 + s, 3),
          s < 0 ? PAPER : MHI, { line: INK, lw: 3 });
        carveSaw(g, x - 16, -72, x + 16, -72, 3, s < 0 ? MDK : PAPER, 8);
        carveSaw(g, x - 16, -30, x + 16, -30, 3, s < 0 ? MDK : PAPER, 8);
        carveMoon(g, x, 30, 20, s < 0 ? MDK : PAPER, 5, 0.3);
        paper(g, [[x - 28, -104], [x + 28, -104], [x + 28, -92], [x - 28, -92]], GOLD,
          { shadow: null, edge: false, line: GDK, lw: 1.6 });
      }
      return;
    }
    if (a.prop === 'basket') {
      // 花篮：梯形篮身 + 刻纹编织 + 提梁 + 篮口四季花（另配拍板在前景）
      g.beginPath(); g.moveTo(-64, 4); g.quadraticCurveTo(0, -74 + sw, 64, 4);
      g.strokeStyle = MDK; g.lineWidth = 9; g.lineCap = 'round'; g.stroke();
      g.beginPath(); g.moveTo(-64, 4); g.quadraticCurveTo(0, -74 + sw, 64, 4);
      g.strokeStyle = GOLD; g.lineWidth = 3; g.stroke();
      paper(g, jag([[-70, 0], [70, 0], [52, 96], [-52, 96]], 6, 29, 3), GDK,
        { line: INK, lw: 2.8 });
      for (let k = 0; k < 3; k++)
        carveLine(g, -60 + k * 6, 24 + k * 24, 60 - k * 6, 24 + k * 24, 4, PAPER);
      for (let k = -2; k <= 2; k++)
        cutFlower(g, k * 26, -12 - Math.abs(k) * 8, 15, C, t * 0.3 + k, 6, MHI, GOLD);
      return;
    }
    if (a.prop === 'flute') {
      // 紫金箫：深专色管身 + 六孔 + 两端金箍
      paper(g, [[-13, -108], [13, -108], [13, 108], [-13, 108]], MDK,
        { line: INK, lw: 2.8 });
      for (let k = 0; k < 6; k++) dot(g, 0, -76 + k * 28, 4.4, PAPER, GDK, 1.4);
      for (const y of [-100, 96])
        paper(g, [[-17, y], [17, y], [17, y + 12], [-17, y + 12]], GOLD,
          { shadow: null, edge: false, line: GDK, lw: 1.6 });
      for (let k = 0; k < 4; k++)
        carveLine(g, -8, -52 + k * 34, 8, -46 + k * 34, 2.6, MHI);
      return;
    }
    // 渔鼓：纸白鼓身 + 金箍 + 鼓面刻纹，旁挂两支简板
    paper(g, [[-32, -88], [32, -88], [32, 88], [-32, 88]], PAPER,
      { line: INK, lw: 3 });
    for (const y of [-80, 72])
      paper(g, [[-36, y], [36, y], [36, y + 14], [-36, y + 14]], GOLD,
        { shadow: null, edge: false, line: GDK, lw: 1.6 });
    carveMoon(g, 0, -30, 20, MDK, 5, 0.3);
    carveSaw(g, -22, 20, 22, 20, 5, MDK, 8);
    for (const s of [-1, 1]) {
      const x = s * 48;
      paper(g, [[x - 6, -64], [x + 6, -64], [x + 6, 62], [x - 6, 62]], MDK,
        { line: INK, lw: 2 });
      dot(g, x, 62, 5, GOLD, INK, 1.2);
    }
  }

  // ============================================================ 四、头部 / 头饰 / 须发
  function head(g, t, a, blink, ghost) {
    const C = a.col, MAIN = C.main, MDK = C.mainDk, MHI = C.mainHi;
    const hair = ghost ? 'rgba(51,32,26,.86)' : INK;
    const face = ghost ? PAPER : SKIN;
    // 发块
    paper(g, jag([[-70, 272], [-78, 216], [-44, 182], [16, 178], [66, 202],
                  [76, 252], [62, 290], [30, 266], [-30, 268]], 9, 31, 3),
      hair, { line: hair, lw: 1.6 });
    // 脸：硬边折线，保留剪刀味
    paper(g, [[-52, 258], [46, 252], [66, 282], [62, 326], [70, 344],
              [58, 392], [20, 414], [-24, 410], [-54, 380], [-60, 320]],
      face, { line: hair, lw: 3.2 });
    // 眉眼（镂空眼白 + 墨瞳）
    for (const s of [-1, 1]) {
      paper(g, jag([[s * 12, 296], [s * 52, 286], [s * 60, 302], [s * 16, 310]], 3, 33 + s, 2),
        hair, { shadow: null, edge: false });
      const ey = 324 - blink * 9;
      paper(g, [[s * 14, ey - 8], [s * 54, ey - 10], [s * 58, ey], [s * 16, ey + 9]],
        PAPER, { shadow: null, edge: false, line: hair, lw: 2.4 });
      if (blink < 0.6) dot(g, s * 36, ey - 1, 6, hair);
    }
    carveLine(g, 4, 326, -4, 356, 3, GDK);
    // 须发
    if (a.beard === 'luosai') {
      paper(g, jag([[-58, 350], [-48, 396], [-14, 432], [24, 436], [58, 398],
                    [62, 350], [36, 368], [4, 376], [-28, 366]], 9, 37, 3),
        hair, { shadow: 'rgba(74,42,26,.14)', dx: 4, dy: 5 });
      for (let k = 0; k < 3; k++)
        carveLine(g, -30 + k * 24, 388, -20 + k * 22, 424, 3, 'rgba(248,238,216,.42)');
    } else if (a.beard === 'wuliu' || a.beard === 'baixu') {
      const col = a.beard === 'baixu' ? PAPER : hair;
      for (let k = -2; k <= 2; k++) {
        const x = k * 17, len = 96 - Math.abs(k) * 18;
        paper(g, jag([[x - 8, 380], [x + 8, 380], [x + 5 + Math.sin(t + k) * 4, 380 + len],
                      [x - 5, 380 + len]], 4, 41 + k, 2), col,
          { shadow: null, edge: false, line: a.beard === 'baixu' ? INK : null,
            lw: a.beard === 'baixu' ? 2 : 0 });
      }
    } else if (a.beard === 'duanxu') {
      paper(g, jag([[-26, 372], [26, 372], [18, 410], [-18, 410]], 5, 43, 2), hair,
        { shadow: null, edge: false });
    } else {
      dot(g, 0, 372, 4.2, C.lip);
    }
    // 头饰
    if (a.gear === 'yaji') {
      for (const s of [-1, 1]) {
        paper(g, jag([[s * 24, 206], [s * 38, 158], [s * 70, 166], [s * 66, 210]], 6, 47 + s, 2),
          hair, { line: hair, lw: 1.4 });
        dot(g, s * 50, 182, 7, GOLD, INK, 1.4);
      }
      paper(g, jag([[-66, 244], [54, 238], [60, 262], [-62, 268]], 4, 53, 2), MAIN,
        { shadow: null, edge: false, line: MDK, lw: 1.8 });
      carveSaw(g, -50, 254, 44, 250, 8, PAPER, 7);
    } else if (a.gear === 'daoguan') {
      paper(g, [[-48, 158], [48, 158], [40, 226], [-40, 226]], MDK,
        { line: INK, lw: 2.8 });
      carveSaw(g, -34, 180, 34, 180, 5, PAPER, 8);
      paper(g, [[-66, 188], [66, 188], [66, 200], [-66, 200]], GOLD,
        { shadow: null, edge: false, line: GDK, lw: 1.6 });
      dot(g, 0, 172, 7, PAPER, MDK, 1.6);
    } else if (a.gear === 'shuanghuan') {
      for (const s of [-1, 1]) {
        paper(g, jag([[s * 56, 230], [s * 92, 202], [s * 104, 244], [s * 76, 272]], 6, 57 + s, 2),
          hair, { line: hair, lw: 1.4 });
        cutFlower(g, s * 84, 214, 13, C, t * 0.2 * s, 6, MHI, GOLD);
      }
      dot(g, 0, 246, 6, C.lip);
    } else if (a.gear === 'guanmao') {
      paper(g, [[-58, 162], [58, 162], [52, 216], [-52, 216]], INK,
        { line: GDK, lw: 2 });
      for (const s of [-1, 1])
        paper(g, [[s * 52, 180], [s * 148, 172], [s * 148, 196], [s * 52, 204]], INK,
          { line: GDK, lw: 1.8 });
      paper(g, [[-30, 174], [30, 174], [30, 190], [-30, 190]], GOLD,
        { shadow: null, edge: false, line: GDK, lw: 1.4 });
    } else if (a.gear === 'luanfa') {
      for (let k = 0; k < 7; k++) {
        const x = -72 + k * 24;
        paper(g, jag([[x, 216], [x - 8, 176 - (k % 3) * 14], [x + 16, 210]], 5, 61 + k, 2),
          hair, { shadow: null, edge: false });
      }
      paper(g, jag([[-62, 246], [50, 240], [56, 262], [-58, 268]], 4, 67, 2), MAIN,
        { shadow: null, edge: false, line: MDK, lw: 1.6 });
    } else if (a.gear === 'rujin') {
      paper(g, [[-52, 170], [52, 170], [44, 222], [-44, 222]], MDK,
        { line: INK, lw: 2.6 });
      paper(g, jag([[-52, 170], [-26, 142], [26, 142], [52, 170]], 5, 71, 2), MDK,
        { line: INK, lw: 2.2 });
      carveSaw(g, -34, 192, 34, 192, 5, PAPER, 7);
      dot(g, 0, 156, 6, GOLD, INK, 1.2);
    } else if (a.gear === 'laosou') {
      paper(g, jag([[-66, 204], [-42, 154], [42, 154], [66, 204], [46, 226], [-46, 226]], 7, 73, 2),
        IND, { line: INK, lw: 2.6 });
      carveSaw(g, -40, 186, 40, 186, 7, PAPER, 8);
      paper(g, [[-72, 206], [72, 206], [72, 220], [-72, 220]], GDK,
        { shadow: null, edge: false, line: INK, lw: 1.8 });
    }
  }

  // ============================================================ 五、袍身 / 腿 / 袖
  function legs(g, t, a, K, ghost) {
    const C = a.col, MAIN = ghost ? PAPER : C.main, MDK = ghost ? GDK : C.mainDk;
    if (K.sit) {
      paper(g, jag([[-186, 872], [-140, 846], [140, 846], [186, 872], [186, 936],
                    [140, 962], [-140, 962], [-186, 936]], 7, 79, 2), GOLD,
        { line: INK, lw: 2.8 });
      carveSaw(g, -150, 906, 150, 906, 14, PAPER, 10);
      paper(g, [[-120, 836], [26, 826], [64, 878], [-96, 892]], MDK,
        { line: INK, lw: 2.4 });
      paper(g, [[-26, 826], [124, 838], [96, 892], [-60, 878]], MAIN,
        { line: INK, lw: 2.4 });
      dot(g, 0, 858, 7, GOLD, INK, 1.6);
      return;
    }
    paper(g, [[-78, 796], [-14, 796], [-10, 962], [-86, 962]], MDK,
      { line: INK, lw: 2.4 });
    paper(g, [[14, 796], [78, 796], [86, 962], [10, 962]], MAIN,
      { line: INK, lw: 2.4 });
    for (const s of [-1, 1])
      paper(g, jag([[s * 10, 958], [s * 96, 958], [s * 104, 986], [s * -2, 986]], 4, 83 + s, 2),
        GDK, { line: INK, lw: 2.2 });
    // 蓝采和一脚跛：右脚悬空一小截，剪影辨识度
    if (a.robe === 'lanshan') {
      paper(g, [[52, 946], [98, 946], [104, 976], [48, 976]], PAPER,
        { line: INK, lw: 2.2 });
    }
  }

  function robe(g, t, a, K, ghost) {
    const C = a.col, MAIN = ghost ? PAPER : C.main, MDK = ghost ? GDK : C.mainDk;
    const MHI = ghost ? PAPER : C.mainHi, w = a.wide;
    // 领口飘带（先画，压在袍后）
    for (const s of [-1, 1]) {
      const sw = Math.sin(t * 1.15 + s) * 8;
      paper(g, jag([[s * 90, 470], [s * (140 + sw), 566], [s * 166, 690],
                    [s * (136 + sw), 826], [s * 188, 946]], 5, 89 + s, 2),
        s < 0 ? IND : GOLD, { shadow: 'rgba(74,42,26,.16)', dx: 5, dy: 6, line: GDK, lw: 1.8 });
    }
    const pts = [[-104 * w, 446], [-150 * w, 500], [-164 * w, 620], [-148 * w, 780],
                 [-166 * w, 852], [-88 * w, 866], [96 * w, 858], [142 * w, 790],
                 [132 * w, 616], [112 * w, 486], [58 * w, 436], [-40 * w, 430]];
    paper(g, jag(pts, 9, 97, 3), MAIN, { line: INK, lw: 3.2 });
    carveSaw(g, -136 * w, 842, 118 * w, 842, 13, PAPER, 12);
    // 交叉襟
    paper(g, [[-52, 436], [4, 500], [-30, 566], [-78, 470]], PAPER,
      { shadow: null, edge: false, line: INK, lw: 2.4 });
    paper(g, [[52, 430], [-4, 500], [34, 566], [82, 466]], MDK,
      { shadow: null, edge: false, line: INK, lw: 2.4 });
    // 各人袍身母题
    if (a.robe === 'belly') {
      // 袒腹：钟离权的招牌剪影。首轮 92px 大圆 + 圆心点被读成鼓面 / 靶心（审片 P2），
      // 收小到 68px、去掉圆心点，改用一道腹纹弧，腰带另起一行拉开层次。
      dot(g, 0, 686, 68, SKIN, INK, 3);
      carveMoon(g, 0, 686, 29, 'rgba(162,118,44,.62)', 3.4, 0.25);
      carveMoon(g, 0, 638, 46, PAPER, 5, 0.2);
      paper(g, jag([[-96, 774], [96, 774], [96, 802], [-96, 802]], 5, 101, 2), GDK,
        { line: INK, lw: 2 });
    } else if (a.robe === 'daopao') {
      // 道袍：八卦刻纹 + 竖直衣纹
      for (let k = 0; k < 3; k++) carveMoon(g, -54 + k * 54, 664, 22, PAPER, 4.6, k * 0.4);
      for (let k = 0; k < 4; k++) carveLine(g, -90 + k * 56, 730, -84 + k * 56, 826, 4, PAPER);
    } else if (a.robe === 'skirt') {
      // 裙裾：下摆花瓣 + 胸前荷花刻纹
      for (let k = -3; k <= 3; k++)
        paper(g, jag([[k * 44 - 20, 800], [k * 44, 758], [k * 44 + 20, 800],
                      [k * 44, 848]], 5, 103 + k, 2), MHI,
          { shadow: null, edge: false, line: INK, lw: 1.8 });
      carveMoon(g, 0, 620, 40, PAPER, 5.4, 0.2);
      carveMoon(g, 0, 620, 24, PAPER, 4, 0.2);
    } else if (a.robe === 'guanpao') {
      // 官袍：玉带 + 方补子
      paper(g, [[-140 * w, 636], [132 * w, 636], [132 * w, 672], [-140 * w, 672]], GOLD,
        { line: INK, lw: 2.6 });
      for (let k = 0; k < 6; k++) dot(g, -110 + k * 44, 654, 6, PAPER, GDK, 1.4);
      paper(g, [[-46, 540], [46, 540], [46, 620], [-46, 620]], MHI,
        { line: INK, lw: 2.4 });
      carveSaw(g, -34, 558, 34, 558, 5, PAPER, 8);
      carveMoon(g, 0, 590, 18, PAPER, 4, 0.3);
    } else if (a.robe === 'lanshan') {
      // 蓝衫：三块补丁 + 参差衣摆，市井气
      for (let k = 0; k < 3; k++)
        paper(g, jag([[-110 + k * 84, 566 + k * 44], [-54 + k * 84, 556 + k * 44],
                      [-48 + k * 84, 626 + k * 44], [-112 + k * 84, 638 + k * 44]], 5, 107 + k, 2),
          k % 2 ? IND : GOLD, { shadow: null, edge: false, line: INK, lw: 2 });
      for (let k = 0; k < 5; k++)
        carveLine(g, -120 + k * 56, 760, -108 + k * 56, 840, 4, PAPER);
    } else if (a.robe === 'qingshan') {
      // 青衫：细竖纹 + 腰间一束
      for (let k = 0; k < 5; k++)
        carveLine(g, -100 + k * 48, 590, -96 + k * 48, 820, 3.6, PAPER);
      paper(g, [[-120, 700], [120, 700], [120, 726], [-120, 726]], MDK,
        { line: INK, lw: 2.2 });
    } else {
      // 老叟袍：佝偻背 + 折纸纹
      carveMoon(g, 0, 600, 66, PAPER, 6, 0.25);
      for (let k = 0; k < 4; k++)
        carveLine(g, -108 + k * 62, 700, -96 + k * 62, 838, 4, PAPER);
    }
    // 袖与手：角度由 pose 驱动
    g.save(); g.translate(-118, 486); g.rotate(K.armL); g.translate(118, -486);
    paper(g, jag([[-112, 456], [-176, 500], [-206, 596], [-168, 626], [-116, 570]], 8, 109, 3),
      MAIN, { line: INK, lw: 2.8 });
    paper(g, [[-196, 596], [-160, 588], [-148, 620], [-184, 632]], SKIN,
      { shadow: null, edge: false, line: INK, lw: 2.2 });
    g.restore();
    g.save(); g.translate(116, 482); g.rotate(K.armR); g.translate(-116, -482);
    paper(g, jag([[110, 452], [172, 490], [202, 588], [166, 620], [112, 566]], 8, 113, 3),
      MAIN, { line: INK, lw: 2.8 });
    paper(g, [[168, 588], [204, 580], [216, 612], [178, 626]], SKIN,
      { shadow: null, edge: false, line: INK, lw: 2.2 });
    g.restore();
    // 铆钉铰接：肩 / 肘 / 膝
    for (const [x, y] of [[-112, 470], [112, 466], [-190, 596], [190, 590], [-48, 824], [58, 820]])
      dot(g, x, y, 6.5, GOLD, INK, 1.6);
  }

  // ============================================================ 六、主入口
  function drawFigure(c, t, opt = {}) {
    const key = window.SERIES_KEY, a = A[key];
    if (!a) return;
    const K = Object.assign({}, POSES[opt.pose] || POSES.stand,
      opt.tilt !== undefined ? { tilt: opt.tilt } : {},
      opt.lift !== undefined ? { lift: opt.lift } : {},
      opt.dx !== undefined ? { dx: opt.dx } : {},
      opt.alpha !== undefined ? { alpha: opt.alpha } : {});
    const AL = K.alpha;
    if (AL <= 0.001) return;
    const st = step(t, 12);
    const flutter = Math.sin(st * 7.1) * 2.2;
    const blink = ((st * 2.4) % 1) < 0.09 ? 1 : 0;
    const ghost = !!opt.ghost;

    c.save();
    c.globalAlpha = AL;
    c.translate(CX + K.dx + flutter, K.lift);
    c.translate(0, 720); c.rotate(K.tilt); c.scale(K.scale, K.scale); c.translate(0, -720);

    legs(c, t, a, K, ghost);
    robe(c, t, a, K, ghost);
    // 法宝：贴在 propSide 的手上，随 pose 转动
    const px = a.propSide * 206, py = 604;
    c.save(); c.translate(px, py); c.rotate(K.prop);
    c.scale(0.86, 0.86);
    propShape(c, t, a);
    c.restore();
    head(c, t, a, blink, ghost);

    if (ghost) {
      c.save(); c.globalAlpha = AL * 0.8;
      for (let k = 0; k < 12; k++) {
        const ang = k / 12 * TAU + t * 0.35;
        dot(c, Math.cos(ang) * 150, 500 + Math.sin(ang) * 280, 5, PAPER, GDK, 1.2);
      }
      c.restore();
    }
    c.restore();
  }

  // ============================================================ 七、前景纸片母题
  // 全部在 bx_tight.js 的 clipBox + camera 之内画，函数内部不再裁。
  function ridge(c, t, u) {
    for (let k = 0; k < 2; k++) {
      const yy = 890 + k * 44;
      paper(c, jag([[BOX.x0 + 24, 986], [BOX.x0 + 110, yy - 62], [CX - 180, yy - 42],
                    [CX + 40, yy - 66], [CX + 250, yy - 38], [BOX.x1 - 90, yy - 70],
                    [BOX.x1 - 24, 986]], 11, 127 + k, 3),
        k ? JADE : IND, { line: INK, lw: 2.8 });
      for (let j = 0; j < 6; j++)
        carveLine(c, BOX.x0 + 150 + j * 130, yy + 8, BOX.x0 + 190 + j * 130, yy - 26, 3.4, PAPER);
    }
  }

  function cloudBand(c, t, u) {
    for (let k = 0; k < 4; k++) {
      const x = BOX.x0 + 100 + pmod(k * 240 + t * 26, BOX.x1 - BOX.x0 - 200);
      const y = 190 + k * 58 + Math.sin(t * 0.8 + k) * 8;
      paper(c, jag([[x - 70, y + 22], [x - 44, y - 12], [x + 6, y - 22],
                    [x + 58, y], [x + 76, y + 24], [x - 20, y + 32]], 6, 131 + k, 2),
        PAPER, { shadow: 'rgba(74,42,26,.10)', dx: 4, dy: 5, line: GDK, lw: 1.8 });
    }
  }

  function waves(c, t, u, layers) {
    const L = layers === undefined ? 3 : layers;
    for (let k = 0; k < L; k++) {
      const y = 872 + k * 40;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const x = BOX.x0 + 20 + i * (BOX.x1 - BOX.x0 - 40) / 12;
        pts.push([x, y + (i % 2 ? -16 : 6) + Math.sin(t * 1.6 + i + k) * 5]);
      }
      pts.push([BOX.x1 - 20, 1010], [BOX.x0 + 20, 1010]);
      paper(c, jag(pts, 5, 137 + k, 2), k === 1 ? JADE : IND,
        { shadow: 'rgba(74,42,26,.14)', dx: 4, dy: 6, line: INK, lw: 2.2 });
    }
  }

  function petals(c, t, u, n, colA, colB) {
    const st = step(t, 12), r = rng(149);
    for (let i = 0; i < (n || 22); i++) {
      const x = BOX.x0 + 40 + r() * (BOX.x1 - BOX.x0 - 80);
      const y = BOX.y0 + 30 + pmod(r() * 900 - st * (22 + (i % 4) * 12), BOX.y1 - BOX.y0 - 60);
      const s = 6 + (i % 3) * 3;
      c.save(); c.translate(x, y); c.rotate(st * 1.2 + i);
      paper(c, jag([[-s, -s], [s, -s * 0.6], [s * 0.8, s], [-s * 0.6, s * 0.8]], 3, 151 + i, 1),
        i % 2 ? colA : colB, { shadow: null, edge: false, line: INK, lw: 1.2 });
      c.restore();
    }
  }

  function steam(c, t, u) {
    // 黄粱炊烟 / 云母蒸汽：纸白线必须配深金描边，浅底上才读得出
    for (let k = 0; k < 4; k++) {
      c.beginPath(); c.moveTo(CX - 180 + k * 46, 872);
      c.bezierCurveTo(CX - 210 + k * 50, 800 - Math.sin(t * 1.2 + k) * 14,
                      CX - 150 + k * 48, 740, CX - 186 + k * 52, 672);
      c.strokeStyle = k % 2 ? GDK : GOLD; c.lineWidth = 4.4; c.lineCap = 'round'; c.stroke();
    }
    paper(c, jag([[CX - 290, 872], [CX - 90, 872], [CX - 110, 922], [CX - 270, 922]], 6, 157, 2),
      GDK, { line: INK, lw: 2.6 });
    carveSaw(c, CX - 260, 898, CX - 120, 898, 8, PAPER, 9);
  }

  function arch(c, t, u, label, col) {
    // 山门 / 宫门 / 酒楼檐：横檐 + 双柱，绝不压脸（人物头在 y<440）
    paper(c, jag([[BOX.x0 + 46, 178], [BOX.x0 + 82, 142], [CX, 118],
                  [BOX.x1 - 82, 142], [BOX.x1 - 46, 178]], 8, 163, 3), col || GDK,
      { line: INK, lw: 3 });
    paper(c, [[BOX.x0 + 74, 178], [BOX.x1 - 74, 178], [BOX.x1 - 74, 200], [BOX.x0 + 74, 200]],
      GOLD, { line: INK, lw: 2.2 });
    carveSaw(c, BOX.x0 + 110, 190, BOX.x1 - 110, 190, 16, PAPER, 9);
    for (const s of [-1, 1]) {
      const x = CX + s * 262;
      paper(c, [[x - 24, 200], [x + 24, 200], [x + 24, 420], [x - 24, 420]], col || GDK,
        { shadow: 'rgba(74,42,26,.12)', dx: 4, dy: 5, line: INK, lw: 2.2 });
      carveSaw(c, x - 16, 300, x + 16, 300, 3, PAPER, 8);
    }
    if (label) S.plaque(c, label, BOX.x0 + 116, 226);
  }

  function lanterns(c, t, u) {
    for (let k = 0; k < 4; k++) {
      const x = BOX.x0 + 92 + k * 226, y = 236 + (k % 2) * 26 + Math.sin(t * 1.1 + k) * 6;
      paper(c, [[x - 4, 148], [x + 4, 148], [x + 4, y - 24], [x - 4, y - 24]], INK,
        { shadow: null, edge: false });
      paper(c, jag([[x - 26, y - 24], [x + 26, y - 24], [x + 20, y + 40], [x - 20, y + 40]], 5, 167 + k, 2),
        k % 2 ? C_MAIN() : GOLD, { line: INK, lw: 2.4 });
      carveMoon(c, x, y + 4, 14, PAPER, 4, 0.3);
    }
  }
  // 灯笼取当前片专色，避免七支片都用同一团朱红
  function C_MAIN() { const a = A[window.SERIES_KEY]; return a ? a.col.main : '#c33b2a'; }

  function snowFall(c, t, u) {
    const st = step(t, 12), r = rng(173);
    for (let i = 0; i < 30; i++) {
      const x = BOX.x0 + 30 + r() * (BOX.x1 - BOX.x0 - 60);
      const y = BOX.y0 + 20 + pmod(r() * 1000 - st * (30 + (i % 4) * 14), BOX.y1 - BOX.y0 - 40);
      dot(c, x + Math.sin(t + i) * 6, y, 3 + (i % 3), PAPER, GDK, 1);
    }
    paper(c, jag([[BOX.x0 + 26, 958], [BOX.x1 - 26, 958], [BOX.x1 - 26, 1000], [BOX.x0 + 26, 1000]], 9, 179, 3),
      PAPER, { line: INK, lw: 2.6 });
    carveSaw(c, BOX.x0 + 60, 976, BOX.x1 - 60, 976, 18, GDK, 9);
  }

  function blossom(c, t, u) {
    // 顷刻开花：三朵团花 + 花瓣雨，不画人脸不画仙术光
    for (let k = 0; k < 3; k++) {
      const x = CX - 260 + k * 260, y = 690 + (k % 2) * 40;
      cutFlower(c, x, y, 40 + 8 * u, A[window.SERIES_KEY].col, t * 0.2 + k, 8,
        A[window.SERIES_KEY].col.mainHi, GOLD);
      paper(c, [[x - 5, y], [x + 5, y], [x + 5, 962], [x - 5, 962]], JADE,
        { line: INK, lw: 2 });
    }
    petals(c, t, u, 18, A[window.SERIES_KEY].col.mainHi, GOLD);
  }

  function paperDonkey(c, t, u, x, y, s) {
    // 纸驴：一张折纸，四条腿 + 长耳 + 尾，折叠感用锯齿剪口表现
    c.save(); c.translate(x, y); c.scale(s, s);
    paper(c, jag([[-108, 0], [-78, -46], [46, -50], [96, -16], [86, 34],
                  [-70, 38]], 7, 181, 3), PAPER, { line: INK, lw: 3 });
    paper(c, jag([[62, -40], [96, -92], [136, -84], [116, -28]], 6, 183, 2), PAPER,
      { line: INK, lw: 2.6 });
    for (const k of [-1, 1])
      paper(c, jag([[118 + k * 16, -86], [128 + k * 20, -136], [140 + k * 14, -86]], 4, 187 + k, 2),
        PAPER, { line: INK, lw: 2.2 });
    for (let k = 0; k < 4; k++) {
      const lx = -78 + k * 58;
      paper(c, [[lx - 9, 30], [lx + 9, 30], [lx + 6, 104], [lx - 6, 104]], GDK,
        { line: INK, lw: 2 });
    }
    paper(c, jag([[-108, -6], [-148, -30], [-138, 8]], 5, 191, 2), GDK,
      { line: INK, lw: 2 });
    dot(c, 108, -56, 5, INK);
    carveSaw(c, -60, -8, 46, -10, 6, PAPER, 8);
    c.restore();
  }

  function propBig(c, t, u, x, y, s, ang) {
    const a = A[window.SERIES_KEY];
    if (!a) return;
    c.save(); c.translate(x, y); c.rotate(ang === undefined ? Math.sin(t * 0.8) * 0.08 : ang);
    c.scale(s, s); propShape(c, t, a); c.restore();
  }

  function clappers(c, t, u, x, y, s) {
    // 蓝采和拍板：两片小木板，敲出节拍
    c.save(); c.translate(x, y); c.scale(s, s); c.rotate(Math.sin(t * 3.2) * 0.12);
    for (const k of [-1, 1])
      paper(c, [[k * 12 - 9, -60], [k * 12 + 9, -60], [k * 12 + 9, 60], [k * 12 - 9, 60]],
        GDK, { line: INK, lw: 2.2 });
    carveSaw(c, -20, -34, 20, -34, 3, GOLD, 7);
    c.restore();
  }

  function boat(c, t, u) {
    const bx = CX + lerp(170, 36, clamp(u));
    paper(c, jag([[bx - 150, 906], [bx + 150, 906], [bx + 106, 962], [bx - 108, 962]], 7, 193, 2),
      GDK, { line: INK, lw: 2.8 });
    carveSaw(c, bx - 118, 932, bx + 118, 932, 12, PAPER, 9);
    paper(c, [[bx - 4, 906], [bx + 4, 906], [bx + 4, 762], [bx - 4, 762]], INK,
      { shadow: null, edge: false });
    paper(c, jag([[bx + 4, 768], [bx + 92, 792], [bx + 4, 856]], 6, 197, 2), PAPER,
      { line: INK, lw: 2.2 });
  }

  // ============================================================ 八、每片八幕专属前景
  const P = (fn) => fn;
  const FORES = {
    zhongli_v2: {
      1: (c, t, u) => { arch(c, t, u, '边关', IND); ridge(c, t, u); },
      2: (c, t, u) => { arch(c, t, u, '终南', JADE); cloudBand(c, t, u); },
      3: (c, t, u) => { propBig(c, t, u, CX + 262, 560, 1.15, -0.2); cloudBand(c, t, u); },
      4: (c, t, u) => { ridge(c, t, u); S.plaque(c, '袒腹', BOX.x1 - 118, 226); },
      5: (c, t, u) => { steam(c, t, u); propBig(c, t, u, CX + 270, 430, 0.86, 0.24); },
      6: (c, t, u) => { steam(c, t, u); petals(c, t, u, 20, GOLD, PAPER); },
      7: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX - 276, 620, 0.72, 0.1); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
    lvzu_v2: {
      1: (c, t, u) => { arch(c, t, u, '长安', IND); ridge(c, t, u); },
      2: (c, t, u) => { steam(c, t, u); cloudBand(c, t, u); },
      3: (c, t, u) => { steam(c, t, u); petals(c, t, u, 16, PAPER, GOLD); },
      4: (c, t, u) => { ridge(c, t, u); propBig(c, t, u, CX + 268, 540, 0.92, -0.16); },
      5: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX - 268, 520, 1.05, 0.3); },
      6: (c, t, u) => { lanterns(c, t, u); petals(c, t, u, 18, GOLD, IND); },
      7: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX - 270, 640, 0.70, 0.08); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
    hexiangu_v2: {
      1: (c, t, u) => { waves(c, t, u, 1); ridge(c, t, u); S.plaque(c, '云母溪', BOX.x0 + 116, 226); },
      2: (c, t, u) => { waves(c, t, u, 2); cloudBand(c, t, u); },
      3: (c, t, u) => { steam(c, t, u); petals(c, t, u, 20, PAPER, GOLD); },
      4: (c, t, u) => { waves(c, t, u, 1); cutFlower(c, CX - 320, 760, 30, B.PAL.hexiangu, t * 0.2, 7,
                       B.PAL.hexiangu.mainHi, GOLD); cutFlower(c, CX + 320, 760, 30, B.PAL.hexiangu, -t * 0.2, 7,
                       B.PAL.hexiangu.mainHi, GOLD); },
      5: (c, t, u) => { blossom(c, t, u); },
      6: (c, t, u) => { ridge(c, t, u); propBig(c, t, u, CX + 272, 560, 0.88, -0.12); },
      7: (c, t, u) => { waves(c, t, u, 1); propBig(c, t, u, CX - 274, 630, 0.70, 0.1); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
    caoguojiu_v2: {
      1: (c, t, u) => { arch(c, t, u, '京城', IND); ridge(c, t, u); },
      2: (c, t, u) => { arch(c, t, u, '曹府', GDK); petals(c, t, u, 14, PAPER, GOLD); },
      3: (c, t, u) => { steam(c, t, u); propBig(c, t, u, CX + 274, 520, 0.86, 0.16); },
      4: (c, t, u) => { ridge(c, t, u); S.plaque(c, '橘袍', BOX.x1 - 118, 226); },
      5: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX - 268, 540, 1.0, -0.1); },
      6: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX + 266, 470, 1.08, 0.26); },
      7: (c, t, u) => { ridge(c, t, u); propBig(c, t, u, CX - 270, 630, 0.70, 0.08); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
    lancaihe_v2: {
      1: (c, t, u) => { arch(c, t, u, '市井', IND); lanterns(c, t, u); },
      2: (c, t, u) => { clappers(c, t, u, CX + 280, 560, 1.0); lanterns(c, t, u); },
      3: (c, t, u) => { petals(c, t, u, 24, GOLD, PAPER); clappers(c, t, u, CX - 280, 600, 0.86); },
      4: (c, t, u) => { ridge(c, t, u); propBig(c, t, u, CX + 272, 570, 0.96, -0.12); },
      5: (c, t, u) => { lanterns(c, t, u); blossom(c, t, u); },
      6: (c, t, u) => { cloudBand(c, t, u); petals(c, t, u, 26, PAPER, GOLD); },
      7: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX - 270, 640, 0.70, 0.1); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
    hanxiangzi_v2: {
      1: (c, t, u) => { arch(c, t, u, '韩府', IND); ridge(c, t, u); },
      2: (c, t, u) => { cloudBand(c, t, u); propBig(c, t, u, CX + 270, 540, 0.9, -0.2); },
      3: (c, t, u) => { blossom(c, t, u); },
      4: (c, t, u) => { blossom(c, t, u); propBig(c, t, u, CX + 272, 520, 0.92, 0.1); },
      5: (c, t, u) => { snowFall(c, t, u); propBig(c, t, u, CX - 268, 500, 0.88, -0.14); },
      6: (c, t, u) => { snowFall(c, t, u); ridge(c, t, u); },
      7: (c, t, u) => { snowFall(c, t, u); propBig(c, t, u, CX - 270, 630, 0.70, 0.08); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); snowFall(c, t, u); },
    },
    zhangguolao_v2: {
      // 纸驴必须在 ridge 之后画、且抬高到 y≈800；原 y=872 会被山石带整片埋掉（审片 P1）
      1: (c, t, u) => { ridge(c, t, u); paperDonkey(c, t, u, CX + 250, 796, 0.86); },
      2: (c, t, u) => { cloudBand(c, t, u); paperDonkey(c, t, u, CX - 262, 800, 0.70); },
      3: (c, t, u) => { arch(c, t, u, '州县', IND); clappers(c, t, u, CX + 284, 570, 0.8); },
      4: (c, t, u) => { ridge(c, t, u); paperDonkey(c, t, u, CX + 262, 800, 0.86); },
      5: (c, t, u) => { arch(c, t, u, '玄宗', GDK); propBig(c, t, u, CX - 268, 540, 0.88, -0.1); },
      6: (c, t, u) => { cloudBand(c, t, u); paperDonkey(c, t, u, CX + 268, 810, 0.76); },
      7: (c, t, u) => { ridge(c, t, u); propBig(c, t, u, CX - 270, 630, 0.70, 0.08); },
      8: (c, t, u) => { waves(c, t, u, 3); boat(c, t, u); },
    },
  };

  // ============================================================ 九、对外接口
  function has(k) { return !!A[k || window.SERIES_KEY]; }

  function body(c, lt, t, n) {
    const key = window.SERIES_KEY, a = A[key], FR = FORES[key];
    if (!a || !FR) return;
    const u = clamp(lt / ACT);
    const fore = FR[n];
    const hero = (o) => drawFigure(c, t, o);
    const tilt = (k, amp) => amp * Math.sin(t * (0.7 + k * 0.06));
    const MAIN = a.col.main;

    if (n === 1) {
      // 缘起：只给场景 + 打坐剪影，中央不摆完整立像
      if (fore) fore(c, t, u);
      hero({ pose: 'sit', tilt: tilt(1, 0.008) });
      return;
    }
    if (n === 2) {
      if (fore) fore(c, t, u);
      hero({ pose: 'spirit', ghost: true, alpha: 0.86, tilt: tilt(2, 0.014) });
      return;
    }
    if (n === 3) {
      if (fore) fore(c, t, u);
      hero({ pose: 'lost', alpha: 0.46 + 0.10 * Math.sin(t * 0.9), tilt: tilt(3, -0.026) });
      return;
    }
    if (n === 4) {
      // 显影：完整立像 + 专色法宝，封面帧取自这一幕
      if (fore) fore(c, t, u);
      hero({ pose: 'stand', tilt: -0.018 + 0.016 * Math.sin(t * 0.9), lift: 4 + 6 * u });
      return;
    }
    if (n === 5) {
      hero({ pose: 'bless', tilt: 0.030 + 0.012 * Math.sin(t * 1.05) });
      if (fore) fore(c, t, u);
      return;
    }
    if (n === 6) {
      if (fore) fore(c, t, u);
      hero({ pose: 'heal', tilt: -0.062 + 0.014 * Math.sin(t * 0.8), lift: 4 });
      return;
    }
    if (n === 7) {
      hero({ pose: 'fade', tilt: tilt(7, 0.012) });
      return;
    }
    // ⑧ 从幕⑦的 0.5 连续淡出，不硬回切到 1.0；海浪 + 登舟收束
    const fade = 0.5 - 0.5 * ss(0.04, 0.90, clamp(lt / 2.6));
    if (fore) fore(c, t, u);
    hero({ pose: 'go', alpha: fade, tilt: -0.095 + 0.012 * Math.sin(t * 0.7) });
  }

  window.BX_ACTORS = { has, body, draw: drawFigure, propShape, ACTORS: A, FORES, POSES };
})();
