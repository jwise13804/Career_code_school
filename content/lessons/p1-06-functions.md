---
title: "Functions: your saved macros"
minutes: 15
summary: Package a set of steps under a name, give it inputs, and get an answer back. Functions are how all real code is organised.
goals:
  - Define a function with def, parameters and return
  - Explain the difference between print and return
  - Call a function with different inputs
---

## Canned responses

You probably have saved replies or macros: one click and a whole paragraph appears, with the customer's name filled in. You wrote it once and use it a hundred times a day.

A **[[function]]** is a saved set of steps with a name. You've already used some that Python provides: `print()`, `round()`, `len()`. Now you'll write your own.

## Defining a function

```python
def card_fee(amount):
    fee = amount * 0.015
    return round(fee, 2)
```

- `def` means "define a function".
- `card_fee` is its name. Same naming rules as variables.
- `amount` in brackets is a **[[parameter]]**: an input, a blank to fill in.
- The indented lines are the steps.
- `return` hands the answer back to whoever asked.

Defining a function doesn't run it, just as writing a macro doesn't send it. You **call** it by name, with a value for each parameter:

```python
print(card_fee(100))    # 1.5
print(card_fee(250))    # 3.75
```

Each time, `amount` holds whatever you passed in. The value you pass is called an **argument**.

## More than one input

```python
def new_balance(balance, payment):
    return balance - payment

print(new_balance(500, 45))   # 455
```

The order matters: the first argument goes to the first parameter.

## print vs return: the big one

This catches everyone out at first.

- `print` **shows** something on screen, for a human. The program can't use it afterwards.
- `return` **hands back** a value so the rest of the program can use it.

```python
def fee_printed(amount):
    print(amount * 0.015)

def fee_returned(amount):
    return amount * 0.015

total = 100 + fee_returned(100)   # works: 101.5
total = 100 + fee_printed(100)    # TypeError! fee_printed gave back nothing
```

A function without `return` gives back `None`, Python's word for "nothing". If you see `None` where you expected an answer, look for a missing `return`.

```analogy
`print` is saying the answer out loud on a call. `return` is typing it into the system, so the next step of the process can use it.
```

## Why bother?

- **Write once, use everywhere.** The fee rule lives in one place.
- **Change once.** If the fee becomes 1.75%, you change one line.
- **Test it.** You can check a function with lots of inputs, which is exactly what our hidden checks have been doing to `decide` since lesson 4!

## Your turn

```lab
id: p1-06-functions
title: Write two helper functions
--- task
1. Finish `greeting(name)` so it **returns** (not prints) `"Hello, NAME! How can I help today?"` with the name filled in.
2. Write `card_fee(amount)` that returns **1.5%** of `amount`, rounded to 2 decimal places, but **never less than 0.20**.

Hint for the minimum: `max(a, b)` gives back the bigger of two numbers.
--- starter
def greeting(name):
    print(f"Hello, {name}! How can I help today?")


def card_fee(amount):
    # 1.5% of amount, rounded to 2 places, minimum 0.20
    pass


print(greeting("Amira"))
print(card_fee(100))
print(card_fee(5))
--- tests
check("greeting('Amira')", "Hello, Amira! How can I help today?", tip="Use return instead of print inside the function.")
check("greeting('Tom')", "Hello, Tom! How can I help today?")
check("card_fee(100)", 1.5, tip="1.5% as a decimal is 0.015. Then round(..., 2).")
check("card_fee(250)", 3.75)
check("card_fee(5)", 0.2, tip="1.5% of 5 is 0.075, which is under the 20p minimum, so the fee should be 0.20. Try max(fee, 0.20).")
--- hint
`pass` means "do nothing yet". Replace it. For `greeting`, swap the word `print` for `return` (and remove the brackets around the f-string, or keep them: both work).
--- hint
In `card_fee`: `fee = round(amount * 0.015, 2)` works out the percentage. What should you do if it's below 0.20?
--- hint
`return max(fee, 0.20)` returns whichever is bigger: the fee or the 20p minimum.
--- solution
def greeting(name):
    return f"Hello, {name}! How can I help today?"


def card_fee(amount):
    fee = round(amount * 0.015, 2)
    return max(fee, 0.20)


print(greeting("Amira"))
print(card_fee(100))
print(card_fee(5))
```

Notice the starter code printed `None` at first for `greeting`? That was the missing `return` in action.

```quiz
p1-06-functions
```

## Practice this week

```practice
- CS50P [Week 0](https://cs50.harvard.edu/python/weeks/0/), second half: "Functions". This is a good moment to watch it, now that you've written some.
- Write a function `mask(last4)` on the [Practice bench](#/practice) that returns `"**** **** **** 4421"` for `"4421"`.
```
