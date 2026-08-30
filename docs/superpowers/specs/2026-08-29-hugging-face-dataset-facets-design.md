# Hugging Face Dataset Facets Design

## Goal

Make Scout Lab's Datasets workbench useful for sustained discovery while preserving the shared card grid. The controls should reflect Hugging Face's dataset vocabulary instead of a reduced, invented subset.

## Layout

The always-visible row contains `Sort`, `Task`, `Rows`, and `Modality`. `More filters` contains `Format`, `Type`, `Language`, `License`, `Access`, and `AI topic`. This keeps the four most common discovery decisions visible without turning the toolbar into a replica of Hugging Face's sidebar.

## Source Parity

- Sort exposes Trending, Most likes, Most downloads, Recently created, Recently updated, Most rows, Least rows, Largest total size, and Smallest total size.
- Modality exposes 3D, Audio, Document, Geospatial, Image, Tabular, Text, Time-series, and Video.
- Format exposes JSON, CSV, Parquet, Optimized Parquet, ImageFolder, AudioFolder, WebDataset, Text, and Arrow.
- Type exposes Benchmark and Traces.
- Existing grouped tasks and row buckets remain source-aligned.

## Data Strategy

Seven sorts use the public Hugging Face datasets API. `Most rows` and `Least rows` use the ordered dataset list embedded in the Hugging Face datasets page because those two orders are not accepted by the public API. Local preview requests go through a fixed-target, allowlisted proxy; the extension requests Hugging Face directly under its existing host permission.

The parser reads the `DatasetList` component's JSON `data-props`. It does not scrape visible card text. Returned metadata includes row count, modalities, formats, and Benchmark or Traces type when Hugging Face supplies them.

## Failure And Security

- The local proxy accepts GET only, targets `https://huggingface.co/datasets` only, and allowlists every parameter and value.
- Duplicate, unknown, or malformed parameters are rejected before any network call.
- Invalid page JSON is treated as an unavailable live source and follows the existing cache/error behavior.

## Acceptance

- Every source-visible option is present and unique.
- Combined filters produce the expected Hugging Face query.
- All nine sorts trigger a valid source request.
- Cards expose available rows, modality, format, and type metadata.
- Unit, integration, E2E, extension checks, coverage, and live-source checks pass.
