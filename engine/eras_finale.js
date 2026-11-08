// 八仙 · 蓬莱·各显神通·收口 —— 8 幕 × 3.8s = 30.4s
// 一句一幕硬契约：dur 之和 = lines.total = 30.4，幕边界与 t1 严格对齐。
// 收口片：不画单人立像，八色纸片逐幕贴上窗纸；SCENE_LIBS 不加载人物片的 series/actors/tight。
// 转场只用白名单 organic / crossfade / dotBloom / pageTurn（禁 ripple / radiant / lampGlow）。
window.SERIES_KEY = 'finale';
window.SCENE_LIBS = ['scenes/bx_common.js', 'scenes/bx_figure.js', 'scenes/bx_finale.js'];
window.ERAS = [
  { id: 'f1', dur: 3.8 },
  { id: 'f2', dur: 3.8, transition: { type: 'organic', dur: 0.26 } },
  { id: 'f3', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
  { id: 'f4', dur: 3.8, transition: { type: 'dotBloom', dur: 0.26 } },
  { id: 'f5', dur: 3.8, transition: { type: 'pageTurn', dur: 0.26 } },
  { id: 'f6', dur: 3.8, transition: { type: 'organic', dur: 0.26 } },
  { id: 'f7', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
  { id: 'f8', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
];
