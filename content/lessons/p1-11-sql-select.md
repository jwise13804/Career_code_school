---
title: "SELECT: looking up records"
minutes: 12
summary: Meet a real database of customers, cards, transactions and disputes, and ask it your first questions in SQL.
goals:
  - Explain what a database, table, row and column are
  - Write SELECT ... FROM ... to fetch data
  - Choose specific columns and limit how many rows come back
---

## You already use databases

Every time you searched for a customer in your CRM, a **[[database]]** answered. Behind the screen, there's software storing millions of records and answering questions about them in milliseconds.

Most bank and fintech data lives in **relational databases**, organised as **tables**:

- A **[[table]]** is like one spreadsheet: `customers`, `cards`, `transactions`.
- A **row** is one record: one customer, one card, one transaction.
- A **column** is one field: `name`, `city`, `amount`.

```analogy
Looking up one customer at a time is the CRM search box. SQL is how you ask about **all of them at once**: "every blocked card", "total refunds this month", "which merchant gets the most disputes". That's a superpower in an operations team, and an everyday tool for a backend developer.
```

## SQL

**[[sql]]** (Structured Query Language, said "S-Q-L" or "sequel") is the language for asking databases questions. A question is called a **query**. The simplest query:

```sql
SELECT * FROM customers;
```

- `SELECT` means "show me".
- `*` means "every column".
- `FROM customers` says which table.
- The `;` marks the end of the query.

SQL keywords are usually written in CAPITALS so they stand out, but SQL doesn't actually mind.

## Choosing columns

Most of the time you don't want every column. List the ones you want, separated by commas:

```sql
SELECT name, city FROM customers;
```

## Just a few rows

Tables can have millions of rows. `LIMIT` says "just give me the first few", which is perfect for a quick look:

```sql
SELECT * FROM transactions LIMIT 5;
```

## Your turn: the bank database

This playground holds a small database: **12 customers, 16 cards, 85 transactions and 8 disputes** (all made up). Open *What's in the database?* to see every table and column. Work through the challenges, and use the numbered buttons to move between them.

```sql-lab
{
  "id": "p1-11-sql",
  "title": "First queries",
  "challenges": [
    { "id": "all-customers", "prompt": "Show **every column** for every customer.", "solution": "SELECT * FROM customers;", "hint": "Use `*` for all columns: `SELECT * FROM customers;`" },
    { "id": "names-cities", "prompt": "Show just the **name** and **city** of every customer.", "solution": "SELECT name, city FROM customers;", "hint": "List the columns with a comma between them, in that order: `SELECT name, city FROM ...`" },
    { "id": "cards", "prompt": "Show the **last4** and **status** of every card.", "solution": "SELECT last4, status FROM cards;", "hint": "The table is called `cards`." },
    { "id": "first-five", "prompt": "Show **all columns** of the **first 5** transactions.", "solution": "SELECT * FROM transactions LIMIT 5;", "hint": "Add `LIMIT 5` at the end, before the semicolon." }
  ]
}
```

```tip
Press **Ctrl+Enter** (or **Cmd+Enter** on a Mac) in the editor to run a query without reaching for the button.
```

```quiz
p1-11-sql
```

## Practice this week

```practice
- **SQLBolt** is a free, bite-sized interactive SQL course, perfect for phone-sized gaps. Do [Lesson 1: SELECT queries](https://sqlbolt.com/lesson/select_queries_introduction).
- On the [Practice bench](#/practice), explore the `disputes` table: `SELECT * FROM disputes;`
```

```video
{
  "title": "SQLBolt: Introduction to SQL",
  "provider": "SQLBolt (free, interactive)",
  "url": "https://sqlbolt.com/",
  "minutes": 10,
  "why": "Short interactive lessons with a built-in editor. Each one takes about 5 to 10 minutes."
}
```
