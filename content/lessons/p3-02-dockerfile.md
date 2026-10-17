---
title: Writing a Dockerfile
minutes: 15
status: planned
summary: Write the Dockerfile for your customers API, line by line, and keep the image small and quick to build.
goals:
  - Write FROM, WORKDIR, COPY, RUN and CMD
  - Use a .dockerignore
  - Order the steps so rebuilds are fast
---

## What this lesson covers

- Choosing a base image like `python:3.12-slim`
- Why `requirements.txt` is copied before the code (layer caching)
- `.dockerignore`: keep secrets and junk out
- Building and running your own image

```analogy
A Dockerfile is a setup checklist for a new starter's laptop, written so precisely that a robot can follow it.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- Docker docs: [Dockerfile reference](https://docs.docker.com/reference/dockerfile/). Skim, don't read it all.
- Read the `Dockerfile` in the capstone download (Phase 4) and explain each line out loud.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
