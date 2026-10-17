---
title: "JSON: the shape of a request"
minutes: 12
status: planned
summary: JSON is how almost every API sends data. Learn to read it, write it and convert it to and from Python.
goals:
  - Read and write JSON objects and arrays
  - Convert between JSON and Python with the json module
  - Spot the common JSON mistakes (single quotes, trailing commas)
---

## What this lesson covers

- JSON objects, arrays, strings, numbers, true/false and null
- How JSON maps onto Python dictionaries and lists
- `json.loads()` and `json.dumps()`
- Why money in JSON should be pence (integers) or strings, never floats

```analogy
JSON is a standard form layout. Every team fills it in the same way, so anyone (or any system) can read it.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- MDN: [Working with JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON)
- Python docs: [the json module](https://docs.python.org/3/library/json.html). Read the first examples only.
- Paste the Mini Bank's `GET /customers` response into the Practice bench scratchpad and load it with `json.loads`.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
