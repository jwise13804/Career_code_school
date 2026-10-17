---
title: Your first line of Python
minutes: 12
summary: Write and run real code in your browser, and learn the one instruction you'll use more than any other.
goals:
  - Explain what a program is, in your own words
  - Use print() to show a message
  - Spot the three most common first-day mistakes
---

## A program is a call script

You already follow scripts at work. When a customer rings because their card was declined, there's a set of steps: check the card status, check the balance, check for a fraud block, then explain.

A **program** is the same idea, written for a computer. It's a list of instructions, done one at a time, from the top down.

The big difference: a computer has **no common sense**. A colleague would understand "check the card thingy". A computer needs every step spelled out exactly. That's not a sign you're bad at this. It's just how computers are, for everybody.

```analogy
Think of the computer as a brand-new starter on their very first shift who follows the script **word for word**. If the script says "say hello", they say hello. If you forget to write "say goodbye", they never say it. They never guess.
```

## Python

The language we'll write in is called **Python**. It's one of the most popular languages for backend work: the part of an app you never see, where payments are approved, balances are worked out and disputes are tracked. You'll find it all over banks and fintechs: in backend services, data work and the small scripts that keep things running.

Python was designed to be readable, so it looks a lot like English. Here is a whole program:

```python
print("Hello, Sam!")
```

When it runs, it shows this:

```text
Hello, Sam!
```

## What `print` does

`print(...)` means **"show this on the screen"**. It's like the moment you send a message to the customer in a chat window.

- `print` is the instruction.
- The round brackets `( )` hold *what* to show.
- The quote marks `" "` mean **this is text, show it exactly as written**. Programmers call a piece of text a **[[string]]**.

You can have as many `print` lines as you like. They run in order, top to bottom:

```python
print("Hello, Sam!")
print("Your new card is on its way.")
print("It should arrive in 3 to 5 working days.")
```

## Notes to yourself: comments

Any line that starts with `#` is a **[[comment]]**. Python ignores it completely. Comments are for humans, like the internal notes on a case that the customer never sees.

```python
# Card replacement message - agreed with the complaints team
print("Your new card is on its way.")
```

## Your turn

Below is a real code editor. The code runs **in your browser**: nothing is installed and nothing is sent anywhere. The first time you press **Run**, Python downloads (about 8 MB, roughly as big as a few photos). After that it's quick.

```lab
id: p1-01-greet
title: Send your first message
project: true
--- task
Change the code so it prints these **two lines**, exactly:

    Hello, Sam!
    Your new card is on its way.

Press **Run** to see what your code prints. When you're happy, press **Check my answer**.
--- starter
# Your first program. Change the text inside the quotes.
print("Hello, world!")
--- tests
check_output("Hello, Sam!", tip="Check the capital letters, the comma and the exclamation mark.")
check_output("Your new card is on its way.", tip="Add a second print(...) line for the second message. Don't forget the full stop.")
check_output("Hello, Sam!\nYour new card is on its way.", tip="The greeting should come first, then the card message.")
--- hint
You need **two** `print(...)` lines, one under the other. Each line shows one message.
--- hint
Text goes inside quote marks, inside round brackets: `print("like this")`. Capital letters and punctuation must match exactly. Computers are fussy about that, just like a sort code.
--- hint
The first line should be `print("Hello, Sam!")`. Now add a second line in the same pattern for the card message.
--- solution
# Your first program. Change the text inside the quotes.
print("Hello, Sam!")
print("Your new card is on its way.")
```

## The three classic first-day mistakes

Everyone makes these. Every developer you'll ever work with has made them hundreds of times.

| Mistake | Example | What Python says |
| --- | --- | --- |
| Forgot a quote mark | `print("Hello)` | `SyntaxError: unterminated string literal` |
| Forgot a bracket | `print("Hello"` | `SyntaxError: '(' was never closed` |
| Capital letter | `Print("Hello")` | `NameError: name 'Print' is not defined` |

An error message isn't a telling-off. It's Python saying "I didn't understand this line", and it nearly always tells you **which line**. We have a whole lesson on reading errors later.

```tip
Try making one of these mistakes on purpose in the editor above, then press Run. Seeing the error when you *know* what caused it makes real errors far less scary later.
```

```quiz
p1-01-hello
```

## Practice this week

```practice
You'll get much more out of this course if you mix it with **CS50's Introduction to Programming with Python (CS50P)** from Harvard. It's free, friendly and excellent.

- Watch the first half of **Lecture 0** (Functions, Variables). Stop when it gets to "functions" if your 15 minutes are up. We cover that in lesson 6.
- You don't need to install anything yet. Keep using this site's editor.
```

```video
{
  "title": "CS50P Lecture 0: Functions, Variables",
  "provider": "Harvard CS50P",
  "url": "https://cs50.harvard.edu/python/weeks/0/",
  "minutes": 60,
  "why": "Watch the first part, about print and strings. It goes slower and deeper than this lesson, which suits a second pass."
}
```
