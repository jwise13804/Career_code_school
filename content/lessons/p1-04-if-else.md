---
title: "Decisions: approve or decline"
minutes: 14
summary: Every card payment ends in a decision. Write the code that makes one, using if, elif and else.
goals:
  - Compare values with ==, !=, <, >, <= and >=
  - Write if / elif / else blocks with correct indentation
  - Combine conditions with and / or
---

## The decision behind every tap

When a card is tapped, the issuing bank's system decides in a fraction of a second: approve or decline? You know the reasons for a decline better than most developers: card blocked, insufficient funds, suspected fraud, expired card.

Code makes decisions with **if**.

## Comparing things

A comparison gives back `True` or `False` (these are called **booleans**):

| Code | Means | Example |
| --- | --- | --- |
| `==` | is equal to | `card_status == "active"` |
| `!=` | is not equal to | `card_status != "blocked"` |
| `<` / `>` | less / more than | `amount > 100` |
| `<=` / `>=` | at most / at least | `amount <= balance` |

```warning
`=` **stores** a value; `==` **compares** two values. Mixing them up is one of the most common beginner bugs. Python will usually tell you with a `SyntaxError`.
```

## if, elif, else

```python
amount = 30
balance = 50

if amount <= balance:
    print("Approved")
else:
    print("Declined: insufficient funds")
```

Read it like a script: *if the amount is no more than the balance, approve; otherwise, decline.*

Three details matter:

1. A **colon** `:` ends the `if` and `else` lines.
2. The lines that belong to it are **indented by 4 spaces**. That's how Python knows they're "inside" the if. It's like sub-steps in a call script.
3. Only **one** branch runs.

For more than two outcomes, add `elif` (short for "else if"). Python checks them **top to bottom** and stops at the first one that's true:

```python
if card_status == "blocked":
    print("Declined: card blocked")
elif amount > balance:
    print("Declined: insufficient funds")
else:
    print("Approved")
```

Order matters! We check for a blocked card *first*, because a blocked card should be declined even if there's plenty of money.

## and / or

```python
if card_status == "active" and amount <= balance:
    print("Approved")
```

- `and`: both must be true.
- `or`: at least one must be true.

## A word about functions

In the lab, your code is wrapped in a **function** called `decide`. That lets us test it with lots of different customers at once. You'll learn to write functions yourself in lesson 6. For now, two things to know:

- `balance`, `amount` and `card_status` are filled in for you each time `decide` is used.
- Instead of `print`, use **`return`** to hand the answer back, e.g. `return "Approved"`.

## Your turn

```lab
id: p1-04-decide
title: Approve or decline
--- task
Complete `decide` so it returns exactly one of these messages:

- `"Declined: card blocked"` if `card_status` is `"blocked"`
- `"Declined: insufficient funds"` if `amount` is more than `balance`
- `"Approved"` otherwise

A payment of **exactly** the balance should be approved.
--- starter
def decide(balance, amount, card_status):
    # Write your if / elif / else here.
    # Remember: return the message, and indent inside the if.
    return "Approved"


# Try it out:
print(decide(50, 30, "active"))
print(decide(50, 80, "active"))
print(decide(50, 30, "blocked"))
--- tests
check("decide(50, 30, 'active')", "Approved")
check("decide(50, 80, 'active')", "Declined: insufficient funds", tip="If amount > balance, return the insufficient funds message.")
check("decide(50, 30, 'blocked')", "Declined: card blocked", tip="Check card_status == 'blocked'.")
check("decide(10, 500, 'blocked')", "Declined: card blocked", tip="A blocked card should be declined for being blocked, even if funds are short too. Which check should come first?")
check("decide(50, 50, 'active')", "Approved", tip="Paying exactly the balance is fine: use > (more than), not >=.")
--- hint
Start with `if card_status == "blocked":`, then on the next line, indented by 8 spaces (4 for the function, 4 for the if), `return "Declined: card blocked"`.
--- hint
Next: `elif amount > balance:` with its own `return`, then `else:` for approved.
--- hint
Check the order: blocked first, then funds, then approved. And use `>` not `>=` so a payment of exactly the balance is approved.
--- solution
def decide(balance, amount, card_status):
    if card_status == "blocked":
        return "Declined: card blocked"
    elif amount > balance:
        return "Declined: insufficient funds"
    else:
        return "Approved"


# Try it out:
print(decide(50, 30, "active"))
print(decide(50, 80, "active"))
print(decide(50, 30, "blocked"))
```

```quiz
p1-04-if-else
```

## Practice this week

```practice
- CS50P [Week 1: Conditionals](https://cs50.harvard.edu/python/weeks/1/). Watch the lecture in two or three sittings; it's long but very clear.
- Try adding a fourth rule to your `decide` function on the [Practice bench](#/practice): decline any single payment over £1,000 with `"Declined: over limit"`. Where in the order should it go?
```

```video
{
  "title": "CS50P Lecture 1: Conditionals",
  "provider": "Harvard CS50P",
  "url": "https://cs50.harvard.edu/python/weeks/1/",
  "minutes": 60,
  "why": "if, elif, else, and/or explained from scratch with lots of examples."
}
```
