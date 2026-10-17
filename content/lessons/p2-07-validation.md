---
title: Validating input with Pydantic
minutes: 15
status: planned
summary: Never trust input. Use Pydantic models to describe exactly what a valid request looks like, and reject the rest automatically.
goals:
  - Define a request body with a Pydantic model
  - Add rules like positive amounts and required fields
  - Understand FastAPI's automatic 422 responses
---

## What this lesson covers

- Request bodies with `BaseModel`
- `Field(gt=0)`, required vs optional fields, defaults
- Why a negative payment amount must be rejected before it reaches your logic
- Reading a 422 error response

```analogy
Validation is the mandatory fields on a dispute form: the case can't be submitted until the essentials are filled in correctly.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- FastAPI tutorial: [Request Body](https://fastapi.tiangolo.com/tutorial/body/) and [Body - Fields](https://fastapi.tiangolo.com/tutorial/body-fields/)
- Look at `PaymentRequest` in the capstone download (Phase 4). It uses exactly this.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
