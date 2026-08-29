# Balanced Models Workbench Design

## Goal

Make the Models tab useful for both daily discovery and practical model selection without copying Hugging Face's full catalog interface.

The workbench keeps the shared Scout Lab card grid. Discovery controls stay visible; runtime and catalog filters live behind **More filters**.

## Source Contract

Hugging Face Hub remains the only ranking and metadata source. Scout Lab sends the selected controls to the public models API and does not invent popularity scores.

The sort menu matches Hugging Face's labels and order:

1. Trending
2. Most likes
3. Most downloads
4. Recently created
5. Recently updated
6. Most parameters
7. Least parameters

The API mappings are:

| UI option | API sort | Direction |
| --- | --- | --- |
| Trending | `trendingScore` | descending |
| Most likes | `likes` | descending |
| Most downloads | `downloads` | descending |
| Recently created | `createdAt` | descending |
| Recently updated | `lastModified` | descending |
| Most parameters | `num_parameters` | descending |
| Least parameters | `num_parameters` | ascending |

Base-only filtering uses `base_model_relation=base`. Inference availability uses `inference_provider=all`.

## Controls

The first row contains the daily-use controls in this order:

- Sort
- Task
- Parameter size
- Base models only
- Inference available
- More filters

The task menu covers common Hugging Face model tasks, including text generation, image/text tasks, video, speech, and feature extraction.

**More filters** is a native disclosure containing independent selectors for:

- library or format
- license
- access
- compatible application
- updated date

The disclosure opens automatically when any advanced filter is active. Reset and saved-default behavior includes every Models filter.

## Family Grouping

Quantizations, fine-tunes, adapters, and merges are grouped by Hugging Face's `base_model:*` tags. The highest-ranked item represents each family unless the base model itself is present, in which case the base model is the representative.

Related variants appear in a collapsed list inside the representative card. Each variant keeps its own validated Hugging Face link. A family occupies one grid position, preventing one popular model family from overwhelming the page.

When **Base models only** is active, Hugging Face performs source-side base filtering and the family list naturally disappears.

## Card Metadata

Model cards retain the shared Scout Lab anatomy and add model-specific facts:

- model ID and owner
- task
- parameter count when supplied by Hugging Face
- library or format
- license
- open or gated access
- inference availability
- created and updated dates
- downloads, likes, and trending score
- expandable related variants

The primary metric follows the active sort. Missing values are labeled honestly as not specified.

## Error Handling

Invalid stored filter values normalize to factory defaults. Source errors continue to use saved results when available and the existing Hugging Face source card otherwise. No synthetic model result or ranking is generated.

Unsafe or non-Hugging Face links are rejected by the shared URL validator.

## Acceptance Criteria

- The seven sort labels and order match Hugging Face.
- Every sort produces the verified API field and direction.
- Task, size, base-only, inference, library, license, access, app, and updated-date controls affect the result request or normalized result set as specified.
- Related variants collapse into one family card and every listed variant opens its correct Hugging Face page.
- Cards expose parameter, access, inference, license, library, date, download, like, and trending metadata when available.
- Save defaults, reset filters, search, favorite, hide, comment, and open continue to work on Models.
- The controls and cards have no horizontal overflow at desktop, tablet, or mobile widths.
- Unit, integration, E2E, live-source, link, extension, coverage, and dependency-security checks pass.

## Verified References

- [Hugging Face Hub API client](https://huggingface.co/docs/huggingface_hub/en/package_reference/hf_api)
- [Hugging Face Models](https://huggingface.co/models?sort=trending)
