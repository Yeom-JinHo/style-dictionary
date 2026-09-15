---
'style-dictionary': minor
---

Add `StopTransformError` to `style-dictionary/utils`. Throwing it from a transform stops the transform pipeline for the token being transformed: no further transforms are applied to that token and it keeps the state it had after the last successfully applied transform. The error is collected and reported like any other transform error, so `log.warnings: 'error'` makes the build fail at the end of the run. Transforms that throw regular errors keep the existing behavior (fallback value, pipeline continues).
