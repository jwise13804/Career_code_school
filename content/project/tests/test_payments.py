import os

from app import database, ledger
from tests.conftest import pay


def balance(client):
    return client.get("/accounts/1/balance").json()["balance_pence"]


def test_payment_is_created_and_balance_goes_down(client):
    response = pay(client, "order-1", amount_pence=420)
    assert response.status_code == 201
    assert response.json()["amount_pence"] == 420
    assert balance(client) == 10000 - 420


def test_retry_with_same_key_does_not_charge_twice(client):
    first = pay(client, "order-1")
    second = pay(client, "order-1")
    assert second.status_code == 201
    assert second.json()["id"] == first.json()["id"]
    assert second.headers["Idempotent-Replayed"] == "true"
    assert balance(client) == 10000 - 420


def test_new_key_is_a_new_payment(client):
    pay(client, "order-1")
    pay(client, "order-2")
    assert balance(client) == 10000 - 840


def test_same_key_with_different_amount_is_rejected(client):
    pay(client, "order-1", amount_pence=420)
    response = pay(client, "order-1", amount_pence=999)
    assert response.status_code == 409


def test_missing_idempotency_key_is_rejected(client):
    response = client.post("/payments", json={"card_id": 1, "amount_pence": 420, "merchant": "Greggs"})
    assert response.status_code == 400


def test_insufficient_funds_is_declined(client):
    response = pay(client, "big-order", amount_pence=50000)
    assert response.status_code == 402
    assert response.json()["decline_code"] == "insufficient_funds"
    assert balance(client) == 10000


def test_blocked_card_is_declined(client):
    response = pay(client, "order-1", card_id=2)
    assert response.status_code == 403


def test_unknown_card_is_not_found(client):
    assert pay(client, "order-1", card_id=99).status_code == 404


def test_amount_must_be_positive(client):
    assert pay(client, "order-1", amount_pence=0).status_code == 422


def test_ledger_always_balances(client):
    pay(client, "order-1", amount_pence=420)
    pay(client, "order-2", amount_pence=1999)
    conn = database.connect(os.environ["DATABASE_PATH"])
    assert ledger.ledger_total(conn) == 0
