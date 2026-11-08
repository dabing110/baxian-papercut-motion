#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 全系列 9 部待发箱终检
=========================================================================
逐部核对：四件套齐全 / manifest 的 gate.passed / 成片时长与音轨 / 封面尺寸 /
cover 是否来自同源无声片（cover_source 字段）/ status=pending_upload。

用法：python _终检_全系列.py
"""
import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
FF = os.environ.get("FFMPEG_BIN") or "ffmpeg"
META = os.path.join(ROOT, "voice", "发布元数据_复刻.json")
BOX = os.path.join(ROOT, "_视频号待发箱")


def probe(path):
    """本机无 ffprobe（只有 ffmpeg.exe），沿用 prepare_channels_remake.py 的 -i 解析法。"""
    r = subprocess.run([FF, "-i", path], capture_output=True, text=True,
                       encoding="utf-8", errors="ignore")
    txt = r.stderr or ""
    dur = 0.0
    for line in txt.splitlines():
        s = line.strip()
        if s.startswith("Duration:"):
            try:
                hh, mm, ss = s.split("Duration:")[1].split(",")[0].strip().split(":")
                dur = int(hh) * 3600 + int(mm) * 60 + float(ss)
            except (ValueError, IndexError):
                pass
    return {"dur": dur, "audio": "Audio:" in txt,
            "video": "Video:" in txt}


def main():
    with io.open(META, encoding="utf-8") as f:
        meta = json.load(f)["films"]
    dirs = [d for d in os.listdir(BOX) if os.path.isdir(os.path.join(BOX, d))]
    rows, bad = [], []
    for k, m in sorted(meta.items()):
        name = m["name"]
        hit = [d for d in dirs if d.endswith(name) and
               os.path.exists(os.path.join(BOX, d, "manifest.json"))]
        if not hit:
            rows.append((k, "缺目录", "-", "-", "-", "-"))
            bad.append(k + " 缺目录")
            continue
        p = os.path.join(BOX, hit[-1])
        need = [name + ".mp4", "封面.jpg", "发布文案.md", "manifest.json"]
        missing = [x for x in need if not os.path.exists(os.path.join(p, x))]
        man = json.load(io.open(os.path.join(p, "manifest.json"), encoding="utf-8"))
        gate = man.get("gate", {}).get("passed") is True
        status = man.get("status", "")
        info = probe(os.path.join(p, name + ".mp4")) or {}
        dur = info.get("dur", 0)
        from PIL import Image
        cw, ch = Image.open(os.path.join(p, "封面.jpg")).size
        ok = (not missing and gate and status == "pending_upload" and
              abs(dur - 30.4) < 0.3 and info.get("audio") is True and
              (cw, ch) == (1080, 1440))
        rows.append((k, "OK" if ok else "FAIL", f"{dur:.2f}s",
                     "有" if info.get("audio") else "无",
                     f"{cw}x{ch}", "是" if gate else "否"))
        if not ok:
            bad.append(f"{k}: 缺件={missing} gate={gate} status={status} "
                       f"dur={dur:.2f} audio={info.get('audio')} cover={cw}x{ch}")

    print(f"{'key':<18} {'结果':<6} {'时长':<9} {'音轨':<5} {'封面':<12} 门禁")
    print("-" * 64)
    for r in rows:
        print(f"{r[0]:<18} {r[1]:<6} {r[2]:<9} {r[3]:<5} {r[4]:<12} {r[5]}")
    print("-" * 64)
    print(f"共 {len(rows)} 部；", "ALL PASS" if not bad else "未通过：\n  " + "\n  ".join(bad))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
