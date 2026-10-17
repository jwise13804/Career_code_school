---
title: "Loops: working through the queue"
minutes: 14
summary: Do the same thing for every item in a list, whether that's three transactions or three million, with a for loop.
goals:
  - Write a for loop over a list
  - Keep a running total and a count inside a loop
  - Recognise (and stop) a loop that never ends
---

## Working the queue

At the start of a shift you have a queue: case after case, and you do the same checks on each one. You don't write a new process for every case. You repeat one process until the queue is empty.

A **[[loop]]** does exactly this. Here's a list of transaction amounts (square brackets, items separated by commas; there's a whole lesson on lists soon):

```python
amounts = [12.50, 250.00, 8.99]

for amount in amounts:
    print(f"Checking £{amount}")
```

```text
Checking £12.5
Checking £250.0
Checking £8.99
```

Read `for amount in amounts:` as **"for each amount in the amounts list, do this"**. The indented lines run once per item, and each time round, `amount` holds the next item.

```analogy
`amount` is like "the current case". It's a different case each time, but the steps you follow are the same.
```

## Running totals

To add things up, start a total at zero *before* the loop, and add to it *inside* the loop:

```python
amounts = [12.50, 3.20, 45.00]
total = 0

for amount in amounts:
    total = total + amount

print(total)   # 60.7
```

The same pattern counts things. Combine it with an `if` to count only some of them:

```python
large = 0
for amount in amounts:
    if amount > 40:
        large = large + 1
print(large)   # 1
```

Watch the indentation: the `if` is inside the loop (4 spaces), and the line inside the `if` has 8 spaces.

```tip
`total += amount` is a shortcut for `total = total + amount`. You'll see both in real code.
```

## Counting with range

`range(3)` gives the numbers 0, 1, 2. It's handy for "do this 3 times":

```python
for attempt in range(3):
    print(f"Retry {attempt + 1}")
```

## while loops, and the loop that never ends

A `while` loop repeats *as long as* something is true:

```python
balance = 100
while balance > 0:
    balance = balance - 30
    print(balance)
```

If the condition never becomes false, the loop runs **forever**. Every developer writes one of these by accident eventually. In this course, the **Stop** button rescues you, and anything running over 10 seconds is stopped automatically. Try it: write `while True:` and `print("hi")` (indented), press Run, then press Stop.

## Your turn

```lab
id: p1-05-flag
title: Flag large transactions for review
--- task
Fraud rules flag any transaction **over £100** for review.

1. Loop through `queue`.
2. For each amount over 100, print `Review: £` followed by the amount, e.g. `Review: £250.0`.
3. Count the flagged ones in `flagged_count`.
4. Add up **all** the amounts in `queue_total` (flagged or not).
--- starter
queue = [12.5, 250.0, 8.99, 1200.0, 45.0, 100.0]

flagged_count = 0
queue_total = 0

# Write your loop here

print(f"{flagged_count} flagged, £{queue_total:.2f} in total")
--- tests
check_output("Review: £250.0", tip="Print inside an if that checks amount > 100.")
check_output("Review: £1200.0")
check("flagged_count", 2, tip="Exactly £100 is not *over* £100, so it shouldn't be flagged. Use > not >=.")
check("round(queue_total, 2)", 1616.49, label="queue_total", tip="Add every amount, inside the loop but outside the if.")
check_no_output("Review: £100.0", tip="£100.0 isn't *over* £100, so it shouldn't be flagged. Use > rather than >=.")
--- hint
Start with `for amount in queue:` and indent everything that should happen for each amount by 4 spaces.
--- hint
Inside the loop: `queue_total = queue_total + amount`. Then `if amount > 100:` with the print and `flagged_count = flagged_count + 1` indented under it (8 spaces).
--- hint
The print looks like `print(f"Review: £{amount}")`.
--- solution
queue = [12.5, 250.0, 8.99, 1200.0, 45.0, 100.0]

flagged_count = 0
queue_total = 0

for amount in queue:
    queue_total = queue_total + amount
    if amount > 100:
        print(f"Review: £{amount}")
        flagged_count = flagged_count + 1

print(f"{flagged_count} flagged, £{queue_total:.2f} in total")
```

```quiz
p1-05-loops
```

## Practice this week

```practice
- CS50P [Week 2: Loops](https://cs50.harvard.edu/python/weeks/2/). The first half covers `while` and `for`.
- On the [Practice bench](#/practice), find the **smallest** amount in a list using a loop (start with the first item, and replace it whenever you find a smaller one).
```

```video
{
  "title": "CS50P Lecture 2: Loops",
  "provider": "Harvard CS50P",
  "url": "https://cs50.harvard.edu/python/weeks/2/",
  "minutes": 60,
  "why": "for, while and range with many small examples. Pause and type them out."
}
```
