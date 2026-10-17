---
title: "What an API is: the front desk"
minutes: 14
summary: Every app you've supported, from the banking app to the card terminal, talks to the bank through an API. Today you send your first requests.
goals:
  - Explain what an API is using the front desk comparison
  - Name the parts of a request (method, path, headers, body)
  - Read a status code and know whose "fault" it is
---

## The front desk

Think about a bank branch. Customers never walk into the back office and open the filing cabinets themselves. They go to the **front desk**, ask in a standard way ("I'd like my balance, here's my ID"), and the desk replies.

An **[[api]]** (Application Programming Interface) is that front desk, for software. The banking app on a customer's phone never touches the bank's database directly. It sends a **[[request]]** to the API, and the API sends back a **[[response]]**.

```analogy
You've been the front desk for years. A customer asks a question, you check whether they're allowed to ask it, look things up in systems they can't see, and reply in a way they understand. A backend developer builds the **automatic** version of you.
```

This is the heart of backend work. When you got a call saying "the app shows the wrong balance", somewhere an API returned the wrong thing.

## Anatomy of a request

Every request has up to four parts:

| Part | What it is | Front desk version |
| --- | --- | --- |
| **Method** | What kind of thing you want: `GET` reads, `POST` creates | "I'd like to *check*…" vs "I'd like to *open*…" |
| **Path** | Which thing: `/customers/3` | "…the account for customer 3" |
| **Headers** | Extra details, like who you are | Showing your ID |
| **Body** | The data you're sending (for `POST`) | The filled-in form |

The two methods you'll use most:

- **GET**: "give me something". Safe to repeat: asking for a balance twice changes nothing.
- **POST**: "create something": a new customer, a payment, a dispute. *Not* automatically safe to repeat. Remember that, because it's the whole of Phase 4.

## Status codes: decline codes for the web

Every response comes with a three-digit **[[status-code]]**. You already know this idea: decline codes tell you *why* a payment failed. Status codes come in families:

| Family | Meaning | Whose problem? | Common ones |
| --- | --- | --- | --- |
| **2xx** | It worked | Nobody's | `200 OK`, `201 Created` |
| **4xx** | The request was wrong | The caller's (the app) | `400`, `401`, `404`, `422` |
| **5xx** | The server broke | The server's (the bank) | `500` |

```tip
The first digit is the useful bit. **4** means "you asked wrong" and **5** means "we broke". When you were in support, a 5xx is the kind of thing that turned into an incident.
```

## Data comes back as JSON

Responses usually come back as **[[json]]**: a tidy text format for data that looks a lot like Python dictionaries. Here's a customer:

```json
{
  "id": 3,
  "name": "Priya Patel",
  "city": "Leicester"
}
```

Curly brackets hold one record. Square brackets `[ ]` hold a list of them.

## Your turn: talk to the Mini Bank

Below is a request builder, like **Postman**, a tool developers use every day. It's connected to a pretend bank API that runs inside this page. Work through the tasks. Each ticks itself off when you get the right response.

```api
{
  "id": "p2-01-api",
  "title": "Talk to the Mini Bank API",
  "tasks": [
    { "id": "list", "text": "List all customers: `GET /customers`", "method": "GET", "path": "^/customers/?$", "status": 200 },
    { "id": "one", "text": "Fetch customer 3: `GET /customers/3`", "method": "GET", "path": "^/customers/3$", "status": 200 },
    { "id": "404", "text": "Ask for a customer who doesn't exist and get a **404**", "method": "GET", "status": 404 },
    { "id": "create", "text": "Add a new customer with `POST /customers` and get a **201**", "method": "POST", "path": "^/customers/?$", "status": 201 },
    { "id": "401", "text": "Try `POST /payments` **without** the API key and get a **401**", "method": "POST", "path": "^/payments", "status": 401 },
    { "id": "pay", "text": "Now take a payment **with** the key and get a **201**", "method": "POST", "path": "^/payments", "status": 201 }
  ],
  "presets": [
    { "label": "GET /customers", "method": "GET", "path": "/customers" },
    { "label": "POST /customers", "method": "POST", "path": "/customers", "body": { "name": "Grace Murphy", "city": "Belfast" } },
    { "label": "POST /payments (no key)", "method": "POST", "path": "/payments", "headers": {}, "body": { "card_id": 1, "amount": 4.2, "merchant": "Greggs" } },
    { "label": "POST /payments (with key)", "method": "POST", "path": "/payments", "headers": { "Authorization": "Bearer demo-key-123" }, "body": { "card_id": 1, "amount": 4.2, "merchant": "Greggs" } }
  ]
}
```

Some things to try once the tasks are done:

- `POST /customers` with the `"city"` left out. Which status do you get, and does the message help?
- Pay with card `2`. Why is it refused? (Hint: `GET /cards/2`.)
- Pay `5000` with card `4`. Compare the status code with the blocked-card one.

```quiz
p2-01-api
```

## Practice this week

```practice
- Read MDN's [Overview of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview) (about 15 minutes). Skip anything that feels too deep. It'll make sense later.
- Bookmark MDN's [list of HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status). Real developers look these up constantly.
- Spend 10 minutes on the [Practice bench](#/practice): try every endpoint the Mini Bank lists at `GET /`.
```

```video
{
  "title": "FastAPI documentation: First Steps",
  "provider": "FastAPI docs (free, official)",
  "url": "https://fastapi.tiangolo.com/tutorial/first-steps/",
  "minutes": 20,
  "why": "A preview of where this phase is going: real Python that answers requests like the Mini Bank does. Just read it for now. You'll build it in lesson 5."
}
```
