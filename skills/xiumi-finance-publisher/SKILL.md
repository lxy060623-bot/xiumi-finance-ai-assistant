---
name: xiumi-finance-publisher
description: Research, verify, draft, and lay out a four-section Chinese financial-news digest in a copied Xiumi template, with traceable article and image sources. Use when asked to create periodic financial资讯/简报, follow an earlier Xiumi issue's format, duplicate rather than overwrite a template, edit a Xiumi draft through a browser, or audit a finance draft's citations and image credits.
---

# Xiumi Finance Publisher

Create a source-backed financial digest and, when browser control is available, place it into a new Xiumi draft without changing the source template.

## Operating contract

- Treat every date, number, quotation, policy statement, and market claim as unverified until checked against a reachable source.
- Prefer official agencies, central banks, exchanges, regulators, statistical offices, and company filings. Use reputable news outlets only for context or when no primary account exists.
- Never invent a URL, publication date, image credit, market move, or quotation.
- Never overwrite the reference issue. Duplicate it first and verify that the editor URL or draft identity has changed before editing.
- Save as a draft. Do not publish, export, delete, or send externally without explicit authorization.
- Do not expose API keys, cookies, login data, unpublished drafts, or private account details.
- If the requested period is in the future or reliable coverage is incomplete, say so and produce only the verifiable portion.

## Choose the workflow

1. If an earlier issue or Xiumi template is provided, inspect it first. Record its title pattern, cover treatment, four module roles, section order, paragraph density, captions, source-label style, and closing disclaimer.
2. If the task is research or copywriting only, complete the research and draft stages, then return a paste-ready manuscript.
3. If the task asks for direct Xiumi editing and browser control is available, continue through duplication, layout, saving, and persistence verification.
4. If browser control is unavailable, do not pretend the page was edited. Return the manuscript plus precise placement instructions. The companion browser extension may be used as an optional execution layer, but is not required for research or drafting.

## Research and verification

Read [references/editorial-standard.md](references/editorial-standard.md) before collecting material.

1. Confirm the exact coverage window, locale/time zone, audience, and reference issue. Infer these from the user's materials when safe; ask only when the answer would materially change the edition.
2. Build a source ledger before drafting. For every candidate item record: module, event date, source publication date, headline, factual claim, publisher, page URL, image URL or asset page, creator/owner, license or reuse basis, and access date.
3. Open every cited page. Confirm that its title, date, organization, and content support the claim. Search snippets are discovery aids, not evidence.
4. Select four coherent themes corresponding to the reference issue's four editorial roles. Theme names may change, but the role and visual hierarchy should remain recognizable.
5. Use at least two substantive items per module when the period supports them. Avoid padding with events outside the requested window; older background must be labeled as context.
6. Use a distinct, relevant image for each module. Prefer official press images, government or institutional media galleries, or permissively licensed repositories. Record a human-readable credit and a direct source page.

## Draft the issue

Follow the structure and checks in [references/editorial-standard.md](references/editorial-standard.md).

- Match the reference issue's title syntax and tone; change only the date range and edition-specific wording.
- Preserve four modules in the same order and comparable length unless the user asks otherwise.
- Lead each module with a concise synthesis, then explain the selected developments, why they matter, and what to watch.
- Put source labels immediately after the claim or at the end of its paragraph. Include publisher, article title, date, and working URL.
- Put the image credit directly below each image. Do not use “图片来源：网络”.
- Separate reported facts from analysis. Use restrained language and avoid individualized investment advice.
- End with a source note and a financial-information disclaimer consistent with the reference issue.

When a manuscript file is available, run:

```bash
python scripts/validate_finance_draft.py path/to/draft.md
```

Fix all errors before layout. Warnings require judgment and should be disclosed if they remain.

## Lay out in Xiumi

Read [references/xiumi-workflow.md](references/xiumi-workflow.md) before controlling the editor.

1. Confirm the user is signed in and the intended reference issue is open.
2. Use Xiumi's copy/duplicate action to create a new draft. Never edit until the duplicate is confirmed.
3. Rename the duplicate using the requested period.
4. Replace content module by module while preserving the template's typography, colors, spacing, dividers, caption style, and footer.
5. Insert the four verified images and their credits. Do not hotlink an image when the license or host disallows it.
6. Save the draft and wait for the saved-state indicator.
7. Reload or reopen the new draft and verify title, all four modules, images, source labels, and footer persisted.
8. Leave the source issue untouched. Close only auxiliary tabs created during this task when safe.

## Handoff

Report:

- new draft title and link, or the manuscript path if direct editing was unavailable;
- the four final theme names;
- number of article sources and image sources;
- validation outcome and any unresolved warning;
- confirmation that the original template was not changed and the new draft was saved but not published.
