# Safe Xiumi workflow

## Invariants

- The reference issue is read-only.
- Editing begins only after a copy has been created and the new draft identity is visible.
- Publishing is outside scope unless the user explicitly requests it.
- A save indicator alone is not enough; persistence must be checked by reopening or reloading the copied draft.

## Duplicate safely

1. Record the reference issue title and URL.
2. Invoke the Xiumi copy/duplicate action from the article or document menu.
3. Wait for the new editor to finish loading.
4. Confirm at least one identity signal changed: document ID in the URL, title marked as a copy, or a new entry in the user's drafts.
5. If the identity is ambiguous, stop editing and resolve it. Do not take the risk of overwriting the source.

## Edit defensively

- Replace one module at a time and inspect the result before continuing.
- Preserve container hierarchy, text styles, line spacing, separators, and footer blocks.
- Use normal paste for plain text and a tested rich-text path only when it preserves the template.
- If a selection or paste lands in the wrong block, undo immediately and reselect; do not compensate with cascading layout edits.
- Keep source links readable in the final mobile-width preview.
- Use Xiumi-hosted uploads or another permitted asset flow instead of embedding unstable or unauthorized hotlinks.

## Save and verify

1. Trigger save and wait until the interface reports completion.
2. Record the copied draft's title and URL.
3. Reload or reopen the copied draft.
4. Check the title, Part.01–Part.04 headings, first and last paragraph of each module, four images, four image credits, source links, and disclaimer.
5. Confirm the source issue still has its original title and URL.

If any content disappears after reload, the task is not complete. Restore the missing content, save, and repeat verification.
