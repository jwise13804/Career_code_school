---
title: "Mini project: total a list of transactions"
minutes: 15
summary: Put everything from Phase 1's Python lessons together and write a real piece of statement logic, the kind of code that runs inside every bank.
goals:
  - Combine loops, if/else, dictionaries and functions in one program
  - Handle payments, refunds and declined transactions correctly
  - Format money for customers, and test edge cases like an empty statement
---

## The brief

You've been asked to write the code behind a statement total. Here's the data, a list of transaction records, with money in **pence** (lesson 3!):

```python
transactions = [
    {"merchant": "Tesco",   "type": "payment", "amount_pence": 4250, "status": "approved"},
    {"merchant": "Greggs",  "type": "payment", "amount_pence": 385,  "status": "approved"},
    {"merchant": "ASOS",    "type": "payment", "amount_pence": 6000, "status": "declined"},
    {"merchant": "ASOS",    "type": "refund",  "amount_pence": 1500, "status": "approved"},
]
```

The rules, which you could explain to a customer in your sleep:

- **Approved payments** add to the total.
- **Approved refunds** take away from it.
- **Declined** anything doesn't count at all: no money moved.

So the total here is 4250 + 385 − 1500 = **3135p**, shown as **£31.35**.

```analogy
This is the "why doesn't my statement add up?" call, turned into code. Declined transactions showing as pending, and refunds that customers forget to subtract: you know where the confusion comes from, and that knowledge is genuinely valuable when writing this logic.
```

## Plan before you code

Professional developers break a problem into small functions. Ours:

1. `total_pence(transactions)`: loop, apply the rules, return a whole number of pence.
2. `format_pounds(pence)`: turn `3135` into the **text** `"£31.35"`.

Then the program just uses both:

```python
print(format_pounds(total_pence(transactions)))   # £31.35
```

## Edge cases

An **[[edge-case]]** is an unusual input that's easy to forget. Good developers test them on purpose:

- An **empty** statement should total `"£0.00"`, not crash.
- A statement with **only declined** transactions should also be `"£0.00"`.
- If refunds are bigger than payments, the total is **negative**: show it as `"-£5.00"` rather than `"£-5.00"`.

## Build it

```lab
id: p1-10-statement
title: The statement total
project: true
--- task
1. Finish `total_pence(transactions)` using the three rules above.
2. Finish `format_pounds(pence)` so it returns **text** like `"£31.35"`: always two decimal places, and a minus sign *before* the £ for negative totals (`"-£5.00"`).

Our checks include the edge cases. Read any failure messages carefully: they say what your function gave and what we expected.
--- starter
def total_pence(transactions):
    total = 0
    for t in transactions:
        # Apply the rules:
        #   approved payment -> add
        #   approved refund  -> subtract
        #   declined         -> ignore
        pass
    return total


def format_pounds(pence):
    return pence / 100


transactions = [
    {"merchant": "Tesco", "type": "payment", "amount_pence": 4250, "status": "approved"},
    {"merchant": "Greggs", "type": "payment", "amount_pence": 385, "status": "approved"},
    {"merchant": "ASOS", "type": "payment", "amount_pence": 6000, "status": "declined"},
    {"merchant": "ASOS", "type": "refund", "amount_pence": 1500, "status": "approved"},
]

print(format_pounds(total_pence(transactions)))
--- tests
_example = [
    {"merchant": "Tesco", "type": "payment", "amount_pence": 4250, "status": "approved"},
    {"merchant": "Greggs", "type": "payment", "amount_pence": 385, "status": "approved"},
    {"merchant": "ASOS", "type": "payment", "amount_pence": 6000, "status": "declined"},
    {"merchant": "ASOS", "type": "refund", "amount_pence": 1500, "status": "approved"},
]
check("total_pence(" + repr(_example) + ")", 3135, label="total_pence(the example statement)", tip="4250 + 385 - 1500. The declined ASOS payment shouldn't count.")
check("total_pence([])", 0, tip="An empty statement should total 0.")
check("total_pence([{'merchant': 'X', 'type': 'payment', 'amount_pence': 999, 'status': 'declined'}])", 0, label="total_pence(only a declined payment)", tip="Declined transactions don't move money, so skip them.")
check("total_pence([{'merchant': 'X', 'type': 'refund', 'amount_pence': 500, 'status': 'approved'}])", -500, label="total_pence(only a refund)", tip="Approved refunds are subtracted.")
check("format_pounds(1250)", "£12.50", tip="Return text: f\"£{pence / 100:.2f}\" gives two decimal places.")
check("format_pounds(3135)", "£31.35")
check("format_pounds(0)", "£0.00")
check("format_pounds(-500)", "-£5.00", tip="For negative amounts, put the minus sign first: work out the text for abs(pence), then add '-' in front.")
check_output("£31.35", tip="The last line should print the formatted total.")
--- hint
Inside the loop, start with `if t["status"] == "declined":` then `continue`. `continue` means "skip to the next transaction". (Or check for `"approved"` and do everything inside that `if`.)
--- hint
Then: `if t["type"] == "payment":` add `t["amount_pence"]` to `total`; otherwise subtract it. For `format_pounds`, return an f-string like `f"£{pence / 100:.2f}"`. It must *return text*, not a number.
--- hint
For negatives: `if pence < 0: return "-" + format_pounds(abs(pence))`. `abs()` removes the minus sign, so you can reuse the positive version.
--- solution
def total_pence(transactions):
    total = 0
    for t in transactions:
        if t["status"] != "approved":
            continue
        if t["type"] == "payment":
            total = total + t["amount_pence"]
        elif t["type"] == "refund":
            total = total - t["amount_pence"]
    return total


def format_pounds(pence):
    if pence < 0:
        return "-" + format_pounds(abs(pence))
    return f"£{pence / 100:.2f}"


transactions = [
    {"merchant": "Tesco", "type": "payment", "amount_pence": 4250, "status": "approved"},
    {"merchant": "Greggs", "type": "payment", "amount_pence": 385, "status": "approved"},
    {"merchant": "ASOS", "type": "payment", "amount_pence": 6000, "status": "declined"},
    {"merchant": "ASOS", "type": "refund", "amount_pence": 1500, "status": "approved"},
]

print(format_pounds(total_pence(transactions)))
```

## You built something real

This is genuinely the kind of function that sits inside banking apps. In Phase 2 it'll sit behind an API; in Phase 3 its tests will run automatically on every change; and in Phase 4 it grows into a proper ledger.

Your code is saved, and it will be included when you press **Download my project files** at the end of the course.

```practice
- Save this program on your own computer as `totals.py`. The next Git lessons use exactly this file. (No Python installed yet? That's fine: the Git practice terminal pretends you have it.)
- Stretch: add a third function, `spend_by_merchant(transactions)`, that returns a dictionary like `{"Tesco": 4250, "Greggs": 385}` for approved payments only.
- CS50P Problem Set 2 has more practice with exactly these tools.
```

```quiz
p1-10-project
```
