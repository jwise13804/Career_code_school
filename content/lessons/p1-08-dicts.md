---
title: "Dictionaries: customer records"
minutes: 15
summary: Store a whole customer record (name, card, status, balance) as one value with labelled fields, then work with a list of them, the way real systems do.
goals:
  - Create a dictionary and read values by key
  - Update a field and add a new one
  - Loop through a list of dictionaries to answer a question
---

## A record with labelled fields

A list keeps things in order by position. But a customer record isn't "item 0, item 1, item 2". It's **name**, **card**, **status**. For that, Python has the **[[dictionary]]** (or *dict*):

```python
customer = {
    "name": "Amira Khan",
    "card_last4": "4421",
    "card_status": "active",
    "balance": 1240.50,
}
```

Curly brackets. Each line is a **key** (the label, in quotes), a colon, then the **value**.

```analogy
It's the customer screen in your CRM. The field names down the left are the keys, and what's filled in next to them are the values.
```

## Reading a field

Use square brackets with the key:

```python
print(customer["name"])          # Amira Khan
print(customer["card_status"])   # active
```

If the key doesn't exist, you get a **KeyError**:

```python
customer["email"]   # KeyError: 'email'
```

When a field might be missing, `.get()` is safer. It gives back a default instead of crashing:

```python
customer.get("email", "no email on file")   # 'no email on file'
```

## Changing and adding fields

```python
customer["card_status"] = "blocked"      # update an existing field
customer["email"] = "amira@example.com"  # add a new one
```

## Lists of dictionaries: a whole table

Put dictionaries in a list and you have a table of customers, the same shape as rows in a database, which is where Phase 1 heads next:

```python
customers = [
    {"name": "Amira Khan", "card_status": "active"},
    {"name": "Tom Walsh", "card_status": "blocked"},
    {"name": "Priya Patel", "card_status": "active"},
]

for customer in customers:
    if customer["card_status"] == "blocked":
        print(customer["name"])     # Tom Walsh
```

This shape (a list of records) is everywhere in backend work. API responses, database results and JSON files all look like this.

## Your turn

```lab
id: p1-08-dicts
title: Work with customer records
--- task
1. `card_message(customer)` should return:
   - `"Your card ending 4421 is active."` for an active card (with the right last 4 digits)
   - `"Your card ending 3381 is blocked. Please call us to unblock it."` for a blocked card
2. `blocked_names(customers)` should return a **list of the names** of customers whose card is blocked, in order.
--- starter
def card_message(customer):
    pass


def blocked_names(customers):
    names = []
    return names


amira = {"name": "Amira Khan", "card_last4": "4421", "card_status": "active"}
tom = {"name": "Tom Walsh", "card_last4": "3381", "card_status": "blocked"}

print(card_message(amira))
print(card_message(tom))
print(blocked_names([amira, tom]))
--- tests
check("card_message({'name': 'Amira Khan', 'card_last4': '4421', 'card_status': 'active'})", "Your card ending 4421 is active.", tip="Use customer['card_last4'] inside an f-string.")
check("card_message({'name': 'Tom Walsh', 'card_last4': '3381', 'card_status': 'blocked'})", "Your card ending 3381 is blocked. Please call us to unblock it.", tip="Check customer['card_status'] with an if.")
check("blocked_names([{'name': 'A', 'card_last4': '1', 'card_status': 'blocked'}, {'name': 'B', 'card_last4': '2', 'card_status': 'active'}, {'name': 'C', 'card_last4': '3', 'card_status': 'blocked'}])", ["A", "C"], tip="Loop through customers; append customer['name'] when the status is 'blocked'.")
check("blocked_names([])", [])
--- hint
Inside `card_message`, start with `if customer["card_status"] == "blocked":`.
--- hint
Each branch returns an f-string, e.g. `return f"Your card ending {customer['card_last4']} is active."`. Use **single** quotes for the key inside the f-string, because the f-string itself uses double quotes.
--- hint
For `blocked_names`: `for customer in customers:` then `if customer["card_status"] == "blocked":` then `names.append(customer["name"])`.
--- solution
def card_message(customer):
    if customer["card_status"] == "blocked":
        return f"Your card ending {customer['card_last4']} is blocked. Please call us to unblock it."
    return f"Your card ending {customer['card_last4']} is active."


def blocked_names(customers):
    names = []
    for customer in customers:
        if customer["card_status"] == "blocked":
            names.append(customer["name"])
    return names


amira = {"name": "Amira Khan", "card_last4": "4421", "card_status": "active"}
tom = {"name": "Tom Walsh", "card_last4": "3381", "card_status": "blocked"}

print(card_message(amira))
print(card_message(tom))
print(blocked_names([amira, tom]))
```

```tip
Notice the solution's `card_message` has no `else`. A `return` ends the function immediately, so if the card is blocked we never reach the last line. Both styles are fine.
```

```quiz
p1-08-dicts
```

## Practice this week

```practice
- CS50P [Week 2](https://cs50.harvard.edu/python/weeks/2/) ends with dictionaries ("dict"). Watch that section.
- On the [Practice bench](#/practice), write `total_balance(customers)` that adds up a `"balance"` field across a list of customer dicts.
```
