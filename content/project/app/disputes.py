"""The dispute workflow as a state machine (see the course lesson "The dispute workflow")."""

TRANSITIONS = {
    "opened": ["under_review"],
    "under_review": ["awaiting_customer", "resolved_won", "resolved_lost"],
    "awaiting_customer": ["under_review"],
    "resolved_won": [],
    "resolved_lost": [],
}


class InvalidTransition(ValueError):
    pass


def check_move(current: str, new_state: str) -> None:
    if new_state not in TRANSITIONS:
        raise InvalidTransition(f"Unknown state: {new_state}")
    if new_state not in TRANSITIONS[current]:
        raise InvalidTransition(f"Can't move a dispute from {current} to {new_state}")
