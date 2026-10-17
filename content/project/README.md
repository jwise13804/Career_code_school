# Mini Card Payments API

<!-- This README is a template. Replace every part in [square brackets] with your own words.
     A good README is often the first thing a hiring manager reads. -->

A small card payments API built with **Python**, **FastAPI** and **SQLite**. It takes payments
safely (no double charges), keeps a double-entry ledger, and handles disputes through a
state machine.

[One or two sentences about you: e.g. "I built this while moving from customer support at a
card company into backend development. In support I handled [disputes / failed payments /
...], so I wanted to build the system behind them."]

## What it does

| Endpoint | What it's for |
| --- | --- |
| `POST /payments` | Take a card payment. Requires an `Idempotency-Key` header. |
| `GET /payments/{id}` | Look up a payment |
| `GET /accounts/{id}/balance` | A balance, worked out from the ledger |
| `POST /disputes` | Open a dispute on a payment |
| `POST /disputes/{id}/transition` | Move a dispute to its next state |
| `GET /health` | Health check |

FastAPI also generates interactive docs at `/docs` when the app is running.

## Design decisions

- **Idempotency keys.** Mobile networks drop replies, and apps retry. Every payment needs an
  `Idempotency-Key`; a retry with the same key gets the original response back and is never
  charged twice. Reusing a key with a different body returns `409 Conflict`.
- **Money in pence.** Amounts are whole numbers of pence, so there are no floating point
  rounding errors.
- **Double-entry ledger.** Balances aren't stored; they're calculated from ledger entries.
  Every payment writes two entries that sum to zero, so money can't appear or disappear,
  and a test checks that.
- **Dispute state machine.** Allowed moves live in one dictionary (`app/disputes.py`).
  Anything else is refused with `409`.
- [Add your own: something you changed, and why]

## Running it

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open http://localhost:8000/docs and try `POST /payments`.

### With Docker

```bash
docker build -t card-payments-api .
docker run -p 8000:8000 card-payments-api
```

## Tests

```bash
pytest -v
```

The tests cover: successful payments, retries with the same key, key reuse with a different
body, insufficient funds, blocked cards, validation, the ledger always balancing, and the
dispute workflow. GitHub Actions runs them on every push (`.github/workflows/ci.yml`).

## What I'd add next

- [e.g. refunds as their own ledger entries]
- [e.g. expiring idempotency keys after 24 hours]
- [e.g. authentication with API keys]
- [e.g. PostgreSQL instead of SQLite, with Docker Compose]

## What I learned

[Two or three honest sentences. What was hard? What clicked? Interviewers love this section.]

---

Card numbers here are test data only. No real card data is stored: see PCI DSS.
