---
title: A ledger table that always balances
minutes: 15
status: planned
summary: Why banks never just store a balance, and how double-entry ledgers make every penny explainable.
goals:
  - Explain double-entry bookkeeping in plain English
  - Record a payment as two entries that sum to zero
  - Derive a balance from ledger entries with SQL
---

## What this lesson covers

- Why `UPDATE accounts SET balance = ...` is risky
- Every movement as two entries: money out of one account, into another
- `SELECT SUM(amount_pence) ... WHERE account = ?`
- A test that proves the ledger always sums to zero

```analogy
When a customer says their balance is wrong, you go through the transaction history line by line. A ledger means that history *is* the balance, so it can always be explained.
```

## Learn it now with free resources

The interactive version of this lesson is still being written. Until then, these free resources cover it well. Give yourself one or two of your study gaps for them, then mark this lesson complete.

```practice
- Wikipedia: [Double-entry bookkeeping](https://en.wikipedia.org/wiki/Double-entry_bookkeeping). Read the overview.
- Read `app/ledger.py` in the capstone download and find the test that checks the ledger sums to zero.
```

```tip
Stuck on something in these resources? Press **Stuck? Ask Claude** below and paste in the part that confused you.
```
