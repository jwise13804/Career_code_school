---
title: "GitHub Actions: tests on every push"
minutes: 15
summary: Tests only help if someone runs them. With continuous integration, a robot runs them on every single change, and broken code can't reach customers.
goals:
  - Explain what continuous integration (CI) is and why teams rely on it
  - Read a simple GitHub Actions workflow file
  - See how a failing test blocks a deploy, then fix it
---

## The four-eyes check, automated

Some actions in a bank need a second person to approve: a large refund, a write-off, changing a customer's address. It's the **four-eyes** rule, and it exists because mistakes are expensive.

**[[ci]]** (Continuous Integration) is the same idea for code. Every time anyone pushes a change, a fresh computer:

1. Copies the code
2. Installs what it needs
3. Checks the code is well-formed (**lint**)
4. Runs all the tests
5. Only if everything passes, **deploys** it (makes it live)

If any step fails, everything after it stops, so broken code never reaches customers.

```analogy
It's the refund approval queue. A refund that fails a check doesn't get paid out "just this once". It stops, goes red, and someone fixes it first.
```

## The workflow file

On GitHub, this pipeline is written in a small file in your project at `.github/workflows/ci.yml`. It's in a format called YAML: indented lists of settings.

```text
name: CI
on: [push]                      # run on every push

jobs:
  test:
    runs-on: ubuntu-latest      # a fresh computer, every time
    steps:
      - uses: actions/checkout@v5        # 1. copy the code
      - uses: actions/setup-python@v6    # 2. install Python
        with:
          python-version: "3.12"
      - run: pip install -r requirements.txt pytest
      - run: pytest                       # 4. run the tests
```

You don't need to memorise this. Real developers copy a starter file and adjust it. What matters is reading it: **on** says *when*, **steps** say *what*, top to bottom.

## Watch it happen

Below is a pipeline. A colleague has just changed the fee calculation, and there's a bug in it. **Lint** and **Tests** really run your Python in the browser; the other stages are simulated.

```ci
id: p3-04-ci
title: Fix the build
filename: fees.py
--- task
1. Press **git push** with the code as it is. Watch the tests fail and the deploy get **blocked**.
2. Read which test failed and why.
3. Fix the bug in `fees.py` and push again until the pipeline goes all green.
--- starter
def card_fee(amount):
    """1.5% fee, rounded to pennies, minimum 20p."""
    fee = round(amount * 0.01, 2)
    return max(fee, 0.20)
--- tests
check("card_fee(100)", 1.5, tip="1.5% of £100 is £1.50.", label="test_fee_is_one_and_a_half_percent: card_fee(100)")
check("card_fee(5)", 0.2, tip="1.5% of £5 is under 20p, so the minimum applies.", label="test_minimum_fee: card_fee(5)")
check("card_fee(1000)", 15.0, label="test_large_payment: card_fee(1000)")
--- hint
Look at the failing test: `card_fee(100)` gave `1.0`, not `1.5`. Which number in the code decides the percentage?
--- hint
1% as a decimal is `0.01`. What's 1.5% as a decimal?
--- hint
Change `0.01` to `0.015`, then push again.
--- solution
def card_fee(amount):
    """1.5% fee, rounded to pennies, minimum 20p."""
    fee = round(amount * 0.015, 2)
    return max(fee, 0.20)
```

```tip
Try breaking the code in other ways and pushing: delete a bracket (lint fails first), or misspell `amount` (tests fail with a NameError). Seeing *which* stage catches *which* mistake is a great intuition to build.
```

## Where you've seen this already

This very website deploys with GitHub Actions. Every change to a lesson runs a content check, and only then publishes the site to GitHub Pages. In Phase 4 your capstone project comes with its own `ci.yml`, ready to go.

```quiz
p3-04-ci
```

## Practice this week

```practice
- Microsoft Learn: [Build continuous integration workflows by using GitHub Actions](https://learn.microsoft.com/training/modules/github-actions-ci/) (free, about an hour, done in your own GitHub account).
- GitHub's own [Quickstart for GitHub Actions](https://docs.github.com/en/actions/get-started/quickstart) takes about 10 minutes.
- Add the workflow above to your `statement-totals` repository from Phase 1. Push, and watch the **Actions** tab.
```
