---
title: "Lists: a customer's transactions"
minutes: 14
summary: Keep many values in order under one name, like the lines on a statement, then add to them, count them and pick them out.
goals:
  - Create a list, read items by position, and add new ones
  - Use len, sum, max and min on a list
  - Write functions that take a list and return an answer
---

## A statement is a list

A card statement is an ordered list of transactions. Python has a type for exactly this, the **[[list]]**:

```python
amounts = [12.50, 3.20, 45.00, 9.99]
```

Square brackets, items separated by commas. A list can hold anything: numbers, text, even other lists.

## Positions start at zero

Each item has a position number, called its **index**. Python counts from **0**:

```python
amounts = [12.50, 3.20, 45.00, 9.99]
print(amounts[0])    # 12.5  (the first item)
print(amounts[2])    # 45.0  (the third item)
print(amounts[-1])   # 9.99  (negative counts from the end: the last item)
```

```warning
Counting from zero trips everyone up for a while. If you ask for `amounts[4]` in a list of four items, you get an `IndexError: list index out of range`. The last item is at position 3.
```

## Handy tools

```python
len(amounts)     # 4      how many items
sum(amounts)     # 70.69  add them all up
max(amounts)     # 45.0   the biggest
min(amounts)     # 3.2    the smallest
45.0 in amounts  # True   is it in the list?
```

## Adding to a list

`.append()` adds an item to the end, like a new transaction landing on the statement:

```python
amounts.append(4.20)
print(amounts)   # [12.5, 3.2, 45.0, 9.99, 4.2]
```

Lists can change after you create them. Programmers call this *mutable*.

## Building a new list with a loop

A very common pattern: go through one list and collect some items into a new one.

```python
amounts = [12.50, -3.20, 45.00, -9.99]
refunds = []

for amount in amounts:
    if amount < 0:
        refunds.append(amount)

print(refunds)   # [-3.2, -9.99]
```

Start with an empty list `[]`, loop, and `.append()` the ones you want.

## Your turn

```lab
id: p1-07-lists
title: Statement helpers
--- task
Here, **refunds are negative** amounts and payments are positive. Write three functions:

1. `count_transactions(amounts)`: returns how many amounts there are.
2. `largest_payment(amounts)`: returns the biggest amount.
3. `refunds_only(amounts)`: returns a **new list** containing only the negative amounts, in their original order.
--- starter
def count_transactions(amounts):
    pass


def largest_payment(amounts):
    pass


def refunds_only(amounts):
    refunds = []
    # loop through amounts and append the negative ones
    return refunds


statement = [12.5, -3.2, 45.0, 9.99, -20.0]
print(count_transactions(statement))
print(largest_payment(statement))
print(refunds_only(statement))
--- tests
check("count_transactions([12.5, -3.2, 45.0, 9.99, -20.0])", 5, tip="len() counts the items in a list.")
check("count_transactions([])", 0)
check("largest_payment([12.5, -3.2, 45.0, 9.99, -20.0])", 45.0, tip="max() gives the biggest item.")
check("refunds_only([12.5, -3.2, 45.0, 9.99, -20.0])", [-3.2, -20.0], tip="Loop through amounts; if amount < 0, append it to refunds.")
check("refunds_only([1, 2, 3])", [], tip="No negatives means an empty list.")
--- hint
For the first two, Python has a built-in that does all the work: `return len(amounts)` and `return max(amounts)`.
--- hint
In `refunds_only`, add a loop before the return: `for amount in amounts:` then, indented, `if amount < 0:`.
--- hint
Inside the `if`, add `refunds.append(amount)`. Keep `return refunds` at the end, outside the loop (4 spaces of indent, not 8).
--- solution
def count_transactions(amounts):
    return len(amounts)


def largest_payment(amounts):
    return max(amounts)


def refunds_only(amounts):
    refunds = []
    for amount in amounts:
        if amount < 0:
            refunds.append(amount)
    return refunds


statement = [12.5, -3.2, 45.0, 9.99, -20.0]
print(count_transactions(statement))
print(largest_payment(statement))
print(refunds_only(statement))
```

```quiz
p1-07-lists
```

## Practice this week

```practice
- CS50P [Week 2](https://cs50.harvard.edu/python/weeks/2/) covers lists in its second half.
- On the [Practice bench](#/practice), write `payments_only(amounts)`: the opposite of `refunds_only`.
```
