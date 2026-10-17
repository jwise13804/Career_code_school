---
title: Write your first request handler
minutes: 15
summary: Last time you sent requests to an API. Now you'll be the API. The code that answers a request is just a Python function, built from things you already know.
goals:
  - Explain that an API endpoint is a function, with a request in and a response out
  - Return the right status code for success, not found and bad input
  - Use if, loops and dictionaries to answer real requests
---

## An API is a function

Here's the secret that makes backend development click: **the code that answers a request is just a function**.

- **In:** the method, the path and the body.
- **Out:** a status code and some data.

```analogy
It's your call-handling flowchart. "Is it a balance question? Look it up and tell them. Is it about a card we can't find? Say so politely. Have they left out their name? Ask for it." Each branch ends with a reply *and* an outcome code.
```

In Python, a handler can look like this:

```python
def handle(method, path, body):
    if method == "GET" and path == "/customers":
        return 200, customers
    return 404, {"error": "Not found"}
```

`return 200, customers` sends back **two things**: the status code and the data. Python lets you return several values separated by a comma.

## Pulling an ID out of a path

For `GET /customers/2`, we need the `2`. Paths are text, so we split them on `/`:

```python
path = "/customers/2"
parts = path.split("/")    # ['', 'customers', '2']
customer_id = int(parts[2])  # 2, as a number
```

The first item is empty because the path *starts* with `/`. `int()` turns the text `"2"` into the number `2` so we can compare it with the IDs in our records.

## Your turn: be the server

The editor below **is** the server. When you press **Send request**, the request goes to *your* `handle` function and its answer appears as the response. Fill in the two TODOs.

```handler
id: p2-04-handler
title: Answer customer requests
--- task
Make your `handle` function:

1. **`GET /customers/<id>`**: return that customer with `200`, or `404` with `{"error": "Customer not found"}`.
2. **`POST /customers`**: if the body has no `"name"`, return `422` with `{"error": "name is required"}`. Otherwise add the new customer to the list and return it with `201`.

Use the example requests at the bottom to try it, then press **Check my handler**.
--- starter
customers = [
    {"id": 1, "name": "Amira Khan", "city": "Leeds"},
    {"id": 2, "name": "Tom Walsh", "city": "Manchester"},
]

def handle(method, path, body):
    if method == "GET" and path == "/customers":
        return 200, customers

    # TODO 1: GET /customers/<id>
    # Return the matching customer with 200,
    # or {"error": "Customer not found"} with 404.

    # TODO 2: POST /customers
    # No "name" in the body? Return {"error": "name is required"} with 422.
    # Otherwise give the new customer an id, add them, return them with 201.

    return 404, {"error": "Not found"}
--- requests
GET /customers
GET /customers/2
GET /customers/99
POST /customers {"name": "Grace Murphy", "city": "Belfast"}
POST /customers {"city": "Leeds"}
--- tests
check("handle('GET', '/customers', None)[0]", 200)
check("handle('GET', '/customers/2', None)[0]", 200, tip="Use path.startswith('/customers/') to spot this request, then loop through customers to find the matching id.")
check("handle('GET', '/customers/2', None)[1]['name']", "Tom Walsh", tip="Return the customer dictionary itself as the second value.")
check("handle('GET', '/customers/99', None)[0]", 404, tip="If the loop finishes without finding a match, return 404.")
check("handle('GET', '/customers/99', None)[1]", {"error": "Customer not found"})
check("handle('POST', '/customers', {'name': 'Grace Murphy', 'city': 'Belfast'})[0]", 201, tip="Check method == 'POST' and path == '/customers'.")
check_true("any(c['name'] == 'Grace Murphy' for c in customers)", "After the POST, Grace Murphy should be in the customers list.", "Grace Murphy was added to the customers list.", tip="Use customers.append(new_customer).")
check("handle('POST', '/customers', {'city': 'Leeds'})[0]", 422, tip="Check whether 'name' is in body before adding anyone.")
check("handle('POST', '/customers', {'city': 'Leeds'})[1]", {"error": "name is required"})
--- hint
For TODO 1, start with `if method == "GET" and path.startswith("/customers/"):` then get the id with `int(path.split("/")[2])`.
--- hint
Loop through `customers` and compare each `customer["id"]` with the id. Return as soon as you find a match. If the loop ends, nothing matched, so return the 404 *after* the loop (not inside it).
--- hint
For TODO 2: `if not body or "name" not in body:` catches a missing name. A new id can be `len(customers) + 1`. Build a dictionary, `customers.append(...)` it, and `return 201, new_customer`.
--- solution
customers = [
    {"id": 1, "name": "Amira Khan", "city": "Leeds"},
    {"id": 2, "name": "Tom Walsh", "city": "Manchester"},
]

def handle(method, path, body):
    if method == "GET" and path == "/customers":
        return 200, customers

    if method == "GET" and path.startswith("/customers/"):
        customer_id = int(path.split("/")[2])
        for customer in customers:
            if customer["id"] == customer_id:
                return 200, customer
        return 404, {"error": "Customer not found"}

    if method == "POST" and path == "/customers":
        if not body or "name" not in body:
            return 422, {"error": "name is required"}
        new_customer = {"id": len(customers) + 1, "name": body["name"], "city": body.get("city", "")}
        customers.append(new_customer)
        return 201, new_customer

    return 404, {"error": "Not found"}
```

```note
You might notice that if you POST Grace and then GET `/customers`, she's gone. In this lab, every request starts the server fresh, like a till that's switched off and on between customers, so anything kept in a Python list is forgotten. That's exactly why real APIs save data in a **database**. You'll do that in lesson 8.
```

## What this looks like in FastAPI

Real projects use a **framework** that handles the paths and JSON for you. In **FastAPI**, the same thing looks like this. You'll write it for real in the next lesson:

```python
from fastapi import FastAPI, HTTPException

app = FastAPI()

@app.get("/customers/{customer_id}")
def get_customer(customer_id: int):
    for customer in customers:
        if customer["id"] == customer_id:
            return customer
    raise HTTPException(status_code=404, detail="Customer not found")
```

It's the same logic you just wrote. FastAPI simply does the path-splitting for you.

## Practice this week

```practice
- Read FastAPI's [First Steps](https://fastapi.tiangolo.com/tutorial/first-steps/) and [Path Parameters](https://fastapi.tiangolo.com/tutorial/path-params/) pages. Compare them with your handler.
- Extend your handler on the [Practice bench](#/practice) scratchpad: add `GET /customers?city=Leeds`. (Hint: `path.split("?")`.)
```
