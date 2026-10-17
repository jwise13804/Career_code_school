---
title: "Variables: labels for account details"
minutes: 12
summary: Store information under a name and use it again, the way a customer screen keeps the name, card number and balance in labelled fields.
goals:
  - Create variables and change their values
  - Tell text (strings) and numbers apart
  - Build a message with an f-string
---

## Labelled fields

When you open a customer record, you see labelled fields: **Name: Amira Khan**, **Card: ending 4421**, **Balance: £1,240.50**. The label stays the same; the value inside can change.

A **[[variable]]** is exactly that: a label with a value attached.

```python
customer_name = "Amira Khan"
card_last4 = "4421"
balance = 1240.50
```

Read the `=` as **"store"** or **"gets"**, not "equals". `balance = 1240.50` means *"store 1240.50 under the label balance"*.

Now you can use the label instead of the value:

```python
print(customer_name)   # shows: Amira Khan
print(balance)         # shows: 1240.5
```

Notice there are **no quote marks** around `customer_name` in `print(customer_name)`. Quotes would mean "this exact text". Without them, Python looks up the label and uses whatever's stored there.

## Changing a value

Values can change, just like a balance after a payment:

```python
balance = 500
balance = balance - 45    # take 45 off whatever balance was
print(balance)            # 455
```

The second line looks strange if you read `=` as "equals". Read it as: *work out `balance - 45`, then store the answer back in `balance`*.

## Naming rules

- Use lowercase words joined by underscores: `card_status`, `new_balance`. (This style is called *snake_case*.)
- No spaces, and don't start with a number.
- Capitals matter: `Balance` and `balance` are two different labels.
- Choose names that explain themselves. `x = 455` tells a colleague nothing; `new_balance = 455` tells them everything.

## Text or number?

```python
balance = 455      # a number: you can do maths with it
card_last4 = "4421"  # text: a label, not an amount
```

Why store `"4421"` as text? Because you'd never add two card endings together, and some start with zero (`"0042"`). If it's an *identifier*, not an *amount*, it's usually text.

## f-strings: filling in a template

You know templated messages with blanks: *"Dear {name}, your card ending {last4}…"*. Python has these too. They're called **[[f-string]]s**. Put an `f` before the opening quote and variables in `{curly brackets}`:

```python
name = "Sam"
last4 = "1204"
print(f"Hi {name}, your card ending {last4} has been frozen.")
```

shows

```text
Hi Sam, your card ending 1204 has been frozen.
```

```warning
Forget the `f` and Python prints the curly brackets literally: `Hi {name}, your card…`. No error, just a wrong message. That makes it an easy bug to miss!
```

## Your turn

```lab
id: p1-02-charge-message
title: Tell the customer about a payment
--- task
Priya's card was just charged £45.

1. Create a variable called `new_balance` that is `balance` minus `payment`. Use the variables, not the numbers.
2. Print this message using an f-string:

        Priya, your card ending 7765 was charged £45. Your new balance is £455.
--- starter
customer_name = "Priya"
card_last4 = "7765"
balance = 500
payment = 45

# 1. Work out the new balance
new_balance = 0

# 2. Print the message with an f-string
print("...")
--- tests
check("new_balance", 455, tip="new_balance should be balance - payment.")
check_output("Priya, your card ending 7765 was charged £45. Your new balance is £455.", tip="Check every word and the full stop. Did you put an f before the opening quote?")
--- hint
Line 7 should use the two variables: `new_balance = balance - payment`.
--- hint
An f-string starts with `f"` and variables go in curly brackets: `f"{customer_name}, your card ending {card_last4} ..."`
--- hint
The full line is `print(f"{customer_name}, your card ending {card_last4} was charged £{payment}. Your new balance is £{new_balance}.")`
--- solution
customer_name = "Priya"
card_last4 = "7765"
balance = 500
payment = 45

# 1. Work out the new balance
new_balance = balance - payment

# 2. Print the message with an f-string
print(f"{customer_name}, your card ending {card_last4} was charged £{payment}. Your new balance is £{new_balance}.")
```

```tip
Try changing `payment = 45` to `payment = 120` and press Run. The whole message updates by itself. That's the point of variables: write the logic once and it works for every customer.
```

```quiz
p1-02-variables
```

## Practice this week

```practice
- CS50P [Week 0](https://cs50.harvard.edu/python/weeks/0/): watch the part on variables and strings, then try **Problem Set 0**'s first problem ("Indoor Voice") in the [Practice bench](#/practice) scratchpad.
- Microsoft Learn: [Take your first steps with Python](https://learn.microsoft.com/en-us/training/paths/python-first-steps/) has short, free modules if you'd like a second explanation.
```
