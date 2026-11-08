#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""八仙 · 民俗套色剪纸 —— 串行收口
=========================================================================
逐部执行：_合成_系列.py（拼接 + 配音 + 烧字幕）
        → _qa_系列.py（活气 QA，死帧 / 跳变）
        → prepare_channels_remake.py（成片 / 封面 / 发布文案 / manifest 四件套）
封面统一从同源「未烧字幕无声片」抽帧（元数据 cover_video，红线 05）。

用法：python _批量收口_系列.py [--keys zhongli_v2 ...]
"""
import argparse
import io
import json
import os
import subprocess
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
META = os.path.join(ROOT, "voice", "发布元数据_复刻.json")
KEYS = ["zhongli_v2", "lvzu_v2", "hexiangu_v2", "caoguojiu_v2",
        "lancaihe_v2", "hanxiangzi_v2", "zhangguolao_v2", "finale"]


def run(cmd, tag):
    print(f"\n{'=' * 68}\n### {tag}\n{'=' * 68}", flush=True)
    r = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True,
                       encoding="utf-8", errors="ignore")
    out = ((r.stdout or "") + "\n" + (r.stderr or "")).strip()
    # 只回显尾部，避免多部 × 3 步把日志刷爆
    print("\n".join(out.splitlines()[-18:]), flush=True)
    if r.returncode != 0:
        print(f"!!! {tag} rc={r.returncode}", flush=True)
    return r.returncode, out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--keys", nargs="*", default=KEYS)
    a = ap.parse_args()
    report = []
    for k in a.keys:
        rc1, o1 = run([PY, "_合成_系列.py", "--key", k], f"{k} · 合成配音")
        rc2, o2 = run([PY, "_qa_系列.py", "--key", k], f"{k} · 活气 QA")
        # QA 的 rc=1 只代表需人工复核，不阻断后续打包，但会记进汇总
        rc3, o3 = run([PY, os.path.join("voice", "prepare_channels_remake.py"),
                       "--key", k, "--force"], f"{k} · 待发箱四件套")
        qa = "PASS" if "QA 结论: PASS" in o2 else "需复核"
        report.append((k, rc1, qa, rc3))

    print(f"\n{'=' * 68}\n### 收口汇总\n{'=' * 68}", flush=True)
    meta = json.load(io.open(META, encoding="utf-8"))["films"]
    all_ok = True
    for k, rc1, qa, rc3 in report:
        boxes = [d for d in os.listdir(os.path.join(ROOT, "_视频号待发箱"))
                 if os.path.isdir(os.path.join(ROOT, "_视频号待发箱", d))]
        gate = None
        for d in boxes:
            p = os.path.join(ROOT, "_视频号待发箱", d, "manifest.json")
            if os.path.exists(p):
                m = json.load(io.open(p, encoding="utf-8"))
                if m.get("source", "").endswith(meta[k]["name"] + ".mp4"):
                    gate = m["gate"]["passed"]
        ok = rc1 == 0 and qa == "PASS" and rc3 == 0 and gate is True
        all_ok &= ok
        print(f"  {'OK  ' if ok else 'FAIL'} {k:<16} 合成 rc={rc1}  QA={qa}  "
              f"打包 rc={rc3}  gate={gate}", flush=True)
    print("\n批量收口:", "ALL PASS" if all_ok else "存在未通过项，见上表", flush=True)
    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
