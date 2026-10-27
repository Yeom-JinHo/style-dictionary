---
'style-dictionary': patch
---

**BREAKING**: the `sketch/palette` format is registered under its documented name again. Since the enums were introduced in v4.3.0 the format was accidentally registered as `sketchPalette`, which made `format: 'sketch/palette'` throw "Can't find format". The `formats.sketchPalette` enum now resolves to `'sketch/palette'`, and the accidental `'sketchPalette'` string name is no longer accepted. If you used `format: 'sketchPalette'`, switch to `format: 'sketch/palette'` or use `formats.sketchPalette` from `style-dictionary/enums`.
