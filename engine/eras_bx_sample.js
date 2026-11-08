// 八仙 · 民俗套色剪纸 —— 三幕静帧样张（15s，不是成片，只用于钉风格）
// 加载顺序是隐式依赖：common 导出 window.BX → figure 消费它 → sample 消费两者。
window.SERIES_KEY = 'bx_sample';
window.SCENE_LIBS = ['scenes/bx_common.js', 'scenes/bx_figure.js', 'scenes/bx_sample.js'];
window.ERAS = [
  { id: 's1', dur: 5.0 },
  { id: 's2', dur: 5.0, transition: { type: 'organic',   dur: 0.40 } },
  { id: 's3', dur: 5.0, transition: { type: 'crossfade', dur: 0.40 } },
];
