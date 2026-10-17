// "Mini Bank API": a pretend banking API that lives entirely in this browser
// tab. It behaves like a real REST API (methods, paths, status codes, JSON,
// headers, idempotency keys) but nothing leaves the page. Reloading resets it.

export const API_KEY = "demo-key-123";

const STATUS_TEXT = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  409: "Conflict",
  422: "Unprocessable Content",
  500: "Internal Server Error",
};

export const STATUS_EXPLAIN = {
  200: "Success. Here's what you asked for.",
  201: "Success. Something new was created (like a new case reference being issued).",
  204: "Success, and there's nothing to send back.",
  400: "The request itself was garbled, for example the body isn't valid JSON.",
  401: "Who are you? The request is missing a valid API key, like a caller who can't pass security questions.",
  402: "The payment was refused, for example insufficient funds.",
  403: "We know who you are, but you're not allowed to do this.",
  404: "Nothing exists at that address. Check the path and the ID.",
  405: "That path exists, but not with this method (for example DELETE where only GET is allowed).",
  409: "This clashes with something that already happened.",
  422: "The request was understood, but the details are wrong or missing, like a form with a required box left empty.",
  500: "The server broke. Not your fault: in real life, this is when engineers get paged.",
};

export function statusText(code) {
  return STATUS_TEXT[code] || "";
}

function seed() {
  return {
    customers: [
      { id: 1, name: "Amira Khan", city: "Leeds" },
      { id: 2, name: "Tom Walsh", city: "Manchester" },
      { id: 3, name: "Priya Patel", city: "Leicester" },
      { id: 4, name: "Sam Okafor", city: "London" },
    ],
    accounts: [
      { id: 1, customer_id: 1, balance: 1240.5 },
      { id: 2, customer_id: 2, balance: 35.2 },
      { id: 3, customer_id: 3, balance: 512.0 },
      { id: 4, customer_id: 4, balance: 88.75 },
    ],
    cards: [
      { id: 1, account_id: 1, last4: "4421", status: "active" },
      { id: 2, account_id: 2, last4: "3381", status: "blocked" },
      { id: 3, account_id: 3, last4: "7765", status: "active" },
      { id: 4, account_id: 4, last4: "1204", status: "active" },
    ],
    payments: [],
    disputes: [],
    idempotency: new Map(), // key -> {bodyText, response}
  };
}

let db = seed();
export function resetBank() {
  db = seed();
}

const json = (status, body, headers = {}) => ({ status, body, headers: { "content-type": "application/json", ...headers } });
const err = (status, message, extra = {}) => json(status, { error: message, ...extra });
const money = (n) => Math.round(n * 100) / 100;

/**
 * Handle a request. `headers` is a plain object with lower-case keys.
 * Returns {status, headers, body}.
 */
export function handleRequest({ method, path, headers = {}, bodyText = "" }) {
  method = method.toUpperCase();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, "https://minibank.example");
  const parts = url.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  let body = null;
  if (bodyText && bodyText.trim() && method !== "GET") {
    try {
      body = JSON.parse(bodyText);
    } catch {
      return err(400, "The request body isn't valid JSON. Check for missing quotes or commas, and use double quotes.");
    }
  }
  const authed = (headers.authorization || "").trim() === `Bearer ${API_KEY}`;
  const needAuth = () => (authed ? null : err(401, "Missing or wrong API key. Add the header  Authorization: Bearer " + API_KEY));
  const findId = (list, raw) => list.find((x) => String(x.id) === String(raw));

  // GET / : a friendly index
  if (parts.length === 0) {
    if (method !== "GET") return err(405, "Only GET works here.");
    return json(200, {
      name: "Mini Bank API (simulation)",
      endpoints: [
        "GET /customers",
        "GET /customers/{id}",
        "POST /customers",
        "GET /accounts/{id}/balance",
        "GET /cards/{id}",
        "POST /cards/{id}/freeze",
        "GET /payments",
        "POST /payments  (needs API key)",
        "POST /disputes  (needs API key)",
        "GET /disputes/{id}",
      ],
    });
  }

  const [resource, id, action] = parts;

  if (resource === "customers") {
    if (!id) {
      if (method === "GET") {
        let list = db.customers;
        const city = url.searchParams.get("city");
        if (city) list = list.filter((c) => c.city.toLowerCase() === city.toLowerCase());
        return json(200, list);
      }
      if (method === "POST") {
        if (!body || typeof body !== "object") return err(422, "Send a JSON body like {\"name\": \"Grace Murphy\", \"city\": \"Belfast\"}.");
        const missing = ["name", "city"].filter((f) => !body[f] || typeof body[f] !== "string");
        if (missing.length) return err(422, `Missing or invalid field(s): ${missing.join(", ")}`, { fields: missing });
        const customer = { id: Math.max(0, ...db.customers.map((c) => c.id)) + 1, name: body.name, city: body.city };
        db.customers.push(customer);
        return json(201, customer, { location: `/customers/${customer.id}` });
      }
      return err(405, "Use GET to list customers or POST to add one.");
    }
    if (method !== "GET") return err(405, `${method} isn't allowed on a single customer in this API. Only GET.`);
    const c = findId(db.customers, id);
    return c ? json(200, c) : err(404, `No customer with id ${id}.`);
  }

  if (resource === "accounts") {
    const a = findId(db.accounts, id);
    if (!id || action !== "balance") return err(404, "Try /accounts/1/balance");
    if (method !== "GET") return err(405, "Balances are read-only. Use GET.");
    return a ? json(200, { account_id: a.id, balance: money(a.balance), currency: "GBP" }) : err(404, `No account with id ${id}.`);
  }

  if (resource === "cards") {
    const card = findId(db.cards, id);
    if (!id) return err(404, "Ask for a specific card, e.g. /cards/1");
    if (!card) return err(404, `No card with id ${id}.`);
    if (!action) {
      if (method !== "GET") return err(405, "Use GET to read a card.");
      return json(200, card);
    }
    if (action === "freeze" || action === "unfreeze") {
      if (method !== "POST") return err(405, `Use POST to ${action} a card: it changes something.`);
      card.status = action === "freeze" ? "blocked" : "active";
      return json(200, card);
    }
    return err(404, `Unknown action "${action}".`);
  }

  if (resource === "payments") {
    if (method === "GET" && !id) return json(200, db.payments);
    if (method === "GET" && id) {
      const p = findId(db.payments, id);
      return p ? json(200, p) : err(404, `No payment with id ${id}.`);
    }
    if (method !== "POST" || id) return err(405, "Use POST /payments to take a payment.");
    const denied = needAuth();
    if (denied) return denied;
    const key = headers["idempotency-key"];
    if (key && db.idempotency.has(key)) {
      const saved = db.idempotency.get(key);
      if (saved.bodyText.trim() !== bodyText.trim()) return err(409, "This Idempotency-Key was already used with a different request body.");
      return { ...saved.response, headers: { ...saved.response.headers, "idempotent-replayed": "true" } };
    }
    if (!body) return err(422, "Send a JSON body like {\"card_id\": 1, \"amount\": 12.50, \"merchant\": \"Greggs\"}.");
    const problems = [];
    if (typeof body.card_id !== "number") problems.push("card_id (a number)");
    if (typeof body.amount !== "number" || body.amount <= 0) problems.push("amount (a number above 0)");
    if (!body.merchant) problems.push("merchant");
    if (problems.length) return err(422, `Missing or invalid: ${problems.join(", ")}`);
    const card = findId(db.cards, body.card_id);
    if (!card) return err(404, `No card with id ${body.card_id}.`);
    let response;
    if (card.status !== "active") response = err(403, "Card is blocked. Payment declined.", { decline_code: "card_blocked" });
    else {
      const account = findId(db.accounts, card.account_id);
      if (account.balance < body.amount) response = err(402, "Insufficient funds. Payment declined.", { decline_code: "insufficient_funds" });
      else {
        account.balance = money(account.balance - body.amount);
        const payment = { id: db.payments.length + 1, card_id: card.id, amount: money(body.amount), merchant: body.merchant, status: "approved" };
        db.payments.push(payment);
        response = json(201, payment, { location: `/payments/${payment.id}` });
      }
    }
    if (key) db.idempotency.set(key, { bodyText, response });
    return response;
  }

  if (resource === "disputes") {
    if (method === "GET") {
      if (!id) return json(200, db.disputes);
      const d = findId(db.disputes, id);
      return d ? json(200, d) : err(404, `No dispute with id ${id}.`);
    }
    if (method !== "POST" || id) return err(405, "Use POST /disputes to open a dispute.");
    const denied = needAuth();
    if (denied) return denied;
    if (!body || typeof body.payment_id !== "number" || !body.reason) return err(422, "Send {\"payment_id\": 1, \"reason\": \"not received\"}.");
    const p = findId(db.payments, body.payment_id);
    if (!p) return err(404, `No payment with id ${body.payment_id}. Make a payment first.`);
    if (db.disputes.some((d) => d.payment_id === p.id)) return err(409, "That payment already has a dispute open.");
    const d = { id: db.disputes.length + 1, payment_id: p.id, reason: body.reason, status: "opened" };
    db.disputes.push(d);
    return json(201, d);
  }

  if (resource === "crash") {
    return err(500, "Something went wrong on the server. (This endpoint breaks on purpose so you can see a 500.)");
  }

  return err(404, `There's nothing at /${parts.join("/")}. Try GET / to see what's available.`);
}
