#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 8 幕静帧审片抽帧 + 接触表
=========================================================================
对 voice/发布元数据_复刻.json 里的每部片，抽 8 幕中帧（1.9 + 3.8*i），
输出 _审片/二审_<key>/t<秒>.png，并拼成 4×2 接触表 _审片/二审_<key>_接触表.png。

用法：
    python _审片_抽帧.py                      # 默认全部 9 部
    python _审片_抽帧.py --keys zhongli_v2 finale
"""
import argparse
import io
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).parent
CODE = ROOT / "engine"
REVIEW = ROOT / "_审片"
META = ROOT / "voice" / "发布元数据_复刻.json"
PY = sys.executable
TIMES = [1.9, 5.7, 9.5, 13.3, 17.1, 20.9, 24.7, 28.5]


def contact(key, folder):
    from PIL import Image, ImageDraw
    files = sorted(folder.glob("t*.png"))
    if len(files) != 8:
        return None
    W, H = 480, 270
    sheet = Image.new("RGB", (W * 4, H * 2), (245, 238, 216))
    d = ImageDraw.Draw(sheet)
    for i, p in enumerate(files):
        im = Image.open(p).convert("RGB").resize((W, H))
        x, y = (i % 4) * W, (i // 4) * H
        sheet.paste(im, (x, y))
        d.rectangle([x + 6, y + 6, x + 92, y + 34], fill=(51, 32, 26))
        d.text((x + 14, y + 12), f"k{i + 1}  {p.stem[1:]}s", fill=(248, 238, 216))
    out = REVIEW / f"二审_{key}_接触表.png"
    sheet.save(out)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keys", nargs="*")
    a = ap.parse_args()
    with io.open(META, encoding="utf-8") as f:
        keys = a.keys or list(json.load(f)["films"])
    REVIEW.mkdir(exist_ok=True)
    fails = []
    for k in keys:
        folder = REVIEW / f"二审_{k}"
        folder.mkdir(exist_ok=True)
        cmd = [PY, "render.py", "--film", k,
               "--stills", ",".join(str(x) for x in TIMES),
               "--out", str(folder), "--no-counter"]
        r = subprocess.run(cmd, cwd=str(CODE), capture_output=True, text=True,
                           encoding="utf-8", errors="ignore")
        n = len(list(folder.glob("t*.png")))
        boot = "场景加载失败" in (r.stdout or "") + (r.stderr or "")
        ok = r.returncode == 0 and n == 8 and not boot
        print(f"{'OK  ' if ok else 'FAIL'} {k:<18} 帧 {n}/8  rc={r.returncode}", flush=True)
        if not ok:
            print((r.stdout or "")[-600:] + "\n" + (r.stderr or "")[-600:], flush=True)
            fails.append(k)
            continue
        sheet = contact(k, folder)
        print(f"     接触表 -> {sheet.name}", flush=True)
    print("抽帧结果:", "ALL OK" if not fails else f"FAIL {fails}", flush=True)
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
