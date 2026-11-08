#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 首支《铁拐李》紧凑版配置生成器
=========================================================================
产出三件套：
    engine/eras_tieguali_v2.js      8 幕 × 3.8s = 30.4s，转场只用白名单
    voice/lines_tieguali_v2.json       8 句旁白，一句一幕
    voice/发布元数据_复刻.json          视频号四件套元数据（封面走同源无声片）

硬契约自检：
    ① eras 的 dur 之和 = lines.total = 30.4
    ② t1 严格对齐幕边界 3.8/7.6/11.4/15.2/19.0/22.8/26.6/30.4
    ③ 每句去标点 10~16 字，全片 ≥95 字
    ④ SCENE_LIBS 四个文件全部存在，顺序是隐式依赖
用法：python _生成_八仙配置.py
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
CODE = os.path.join(ROOT, "engine")
VOICE = os.path.join(ROOT, "voice")
ACT, N, TOTAL = 3.8, 8, 30.4
KEY = "tieguali_v2"
NAME = "铁拐李·借躯还魂·紧凑版"

TRANS = ["organic", "crossfade", "dotBloom", "pageTurn",
         "organic", "crossfade", "crossfade"]

# 一句一幕故事链：修道 → 出窍 → 焚躯 → 借躯 → 点化 → 济世 → 立身 → 过海
# 留白暗写：不画焚烧、不画病痛、不画血光（余烬用纸白线，病苦用排队剪影与药碗侧写）
TEXTS = [
    "华山道士李玄，一晃清修四十年",
    "元神出窍赴约，肉身托与徒弟",
    "徒弟母病急归，六日焚了躯壳",
    "借得跛足躯壳，葫芦铁拐随身",
    "太上老君点化，赐他金丹一葫",
    "一勺葫芦仙丹，救尽人间病苦",
    "不恋仙班名位，长向市井乞行",
    "八仙过海那日，他拄拐先登舟",
]
IDS = ["k1 修道", "k2 出窍", "k3 焚躯", "k4 借躯",
       "k5 点化", "k6 济世", "k7 人物签", "k8 过海"]

LIBS = ["scenes/bx_common.js", "scenes/bx_figure.js",
        "scenes/bx_series.js", "scenes/bx_tight.js"]


def build_eras():
    lines = [
        "// 八仙 · 民俗套色剪纸 —— 首支《铁拐李·借躯还魂》紧凑版 8 幕 × 3.8s = 30.4s",
        "// 一句一幕硬契约：dur 之和 = lines_tieguali_v2.json 的 total = 30.4，t1 与幕边界严格对齐。",
        "// 转场只用白名单 organic / crossfade / dotBloom / pageTurn（禁 ripple / radiant / lampGlow）。",
        "// 加载顺序是隐式依赖：common 导出 window.BX → figure 消费它 → series 消费两者 → tight 消费 series。",
        f"window.SERIES_KEY = '{KEY}';",
        "window.SCENE_LIBS = [" + ", ".join("'" + x + "'" for x in LIBS) + "];",
        "window.ERAS = [",
    ]
    for i in range(N):
        if i == 0:
            lines.append("  { id: 'k1', dur: 3.8 },")
        else:
            # 转场名不能带对齐空格：TRANSITIONS[type] 精确匹配，尾空格会让 index.js 判定「转场未注册」而拒绝启动
            lines.append("  { id: 'k%d', dur: 3.8, transition: { type: '%s', dur: 0.26 } },"
                         % (i + 1, TRANS[i - 1]))
    lines.append("];")
    return "\n".join(lines) + "\n"


def build_lines():
    out = {
        "film": NAME,
        "note": "8 幕 30.4s 紧凑版正式配置；一句一幕硬契约（eras 的 dur 之和 = total = 30.4，t1 对齐幕边界）。"
                "故事链：修道→出窍→焚躯→借躯→点化→济世→立身→过海。全片 97 字（去标点），语速 +0%，"
                "字幕 --sub-style clear。留白暗写：不画焚烧、不画病痛、不画血光。",
        "voice": "zh-CN-XiaoxiaoNeural",
        "rate": "+0%",
        "total": TOTAL,
        "amb": "paper",
        "lines": [],
    }
    for i, txt in enumerate(TEXTS):
        out["lines"].append({
            "id": IDS[i],
            "t0": round(i * ACT, 2),
            "t1": round((i + 1) * ACT, 2),
            "lead": 0.18,
            "text": txt,
        })
    return out


def build_meta():
    film = {
        "name": NAME,
        "video": f"成片_有声/{NAME}.mp4",
        "subtitle": f"_配音_{KEY}/sub.ass",
        "amb": "paper",
        "cover_time": 13.30,
        "cover_video": f"成片/{NAME}_无声.mp4",
        "cover_note": "k4 借躯显影幕（11.4–15.2s）：铁拐李完整立像 —— 蓬头虬髯、朱红破衲、束腰葫芦、Γ 形铁拐、"
                      "跛足悬空鞋，脸部完整无遮挡，是全片最适合静态招贴的一幕。8 幕紧凑版字幕占满 3.3~3.6s/幕，"
                      "幕间空隙仅 0.2~0.5s 且叠 0.26s 转场，无法按 sub.ass 反推安全无字幕点；统一从同源"
                      "「未烧字幕无声片」抽帧，从根上避免烧录字幕与封面标题叠成双层文字。",
        "title": "剪纸动画 · 铁拐李借躯",
        "sub": "八仙人物 · 民俗套色剪纸 · 人物卷一",
        "desc": "华山道士李玄，清修四十年。元神出窍赴约前，把肉身托给徒弟看守；徒弟因母病急归，"
                "第六日焚了那具躯壳。\n\n元神归来无处可依，只得借路边跛足饿殍的身子还魂——从此蓬头虬髯、"
                "一领破衲、腰悬葫芦、手拄铁拐。太上老君点化，赐他金丹一葫；一勺仙丹倾下去，"
                "救尽市井病苦。他不恋仙班名位，长向人间乞行；八仙过海那日，是他拄拐先登了舟。\n\n"
                "《八仙人物》系列第一支：1988 上美影剪纸民俗语言的视觉致敬向导读，亮色窗纸、朱红纸片、"
                "锯齿剪口、镂空刻纹、贴片投影、分件铆钉，一人一专色，全部以几何路径全代码绘制。"
                "8 幕 30 秒，一句一幕，故事一次讲完。\n\n凶险一律留白暗写：不画焚烧、不画病痛、不画血光。"
                "本片不复刻任何具体动画造型，不主张任何影视改编形象的权利；画面、旁白与配音均为程序化生成 / AI 合成。",
        "tags": ["#八仙", "#铁拐李", "#中国剪纸", "#非遗动画", "#国风动画",
                 "#AI生成", "#动画短片", "#民间美术"],
        "spec": {"w": 1920, "h": 1080, "dur": TOTAL, "orientation": "横屏"},
    }
    return {
        "batch": "八仙 · 民俗套色剪纸人物（首支）",
        "note": "37_papercut 中国民俗套色剪纸主风格；亮色窗纸 / 朱红纸片 / 锯齿剪口 / 镂空刻纹 / "
                "贴片投影 / 分件铰接 / 12fps 纸屑步进。1920×1080 横屏内嵌中央竖幅窗纸。"
                "首支《铁拐李》为 8 幕 30.4s 紧凑版，全代码纸片 rig，无外部素材。"
                "仅代码层；成片 / 封面 / 待发箱与形象骨架文件不在仓库内。",
        "films": {KEY: film},
    }


def main():
    counts = [len(re.sub(r"[，。：、？！\s]", "", x)) for x in TEXTS]
    assert len(TEXTS) == N and all(10 <= n <= 16 for n in counts), counts
    assert sum(counts) >= 95, sum(counts)
    assert abs(N * ACT - TOTAL) < 1e-9
    for f in LIBS:
        assert os.path.exists(os.path.join(CODE, f)), f"缺口：{f}"
    eras = build_eras()
    lines = build_lines()
    meta = build_meta()
    # 红线：本生成器只负责首支。重跑时必须保留 _生成_后续配置.py 追加的其他 8 条，
    # 否则整包元数据会被打回单条，后续片的合成 / 打包会直接找不到 key。
    meta_path = os.path.join(VOICE, "发布元数据_复刻.json")
    if os.path.exists(meta_path):
        old = json.load(io.open(meta_path, encoding="utf-8"))
        for k, v in old.get("films", {}).items():
            if k != KEY:
                meta["films"][k] = v
    assert abs(sum(l["t1"] - l["t0"] for l in lines["lines"]) - TOTAL) < 1e-9
    assert all(abs(lines["lines"][i]["t1"] - (i + 1) * ACT) < 1e-9 for i in range(N))
    assert "scenes/bx_series.js" in eras and "scenes/bx_tight.js" in eras
    assert meta["films"][KEY]["name"] == lines["film"]

    os.makedirs(VOICE, exist_ok=True)
    with io.open(os.path.join(CODE, f"eras_{KEY}.js"), "w", encoding="utf-8", newline="\n") as f:
        f.write(eras)
    with io.open(os.path.join(VOICE, f"lines_{KEY}.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(lines, f, ensure_ascii=False, indent=1)
        f.write("\n")
    with io.open(os.path.join(VOICE, "发布元数据_复刻.json"), "w", encoding="utf-8", newline="\n") as f:
        json.dump(meta, f, ensure_ascii=False, indent=1)
        f.write("\n")
    print(f"字数（去标点）：{counts}  合计 {sum(counts)}")
    print(f"写入 eras_{KEY}.js / lines_{KEY}.json / 发布元数据_复刻.json")
    print(f"幕边界：{[round((i+1)*ACT,1) for i in range(N)]}  total={TOTAL}")


if __name__ == "__main__":
    main()
