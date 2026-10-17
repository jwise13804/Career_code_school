---
title: "PCI DSS: protecting card data"
minutes: 12
summary: The security rules every company that touches card numbers must follow, what they mean for the code you write, and why the best card data is card data you never hold.
goals:
  - Explain what PCI DSS is and who it applies to
  - Know which card data must never be stored
  - Mask card numbers safely in code and logs
---

## Why the rules exist

Card numbers are valuable to criminals. A single leaked database can mean millions of reissued cards, a lot of fraud, and huge fines. So the card schemes created one shared rulebook: the **Payment Card Industry Data Security Standard**, **[[pci-dss]]**.

- It's run by the **PCI Security Standards Council**, founded by the major card schemes.
- It applies to **any organisation that stores, processes or transmits card data**: banks, fintechs, shops and payment providers.
- The current version is **PCI DSS v4.0.1**. It has **12 requirements**, covering networks, encryption, access control, monitoring, testing and policies.

You don't need to memorise all 12. As a developer, a handful of rules shape your code every day.

## What counts as card data

| Data | Can it be stored? |
| --- | --- |
| **PAN** (the long card number) | Only if protected: encrypted, tokenised or truncated |
| Cardholder name, expiry date | Yes, if protected alongside the PAN |
| **CVV/CVC** (the 3 or 4 digit security code) | **Never** after authorisation, not even encrypted |
| **PIN** or PIN block | **Never** |
| Full chip or magnetic stripe data | **Never** after authorisation |

```analogy
You were probably trained never to ask a customer for their full PIN or security code over the phone. PCI DSS is the same instinct, written into how systems are built.
```

## Rules that shape your code

1. **Never log card numbers.** Logs get copied, searched and shared. Log `card ending 4242` or a token instead.
2. **Mask when displaying.** Show only what's needed, usually the last four digits: `************4242`.
3. **Tokenise.** Swap the real PAN for a random **[[tokenisation|token]]** (like `tok_8fj2k`) that's useless if stolen. Only a secure vault can turn it back.
4. **Keep card data out of your systems entirely** where you can. Payment providers offer hosted payment pages or fields, so the card number goes straight from the customer's browser to the provider and never touches your servers. Less card data held means far fewer PCI requirements apply to you.
5. **Never use real card numbers in tests.** Schemes and providers publish test numbers such as `4242 4242 4242 4242`.

## Your turn: mask a card number

```lab
id: p4-02-mask
title: Mask a card number
--- task
Write `mask_card_number(pan)`:

- Remove any spaces first.
- Replace every digit **except the last four** with `*`.

So `"4242 4242 4242 4242"` becomes `"************4242"`, and a 15-digit card keeps 11 stars.
--- starter
def mask_card_number(pan):
    pass


print(mask_card_number("4242 4242 4242 4242"))
print(mask_card_number("378282246310005"))
--- tests
check("mask_card_number('4242424242424242')", "************4242", tip="len(pan) - 4 stars, then the last 4 characters: pan[-4:].")
check("mask_card_number('4242 4242 4242 4242')", "************4242", tip="Remove spaces first: pan.replace(' ', '').")
check("mask_card_number('378282246310005')", "***********0005", tip="Work out the number of stars from the length, so it works for 15-digit cards too.")
check_no_output("4242424242424242", tip="Never print a full card number, even while testing.")
--- hint
`pan.replace(" ", "")` gives the number without spaces. Save it back into `pan`.
--- hint
`pan[-4:]` gives the last four characters. `"*" * 5` gives `"*****"`: you can multiply text by a number.
--- hint
`return "*" * (len(pan) - 4) + pan[-4:]`
--- solution
def mask_card_number(pan):
    pan = pan.replace(" ", "")
    return "*" * (len(pan) - 4) + pan[-4:]


print(mask_card_number("4242 4242 4242 4242"))
print(mask_card_number("378282246310005"))
```

```quiz
p4-02-pci
```

## Practice this week

```practice
- Browse the [PCI Security Standards Council](https://www.pcisecuritystandards.org/) website's "Standards" section. Just get a feel for it: nobody reads all of it at once.
- Look at Stripe's [testing card numbers](https://docs.stripe.com/testing) page. Your capstone's tests use numbers like these, never real ones.
- At work, notice where card numbers are masked in the tools you use. Now you know why.
```
