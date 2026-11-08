#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 系列通用合成器
=========================================================================
    _渲染分段/<key>_1..3.mp4  →  concat  →  成片/<名>_无声.mp4
                              →  build_voice_remake.py（旁白 + 环境音 + clear 字幕烧录）
                              →  成片_有声/<名>.mp4

用法：
    python _合成_系列.py --key tieguali_v2

新增一支时只需：eras_<key>.js（复用 bx_common/figure/series/tight 四层）
+ voice/lines_<key>.json + 发布元数据_复刻.json 的 films 条目
+ FILMS 里登记 eras/lines 两个路径 + bx_series.js 的 FILMS 配置。
"""
import argparse
import io
import json
import os
import sys
import re
import subprocess

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
FF = os.environ.get("FFMPEG_BIN") or "ffmpeg"
VOICE = os.path.join(ROOT, "voice", "build_voice_remake.py")
META = os.path.join(ROOT, "voice", "发布元数据_复刻.json")
SEG = os.path.join(ROOT, "_渲染分段")
SILENT_DIR = os.path.join(ROOT, "成片")
FINAL_DIR = os.path.join(ROOT, "成片_有声")

# 全系列 9 部（首支 + 第二批 7 支 + 收口片）自动从元数据注册，新增片子不必改本文件。
# 约定：eras_<key>.js 与 lines_<key>.json 同名成对存在。
def _all_films():
    with io.open(META, encoding="utf-8") as f:
        keys = list(json.load(f)["films"])
    return {k: {"eras": os.path.join(ROOT, "engine", f"eras_{k}.js"),
                "lines": os.path.join(ROOT, "voice", f"lines_{k}.json")} for k in keys}


FILMS = _all_films()


def run(cmd, tag):
    print("\n###", tag, flush=True)
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                       encoding="utf-8", errors="ignore")
    print("\n".join((r.stdout or "").strip().splitlines()[-26:]), flush=True)
    if r.returncode != 0:
        print("STDERR:", (r.stderr or "")[-1400:], flush=True)
        raise SystemExit(f"{tag} 失败 rc={r.returncode}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--key", required=True, choices=sorted(FILMS))
    a = ap.parse_args()
    key, cfg = a.key, FILMS[a.key]
    meta = json.load(io.open(META, encoding="utf-8"))["films"][key]
    name = meta["name"]

    segs = [os.path.join(SEG, f"{key}_{i}.mp4") for i in (1, 2, 3)]
    for p in segs:
        if not os.path.exists(p) or os.path.getsize(p) < 100000:
            raise SystemExit(f"分段未完成或异常：{p}")
    os.makedirs(SILENT_DIR, exist_ok=True)
    os.makedirs(FINAL_DIR, exist_ok=True)

    lst = os.path.join(SEG, f"list_{key}.txt")
    with io.open(lst, "w", encoding="utf-8") as f:
        for p in segs:
            f.write("file '" + p.replace("\\", "/") + "'\n")
    silent = os.path.join(SILENT_DIR, f"{name}_无声.mp4")
    run([FF, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
         "-i", lst, "-c", "copy", "-movflags", "+faststart", silent], "拼接三段")

    final = os.path.join(ROOT, meta["video"])
    os.makedirs(os.path.dirname(final), exist_ok=True)
    run([PY, VOICE,
         "--lines", cfg["lines"],
         "--eras", cfg["eras"],
         "--video", silent,
         "--outdir", os.path.join(ROOT, os.path.dirname(meta["subtitle"])),
         "--final", final,
         "--sub-style", "clear",
         "--amb-gain", "0.32"], "旁白 / 环境音 / 字幕烧录")

    r = subprocess.run([FF, "-i", final], capture_output=True, text=True,
                       encoding="utf-8", errors="ignore")
    m = re.search(r"Duration: (\d+):(\d+):([\d.]+)", r.stderr or "")
    dur = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]) if m else 0
    print(f"\n=== 完成：{final}  时长 {dur:.2f}s  "
          f"{os.path.getsize(final)/1024/1024:.1f}MB", flush=True)


if __name__ == "__main__":
    main()
