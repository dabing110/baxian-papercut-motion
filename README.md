# baxian-papercut-motion · 八仙民俗套色剪纸动画流水线

用**代码**画中国民俗套色剪纸，批量生产《八仙人物》系列动画的完整开源工程：确定性帧引擎 + 8 支人物片 + 1 部收口片 + 逐帧渲染 + TTS 配音烧字幕 + 活气 QA + 发布门禁，全部本地完成，不依赖任何云服务或 AI 绘画服务。

```
铁拐李 · 借躯还魂    汉钟离 · 黄粱一扇    吕洞宾 · 黄粱一梦    何仙姑 · 云母溪荷
曹国舅 · 弃爵玉板    蓝采和 · 市井踏歌    韩湘子 · 雪拥蓝关    张果老 · 倒骑纸驴
                        蓬莱 · 各显神通（收口片）
```

## 这是什么

| 层 | 内容 | 说明 |
|---|---|---|
| 引擎 | `engine/engine.js` + `engine/eras_*.js` ×10 + `engine/scenes/*.js` ×8 | 确定性帧引擎（同一时刻 t 必得同一帧，可复现、可回归）；剪纸公共层 `bx_common.js`、铁拐李纸片分件铰接 rig `bx_figure.js`、共享模板 `bx_series.js`、8 幕紧凑引擎 `bx_tight.js`、第二批七人层 `bx_actors.js`、收口片 `bx_finale.js` |
| 流水线 | 仓库根目录 8 个 `_*.py` | 配置生成器、分段渲染、拼接合成、活气 QA、静帧审片抽帧、批量收口、全系列终检 |
| 配音 / 发布 | `voice/` | 9 份台词轴 `lines_*.json`、`build_voice_remake.py`（edge-tts + ASS 字幕）、`ambience.py`（8 种环境音）、`prepare_channels_remake.py`（视频号四件套）、发布元数据 |
| 方法 | `docs/` | 十二节方法论 + 第 37 张风格卡：版本辨析、剪纸语法、零回归扩展、十七条红线、9 部验收数据 |

**独立工程**：外部依赖只有 Python + Playwright（Chromium）+ ffmpeg + edge-tts + Node（可选，仅用于语法检查）。

风格依据：1988 年上海美术电影制片厂《八仙与跳蚤》的**形式机制**（民间单色剪纸、昆曲身段、一人一代表色、纸片平涂、关节铰接、舞台式横移），只学工序与运动语法，**不复刻任何具体造型**。视觉语言实现为「剪 → 刻 → 贴 → 揭」四个渲染器：`jag()` 锯齿剪口、`carve*()` 窗纸色镂空、`paper()` 偏移暗影 + 平涂 + 纸白毛边、`curtainScreen()` 揭窗纸；亮窗纸 + 朱红纸片 + 一人一专色 + 12fps 纸屑步进。

## 系列结构

- **人物片 8 支**：铁拐李（首支）+ 汉钟离 / 吕洞宾 / 何仙姑 / 曹国舅 / 蓝采和 / 韩湘子 / 张果老（第二批 7 支）。统一 **8 幕 × 3.8s = 30.4s** 紧凑版：8 句旁白一句一幕，镜头逐幕推近，⑤⑥ 幕给法宝与内心特写。
- **收口片《蓬莱·各显神通》**：不画单人立像，让八张一人一专色的剪纸纸片逐幕「贴」上窗纸，末尾八宝同框、朱红钤印，一次收束整个系列。八人群像靠「剪影 + 头饰 + 法宝 + 专色」四件套区分。
- 全系列 9 部均为 1920×1080 / 60fps / 30.4s，配音 `zh-CN-XiaoxiaoNeural`、`--sub-style clear`、环境音按人分为 `paper / palace / tea / garden / city / snow / warm / sea`。

### 三条链路（SCENE_LIBS 顺序是隐式依赖，不可换）

```
首支       common → figure → series → tight                 场景 id k1..k8
第二批     common → figure → series → actors → tight        场景 id k1..k8
收口片     common → figure → finale                          场景 id f1..f8（完全隔离）
```

第二批采用**零回归扩展**：`bx_actors.js` 用 `Object.assign(S.FILMS, CFG)` 挂 7 条配置，`bx_tight.js` 的 `body()` 顶部只加一个 `has()/body()` 分派钩子；共享层色板写 `cfg().pal || P`（`curPal()`），首支没有 `pal` 字段 → 回落到原色板，默认分支逐字节等价。改共享层之前先渲首支 8 帧留基线，接入后重渲并逐像素比对，8 帧全等，首支成片无需重做。

## 快速开始

### 1. 环境

```bash
pip install playwright pillow numpy edge-tts
python -m playwright install chromium
# ffmpeg 加入 PATH，或：export FFMPEG_BIN=/path/to/ffmpeg
# 封面字体可用 FONT_BOLD / FONT_KAI 覆盖（默认 Windows 系统字体）
```

### 2. 本地看片（零依赖预览）

```bash
cd engine
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/index.html?film=tieguali_v2
```

`?film=<key>` 读 `eras_<key>.js`；不加参数默认看 `eras_tieguali_v2.js`。
可用 key：`tieguali_v2` `zhongli_v2` `lvzu_v2` `hexiangu_v2` `caoguojiu_v2`
`lancaihe_v2` `hanxiangzi_v2` `zhangguolao_v2` `finale` `bx_sample`（三幕风格样张）。

### 3. 渲染 + 合成 + QA + 待发箱

```bash
# 分段渲（3 段并发，绕开 Chromium 内存累积）
python _批量渲染_紧凑版.py --keys zhongli_v2 --workers 3
# 拼接 + 配音 + 环境音 + clear 字幕烧录
python _合成_系列.py --key zhongli_v2
# 活气 QA（幕内 <0.10% 死帧、>32% 跳变）
python _qa_系列.py --key zhongli_v2
# 视频号四件套：成片副本 + 1080×1440 封面 + 发布文案 + manifest
python voice/prepare_channels_remake.py --key zhongli_v2 --force
```

也可一条龙：`python _批量收口_系列.py --keys zhongli_v2`。
8 幕审片抽帧与接触表：`python _审片_抽帧.py --keys finale`。

> 分段边界统一 `0 / 11.4 / 22.8 / 30.4`（8 幕 × 3.8s），人物片与收口片共用。

### 4. 新增一支人物片

```bash
python _生成_八仙配置.py          # 首支范式：eras / lines / 元数据 / 注册
python _生成_后续配置.py          # 第二批范式：零回归扩展 + 幂等注册 + 转场白名单断言
```

范式与契约见 `docs/八仙人物选题研究.md` 第十二节。生成器自带**静态契约自检**：8 句、每句 10~16 字、合计 ≥95 字、`t1` 对齐幕边界、`dur` 之和 = `total = 30.4`、转场名不得带格式化空格、`SCENE_LIBS` 顺序断言。

## 硬契约与已知坑（都踩过）

| 坑 | 解法 |
|---|---|
| 一句一幕 | `eras` 的 `dur` 之和 = `lines.total` = 30.4，`t1` 严格对齐幕边界；转场时长已嵌入 dur，不额外叠加 |
| `ss(lo,hi,x)` 是 smoothstep 阈值函数 | 返回 0..1，**不是区间插值**；要 `[a,b]` 必须 `a+(b-a)*ss(0,1,x)` |
| 屏幕空间覆盖层消失 | 帘 / 判词纸签 / 结句底必须在 camera `restore()` 之后画；裁剪只在 camera 前做一次，前景函数内部不得再 clip |
| 转场名带格式化空格 | `%-10s` 会写出 `'organic   '`，`TRANSITIONS[type]` 精确匹配失败 → 引擎拒启动；写 `'%s'` |
| 镜头推近把头推进横幅 | `z>1.16` + 负 dy + 负 lift 会让蓬头越过顶部横幅；推近感交给 dx 与前景尺度 |
| 匾额压脸 / 与横幅同词 | 匾额移到左上角，横幅文案换一个词 |
| 深色线画在深色块上 | 等于没画；镂空刻纹用窗纸色，浅底细刻线宽 ≥3.4 |
| 组合道具散架 | 葫芦要补背带与握持的手，Γ 形拐要留窗纸空隙，扁担与筐之间要有垂绳 |
| 封面抽帧带烧录字幕条 | 8 幕紧凑版字幕占满 3.3~3.6s/幕，幕间空隙不足以反推安全点；统一从元数据 `cover_video` 指向的**同源未烧字幕无声片**抽帧 |
| 浅色纸片被后画纸带埋掉 | 背景深色纸带先画、纸白主体后画，并把主体抬到纸带上沿 |
| 一人一专色 ≠ 群像可辨 | 4×2 同框必须补八顶独立头饰剪影，否则读成同一张纸片换色 |
| 末幕文字压卡片 | 结句横幅 / 匾额 / 卡片 / 钤印按 y 区间排开，末幕宁可撤匾额 |
| 显影窗口停在半透明 | 按审片帧 `lt = 秒 − 幕起点` 反算 alpha，别让关键帧停在 0.36 |
| 配置生成器重跑清空元数据 | 写盘前必须 merge 已有 `films` 条目 |
| 批量配音连续请求撞上 TTS 瞬时故障 | 连续 40+ 句后个别句子会失败并留 `line_*.wav.mp3` 残件；手工 worker 验证服务端恢复后，清残件 + 单 key 串行重试即可，**不改台词 / 不调 rate / 不重渲** |
| 活气中位 8% 目标 | 为「大面积连续运动」风格校准的软目标；纸片平涂实测 5.02~5.77%、收口片 2.249%（逐格贴纸刻意收敛），判据回到「0 死帧 + 0 跳变 + 幕内可见运动链」，不靠加噪点凑数 |

转场白名单：`organic` / `crossfade` / `dotBloom` / `pageTurn`；禁 `radiant` / `lampGlow` / `ripple`。

## 验收（全系列 9 部）

| 项 | 结果 |
|---|---|
| 分段渲染 | 9 部 × 3 段 = 27 段，0 失败 |
| 活气 QA | 每部 76 帧，**9/9 死帧 0 / 跳变 0 / PASS** |
| 待发箱 | 9/9 四件套齐、`gate.passed=true` |
| 封面 | 人物片 13.30s（k4 显影）、收口片 24.70s（f7 各显），8 张目视复核无双层文字 |

逐部数据与全部红线见 `docs/八仙人物选题研究.md` 第十二节。

## 目录

```
baxian-papercut-motion/
├── engine/                       帧引擎（起本地服务打开 index.html 即可预览）
│   ├── index.html                入口：lib 全量加载 → 读 ?film=<key> → 载 eras_<key>.js
│   ├── engine.js                 确定性帧引擎（window.renderFrame(t)）
│   ├── render.py                 逐帧渲染（Playwright → image2pipe → ffmpeg）
│   ├── transitions.js            幕间转场
│   ├── eras_*.js ×10             9 张成片段落表 + 三幕风格样张
│   ├── lib/                      16 个通用绘制库 + fonts/（45 个 woff，SIL OFL）
│   └── scenes/                   8 个八仙场景（common / figure / series / tight /
│                                actors / finale / sample / index）
├── voice/                        配音与发布
│   ├── build_voice_remake.py     edge-tts + ASS 字幕 + 环境音混轨
│   ├── ambience.py               8 种环境音预设
│   ├── prepare_channels_remake.py 视频号四件套与发布门禁
│   ├── lines_*.json ×9          台词轴（id / t0 / t1 / text，配音与字幕共源）
│   └── 发布元数据_复刻.json       9 部标题 / 描述 / 话题 / 封面帧 / 规格
├── docs/
│   ├── 八仙人物选题研究.md        十二节方法论
│   └── 风格卡_37_papercut.md     第 37 张风格卡
├── _合成_系列.py                 拼接 + 配音 + 字幕烧录
├── _qa_系列.py                   活气 QA
├── _审片_抽帧.py                 8 幕静帧审片 + 接触表
├── _批量渲染_紧凑版.py            3 段并发渲染
├── _批量收口_系列.py              合成 → QA → 四件套
├── _生成_八仙配置.py / _生成_后续配置.py   配置生成器（含静态契约自检）
├── _终检_全系列.py               9 部待发箱终检
└── README / LICENSE / NOTICE / .gitignore
```

**成片、封面、字幕、审片帧、渲染分段不在仓库内**（体积与发布用途），需本地自行渲染。`发布元数据_复刻.json` 中的 `video` / `subtitle` / `cover_video` 是渲染产物的**相对路径占位**，流水线运行后会生成对应文件。

## 与姊妹仓库的关系

本仓库与 [sanguo-ink-motion](https://github.com/dabing110/sanguo-ink-motion)（三国水墨）、[shuihu-ink-motion](https://github.com/dabing110/shuihu-ink-motion)（水浒版画）、[piying-shadow-motion](https://github.com/dabing110/piying-shadow-motion)（皮影复刻）、[honglou-nouveau-motion](https://github.com/dabing110/honglou-nouveau-motion)（红楼慕夏新艺术）**引擎底座完全同源**，均来自花叔 huashu-art-motion。差异全在内容层的美术语言与剧本：

| 仓库 | 视觉 | 片长 / 幕数 |
|---|---|---|
| 三国 | 干笔 + 平涂 + 描边水墨 | 25s / 6 幕 |
| 水浒 | 焦墨勾线 + 宣纸底 + 钤印版画 | 24.8~33.6s / 6~10 幕 |
| 皮影 | 幕布 + 皮件 + 操杆 | 19.6~30.4s / 4~6 幕 |
| 红楼 | 慕夏新艺术金彩仕女 + 敦煌重彩收口 | 30.4s / 8 幕 |
| **八仙（本仓库）** | **中国民俗套色剪纸 · 一人一专色** | **30.4s / 8 幕** |

## 许可

- 代码：MIT（版权 © 2026 dabing110），第三方归属见 `NOTICE`
- 台词、场景代码、剧本与发布文案：原创
- 八仙传说与相关民间故事：公共领域
- 字体：各开源字体沿用各自 SIL OFL 1.1（见 `engine/lib/fonts/LICENSES.md`）
- **TTS 服务条款提示**：`voice/build_voice_remake.py` 使用 edge-tts（调用微软 Edge 在线 TTS 服务），使用前请自行确认微软服务条款对你的场景可用。

## 致谢

**引擎底座来自花叔的 [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion)**（MIT © 花叔 Huashu）：`engine/engine.js`、`engine/index.html`、`engine/transitions.js` 与 `engine/lib/` 的绘画/动效库均复制自该技能的 `scripts/engine/`，`engine/render.py` 亦源自其渲染器（本仓库仅做 ffmpeg 路径参数化、秒制 `dur` 适配与目录布局调整）。

本仓库的原创部分：9 部片的剧本与台词轴、8 个八仙场景、10 张段落表、剪纸渲染器与 8 幕紧凑引擎、零回归扩展架构、配音与环境音、活气 QA、发布流水线，以及十二节方法论文档与第 37 张风格卡。

视觉语言来自对 1988 年上美影《八仙与跳蚤》剪纸片形式机制的观察，以及山西民间剪纸、木版年画与昆曲人物身段的启发；工程结构受「确定性渲染」思想影响（同 t 必同帧，QA 才能回归）。
