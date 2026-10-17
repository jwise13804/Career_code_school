# TODO

## Unverified videos (shown as "Watch" cards, not embeds)

The build environment couldn't reach YouTube, so **no video IDs were verified**. Following the rule "never invent IDs", every `video` block links to the official course or documentation page instead of embedding a video.

To turn one into an embed:

1. Open the official page below and find the lecture's YouTube link.
2. Check that the video is the right lecture and plays.
3. Add `"youtube": "<the ID>", "verified": true` to that lesson's `video` block. It then plays inline via `youtube-nocookie.com`, and only after she presses play.

| Lesson | Video card | Official page to take the ID from |
| --- | --- | --- |
| p1-01-hello | CS50P Lecture 0: Functions, Variables | https://cs50.harvard.edu/python/weeks/0/ |
| p1-04-if-else | CS50P Lecture 1: Conditionals | https://cs50.harvard.edu/python/weeks/1/ |
| p1-05-loops | CS50P Lecture 2: Loops | https://cs50.harvard.edu/python/weeks/2/ |
| p1-11-sql-select | SQLBolt introduction (interactive, not a video) | https://sqlbolt.com/ |
| p2-01-what-is-an-api | FastAPI docs: First Steps (docs page) | https://fastapi.tiangolo.com/tutorial/first-steps/ |
| p2-10-pytest-basics | CS50P Lecture 5: Unit Tests | https://cs50.harvard.edu/python/weeks/5/ |
| p3-01-docker-concepts | Docker: Get Started | https://docs.docker.com/get-started/ |

Microsoft Learn modules are linked from lesson "Practice this week" boxes; they're text-and-exercise modules, so they don't need embeds.

## Content still to write (lessons marked `status: planned`)

- Phase 2: p2-02 status codes, p2-03 JSON, p2-05 FastAPI first app, p2-06 path and query, p2-07 validation, p2-08 SQLite from Python, p2-09 SQL injection, p2-11 testing an API, p2-12 customers API project
- Phase 3: p3-02 Dockerfile, p3-03 Compose, p3-05 linting, p3-06 cloud basics, p3-07 deploying, p3-08 logs, p3-09 secrets
- Phase 4: p4-04 capstone plan, p4-06 ledger, p4-08 capstone tests, p4-09 README

Each already has goals, an outline, a support-desk comparison and checked free resources.

## Ideas

- A "Phase complete" celebration screen and certificate-style summary to share.
- An SQL lab for the ledger (balances from entries) in p4-06.
- A Docker Compose terminal scenario for p3-03.
- Optional offline support (a service worker caching the site and Pyodide).
