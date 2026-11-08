// 八仙 · 韩湘子·雪拥蓝关·紧凑版 —— 8 幕 × 3.8s = 30.4s
// 一句一幕硬契约：dur 之和 = lines.total = 30.4，幕边界与 t1 严格对齐。
// 第二批人物片：SCENE_LIBS 顺序 common → figure → series → actors → tight（actors 必须在 series 之后、tight 之前）。
// 转场只用白名单 organic / crossfade / dotBloom / pageTurn（禁 ripple / radiant / lampGlow）。
window.SERIES_KEY = 'hanxiangzi_v2';
window.SCENE_LIBS = ['scenes/bx_common.js', 'scenes/bx_figure.js', 'scenes/bx_series.js', 'scenes/bx_actors.js', 'scenes/bx_tight.js'];
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
