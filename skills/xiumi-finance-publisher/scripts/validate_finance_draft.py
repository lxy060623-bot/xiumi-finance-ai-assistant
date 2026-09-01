#!/usr/bin/env python3
"""Check a Markdown/text financial digest for the Skill's minimum structure."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


URL_RE = re.compile(r"https?://[^\s)）>]+", re.IGNORECASE)
PART_RE = re.compile(r"(?:part\s*[.．]?\s*0?([1-4])|第\s*([一二三四1234])\s*(?:部分|章|节))", re.IGNORECASE)
IMAGE_CREDIT_RE = re.compile(r"(?:图片|图表|照片)(?:来源|版权|作者)|image\s+credit", re.IGNORECASE)
SOURCE_RE = re.compile(r"(?:^|\n)\s*(?:来源|资料来源|参考资料)\s*[：:]", re.IGNORECASE)
DISCLAIMER_RE = re.compile(r"(?:不构成(?:任何)?投资建议|仅供信息|免责声明)", re.IGNORECASE)


def normalize_part(raw: str) -> int | None:
    lookup = {"一": 1, "二": 2, "三": 3, "四": 4}
    if raw.isdigit():
        return int(raw)
    return lookup.get(raw)


def validate(text: str) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []

    parts: set[int] = set()
    for match in PART_RE.finditer(text):
        raw = match.group(1) or match.group(2)
        part = normalize_part(raw)
        if part:
            parts.add(part)

    missing = sorted({1, 2, 3, 4} - parts)
    if missing:
        errors.append("缺少四模块标识：" + ", ".join(f"Part.{n:02d}" for n in missing))

    urls = URL_RE.findall(text)
    if len(urls) < 8:
        errors.append(f"可识别 URL 仅 {len(urls)} 个；四个模块的文章与图片出处合计应至少 8 个")

    image_credits = IMAGE_CREDIT_RE.findall(text)
    if len(image_credits) < 4:
        errors.append(f"图片出处标识仅 {len(image_credits)} 处；每个模块至少需要 1 处")

    if SOURCE_RE.search(text) is None:
        errors.append("未找到明确的‘来源：’或‘资料来源：’标识")

    if DISCLAIMER_RE.search(text) is None:
        errors.append("未找到金融信息免责声明")

    if re.search(r"图片来源\s*[：:]\s*(?:网络|互联网|未知)", text, re.IGNORECASE):
        errors.append("存在不可追溯的笼统图片来源（网络/互联网/未知）")

    if not re.search(r"(?:检索|访问|资料|信息).{0,10}(?:截止|日期)|accessed", text, re.IGNORECASE):
        warnings.append("未识别到资料检索截止时间或访问日期")

    if len(text.strip()) < 1200:
        warnings.append("正文少于 1200 个字符，可能不足以支撑四个完整模块")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("draft", type=Path, help="Markdown or text draft to validate")
    args = parser.parse_args()

    try:
        text = args.draft.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as exc:
        print(f"ERROR: 无法读取 {args.draft}: {exc}", file=sys.stderr)
        return 2

    errors, warnings = validate(text)
    for item in errors:
        print(f"ERROR: {item}")
    for item in warnings:
        print(f"WARNING: {item}")

    if errors:
        print(f"FAIL: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1

    print(f"PASS: 0 errors, {len(warnings)} warning(s), {len(URL_RE.findall(text))} URL(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
