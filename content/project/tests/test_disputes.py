import pytest

from app.disputes import InvalidTransition, check_move
from tests.conftest import pay


def open_dispute(client):
    payment_id = pay(client, "order-1").json()["id"]
    return client.post("/disputes", json={"payment_id": payment_id, "reason": "not received"})


def test_open_dispute(client):
    response = open_dispute(client)
    assert response.status_code == 201
    assert response.json()["status"] == "opened"


def test_cannot_open_two_disputes_for_one_payment(client):
    open_dispute(client)
    response = client.post("/disputes", json={"payment_id": 1, "reason": "duplicate"})
    assert response.status_code == 409


def test_full_journey(client):
    dispute_id = open_dispute(client).json()["id"]
    for state in ["under_review", "awaiting_customer", "under_review", "resolved_won"]:
        response = client.post(f"/disputes/{dispute_id}/transition", json={"to": state})
        assert response.status_code == 200
        assert response.json()["status"] == state


def test_cannot_skip_review(client):
    dispute_id = open_dispute(client).json()["id"]
    response = client.post(f"/disputes/{dispute_id}/transition", json={"to": "resolved_won"})
    assert response.status_code == 409


@pytest.mark.parametrize("current, new_state", [("opened", "resolved_lost"), ("resolved_won", "opened"), ("opened", "nonsense")])
def test_illegal_moves_raise(current, new_state):
    with pytest.raises(InvalidTransition):
        check_move(current, new_state)
