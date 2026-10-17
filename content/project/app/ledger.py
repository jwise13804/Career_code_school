"""The ledger: the single source of truth for where money is.

A balance is never stored. It's always worked out by adding up ledger
entries, so it can always be explained line by line.
"""
import sqlite3


def record_payment(conn: sqlite3.Connection, payment_id: int, account_id: int, merchant: str, amount_pence: int) -> None:
    """Move money from the customer to the merchant: two entries that sum to zero."""
    conn.execute(
        "INSERT INTO ledger_entries (payment_id, account, amount_pence, description) VALUES (?, ?, ?, ?)",
        (payment_id, f"customer:{account_id}", -amount_pence, f"Card payment to {merchant}"),
    )
    conn.execute(
        "INSERT INTO ledger_entries (payment_id, account, amount_pence, description) VALUES (?, ?, ?, ?)",
        (payment_id, f"merchant:{merchant}", amount_pence, f"Card payment {payment_id}"),
    )


def balance_pence(conn: sqlite3.Connection, account_id: int) -> int:
    row = conn.execute(
        "SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries WHERE account = ?",
        (f"customer:{account_id}",),
    ).fetchone()
    return row[0]


def ledger_total(conn: sqlite3.Connection) -> int:
    """Should always be 0. If it isn't, money has appeared or vanished: a serious bug."""
    return conn.execute("SELECT COALESCE(SUM(amount_pence), 0) FROM ledger_entries").fetchone()[0]
