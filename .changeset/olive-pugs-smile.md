---
'style-dictionary': minor
---

Add support for DTCG v2025.10 `duration` token values, while remaining backwards compatible for Style Dictionary `time` tokens.

The `time/seconds` transform now also matches `duration` tokens and handles their object values, and `transition/css/shorthand` stringifies the `duration` and `delay` properties of a transition, including when those properties reference `duration` tokens.

```json
{
  "fast": {
    "$type": "duration",
    "$value": { "value": 200, "unit": "ms" }
  },
  "fade": {
    "$type": "transition",
    "$value": {
      "duration": "{fast}",
      "delay": { "value": 0, "unit": "ms" },
      "timingFunction": "ease-in-out"
    }
  }
}
```

`time/seconds` now uses the minimum amount of decimals that keeps the precision of the input, instead of a fixed two. A 1ms duration resolves to `0.001s` instead of being rounded away to `0.00s`, and a value that needs no decimals is no longer padded with them. A value that is already in seconds, e.g. `"0.36s"`, is also no longer divided a second time into `"0.00s"`.

Note that dropping the fixed two decimals changes existing output: a `time` token of `500` now transforms to `0.5s` rather than `0.50s`, and `1000` to `1s` rather than `1.00s`. The values are equivalent on every platform this transform targets.
