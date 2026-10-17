"""Database setup. SQLite is built into Python, so there's nothing to install.

Money is stored in pence (whole numbers), never as decimals.
"""
import os
import sqlite3

DEFAULT_PATH = os.environ.get("DATABASE_PATH", "payments.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY,
    owner TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY,
    account_id INTEGER NOT NULL REFERENCES accounts(id),
    last4 TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'blocked'))
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY,
    card_id INTEGER NOT NULL REFERENCES cards(id),
    amount_pence INTEGER NOT NULL CHECK (amount_pence > 0),
    merchant TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Double-entry ledger: every payment writes two rows that add up to zero.
-- Money never appears or disappears; it only moves between accounts.
CREATE TABLE IF NOT EXISTS ledger_entries (
    id INTEGER PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    account TEXT NOT NULL,          -- e.g. 'customer:1' or 'merchant:Greggs'
    amount_pence INTEGER NOT NULL,  -- negative = money out, positive = money in
    description TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Remembers the response for every Idempotency-Key we've handled.
CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    request_hash TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    response_body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS disputes (
    id INTEGER PRIMARY KEY,
    payment_id INTEGER NOT NULL UNIQUE REFERENCES payments(id),
    reason TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


def connect(path: str = DEFAULT_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(path, check_same_thread=False)
    conn.row_factory = sqlite3.Row  # rows behave like dictionaries
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db(conn: sqlite3.Connection) -> None:
    conn.executescript(SCHEMA)
    conn.commit()


def seed(conn: sqlite3.Connection) -> None:
    """Demo data: one customer with £100.00, one active card and one blocked card."""
    if conn.execute("SELECT COUNT(*) FROM accounts").fetchone()[0]:
        return
    conn.execute("INSERT INTO accounts (id, owner) VALUES (1, 'Demo Customer')")
    conn.execute("INSERT INTO cards (id, account_id, last4, status) VALUES (1, 1, '4242', 'active')")
    conn.execute("INSERT INTO cards (id, account_id, last4, status) VALUES (2, 1, '0002', 'blocked')")
    # Opening balance: money moves from the bank's funding account to the customer.
    conn.execute(
        "INSERT INTO ledger_entries (account, amount_pence, description) VALUES "
        "('bank:funding', -10000, 'Opening balance'), ('customer:1', 10000, 'Opening balance')"
    )
    conn.commit()
