---
title: "JOIN: connecting cards to customers"
minutes: 15
summary: Data is split across tables on purpose. JOIN puts it back together, so you can answer questions like "whose card is this?"
goals:
  - Explain primary keys and foreign keys
  - Join two tables with JOIN ... ON
  - Join three tables to follow a transaction back to its customer
---

## Why split data into tables?

Look at the `cards` table. It doesn't have the customer's name, just a `customer_id`. Why not store the name on every card?

Because if Amira changes her name, you'd have to update it on every card, every transaction and every dispute, and if you miss one, the data disagrees with itself. Instead, each fact is stored **once**, and tables point at each other.

- Every table has an `id` column: its **[[primary-key]]**, a unique reference, like a customer number.
- `cards.customer_id` holds a customer's `id`. A column that points at another table's id is a **[[foreign-key]]**.

```analogy
It's like a case that says "Customer ref: 1". You don't copy the customer's details into the case; you look them up by the reference. A JOIN does the looking-up for you, for every row at once.
```

## JOIN … ON

```sql
SELECT customers.name, cards.last4
FROM cards
JOIN customers ON cards.customer_id = customers.id;
```

Read it as: *take each card, find the customer whose `id` matches the card's `customer_id`, and put them side by side.*

- `ON` says how the tables connect.
- When two tables both have a column with the same name (both have `id`!), write `table.column` to be clear. It's good practice to always do this in a join.

## Joining three tables

A transaction belongs to a card, and a card belongs to a customer. To get from a transaction to a customer's name, join twice:

```sql
SELECT customers.name, transactions.merchant, transactions.amount
FROM transactions
JOIN cards ON transactions.card_id = cards.id
JOIN customers ON cards.customer_id = customers.id;
```

You can add `WHERE` after the joins as usual.

## Your turn

```sql-lab
{
  "id": "p1-13-sql",
  "title": "Join the tables",
  "challenges": [
    { "id": "card-owners", "prompt": "Show each card's owner **name** and the card's **last4**, in that order.", "solution": "SELECT customers.name, cards.last4 FROM cards JOIN customers ON cards.customer_id = customers.id;", "hint": "`FROM cards JOIN customers ON cards.customer_id = customers.id`" },
    { "id": "blocked-owners", "prompt": "Show the **name** and **last4** for **blocked** cards only.", "solution": "SELECT customers.name, cards.last4 FROM cards JOIN customers ON cards.customer_id = customers.id WHERE cards.status = 'blocked';", "hint": "Same join as before, then `WHERE cards.status = 'blocked'`." },
    { "id": "dispute-details", "prompt": "For every dispute, show the dispute **id**, the transaction's **merchant** and **amount**, and the dispute **status**.", "solution": "SELECT disputes.id, transactions.merchant, transactions.amount, disputes.status FROM disputes JOIN transactions ON disputes.transaction_id = transactions.id;", "hint": "`disputes.transaction_id` points at `transactions.id`." },
    { "id": "amira", "prompt": "Show **name**, **merchant** and **amount** for all of **Amira Khan**'s transactions (on any of her cards).", "solution": "SELECT customers.name, transactions.merchant, transactions.amount FROM transactions JOIN cards ON transactions.card_id = cards.id JOIN customers ON cards.customer_id = customers.id WHERE customers.name = 'Amira Khan';", "hint": "Join transactions → cards → customers, then `WHERE customers.name = 'Amira Khan'`." }
  ]
}
```

```quiz
p1-13-sql
```

## Practice this week

```practice
- SQLBolt [Lesson 6: Multi-table queries with JOINs](https://sqlbolt.com/lesson/select_queries_with_joins).
- Challenge yourself on the [Practice bench](#/practice): which customer opened dispute 7? (Three joins!)
```
