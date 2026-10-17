---
title: PSD2 and strong customer authentication
minutes: 12
summary: Why customers get asked to confirm payments in their banking app, the law behind it, and the rules your payment code has to follow.
goals:
  - Explain what PSD2 and SCA are, in plain English
  - Name the three kinds of authentication factor
  - Write a simplified "does this payment need SCA?" rule in code
---

## "Why is my bank asking me to approve this?"

You've definitely taken this call: a customer's online payment is waiting for them to confirm it in their banking app, or to type in a one-time code. That's **strong customer authentication**, and it exists because of a law.

- **PSD2** (the second Payment Services Directive) is an EU law. The UK brought it into its own law through the **Payment Services Regulations 2017**, and it still applies after Brexit, enforced by the **FCA**.
- One of its big requirements is **[[sca]]**: stronger checks that the person paying is really the cardholder. In the UK, SCA has been fully enforced for online card payments since **14 March 2022**.
- PSD2 also created **open banking**: letting customers safely share account data with, or make payments through, regulated third-party apps.

## Two out of three

SCA means proving who you are with **at least two of three different kinds of factor**:

| Factor | Means | Examples |
| --- | --- | --- |
| **Knowledge** | Something you know | PIN, password |
| **Possession** | Something you have | Your phone, your card |
| **Inherence** | Something you are | Fingerprint, face |

Approving in a banking app on your phone with Face ID? That's **possession** (the phone) plus **inherence** (your face). For online card payments, this usually happens through **3-D Secure** (3DS), the step where the bank's screen or app pops up during checkout.

## Exemptions

SCA on every single payment would be exhausting, so there are exemptions, including:

- **Low-value** online payments (up to a small limit, with extra rules counting payments in a row).
- **Contactless** in shops up to the contactless limit (£100 in the UK). After several contactless payments in a row, the card asks for the PIN, which is SCA kicking in.
- **Merchant-initiated** payments like subscriptions, after the first one is authenticated.
- **Trusted beneficiaries** the customer has whitelisted, and low-risk payments judged by the bank's fraud models.

```analogy
"It worked yesterday without asking, so why is it asking today?" Usually an exemption applied yesterday and not today: perhaps a running total was reached, or the risk score changed.
```

## Your turn: a simplified SCA rule

Real SCA decisions are made by issuers, using detailed rules and fraud models. This lab uses a **simplified course rule**, just to practise turning a policy into code.

```lab
id: p4-03-sca
title: Does this payment need SCA?
--- task
Write `needs_sca(payment)`, which returns `True` or `False`. A payment is a dictionary like `{"channel": "online", "amount": 45.0, "recurring": False}`. Our course rule:

1. **Contactless** payments of **£100 or less** don't need SCA. Over £100, they do.
2. **Online** payments that are **recurring** (subscriptions) don't need SCA.
3. Other **online** payments of **£30 or less** don't need SCA (low-value exemption).
4. Any other online payment **needs** SCA.
--- starter
def needs_sca(payment):
    channel = payment["channel"]
    amount = payment["amount"]

    # Write the rules here, returning True or False

    return True


print(needs_sca({"channel": "online", "amount": 45.0, "recurring": False}))
--- tests
check("needs_sca({'channel': 'contactless', 'amount': 4.2, 'recurring': False})", False, tip="Contactless up to £100 doesn't need SCA.")
check("needs_sca({'channel': 'contactless', 'amount': 100.0, 'recurring': False})", False, tip="Exactly £100 is still within the limit: use <=.")
check("needs_sca({'channel': 'contactless', 'amount': 120.0, 'recurring': False})", True)
check("needs_sca({'channel': 'online', 'amount': 15.99, 'recurring': True})", False, tip="Recurring online payments are exempt.")
check("needs_sca({'channel': 'online', 'amount': 25.0, 'recurring': False})", False, tip="Online payments of £30 or less are low-value.")
check("needs_sca({'channel': 'online', 'amount': 45.0, 'recurring': False})", True)
--- hint
Handle contactless first: `if channel == "contactless":` then `return amount > 100`. That comparison already gives `True` or `False`!
--- hint
For online payments, check `payment["recurring"]` next: if it's `True`, return `False`.
--- hint
Then `if amount <= 30: return False`, and finally `return True` for everything else.
--- solution
def needs_sca(payment):
    channel = payment["channel"]
    amount = payment["amount"]

    if channel == "contactless":
        return amount > 100
    if payment["recurring"]:
        return False
    if amount <= 30:
        return False
    return True


print(needs_sca({"channel": "online", "amount": 45.0, "recurring": False}))
```

```quiz
p4-03-sca
```

## Practice this week

```practice
- Read the FCA's page on [strong customer authentication](https://www.fca.org.uk/firms/strong-customer-authentication). Notice how much of it you already understand from working in support.
- Read the UK [Open Banking](https://www.openbanking.org.uk/) site's short explainer on what open banking is. Many UK fintech backend roles involve it.
```
