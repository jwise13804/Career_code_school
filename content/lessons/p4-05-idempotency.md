---
title: "Idempotency keys: charge once"
minutes: 15
summary: A customer taps Pay, the signal drops, the app tries again. Did they pay once or twice? Today you write the code that makes sure it's once.
goals:
  - Explain idempotency with a real double-charge story
  - Describe how an Idempotency-Key header works
  - Fix a payment endpoint so retries never double-charge
---

## The ticket you've definitely seen

> "I only paid once but I've been charged twice!"

You've handled this call. Often the customer is right. Here's one way it happens:

1. The customer taps **Pay** on a train going into a tunnel.
2. The request reaches the bank, and the payment goes through.
3. The *reply* gets lost in the tunnel.
4. The app never heard back, so it **retries**, sending the exact same payment again.
5. The bank sees a second payment and charges it too.

Nobody did anything wrong, but the customer paid twice. Networks *will* drop messages, so the server has to cope with it.

## Idempotent: safe to repeat

An action is **[[idempotency|idempotent]]** if doing it twice has the same effect as doing it once.

- Checking a balance: idempotent. Ask ten times, nothing changes.
- Pressing a lift button again: idempotent. The lift still comes once.
- Taking a payment: **not** idempotent, unless we make it so.

```analogy
It's like a refund reference number. If an agent submits refund REF-1234 and the screen freezes, they press submit again. A good system says "REF-1234 is already processed" instead of paying it twice. The reference number makes the refund safe to repeat.
```

## The fix: an idempotency key

The app creates a unique **[[idempotency-key]]** for each order and sends it with the request, in a header:

```text
POST /payments
Idempotency-Key: order-7f3a
{"card_id": 1, "amount": 25.00}
```

When the server gets a request, it checks:

- **New key?** Take the payment, and **save the result under that key**.
- **Key seen before?** Don't charge again. Send back the saved result.

The retry carries the *same* key, because it's the same order, so it gets the saved answer. A *new* order gets a *new* key and is charged normally. This is exactly how Stripe's API, Adyen's and many bank APIs work.

## Your turn: stop the double charge

The phone below has a slow signal: every tap sends the payment **twice** with the same key. Tap Pay and watch the statement. Then fix the server code.

```idempotency
id: p4-05-idem
title: Stop the double charge
--- task
1. Tap **Pay £25.00** and look at the statement: one order, two charges.
2. Fix `take_payment` so that a key it has already seen returns the **saved** payment instead of charging again.
3. Tap Pay again (a few times) and check: one charge per order. Then press **Check my fix**.
--- starter
# Every charge we've taken: the customer's statement.
ledger = []

# The result we sent back for each idempotency key we've handled.
seen = {}

def take_payment(idempotency_key, amount):
    # TODO 1: if we've handled this key before, return the saved payment.

    payment = {"id": len(ledger) + 1, "amount": amount}
    ledger.append(payment)

    # TODO 2: save this payment in `seen`, under its key.

    return payment
--- tests
check("take_payment('order-1', 25.0)['id']", 1, label="First tap: take_payment('order-1', 25.0)['id']")
check("take_payment('order-1', 25.0)['id']", 1, label="Retry with the same key: take_payment('order-1', 25.0)['id']", tip="The retry should return the saved payment (id 1), not create payment 2.")
check("len(ledger)", 1, label="Charges on the statement after a tap and a retry: len(ledger)", tip="A retry must not add a second row to the ledger.")
check("take_payment('order-2', 10.0)['id']", 2, label="A new order: take_payment('order-2', 10.0)['id']", tip="A brand new key is a new order, so it should be charged.")
check("len(ledger)", 2, label="Charges after two different orders: len(ledger)")
check("take_payment('order-2', 10.0)['amount']", 10.0, label="Retrying order 2 returns its saved amount")
--- hint
Dictionaries are perfect for "have I seen this before?". `if idempotency_key in seen:` is True when that key is already stored.
--- hint
If the key is in `seen`, `return seen[idempotency_key]` straight away, *before* anything is added to the ledger. That's TODO 1.
--- hint
For TODO 2, just before `return payment`, store it: `seen[idempotency_key] = payment`.
--- solution
# Every charge we've taken: the customer's statement.
ledger = []

# The result we sent back for each idempotency key we've handled.
seen = {}

def take_payment(idempotency_key, amount):
    if idempotency_key in seen:
        return seen[idempotency_key]

    payment = {"id": len(ledger) + 1, "amount": amount}
    ledger.append(payment)

    seen[idempotency_key] = payment
    return payment
```

## See it in a real-style API

The Mini Bank API supports idempotency keys too. Send the same payment twice **with the same key**, then look at the response headers and `GET /payments`.

```api
{
  "id": "p4-05-api",
  "title": "Idempotency in the Mini Bank API",
  "tasks": [
    { "id": "first", "text": "Take a payment with an `Idempotency-Key` header (201)", "method": "POST", "path": "^/payments", "status": 201 },
    { "id": "list", "text": "Send it again, then check `GET /payments` shows only one payment", "method": "GET", "path": "^/payments/?$", "status": 200 },
    { "id": "conflict", "text": "Reuse the same key with a **different amount** and get a **409**", "method": "POST", "path": "^/payments", "status": 409 }
  ],
  "presets": [
    { "label": "Pay £25 (key order-7f3a)", "method": "POST", "path": "/payments", "headers": { "Authorization": "Bearer demo-key-123", "Idempotency-Key": "order-7f3a" }, "body": { "card_id": 1, "amount": 25, "merchant": "Coffee & Cake" } },
    { "label": "Same key, £30", "method": "POST", "path": "/payments", "headers": { "Authorization": "Bearer demo-key-123", "Idempotency-Key": "order-7f3a" }, "body": { "card_id": 1, "amount": 30, "merchant": "Coffee & Cake" } },
    { "label": "GET /payments", "method": "GET", "path": "/payments" }
  ]
}
```

```note
In a real system, `seen` would be a **database table**, so it survives restarts and is shared between servers. Keys also expire after a while (often 24 hours). Your capstone's `idempotency_keys` table does exactly this.
```

```quiz
p4-05-idempotency
```

## Practice this week

```practice
- Read Stripe's short guide to [idempotent requests](https://docs.stripe.com/api/idempotent_requests). It's one page, and it's what you'd be expected to know in an interview.
- Explain idempotency out loud to someone (or your phone's voice recorder) using the tunnel story. If you can explain it simply, you understand it.
```
