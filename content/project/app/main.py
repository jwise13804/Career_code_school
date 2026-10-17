"""Mini card payments API.

Run it:      uvicorn app.main:app --reload
Then open:   http://localhost:8000/docs   (FastAPI's built-in, clickable docs)
"""
import hashlib
import json
import os
import sqlite3
from typing import Iterator, Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from . import database, disputes, ledger

app = FastAPI(title="Mini Card Payments API", version="1.0.0")


def get_conn() -> Iterator[sqlite3.Connection]:
    conn = database.connect(os.environ.get("DATABASE_PATH", database.DEFAULT_PATH))
    database.init_db(conn)
    database.seed(conn)
    try:
        yield conn
    finally:
        conn.close()


class PaymentRequest(BaseModel):
    card_id: int
    amount_pence: int = Field(gt=0, description="Amount in pence, e.g. 420 for £4.20")
    merchant: str = Field(min_length=1)


class DisputeRequest(BaseModel):
    payment_id: int
    reason: str = Field(min_length=1)


class TransitionRequest(BaseModel):
    to: str


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/payments", status_code=201)
def create_payment(
    request: PaymentRequest,
    response: Response,
    idempotency_key: Optional[str] = Header(default=None),
    conn: sqlite3.Connection = Depends(get_conn),
):
    if not idempotency_key:
        raise HTTPException(status_code=400, detail="An Idempotency-Key header is required")

    request_hash = hashlib.sha256(request.model_dump_json().encode()).hexdigest()
    saved = conn.execute("SELECT * FROM idempotency_keys WHERE key = ?", (idempotency_key,)).fetchone()
    if saved:
        if saved["request_hash"] != request_hash:
            raise HTTPException(status_code=409, detail="This Idempotency-Key was used with a different request")
        # A retry: send back exactly what we sent the first time, and charge nothing.
        return JSONResponse(
            status_code=saved["status_code"],
            content=json.loads(saved["response_body"]),
            headers={"Idempotent-Replayed": "true"},
        )

    card = conn.execute("SELECT * FROM cards WHERE id = ?", (request.card_id,)).fetchone()
    if card is None:
        raise HTTPException(status_code=404, detail="Card not found")

    if card["status"] != "active":
        status, body = 403, {"detail": "Card is blocked", "decline_code": "card_blocked"}
    elif ledger.balance_pence(conn, card["account_id"]) < request.amount_pence:
        status, body = 402, {"detail": "Insufficient funds", "decline_code": "insufficient_funds"}
    else:
        cur = conn.execute(
            "INSERT INTO payments (card_id, amount_pence, merchant, status) VALUES (?, ?, ?, 'approved')",
            (card["id"], request.amount_pence, request.merchant),
        )
        payment_id = cur.lastrowid
        ledger.record_payment(conn, payment_id, card["account_id"], request.merchant, request.amount_pence)
        status = 201
        body = {"id": payment_id, "card_id": card["id"], "amount_pence": request.amount_pence, "merchant": request.merchant, "status": "approved"}

    # Save the outcome under the key in the same transaction as the payment itself,
    # so a crash can never leave a payment without its idempotency record.
    conn.execute(
        "INSERT INTO idempotency_keys (key, request_hash, status_code, response_body) VALUES (?, ?, ?, ?)",
        (idempotency_key, request_hash, status, json.dumps(body)),
    )
    conn.commit()
    if status != 201:
        return JSONResponse(status_code=status, content=body)
    return body


@app.get("/payments/{payment_id}")
def get_payment(payment_id: int, conn: sqlite3.Connection = Depends(get_conn)):
    row = conn.execute("SELECT * FROM payments WHERE id = ?", (payment_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    return dict(row)


@app.get("/accounts/{account_id}/balance")
def get_balance(account_id: int, conn: sqlite3.Connection = Depends(get_conn)):
    if conn.execute("SELECT 1 FROM accounts WHERE id = ?", (account_id,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"account_id": account_id, "balance_pence": ledger.balance_pence(conn, account_id), "currency": "GBP"}


@app.post("/disputes", status_code=201)
def open_dispute(request: DisputeRequest, conn: sqlite3.Connection = Depends(get_conn)):
    if conn.execute("SELECT 1 FROM payments WHERE id = ?", (request.payment_id,)).fetchone() is None:
        raise HTTPException(status_code=404, detail="Payment not found")
    try:
        cur = conn.execute(
            "INSERT INTO disputes (payment_id, reason, status) VALUES (?, ?, 'opened')",
            (request.payment_id, request.reason),
        )
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="This payment already has a dispute")
    conn.commit()
    return dict(conn.execute("SELECT * FROM disputes WHERE id = ?", (cur.lastrowid,)).fetchone())


@app.post("/disputes/{dispute_id}/transition")
def move_dispute(dispute_id: int, request: TransitionRequest, conn: sqlite3.Connection = Depends(get_conn)):
    row = conn.execute("SELECT * FROM disputes WHERE id = ?", (dispute_id,)).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="Dispute not found")
    try:
        disputes.check_move(row["status"], request.to)
    except disputes.InvalidTransition as err:
        raise HTTPException(status_code=409, detail=str(err))
    conn.execute(
        "UPDATE disputes SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (request.to, dispute_id),
    )
    conn.commit()
    return dict(conn.execute("SELECT * FROM disputes WHERE id = ?", (dispute_id,)).fetchone())
