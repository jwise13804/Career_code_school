import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client(tmp_path, monkeypatch):
    """A test client with a brand-new database for every test."""
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.db"))
    return TestClient(app)


def pay(client, key, amount_pence=420, card_id=1, merchant="Greggs"):
    return client.post(
        "/payments",
        json={"card_id": card_id, "amount_pence": amount_pence, "merchant": merchant},
        headers={"Idempotency-Key": key},
    )
