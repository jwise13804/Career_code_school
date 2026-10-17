---
title: From tap to settlement
minutes: 15
summary: Follow one £4.20 coffee from the moment the card is tapped to the moment the café gets paid, and meet every system along the way. Your capstone builds a small version of this.
goals:
  - Name the parties in a card payment and what each one does
  - Explain authorisation, clearing and settlement in order
  - Connect common customer questions (pending, holds, refunds) to the technical steps
---

## Phase 4: put it all together

Welcome to the last phase. Over the next three months you'll build a small **card payments API** with everything employers look for: idempotency keys, a ledger, a dispute workflow, tests, Docker, CI and a good README. First, let's map the real-world system it's modelled on. You know a lot of this from the customer's side already. Now you'll see the machinery.

## The cast

| Party | Who they are | In our story |
| --- | --- | --- |
| **Cardholder** | The customer | Priya |
| **Merchant** | The business taking payment | The café |
| **[[acquirer]]** | The merchant's bank or payment provider. It "acquires" card payments for the merchant | The café's payment provider |
| **[[card-scheme]]** | The network connecting acquirers and issuers, and setting the rules | Visa or Mastercard |
| **[[issuer]]** | The cardholder's bank, which issued the card and holds her money | Priya's bank. Quite possibly a company like yours! |

## Step 1: authorisation (about 1 to 2 seconds)

Priya taps her card. The terminal reads it and creates a one-time code (a *cryptogram*) that proves the real card was present.

1. Terminal → **acquirer**: "£4.20 at this café, here's the card data."
2. Acquirer → **card scheme**, which routes it to the right **issuer** using the card number.
3. The **issuer** decides: Is the card active? Enough money? Does it look like fraud? Is extra authentication needed?
4. The answer (approve with an authorisation code, or decline with a reason code) travels all the way back.
5. The terminal beeps. ✓

This step is called **[[authorisation]]**. Notice: **no money has moved yet**. The issuer has put a **hold** on £4.20 of Priya's balance, which is why it shows as *pending*.

```analogy
"Why is this payment still pending?" and "I've got a hold on my account from a hotel!" are both questions about authorisation. The money is reserved, but it hasn't actually left yet.
```

## Step 2: clearing (usually later the same day)

At the end of the day, the café's terminal (or provider) sends a batch of that day's approved transactions to the acquirer. The scheme passes the details to each issuer. This is **[[clearing]]**: confirming the final details of each transaction.

The final amount can differ from the authorised one: a restaurant tip, or a hotel's final bill. Once cleared, the transaction usually stops being *pending* and becomes *posted* on the statement.

## Step 3: settlement (often 1 to 2 working days)

Now the money actually moves: issuer → scheme → acquirer → merchant. This is **[[settlement]]**. Along the way, fees are taken:

- **Interchange**: paid to the issuer. In the UK it's capped for most consumer cards (0.2% for debit, 0.3% for credit).
- **Scheme fees**: paid to Visa or Mastercard.
- **Acquirer's margin**: the provider's cut.

So the café receives a little under £4.20.

## And sometimes: refunds and disputes

- A **refund** is a new transaction going the other way, which is why it can take days to appear.
- A **[[chargeback]]** happens when the cardholder disputes a payment through their issuer. It follows the scheme's rules and deadlines. You built a mini version of this workflow in the dispute lesson.

## Put it in order

```quiz
p4-01-payments
```

## Why developers care

Every step above is software, and every one has to deal with timeouts, retries, partial failures and money that must always add up. That's why the capstone focuses on:

- **Idempotency**: the terminal retries; you must never charge twice.
- **A ledger**: every penny recorded, so balances can always be explained.
- **Disputes**: a state machine with strict rules.

## Practice this week

```practice
- Read Stripe's short [How cards work](https://docs.stripe.com/payments/cards/overview) page (free). It's written for developers, so it's good practice at reading technical docs.
- Draw the tap-to-settlement flow from memory on paper, with arrows. Then compare it with this lesson. Being able to sketch this in an interview is a real advantage.
- Think of three customer questions from your job and label which step (authorisation, clearing, settlement, chargeback) each one is really about.
```
