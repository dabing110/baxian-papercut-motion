// 八仙 · 民俗套色剪纸 —— 首支《铁拐李·借躯还魂》紧凑版 8 幕 × 3.8s = 30.4s
// 一句一幕硬契约：dur 之和 = lines_tieguali_v2.json 的 total = 30.4，t1 与幕边界严格对齐。
// 转场只用白名单 organic / crossfade / dotBloom / pageTurn（禁 ripple / radiant / lampGlow）。
// 加载顺序是隐式依赖：common 导出 window.BX → figure 消费它 → series 消费两者 → tight 消费 series。
window.SERIES_KEY = 'tieguali_v2';
window.SCENE_LIBS = ['scenes/bx_common.js', 'scenes/bx_figure.js', 'scenes/bx_series.js', 'scenes/bx_tight.js'];
window.ERAS = [
  { id: 'k1', dur: 3.8 },
  { id: 'k2', dur: 3.8, transition: { type: 'organic', dur: 0.26 } },
  { id: 'k3', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
  { id: 'k4', dur: 3.8, transition: { type: 'dotBloom', dur: 0.26 } },
  { id: 'k5', dur: 3.8, transition: { type: 'pageTurn', dur: 0.26 } },
  { id: 'k6', dur: 3.8, transition: { type: 'organic', dur: 0.26 } },
  { id: 'k7', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
  { id: 'k8', dur: 3.8, transition: { type: 'crossfade', dur: 0.26 } },
];
