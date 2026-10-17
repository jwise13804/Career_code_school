---
title: Reading error messages calmly
minutes: 12
summary: Errors aren't failures. They're decline codes for your code, and once you can read them, they tell you exactly where to look.
goals:
  - Read a Python traceback from the bottom up
  - Recognise the six most common error types
  - Use a calm, repeatable routine to fix bugs
---

## Errors are decline codes

When a payment fails, the system doesn't just say "no". It gives a **reason code**: insufficient funds, card expired, suspected fraud. You've used those codes to help customers for years.

Python does the same. When your code fails, it tells you **what** went wrong and **where**. Developers spend a big part of every day reading these messages. It's a normal part of the job, not a sign you're doing it wrong.

## Anatomy of a traceback

Here's a full error, called a **[[traceback]]**:

```text
Traceback (most recent call last):
  File "main.py", line 7, in <module>
    print(statement_line("Amira", total))
  File "main.py", line 4, in statement_line
    return "Total for " + name + ": £" + total
TypeError: can only concatenate str (not "float") to str
```

**Read it from the bottom up:**

1. **The last line** is the most important: the error type (`TypeError`) and a description.
2. **Just above it** is the exact line that failed (line 4) and its code.
3. **Further up** is how the program got there: line 7 called `statement_line`, which failed on line 4.

In this course, the error box does some of this for you: it shows the line number and explains the error type in plain English.

## The common ones

| Error | Usually means | Support-desk version |
| --- | --- | --- |
| `SyntaxError` | Python can't read the line: a missing `:`, bracket or quote | The form is filled in wrong |
| `IndentationError` | Spacing at the start of a line is off | A step is filed under the wrong heading |
| `NameError` | You used a name Python doesn't know: often a typo | "No customer by that name" |
| `TypeError` | Mixing kinds of data, like text + number | Entering a name in the amount field |
| `KeyError` | A dictionary doesn't have that key | Asking for a field the record doesn't have |
| `IndexError` | A list doesn't have that position | Asking for line 10 of a 5-line statement |

## A calm routine

1. **Read the last line.** What type of error? What does it say?
2. **Find the line number.** Look at that line *and the one above it*. Missing colons and brackets often show up one line late.
3. **Change one thing**, then run again. If you change five things at once, you won't know which one fixed it.
4. **Still stuck after 10 minutes?** Press **Stuck? Ask Claude** at the bottom of the lesson. It copies your code and the error into a ready-made prompt.

```tip
When you fix one error, the next run may show a *different* error further down. That's progress! Python stops at the first problem it finds, so bugs show up one at a time.
```

## Your turn: three bugs

```lab
id: p1-09-debug
title: Fix the statement printer
--- task
This program has **three bugs**. Press **Run**, read the error, fix it, and run again. Repeat until it prints:

    Total for Amira: £60.7

Then press **Check my answer**. Change as little as possible: each bug is a one-line fix.
--- starter
transactions = [12.50, 3.20, 45.00]

def statement_line(name, total):
    return "Total for " + name + ": £" + total

total = 0
for amount in transactions
    total = total + amount

print(statment_line("Amira", total))
--- tests
check("total", 60.7, tip="The loop should add every amount to total.")
check("statement_line('Amira', 60.7)", "Total for Amira: £60.7", tip="Wrap total in str(...), or use an f-string.")
check_output("Total for Amira: £60.7")
--- hint
Bug 1 is a **SyntaxError** on the `for` line. What do `for`, `if` and `def` lines always end with?
--- hint
Bug 2 is a **NameError**: compare the name in the `print` line with the name of the function where it's defined. Spelling counts.
--- hint
Bug 3 is a **TypeError**: you can't join text and a number with `+`. Change `+ total` to `+ str(total)`, or rewrite the line as an f-string: `return f"Total for {name}: £{total}"`.
--- solution
transactions = [12.50, 3.20, 45.00]

def statement_line(name, total):
    return f"Total for {name}: £{total}"

total = 0
for amount in transactions:
    total = total + amount

print(statement_line("Amira", total))
```

```quiz
p1-09-errors
```

## Practice this week

```practice
- CS50P [Week 3: Exceptions](https://cs50.harvard.edu/python/weeks/3/) explains errors and how programs can handle them with `try` and `except`.
- Next time you see an error anywhere in this course, before reading the explanation, say out loud what type it is and which line it's on.
```
