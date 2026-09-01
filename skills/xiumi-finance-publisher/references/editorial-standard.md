# Editorial standard

## Four-module mapping

Preserve the reference issue's four editorial roles even when renaming themes. A reliable default is:

1. **宏观与政策** — central banks, fiscal policy, inflation, employment, GDP, regulation.
2. **市场与资产** — equities, bonds, foreign exchange, commodities, volatility, cross-asset signals.
3. **机构与产业** — banks, insurers, securities firms, listed companies, financial infrastructure, major deals.
4. **前沿与风险** — fintech, AI in finance, digital assets, climate finance, fraud, compliance, systemic risks.

Do not force an item into a module merely to fill space. Rename a theme when the verified news mix supports a clearer structure.

## Source hierarchy

Use this order of preference:

1. original regulation, speech, statistical release, filing, exchange notice, or company announcement;
2. official transcript, press release, or institutional research page;
3. established financial news organization with named reporting and publication date;
4. specialist publication for context, cross-checked against a stronger source.

Avoid anonymous reposts, scraped aggregators, untraceable social posts, AI-written roundups, and search-result snippets as final evidence.

For each claim, capture:

```text
Claim | Event date | Source date | Publisher | Page title | URL | Access date
```

A source must be reachable and must directly support the nearby claim. One citation may support several adjacent sentences only when that relationship is unambiguous.

## Images

Each module needs one relevant image. Record:

```text
Module | Subject | Creator/owner | Source page | Direct asset URL (if allowed) | License/reuse basis | Access date
```

Preferred assets are official charts, official event or building photographs, organization media galleries with stated terms, and permissively licensed images. A screenshot of a chart still requires a source-page credit. Do not remove watermarks or imply ownership.

Credit format:

```text
图片来源：机构/作者，《页面或作品名》，YYYY-MM-DD，URL（许可或使用依据）
```

## Draft shape

Use the reference issue's exact visual conventions. When no reference is available, use:

```markdown
# 8月下旬金融资讯｜标题副句

## Part.01 宏观与政策
![准确描述](image-url-or-local-path)
图片来源：...

导语与两至三则进展，每则说明事实、影响与观察点。

来源：机构，《文章标题》，YYYY-MM-DD，URL

## Part.02 市场与资产
...

## Part.03 机构与产业
...

## Part.04 前沿与风险
...

资料说明：信息检索截止 YYYY-MM-DD HH:mm（时区）。
免责声明：本文仅作信息交流，不构成任何投资建议。
```

## Final editorial checks

- Coverage dates fall inside the requested period or are explicitly labeled background.
- Four modules exist, have distinct roles, and resemble the reference issue in weight and order.
- Every material number and quotation has a direct source.
- Every URL was opened successfully during this task.
- Every image has a creator/owner, source page, and reuse basis.
- Titles do not overstate causality or certainty.
- Analysis is distinguishable from reported fact.
- No individualized investment recommendation appears.
