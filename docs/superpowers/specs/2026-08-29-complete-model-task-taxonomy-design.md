# Complete Model Task Taxonomy Design

## Goal

Make the Models task selector complete, scannable, and faithful to Hugging Face for daily use.

## Source Contract

The canonical taxonomy is Hugging Face's `PIPELINE_DATA` in
`huggingface.js/packages/tasks/src/pipelines.ts`. Scout Lab includes every pipeline whose
metadata does not set `hideInModels: true`.

As of August 29, 2026, the source defines 57 pipeline tasks. Five are hidden from the
Models filter, leaving 52 selectable model tasks. `All tasks` remains the unfiltered
default and does not send `pipeline_tag`.

The task values are passed to the public models API unchanged as `pipeline_tag` values.
Scout Lab does not invent aliases or combine distinct source tasks.

## Interaction Design

Use the existing native Task `<select>` so keyboard navigation, platform accessibility,
and compact toolbar behavior remain intact. Place `All tasks` first, followed by native
`<optgroup>` sections in this order:

1. Multimodal
2. Natural Language Processing
3. Audio
4. Computer Vision
5. Reinforcement Learning
6. Tabular
7. Other

Task labels and values match Hugging Face. The grouped structure is data-driven and the
generic select renderer supports grouped and ungrouped controls without affecting other
Scout Lab tabs.

## Error Handling

Stored values remain validated against the flattened option catalog. A removed or invalid
task falls back to `All tasks`. Group labels and task labels are HTML-escaped by the shared
renderer.

## Testing

- Unit tests assert all seven groups, all 52 visible task values, source labels, and the
  ungrouped `All tasks` option.
- Unit tests verify hidden model tasks are absent.
- E2E tests select every task and verify the outgoing `pipeline_tag` value.
- Existing filter, settings, responsive, and Models workflows must continue to pass.

## Acceptance Criteria

- The Models Task menu exposes all 52 Hugging Face model-visible tasks.
- Tasks are grouped by official modality and remain keyboard accessible.
- `All tasks` sends no `pipeline_tag`.
- Every selectable task sends its exact Hugging Face pipeline value.
- Other selects and saved/default filter behavior are unchanged.

## Verified References

- [Hugging Face task taxonomy](https://github.com/huggingface/huggingface.js/blob/main/packages/tasks/src/pipelines.ts)
- [Hugging Face model card pipeline tags](https://huggingface.co/docs/hub/model-cards#specifying-a-task-pipeline-tag)

