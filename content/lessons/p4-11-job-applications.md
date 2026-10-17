---
title: Applying to UK fintechs and banks
minutes: 15
summary: Download your project, then turn a year of learning (and years of payments experience) into applications for junior backend roles.
goals:
  - Download your project files and publish them on GitHub
  - Write a CV that translates support experience into engineering value
  - Prepare for the typical junior backend interview
---

## First: download your work

```download
{
  "title": "Download my project files",
  "folder": "card-payments-api",
  "files": [
    "README.md",
    "requirements.txt",
    "Dockerfile",
    { "from": "gitignore.txt", "to": ".gitignore" },
    { "from": "github-ci.yml", "to": ".github/workflows/ci.yml" },
    "app/__init__.py",
    "app/main.py",
    "app/database.py",
    "app/ledger.py",
    "app/disputes.py",
    "tests/__init__.py",
    "tests/conftest.py",
    "tests/test_payments.py",
    "tests/test_disputes.py"
  ]
}
```

Then follow the "Putting it on GitHub" steps from the [portfolio lesson](#/lesson/p4-10-portfolio). Before you apply anywhere, run `pytest -v` on your own computer and make sure you can explain every file.

## Your unfair advantage

Most junior developer applicants have never seen a chargeback, never explained a pending transaction, and never handled a customer whose card was declined abroad. **You have.** UK fintechs and banks value domain knowledge a lot, because it means fewer misunderstandings and better questions.

```analogy
You already know what goes wrong in payments from the customer's side. Now you can say: "I know what goes wrong, and I know how to build it so it doesn't."
```

## Where to look

- **Internal moves first.** Your current employer already knows you're reliable. Ask your manager about engineering apprenticeships, internal transfers or shadowing a backend team. Many companies prefer to grow their own people, and this is often the easiest door.
- **Junior / graduate / associate engineer roles** at fintechs, payment companies and banks. Search for "junior backend engineer", "associate software engineer", "graduate software engineer (career changers welcome)", "Python developer".
- **Software engineering apprenticeships** (Level 4 is common in the UK). These are paid, real jobs with training, and many are open to adults of any age.
- **Job boards**: LinkedIn, Indeed, Welcome to the Jungle (formerly Otta) for startups and scale-ups, and company careers pages directly.
- **Communities**: local Python meetups (many UK cities have them), women-in-tech groups and online communities. A friendly referral beats a cold application.

## The CV

Keep it to **two pages at most**. Lead with what makes you different:

1. **Headline**: *"Backend developer (Python, SQL, FastAPI) with 4 years' experience in card payments operations."*
2. **Projects** (above work history while you're switching): your capstone, with one line on idempotency, the ledger and the dispute state machine, plus a link.
3. **Skills**: Python, SQL, FastAPI, pytest, Git and GitHub, Docker, GitHub Actions, REST APIs, payments domain (disputes, chargebacks, authorisation and settlement, PCI DSS awareness, SCA).
4. **Experience**: translate support work into engineering-relevant outcomes:
   - ❌ *"Answered customer calls about payments."*
   - ✅ *"Resolved 40+ card dispute cases a week, working across the chargeback lifecycle with scheme deadlines."*
   - ✅ *"Spotted a recurring duplicate-charge pattern and documented it for the engineering team."* (Use your own real examples.)

## The interview

A typical junior backend process is: a short call → a **technical exercise** (a take-home task or live pair programming) → a **conversation about your project** → a **values/behavioural** interview. Prepare:

- **Talk through your capstone in 3 minutes**: the problem, the design choices, what you'd improve.
- **Expect payments questions you can now answer**:
  - *"What happens if the client times out and retries a payment?"* → idempotency keys.
  - *"How would you store money?"* → integers in minor units, never floats.
  - *"How do you make sure balances are always right?"* → a double-entry ledger, with balances derived from entries.
  - *"How would you stop a closed dispute being reopened?"* → a state machine.
- **Behavioural questions**: use the **STAR** method (Situation, Task, Action, Result). Your support career is full of great stories: a complex escalation, a process you improved, a time you calmed down a furious customer.
- **It's fine to say "I don't know, but here's how I'd find out."** Interviewers value honesty and a clear approach far more than bluffing.

```tip
Use the **Stuck? Ask Claude** button on this page to practise: paste in a job description and ask Claude to interview you for it, one question at a time, with feedback.
```

## Keep going

You won't feel "ready". Almost nobody does. If you can build, test and explain your capstone, **apply**. Rejections are normal, and each interview makes the next one easier. Keep coding a little each week, keep your streak gentle, and keep your GitHub moving.

```quiz
p4-11-jobs
```

```practice
- Find three junior backend job adverts at UK fintechs or banks. Highlight every skill you've learned in this course. You'll be surprised how much is highlighted.
- Write your CV headline and your 3-minute project story. Record yourself saying the story out loud.
- Tell your manager at work what you've been learning. Internal opportunities often start with that conversation.
```
