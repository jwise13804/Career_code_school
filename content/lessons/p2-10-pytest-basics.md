---
title: "pytest: checks that run themselves"
minutes: 15
summary: A test is a tiny program that checks your real program. Write them once and they check your work forever, every time you change something.
goals:
  - Explain why teams write automated tests
  - Write a test function with assert
  - Run pytest and read a failure calmly
---

## Quality checks you never have to repeat

In support, you probably had quality checks: someone samples calls and ticks a checklist. Was the customer verified? Was the right refund amount given?

Code needs the same, but code changes many times a day. Nobody can re-check everything by hand each time. So developers write **[[test]]s**: small pieces of code that check the real code automatically, in seconds.

```analogy
A test is a **mystery shopper** you only have to brief once. "Buy a £100 item. The fee should be £1.50." From then on, every time anything changes, the mystery shopper runs again and reports back.
```

## `assert`: "this must be true"

Python has a keyword built for checking: `assert`. If what follows is true, nothing happens. If it's false, the program stops with an `AssertionError`.

```python
assert 2 + 2 == 4      # fine, nothing happens
assert 2 + 2 == 5      # AssertionError!
```

## A test is a function whose name starts with `test_`

**[[pytest]]** is the most popular testing tool for Python. It looks for files named `test_something.py`, finds every function whose name starts with `test_`, runs them all, and reports back.

```python
# test_fees.py
from fees import card_fee

def test_fee_is_one_and_a_half_percent():
    assert card_fee(100) == 1.50

def test_minimum_fee_is_20p():
    assert card_fee(5) == 0.20
```

Good test names read like a sentence: *test fee is one and a half percent*. When one fails, the name alone tells you what broke.

## Run them

On a real computer you'd install pytest (`pip install pytest`) and type `pytest` in a terminal. Here's a practice terminal to try it, including reading a real failure.

```terminal
pytest-run
```

## Your turn: write tests that catch bugs

A test is only useful if it **fails when the code is wrong**. In this lab, `card_fee` is correct. Write at least two tests. When you check, we'll secretly swap in two *broken* versions of `card_fee` and see whether your tests notice.

```lab
id: p2-10-write-tests
title: Write tests that catch bugs
--- task
The rules for the card fee:

- The fee is **1.5%** of the amount, rounded to pennies.
- But it's never less than **20p**.

Write at least **two** test functions (names starting with `test_`) that use `assert`. Then press **Check my answer**: we run your tests against the correct `card_fee`, then against two broken versions, to see whether your tests catch them.
--- starter
def card_fee(amount):
    """1.5% fee, rounded to pennies, minimum 20p."""
    fee = round(amount * 0.015, 2)
    return max(fee, 0.20)


# Write your tests below. Example shape:
# def test_something():
#     assert card_fee(...) == ...

def test_fee_on_100_pounds():
    assert card_fee(100) == 1.50
--- tests
_names = [n for n in list(globals()) if n.startswith("test_") and callable(globals()[n])]
record(len(_names) >= 2, f"You wrote {len(_names)} test function(s). We're looking for at least 2.", "Each test is a function whose name starts with test_ and contains an assert.")
_all_pass = bool(_names)
for _n in _names:
    try:
        globals()[_n]()
    except AssertionError:
        _all_pass = False
        record(False, f"{_n} failed against the CORRECT card_fee.", "A test should pass when the code is right. Check the number you expect in your assert.")
    except Exception as _e:
        _all_pass = False
        record(False, f"{_n} crashed: {type(_e).__name__}: {_e}")
if _all_pass:
    record(True, "All your tests pass against the correct code.")
_real = card_fee
def _no_minimum(amount):
    return round(amount * 0.015, 2)
def _one_percent(amount):
    return max(round(amount * 0.01, 2), 0.20)
for _label, _bug, _tip in [("forgets the 20p minimum", _no_minimum, "Add a test with a small amount, where 1.5% would be less than 20p."), ("charges 1% instead of 1.5%", _one_percent, "Add a test with a large enough amount that 1% and 1.5% give different fees.")]:
    _caught = False
    for _n in _names:
        _f = globals()[_n]
        _f.__globals__["card_fee"] = _bug
        try:
            _f()
        except Exception:
            _caught = True
        finally:
            _f.__globals__["card_fee"] = _real
    record(_caught, f"A broken version that {_label} was {'caught' if _caught else 'NOT caught'} by your tests.", _tip)
--- hint
You already have one test for £100. What happens with a really small payment, like £5? 1.5% of £5 is 7.5p, but the minimum is 20p.
--- hint
A second test could be `def test_minimum_fee():` with `assert card_fee(5) == 0.20` inside it.
--- hint
Make sure each test is a separate function, each name starts with `test_`, and the `assert` line is indented inside it.
--- solution
def card_fee(amount):
    """1.5% fee, rounded to pennies, minimum 20p."""
    fee = round(amount * 0.015, 2)
    return max(fee, 0.20)


def test_fee_on_100_pounds():
    assert card_fee(100) == 1.50

def test_minimum_fee_is_20p():
    assert card_fee(5) == 0.20
```

```tip
This "plant a bug and see if the tests notice" idea has a name: **mutation testing**. Mention it in an interview and it shows you understand *why* tests exist, not just how to write them.
```

```quiz
p2-10-pytest
```

## Practice this week

```practice
- Work through Microsoft Learn's free module [Testing with Pytest](https://learn.microsoft.com/training/modules/test-python-with-pytest/). It's about an hour, and you can split it over a few gaps.
- CS50P [Week 5: Unit Tests](https://cs50.harvard.edu/python/weeks/5/) covers the same ideas with great examples.
- Optional: install Python and pytest on your own computer with the [pytest Get Started guide](https://docs.pytest.org/en/stable/getting-started.html).
```

```video
{
  "title": "CS50P Lecture 5: Unit Tests",
  "provider": "Harvard CS50P",
  "url": "https://cs50.harvard.edu/python/weeks/5/",
  "minutes": 60,
  "why": "Shows pytest from scratch, including how to organise tests into files."
}
```
