#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 第二批 7 位人物片 + 收口片配置生成器
=========================================================================
沿用首支《铁拐李》的「一句一幕」硬契约：
    30.4s = 8 幕 × 3.8s；eras 的 dur 之和 = lines.total = 30.4；
    每句去标点 10~16 字、全片 ≥95 字；t1 严格对齐幕边界；rate +0%。
转场白名单 organic / crossfade / dotBloom / pageTurn。

产出：
    engine/eras_<key>.js       （人物片 k1..k8 / 收口片 f1..f8）
    voice/lines_<key>.json
    voice/发布元数据_复刻.json    （保留 tieguali_v2，追加 8 条）

零回归：首支条目 tieguali_v2 完全不写；其 eras 仍只加载 common/figure/series/tight，
第二批才在 series 与 tight 之间插入 bx_actors.js，收口片走 common/figure/finale。

用法：python _生成_后续配置.py
"""
import io
import json
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))
CODE = os.path.join(ROOT, "engine")
VOICE = os.path.join(ROOT, "voice")
ACT, N, TOTAL = 3.8, 8, 30.4
TRANS = ["organic", "crossfade", "dotBloom", "pageTurn",
         "organic", "crossfade", "crossfade"]
LIBS_PEOPLE = ['scenes/bx_common.js', 'scenes/bx_figure.js',
               'scenes/bx_series.js', 'scenes/bx_actors.js', 'scenes/bx_tight.js']
LIBS_FINALE = ['scenes/bx_common.js', 'scenes/bx_figure.js', 'scenes/bx_finale.js']
AMBS = ("sea", "paper", "water", "kitchen", "salon", "city", "rain", "snow",
        "garden", "breeze", "tea", "palace", "temple", "warm",
        "chess", "study", "loom", "night")

STYLE = ("《八仙人物》系列：1988 上美影剪纸民俗语言的视觉致敬向导读，亮窗纸、一人一专色、"
         "锯齿剪口、镂空刻纹、贴片投影、分件铆钉，全部以几何路径全代码绘制。"
         "8 幕 30 秒，一句一幕，故事一次讲完。\n\n"
         "凶险一律留白暗写：不画打斗、不画病痛、不画血光。本片不复刻任何具体动画造型，"
         "不主张任何影视改编形象的权利；画面、旁白与配音均为程序化生成 / AI 合成。")

# key -> 片名 / 8 句旁白 / 环境音 / 封面秒 / 副标题 / 发布主标 / 简介 / 标签
FILMS = {
    "zhongli_v2": dict(
        name="汉钟离·黄粱一扇·紧凑版", amb="palace", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷二", title="剪纸动画 · 汉钟离扇醒黄粱",
        texts=[
            "将门出身钟离，一仗败在边关外",
            "卸甲入终南山，石洞里独坐十年",
            "老君授他芭蕉扇，一扇风起云开",
            "袒腹踏歌出山，人间烟火先看见",
            "客栈书生贪睡，黄粱饭还没蒸熟",
            "他只把扇一摇，二十年荣枯散了",
            "书生弃了功名，随他同入终南道",
            "一把芭蕉扇子，先扇醒后来的人",
        ],
        desc="将门出身的钟离权，一仗败在边关外；卸甲入终南山，石洞里独坐十年。"
             "老君授他一把芭蕉扇，一扇风起云开。\n\n"
             "袒腹踏歌出山，先看见人间烟火；客栈里书生贪睡，黄粱饭还没蒸熟，"
             "他只把扇一摇，二十年荣枯就散了。书生弃了功名，随他同入终南道。\n\n"
             "《八仙人物》人物卷二：写那个先醒过来、再回头叫醒别人的人。"
             "双丫髻、袒腹宽袍、芭蕉扇，赭黄专色，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#汉钟离", "#中国剪纸", "#非遗动画", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "lvzu_v2": dict(
        name="吕洞宾·黄粱一梦·紧凑版", amb="tea", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷三", title="剪纸动画 · 吕洞宾一枕黄粱",
        texts=[
            "长安书生吕岩，科举榜上又无名",
            "客栈一枕黄粱，梦里做了二十年",
            "醒来饭犹未熟，功名先化成炊烟",
            "钟离扇底一笑，他弃了儒冠儒服",
            "纯阳剑出鞘时，只斩自家心上妄",
            "岳阳楼上三醉，人间事一笔带过",
            "不谈长生久视，先教人少些贪念",
            "一柄纯阳古剑，终究收进背后鞘",
        ],
        desc="长安书生吕岩，科举榜上又无名；客栈一枕黄粱，梦里做了二十年。"
             "醒来饭犹未熟，功名先化成炊烟。\n\n"
             "钟离扇底一笑，他弃了儒冠儒服；纯阳剑出鞘时，只斩自家心上妄。"
             "岳阳楼上三醉，人间事一笔带过；不谈长生久视，先教人少些贪念。\n\n"
             "《八仙人物》人物卷三：黄粱一梦之后，把剑收进鞘里的人。"
             "道冠、五绺须、石青道袍、纯阳剑，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#吕洞宾", "#黄粱一梦", "#中国剪纸", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "hexiangu_v2": dict(
        name="何仙姑·云母溪荷·紧凑版", amb="garden", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷四", title="剪纸动画 · 何仙姑云母溪荷",
        texts=[
            "云母溪边少女，日日挑水奉母亲",
            "溪上遇见异人，赠她一包云母粉",
            "服下不饥不渴，山间岁月慢慢长",
            "手里一枝荷花，开在无人过问处",
            "家里替她议亲，她只笑着摇摇头",
            "从此不嫁不老，替乡邻采药看病",
            "人说仙姑灵验，她说只是记得路",
            "一朵荷花不谢，留在云母溪水边",
        ],
        desc="云母溪边少女，日日挑水奉母亲；溪上遇见异人，赠她一包云母粉。"
             "服下不饥不渴，山间岁月慢慢长。\n\n"
             "手里一枝荷花，开在无人过问处；家里替她议亲，她只笑着摇摇头。"
             "从此不嫁不老，替乡邻采药看病；人说仙姑灵验，她说只是记得路。\n\n"
             "《八仙人物》人物卷四：八仙里唯一的女仙，写她的从容而不是神迹。"
             "双鬟、藕粉裙裾、一枝荷花，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#何仙姑", "#中国剪纸", "#非遗动画", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "caoguojiu_v2": dict(
        name="曹国舅·弃爵玉板·紧凑版", amb="palace", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷五", title="剪纸动画 · 曹国舅弃爵入山",
        texts=[
            "曹家二位国舅，一门显贵压京城",
            "幼弟仗势伤人，他赔尽家产无补",
            "朝冠搁在案上，他独自出了宫门",
            "一身橘红旧袍，走到山前才停步",
            "钟离问他来意，只说替弟赎一场",
            "玉板敲开云路，把富贵敲成回声",
            "不提旧日爵位，只认山中一席地",
            "两块阴阳玉板，拍给后来听的人",
        ],
        desc="曹家二位国舅，一门显贵压京城；幼弟仗势伤人，他赔尽家产也无补。"
             "朝冠搁在案上，他独自出了宫门。\n\n"
             "一身橘红旧袍，走到山前才停步；钟离问他来意，只说替弟赎一场。"
             "玉板敲开云路，把富贵敲成回声；不提旧日爵位，只认山中一席地。\n\n"
             "《八仙人物》人物卷五：八仙里出身最贵的一个，写他怎么把身份放下。"
             "方翅官帽、橘红官袍、阴阳玉板，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#曹国舅", "#中国剪纸", "#非遗动画", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "lancaihe_v2": dict(
        name="蓝采和·市井踏歌·紧凑版", amb="city", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷六", title="剪纸动画 · 蓝采和市井踏歌",
        texts=[
            "市井有个歌者，蓝衫一脚穿草鞋",
            "拍板敲着节拍，沿街唱些无名曲",
            "讨来的钱串起，转身散给路边人",
            "一只花篮在手，四季花都不肯谢",
            "酒楼众人笑他，他笑众人太匆忙",
            "忽有鹤声过檐，篮里花瓣先起身",
            "一脚跛着踏云，歌还没唱完半句",
            "花篮留在栏边，人间还听那拍板",
        ],
        desc="市井有个歌者，蓝衫一脚穿草鞋；拍板敲着节拍，沿街唱些无名曲。"
             "讨来的钱串起，转身又散给路边人。\n\n"
             "一只花篮在手，四季花都不肯谢；酒楼众人笑他，他笑众人太匆忙。"
             "忽有鹤声过檐，篮里花瓣先起身；一脚跛着踏云，歌还没唱完半句。\n\n"
             "《八仙人物》人物卷六：写八仙里最像街头艺人的那一位。"
             "乱发、茄紫破蓝衫、花篮与拍板，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#蓝采和", "#中国剪纸", "#非遗动画", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "hanxiangzi_v2": dict(
        name="韩湘子·雪拥蓝关·紧凑版", amb="snow", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷七", title="剪纸动画 · 韩湘子雪拥蓝关",
        texts=[
            "韩愈有位侄孙，不爱读书爱吹箫",
            "紫金箫一开口，庭前牡丹顷刻开",
            "瓣上两行小字，写的是雪拥蓝关",
            "叔父不信此兆，只当少年逞机巧",
            "后来一封谏表，果然贬向潮阳路",
            "蓝关雪没马蹄，远处有人吹旧箫",
            "一箫吹散风雪，他没说自己是谁",
            "紫金箫声收住，秦岭雪仍落着",
        ],
        desc="韩愈有位侄孙，不爱读书爱吹箫；紫金箫一开口，庭前牡丹顷刻开。"
             "瓣上两行小字，写的是雪拥蓝关。\n\n"
             "叔父不信此兆，只当少年逞机巧；后来一封谏表，果然贬向潮阳路。"
             "蓝关雪没马蹄，远处有人吹旧箫；一箫吹散风雪，他没说自己是谁。\n\n"
             "《八仙人物》人物卷七：把「云横秦岭家何在」写成一支箫。"
             "儒巾、竹青青衫、紫金箫，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#韩湘子", "#雪拥蓝关", "#中国剪纸", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "zhangguolao_v2": dict(
        name="张果老·倒骑纸驴·紧凑版", amb="warm", cover_time=13.3,
        sub="八仙人物 · 民俗套色剪纸 · 人物卷八", title="剪纸动画 · 张果老倒骑纸驴",
        texts=[
            "中条山一老叟，倒骑白驴看人间",
            "那驴是纸剪的，折起来能藏进袖",
            "拍着渔鼓踏歌，走过州县不留名",
            "玄宗遣人相请，问他却问年几许",
            "他说尧时做过官，记不清几甲子",
            "殿上一笑化纸，白驴从袖里抖开",
            "不留丹药封号，只借御前一盏茶",
            "渔鼓声渐远了，驴背仍朝着来路",
        ],
        desc="中条山一老叟，倒骑白驴看人间；那驴是纸剪的，折起来能藏进袖。"
             "拍着渔鼓踏歌，走过州县不留名。\n\n"
             "玄宗遣人相请，问他却问年几许；他说尧时做过官，记不清几甲子。"
             "殿上一笑化纸，白驴从袖里抖开；不留丹药封号，只借御前一盏茶。\n\n"
             "《八仙人物》人物卷八：纸驴、渔鼓、白须，倒着骑才看得清来路。"
             "靛蓝专色，剪纸分件铰接全代码绘制。\n\n" + STYLE,
        tags=["#八仙", "#张果老", "#中国剪纸", "#非遗动画", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
    "finale": dict(
        name="蓬莱·各显神通·收口", amb="sea", cover_time=24.7,
        sub="八仙人物 · 民俗套色剪纸 · 系列收口", title="剪纸动画 · 八仙过海各显神通",
        texts=[
            "一张窗纸铺开，八色纸片还收着",
            "先贴朱红一片，葫芦铁拐倚在旁",
            "赭黄石青跟上，扇底剑光各自明",
            "藕粉橘红落定，荷花玉板分两行",
            "茄紫竹青靛蓝，花篮箫鼓纸驴齐",
            "八张纸片贴满，窗纸上起了潮声",
            "海浪一层层涨，八件法宝各显通",
            "朱红钤印落下，蓬莱从此在人间",
        ],
        desc="一张窗纸铺开，八色纸片还收着。\n\n"
             "先贴朱红一片，葫芦铁拐倚在旁；赭黄石青跟上，扇底剑光各自明；"
             "藕粉橘红落定，荷花玉板分两行；茄紫竹青靛蓝，花篮箫鼓纸驴齐。"
             "八张纸片贴满，窗纸上起了潮声；海浪一层层涨，八件法宝各显神通。\n\n"
             "《八仙人物》动画系列收口片：不画单人立像，让八张一人一专色的剪纸纸片"
             "逐幕「贴」上窗纸，末尾八宝同框、朱红钤印，一次收束整个系列。"
             "八人群像靠剪影、法宝与专色区分，不靠五官。\n\n"
             "本片为《八仙》人物的视觉语言致敬向导读，不复刻任何具体动画造型，"
             "不主张任何影视改编形象的权利；画面、旁白与配音均为程序化生成 / AI 合成。",
        tags=["#八仙", "#八仙过海", "#各显神通", "#中国剪纸", "#国风动画",
              "#AI生成", "#动画短片", "#民间美术"],
    ),
}


def build_eras(key, is_finale):
    libs = LIBS_FINALE if is_finale else LIBS_PEOPLE
    prefix = "f" if is_finale else "k"
    note = ("收口片：不画单人立像，八色纸片逐幕贴上窗纸；SCENE_LIBS 不加载人物片的 series/actors/tight。"
            if is_finale else
            "第二批人物片：SCENE_LIBS 顺序 common → figure → series → actors → tight（actors 必须在 series 之后、tight 之前）。")
    out = [
        f"// 八仙 · {FILMS[key]['name']} —— 8 幕 × 3.8s = 30.4s",
        "// 一句一幕硬契约：dur 之和 = lines.total = 30.4，幕边界与 t1 严格对齐。",
        f"// {note}",
        "// 转场只用白名单 organic / crossfade / dotBloom / pageTurn（禁 ripple / radiant / lampGlow）。",
        f"window.SERIES_KEY = '{key}';",
        "window.SCENE_LIBS = [" + ", ".join("'" + x + "'" for x in libs) + "];",
        "window.ERAS = [",
    ]
    for i in range(N):
        tid = f"{prefix}{i + 1}"
        if i == 0:
            out.append(f"  {{ id: '{tid}', dur: {ACT} }},")
        else:
            # 转场名不能带对齐空格：TRANSITIONS[type] 精确匹配，尾空格会让 index.js 判定「转场未注册」
            out.append(f"  {{ id: '{tid}', dur: {ACT}, transition: {{ type: '{TRANS[i - 1]}', dur: 0.26 }} }},")
    out.append("];")
    return "\n".join(out) + "\n"


def build_lines(key, is_finale, texts, amb):
    prefix = "f" if is_finale else "k"
    labels = (["空窗", "朱红", "扇剑", "荷板", "篮箫", "潮声", "各显", "钤印"] if is_finale
              else ["缘起", "掀帘", "转折", "显影", "点化", "济世", "判词", "收束"])
    return {
        "film": FILMS[key]["name"],
        "note": "8 幕 30.4s 紧凑版正式配置；一句一幕硬契约（dur 之和 = total = 30.4，t1 对齐幕边界）。"
                "字数按流水线口径去掉标点统计。rate +0%，字幕 --sub-style clear。"
                + ("收口片：八色纸片逐幕贴上窗纸，不画单人立像。" if is_finale else "第二批人物片：独立专色 rig + 八幕专属前景。"),
        "voice": "zh-CN-XiaoxiaoNeural",
        "rate": "+0%",
        "total": TOTAL,
        "amb": amb,
        "lines": [dict(id=f"{prefix}{i + 1} {labels[i]}",
                       t0=round(i * ACT, 1), t1=round((i + 1) * ACT, 1),
                       lead=0.18, text=txt) for i, txt in enumerate(texts)],
    }


def main():
    # ---- 写盘前契约自检 ----
    for key, f in FILMS.items():
        counts = [len(re.sub(r"[，。：、？！\s]", "", x)) for x in f["texts"]]
        assert len(f["texts"]) == N, (key, "句数")
        assert all(10 <= n <= 16 for n in counts), (key, "单句字数", counts)
        assert sum(counts) >= 95, (key, "全片字数", sum(counts))
        assert f["amb"] in AMBS, (key, "环境音预设", f["amb"])
        print(f"  {key:<18} 字数 {counts} 合计 {sum(counts)}  amb={f['amb']}")
    assert abs(N * ACT - TOTAL) < 1e-9
    for lib in set(LIBS_PEOPLE + LIBS_FINALE):
        assert os.path.exists(os.path.join(CODE, lib)), f"缺口：{lib}"

    # ---- eras / lines ----
    for key, f in FILMS.items():
        is_finale = key == "finale"
        io.open(os.path.join(CODE, f"eras_{key}.js"), "w",
                encoding="utf-8", newline="\n").write(build_eras(key, is_finale))
        with io.open(os.path.join(VOICE, f"lines_{key}.json"), "w",
                    encoding="utf-8", newline="\n") as w:
            json.dump(build_lines(key, is_finale, f["texts"], f["amb"]),
                      w, ensure_ascii=False, indent=1)
            w.write("\n")

    # ---- 元数据：保留首支，追加 8 条 ----
    meta_path = os.path.join(VOICE, "发布元数据_复刻.json")
    meta = json.load(io.open(meta_path, encoding="utf-8"))
    assert "tieguali_v2" in meta["films"], "首支元数据丢失，拒绝覆盖"
    meta["batch"] = "八仙 · 民俗套色剪纸人物 全系列（首支 + 第二批 7 支 + 收口片）"
    for key, f in FILMS.items():
        name = f["name"]
        meta["films"][key] = {
            "name": name,
            "video": f"成片_有声/{name}.mp4",
            "subtitle": f"_配音_{key}/sub.ass",
            "amb": f["amb"],
            "cover_time": f["cover_time"],
            "cover_video": f"成片/{name}_无声.mp4",
            "cover_note": (
                "收口片 f7「各显」（22.8–26.6s）：八张专色纸片已贴到第七张、海浪涨到三层，"
                "信息最饱满且不落结句深墨底。8 幕紧凑版字幕占满 3.3~3.6s/幕，幕间空隙仅 0.2~0.5s "
                "且叠转场，无法按 sub.ass 反推安全无字幕点；统一从同源「未烧字幕无声片」抽帧（红线 05）。"
                if key == "finale" else
                "k4 显影幕（11.4–15.2s）：完整立像 + 专属法宝在侧不横脸 + 专色窗纸与匾额齐备，"
                "是全片最适合静态招贴的一幕。8 幕紧凑版字幕占满 3.3~3.6s/幕，幕间空隙仅 0.2~0.5s "
                "且叠转场，无法按 sub.ass 反推安全无字幕点；统一从同源「未烧字幕无声片」抽帧（红线 05）。"
            ),
            "title": f["title"],
            "sub": f["sub"],
            "desc": f["desc"],
            "tags": f["tags"],
            "spec": {"w": 1920, "h": 1080, "dur": 30.4, "orientation": "横屏"},
        }
    with io.open(meta_path, "w", encoding="utf-8", newline="\n") as w:
        json.dump(meta, w, ensure_ascii=False, indent=1)
        w.write("\n")

    # ---- 落盘后复检 ----
    for key, f in FILMS.items():
        e = io.open(os.path.join(CODE, f"eras_{key}.js"), encoding="utf-8").read()
        durs = [float(ln.split("dur:")[1].split(",")[0].split("}")[0].strip())
                for ln in e.splitlines() if "id: '" in ln and "dur:" in ln]
        d = json.load(io.open(os.path.join(VOICE, f"lines_{key}.json"), encoding="utf-8"))
        assert len(durs) == N and abs(sum(durs) - TOTAL) < 1e-6, (key, durs)
        assert [x["t1"] for x in d["lines"][:-1]] == [round(i * ACT, 1) for i in range(1, N)]
        assert abs(d["lines"][-1]["t1"] - TOTAL) < 1e-6
        libs = re.findall(r"scenes/([a-z_]+\.js)", e)
        assert all(os.path.exists(os.path.join(CODE, "scenes", x)) for x in libs), (key, libs)
        tr = [ln.split("type: '")[1].split("'")[0] for ln in e.splitlines() if "type: '" in ln]
        assert all(x in ("organic", "crossfade", "dotBloom", "pageTurn") for x in tr), (key, tr)
        is_finale = key == "finale"
        assert ("bx_finale.js" in e) == is_finale, (key, "收口片链路")
        assert ("bx_actors.js" in e) == (not is_finale), (key, "人物片链路")
    assert len(meta["films"]) == 9, list(meta["films"])
    print(f"\n生成完成：8 eras + 8 lines；元数据 films = {len(meta['films'])} 条")
    print("ALL CONTRACT CHECKS PASS")


if __name__ == "__main__":
    main()
