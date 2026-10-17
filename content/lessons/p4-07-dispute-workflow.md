---
title: The dispute workflow
minutes: 15
summary: You know the dispute process inside out. Now you'll write it as code, so the system itself refuses steps that break the rules.
goals:
  - Describe a dispute's life as a set of states and allowed moves
  - Explain what a state machine is
  - Write code that refuses illegal moves with a clear error
---

## You already know this workflow

A customer says "I never received the parcel." From your side, the dispute moves through stages:

1. **Opened**: the customer reports it.
2. **Under review**: someone looks at the evidence.
3. Sometimes **awaiting customer**: you need a receipt or a screenshot. When it arrives, it goes back to review.
4. **Resolved (won)** or **resolved (lost)**: the outcome. The case is closed.

Some moves are **never** allowed. A case can't jump from *opened* straight to *won* without anyone reviewing it. A closed case can't quietly reopen itself.

```analogy
Your case-management tool already enforces this: the "Resolve" button is greyed out until the case has been reviewed. Someone wrote the code that greys it out. Today, that's you.
```

## A state machine

Developers call this a **[[state-machine]]**:

- a list of **states** a thing can be in, and
- the **transitions** (moves) allowed from each one.

In Python, a dictionary is perfect for this. Each key is a state, and its value is a list of the states you can move to next:

```python
TRANSITIONS = {
    "opened": ["under_review"],
    "under_review": ["awaiting_customer", "resolved_won", "resolved_lost"],
    ...
}
```

Then one function, `move`, makes every change, and refuses any move that isn't in the list:

```python
def move(dispute, new_state):
    allowed = TRANSITIONS[dispute["status"]]
    if new_state not in allowed:
        raise ValueError(f"Can't move from {dispute['status']} to {new_state}")
    dispute["status"] = new_state
    return dispute
```

`raise ValueError(...)` stops with an error on purpose. In an API, you'd turn that into a `409 Conflict` response.

## Your turn: build the workflow

```dispute
id: p4-07-dispute
title: Build the dispute workflow
--- task
1. Press **Run and draw my workflow**. Grey dashed arrows are moves that are **missing** from your `TRANSITIONS`.
2. Fill in `TRANSITIONS` so every allowed move is there (and nothing else).
3. Make `move` **refuse** moves that aren't allowed, with `raise ValueError(...)`.
4. Draw again: everything should be green, and the dispute journeys should all show ✓. Then press **Check my answer**.
--- starter
# Which moves are allowed from each state?
TRANSITIONS = {
    "opened": ["under_review"],
    "under_review": [],
    "awaiting_customer": [],
    "resolved_won": [],
    "resolved_lost": [],
}

def move(dispute, new_state):
    # TODO: refuse any move that isn't listed in TRANSITIONS
    dispute["status"] = new_state
    return dispute
--- expected
{"opened": ["under_review"], "under_review": ["awaiting_customer", "resolved_won", "resolved_lost"], "awaiting_customer": ["under_review"], "resolved_won": [], "resolved_lost": []}
--- journeys
[
  {"label": "Opened → under review", "start": "opened", "to": "under_review", "allowed": true},
  {"label": "Opened → resolved won (skipping review)", "start": "opened", "to": "resolved_won", "allowed": false},
  {"label": "Under review → awaiting customer", "start": "under_review", "to": "awaiting_customer", "allowed": true},
  {"label": "Awaiting customer → under review", "start": "awaiting_customer", "to": "under_review", "allowed": true},
  {"label": "Under review → resolved lost", "start": "under_review", "to": "resolved_lost", "allowed": true},
  {"label": "Resolved won → opened (reopening a closed case)", "start": "resolved_won", "to": "opened", "allowed": false}
]
--- tests
check("sorted(TRANSITIONS['under_review'])", ["awaiting_customer", "resolved_lost", "resolved_won"], tip="From review, a case can wait for the customer, or be resolved either way.")
check("TRANSITIONS['awaiting_customer']", ["under_review"], tip="When the customer sends evidence, the case goes back to review.")
check("TRANSITIONS['resolved_won'] + TRANSITIONS['resolved_lost']", [], tip="Closed cases can't move anywhere.")
check("move({'status': 'opened'}, 'under_review')['status']", "under_review")
def _refused(start, to):
    case = {"status": start}
    try:
        move(case, to)
    except ValueError:
        return case["status"] == start
    return False
record(_refused("opened", "resolved_won"), "Jumping from opened straight to resolved_won is refused with a ValueError.", "Check `if new_state not in TRANSITIONS[dispute['status']]:` and then `raise ValueError(...)`, before changing the status.")
record(_refused("resolved_lost", "under_review"), "A closed case can't be moved back to review.", "Closed states have an empty list, so every move from them should be refused.")
--- hint
Moves out of `under_review`: the case can wait for the customer, be won, or be lost. Moves out of `awaiting_customer`: just back to review. Closed cases have no moves, so they stay as empty lists.
--- hint
In `move`, look up the allowed list with `TRANSITIONS[dispute["status"]]`. If `new_state` is **not in** that list, raise an error.
--- hint
`raise ValueError(f"Can't move from {dispute['status']} to {new_state}")` must come *before* the line that changes `dispute["status"]`.
--- solution
# Which moves are allowed from each state?
TRANSITIONS = {
    "opened": ["under_review"],
    "under_review": ["awaiting_customer", "resolved_won", "resolved_lost"],
    "awaiting_customer": ["under_review"],
    "resolved_won": [],
    "resolved_lost": [],
}

def move(dispute, new_state):
    allowed = TRANSITIONS[dispute["status"]]
    if new_state not in allowed:
        raise ValueError(f"Can't move from {dispute['status']} to {new_state}")
    dispute["status"] = new_state
    return dispute
```

```note
Real card scheme dispute processes (chargebacks, pre-arbitration, arbitration) have more states and strict deadlines, and they differ between Visa and Mastercard. The shape is the same though: states, allowed moves, and code that enforces them. Your capstone's `disputes.py` uses this exact pattern.
```

```quiz
p4-07-disputes
```

## Practice this week

```practice
- Draw your own team's real dispute or complaint process as boxes and arrows on paper. Which moves would you refuse in code?
- Add a `"withdrawn"` state (the customer cancels the dispute) to your workflow on the [Practice bench](#/practice) scratchpad. Where should it be reachable from?
```
