---
title: Numbers and money
minutes: 14
summary: Do sums in Python, discover why computers are surprisingly bad at pennies, and learn the trick every bank uses to get money exactly right.
goals:
  - Use + - * / and // on numbers
  - Explain why money is stored in pence (whole numbers)
  - Show an amount with exactly two decimal places
---

## Python as a calculator

```python
print(12 + 3)      # 15
print(20 - 4.5)    # 15.5
print(3 * 4)       # 12
print(10 / 4)      # 2.5
print(10 // 4)     # 2   (divide and round down to a whole number)
```

There are two kinds of number:

- **int** (integer): whole numbers like `12`, `0`, `-3`.
- **float**: numbers with a decimal point like `12.5` or `0.1`.

## The surprise: computers can't count pennies

Try this in your head: 0.10 + 0.20. Easy, 0.30. Now look at what Python says:

```python
print(0.1 + 0.2)
```

```text
0.30000000000000004
```

That's not a Python bug. Computers store decimals in binary, and some simple-looking decimals (like 0.1) can't be stored exactly, just as ⅓ can't be written exactly as 0.333… in decimal. The error is tiny, but in a bank it adds up across millions of transactions, and "tiny" is still wrong.

```analogy
You've seen a statement that's 1p out, and a customer who wants to know why. Rounding errors like this are one way that happens. Banks treat a 1p difference as a real defect, because it is.
```

## The fix banks use: count in pence

Store money as a **whole number of the smallest unit**: pence, not pounds. Whole numbers are always exact.

```python
coffee_pence = 350      # £3.50
cake_pence = 425        # £4.25
total_pence = coffee_pence + cake_pence
print(total_pence)      # 775, exactly
```

This is called storing money in **[[minor-units]]**, and real payment systems do it. Stripe's API, for example, takes `amount: 775` to mean £7.75.

Only turn pence back into pounds at the very end, when you show it to a person.

## Showing exactly two decimal places

`775 / 100` gives `7.75`. But `1250 / 100` gives `12.5`, and nobody writes money like that. To always show two decimal places, use `:.2f` inside an f-string:

```python
total = 1250 / 100
print(f"£{total}")       # £12.5
print(f"£{total:.2f}")   # £12.50
```

`.2f` means "2 places after the decimal point". You'll use this constantly.

## Rounding

For percentages, you'll get fractions of a penny. `//` divides and rounds **down** to a whole number, which is handy for "round down to whole pence":

```python
tip_pence = 775 * 10 // 100    # 10% of 775 = 77.5, rounded down to 77
```

There's also `round(77.5)`, but it has its own surprises (it rounds .5 to the nearest *even* number), so many payment teams write their rounding rule out explicitly. For now, `//` keeps things predictable.

## Your turn

```lab
id: p1-03-bill
title: Add up a café bill
--- task
A customer buys a coffee (350p) and a cake (425p), and leaves a **10% tip**, rounded **down** to whole pence.

1. `total_pence`: coffee plus cake.
2. `tip_pence`: 10% of `total_pence`, rounded down with `//`.
3. `charge_pence`: total plus tip.
4. Print the charge in pounds with two decimal places, exactly like this:

        Charged: £8.52
--- starter
coffee_pence = 350
cake_pence = 425

total_pence = 0
tip_pence = 0
charge_pence = 0

print("Charged: £...")
--- tests
check("total_pence", 775, tip="Add the two prices together.")
check("tip_pence", 77, tip="10% rounded down: total_pence * 10 // 100.")
check("charge_pence", 852, tip="charge_pence is the total plus the tip.")
check_output("Charged: £8.52", tip="Turn pence into pounds with / 100, and use :.2f inside the curly brackets.")
--- hint
`total_pence = coffee_pence + cake_pence`. Use the variable names, not the numbers, so it still works if prices change.
--- hint
For the tip: `tip_pence = total_pence * 10 // 100`. Then `charge_pence = total_pence + tip_pence`.
--- hint
To print: `print(f"Charged: £{charge_pence / 100:.2f}")`. The maths goes *inside* the curly brackets, then `:.2f`.
--- solution
coffee_pence = 350
cake_pence = 425

total_pence = coffee_pence + cake_pence
tip_pence = total_pence * 10 // 100
charge_pence = total_pence + tip_pence

print(f"Charged: £{charge_pence / 100:.2f}")
```

```quiz
p1-03-numbers
```

## Practice this week

```practice
- In the [Practice bench](#/practice) scratchpad, type `print(0.1 + 0.2)` and see it for yourself. Then try `print(10 + 20)` in pence. Exact!
- CS50P [Week 0](https://cs50.harvard.edu/python/weeks/0/) covers ints and floats. Try Problem Set 0's "Tip Calculator".
```
