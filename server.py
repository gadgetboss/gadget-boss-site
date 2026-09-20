import os
import re
import sys
import json
import time
import hmac
import hashlib
import sqlite3
import base64
import secrets
import urllib.request
import urllib.parse
import urllib.error
from http.server import SimpleHTTPRequestHandler, HTTPServer
from datetime import datetime
import threading

def _load_env_file(path):
    """Load KEY=VALUE lines without overwriting variables already in the environment."""
    if not os.path.isfile(path):
        return
    with open(path, encoding="utf-8") as handle:
        for raw in handle:
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value

# Application configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
_load_env_file(os.path.join(BASE_DIR, ".env"))
_load_env_file(os.path.join(BASE_DIR, ".env.local"))
DB_FILE = os.path.join(BASE_DIR, "crm.db")
ALLOWED_ZOHO_DOMAINS = {"com", "eu", "in", "com.au"}
STATIC_FILE_EXTENSIONS = {".css", ".html", ".ico", ".jpg", ".jpeg", ".js", ".jsx", ".json", ".png", ".svg", ".webp", ".woff", ".woff2"}
CRM_ADMIN_USER = os.environ.get("GADGETBOSS_CRM_USER")
CRM_ADMIN_PASSWORD = os.environ.get("GADGETBOSS_CRM_PASSWORD")
ALLOWED_ORIGIN = os.environ.get("GADGETBOSS_ALLOWED_ORIGIN")
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()
PAYSTACK_PUBLIC_KEY = os.environ.get("PAYSTACK_PUBLIC_KEY", "").strip()

# ---------------------------------------------------------------------------
# Passwordless customer auth (Hubtel OTP) — local-dev parity with api/auth/*
# and api/account/*. Same cookie names, same HMAC signing scheme, same JSON
# shapes, so the storefront behaves identically on 127.0.0.1 and on Vercel.
# ---------------------------------------------------------------------------
OTP_COOKIE = "gb_otp"
SESSION_COOKIE = "gb_session"
OTP_MAX_AGE_SECONDS = 600
SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
OTP_TTL_SECONDS = 300
RESEND_COOLDOWN_SECONDS = 30
MAX_OTP_ATTEMPTS = 5

HUBTEL_DEFAULT_BASE_URL = "https://api-otp.hubtel.com"
HUBTEL_DEFAULT_SENDER_ID = "GADGETBOSS"
HUBTEL_SUCCESS_CODES = {"0", "0000", "0001"}
HUBTEL_SUCCESS_STATUSES = {"0", "0000", "success", "ok", "true"}

GH_COUNTRY_CODE = "233"
GH_MOBILE_FIRST_DIGITS = {"2", "5"}

AUTH_ERR_NOT_CONFIGURED = "Phone verification is not configured."
AUTH_ERR_INVALID_PHONE = "Enter a valid Ghana mobile number."
AUTH_ERR_SEND_FAILED = "Could not send the code. Try again."
AUTH_ERR_VERIFY_FAILED = "Could not verify the code. Try again."
AUTH_ERR_EXPIRED = "Your code expired. Request a new one."
AUTH_ERR_TOO_MANY = "Too many attempts. Request a new code."
AUTH_ERR_WRONG_CODE = "That code is not correct."
AUTH_ERR_COOLDOWN = "Please wait before requesting another code."
ACCOUNT_ERR_SIGN_IN = "Sign in to view your orders."
ACCOUNT_ERR_NOT_FOUND = "Order not found."
ACCOUNT_ERR_LOOKUP = "Could not load your orders. Try again."

ORDER_SELECT = (
    "id,receipt_no,status,total,subtotal,payment_method,created_at,customer_name,"
    "customer_location,order_items(product_id,product_name,qty,unit_price,line_total),"
    "payments(reference)"
)
ORDER_DETAIL_SELECT = ORDER_SELECT + ",updated_at"
TRACKING_STEPS = (
    ("placed", "Order placed"),
    ("confirmed", "Order confirmed"),
    ("processing", "Preparing your order"),
    ("dispatched", "Out for delivery"),
    ("delivered", "Delivered"),
)
ORDER_STATUS_RANK = {
    "PENDING": 0,
    "CONFIRMED": 1,
    "PROCESSING": 2,
    "DISPATCHED": 3,
    "DELIVERED": 4,
    "COMPLETED": 4,
}
UUID_PATTERN = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$", re.I)
ORDER_ID_PATTERN = re.compile(r"^[A-Za-z0-9._-]+$")


def now_seconds():
    return int(time.time())


def session_secret():
    return os.environ.get("SESSION_SECRET", "").strip()


def hubtel_config():
    client_id = os.environ.get("HUBTEL_CLIENT_ID", "").strip()
    client_secret = os.environ.get("HUBTEL_CLIENT_SECRET", "").strip()
    sender_id = os.environ.get("HUBTEL_SENDER_ID", "").strip() or HUBTEL_DEFAULT_SENDER_ID
    base_url = (os.environ.get("HUBTEL_OTP_BASE_URL", "").strip() or HUBTEL_DEFAULT_BASE_URL).rstrip("/")
    return {
        "client_id": client_id,
        "client_secret": client_secret,
        "sender_id": sender_id,
        "base_url": base_url,
        "configured": bool(client_id and client_secret),
    }


def supabase_config():
    url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
    service_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    return {"url": url, "service_key": service_key, "configured": bool(url and service_key)}


# --- Signed cookies -------------------------------------------------------
def b64url_encode(raw):
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def b64url_decode(value):
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def sign_payload(payload_obj, secret):
    """base64url(json).base64url(hmacSha256) — matches api/_lib/cookies.js."""
    payload = b64url_encode(json.dumps(payload_obj, separators=(",", ":")).encode("utf-8"))
    signature = hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest()
    return f"{payload}.{b64url_encode(signature)}"


def verify_signed_payload(token, secret):
    if not token or not secret:
        return None
    index = token.rfind(".")
    if index <= 0 or index == len(token) - 1:
        return None
    payload, signature = token[:index], token[index + 1:]
    expected = b64url_encode(
        hmac.new(secret.encode("utf-8"), payload.encode("ascii"), hashlib.sha256).digest()
    )
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        parsed = json.loads(b64url_decode(payload).decode("utf-8"))
    except Exception:
        return None
    if not isinstance(parsed, dict):
        return None
    expires_at = parsed.get("exp")
    if not isinstance(expires_at, (int, float)) or isinstance(expires_at, bool):
        return None
    if expires_at <= now_seconds():
        return None
    return parsed


def parse_cookie_header(header):
    cookies = {}
    for part in (header or "").split(";"):
        if "=" not in part:
            continue
        name, _, value = part.partition("=")
        name = name.strip()
        if not name:
            continue
        try:
            cookies[name] = urllib.parse.unquote(value.strip())
        except Exception:
            cookies[name] = value.strip()
    return cookies


def build_cookie(name, value, max_age_seconds, secure):
    parts = [
        f"{name}={value}",
        "HttpOnly",
        "Path=/",
        "SameSite=Lax",
        f"Max-Age={max(0, int(max_age_seconds))}",
    ]
    if max_age_seconds <= 0:
        parts.append("Expires=Thu, 01 Jan 1970 00:00:00 GMT")
    if secure:
        parts.append("Secure")
    return "; ".join(parts)


# --- Ghana phone normalisation (mirror of src/auth/phone.ts) --------------
def normalize_gh_phone(value):
    if value is None:
        return None
    digits = re.sub(r"[^0-9]", "", str(value).strip())
    for _ in range(4):
        if digits.startswith("00"):
            digits = digits[2:]
            continue
        if digits.startswith(GH_COUNTRY_CODE) and len(digits) > 9:
            digits = digits[3:]
            continue
        if digits.startswith("0") and len(digits) > 9:
            digits = digits[1:]
            continue
        break
    if len(digits) != 9:
        return None
    if digits[0] not in GH_MOBILE_FIRST_DIGITS:
        return None
    return f"+{GH_COUNTRY_CODE}{digits}"


def gh_phone_variants(e164):
    normalized = normalize_gh_phone(e164)
    if not normalized:
        return []
    subscriber = normalized[4:]
    return [
        f"+{GH_COUNTRY_CODE}{subscriber}",
        f"{GH_COUNTRY_CODE}{subscriber}",
        f"0{subscriber}",
        subscriber,
    ]


def mask_gh_phone(e164):
    normalized = normalize_gh_phone(e164)
    if not normalized:
        return ""
    subscriber = normalized[4:]
    return f"+{GH_COUNTRY_CODE} {subscriber[:2]} *** {subscriber[5:]}"


def normalize_otp_code(value):
    digits = re.sub(r"[^0-9]", "", "" if value is None else str(value))
    return digits if 4 <= len(digits) <= 8 else ""


def pending_otp_response(phone):
    return {
        "ok": True,
        "configured": True,
        "phone": phone,
        "maskedPhone": mask_gh_phone(phone),
        "expiresInSeconds": OTP_TTL_SECONDS,
        "resendInSeconds": RESEND_COOLDOWN_SECONDS,
    }


# --- Hubtel OTP -----------------------------------------------------------
def _hubtel_post(cfg, path, body):
    """Returns (http_status, parsed_json_or_None, raw_text). Never raises."""
    basic = base64.b64encode(
        f"{cfg['client_id']}:{cfg['client_secret']}".encode("utf-8")
    ).decode("ascii")
    request = urllib.request.Request(
        cfg["base_url"] + path,
        data=json.dumps(body).encode("utf-8"),
        method="POST",
        headers={
            "Authorization": f"Basic {basic}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status = response.getcode()
            text = response.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as err:
        status = err.code
        try:
            text = err.read().decode("utf-8", "replace")
        except Exception:
            text = ""
    except Exception as exc:
        print(f"[hubtel] {path} transport error: {exc}")
        return 0, None, ""

    try:
        parsed = json.loads(text) if text else None
    except Exception:
        parsed = None
    return status, parsed, text


def _hubtel_containers(payload):
    if not isinstance(payload, dict):
        return []
    containers = [payload]
    for key in ("data", "Data", "result", "Result", "response", "Response"):
        nested = payload.get(key)
        if isinstance(nested, dict):
            containers.append(nested)
    return containers


def _hubtel_pick(payload, keys):
    for container in _hubtel_containers(payload):
        for key in keys:
            value = container.get(key)
            if value is None or value == "" or isinstance(value, (dict, list)):
                continue
            return value
    return None


def _hubtel_request_id(payload):
    value = _hubtel_pick(payload, ("requestId", "RequestId", "request_id", "requestID", "otpRequestId"))
    return "" if value is None else str(value)


def _hubtel_prefix(payload):
    value = _hubtel_pick(payload, ("prefix", "Prefix", "otpPrefix", "OtpPrefix", "otp_prefix"))
    return "" if value is None else str(value)


def _hubtel_success(status, payload):
    if not 200 <= status < 300:
        return False
    code = _hubtel_pick(payload, ("code", "Code", "responseCode", "ResponseCode", "statusCode", "StatusCode"))
    api_status = _hubtel_pick(payload, ("status", "Status"))
    if code is None and api_status is None:
        return True
    if code is not None and str(code).strip().lower() in HUBTEL_SUCCESS_CODES:
        return True
    if api_status is not None and str(api_status).strip().lower() in HUBTEL_SUCCESS_STATUSES:
        return True
    return False


def _hubtel_log_failure(label, status, text):
    print(f"[hubtel] {label} failed: http={status or 'n/a'} body={str(text or '')[:500]}")


def hubtel_send_otp(phone_e164, cfg):
    status, payload, text = _hubtel_post(
        cfg, "/otp/send", {"senderId": cfg["sender_id"], "phoneNumber": phone_e164, "countryCode": "GH"}
    )
    if not _hubtel_success(status, payload):
        _hubtel_log_failure("send", status, text)
        return {"ok": False, "requestId": "", "prefix": ""}
    request_id = _hubtel_request_id(payload)
    if not request_id:
        _hubtel_log_failure("send (missing requestId)", status, text)
        return {"ok": False, "requestId": "", "prefix": ""}
    return {"ok": True, "requestId": request_id, "prefix": _hubtel_prefix(payload)}


def hubtel_resend_otp(request_id, prefix, cfg):
    status, payload, text = _hubtel_post(cfg, "/otp/resend", {"requestId": request_id, "prefix": prefix})
    if not _hubtel_success(status, payload):
        _hubtel_log_failure("resend", status, text)
        return {"ok": False, "requestId": "", "prefix": ""}
    return {
        "ok": True,
        "requestId": _hubtel_request_id(payload) or request_id,
        "prefix": _hubtel_prefix(payload) or prefix,
    }


def hubtel_verify_otp(request_id, prefix, code, cfg):
    """ok=False with upstream_error=False means 'Hubtel says the code is wrong'."""
    status, payload, text = _hubtel_post(
        cfg, "/otp/verify", {"requestId": request_id, "prefix": prefix, "code": code}
    )
    if status == 0:
        return {"ok": False, "upstreamError": True}
    if _hubtel_success(status, payload):
        return {"ok": True, "upstreamError": False}

    message = _hubtel_pick(payload, ("message", "Message", "description", "Description", "error", "Error"))
    haystack = f"{message or ''} {text or ''}".lower()
    if prefix and "prefix" in haystack:
        # Some Hubtel products expect the prefix concatenated onto the code.
        _hubtel_log_failure("verify (retrying with concatenated prefix)", status, text)
        retry_status, retry_payload, retry_text = _hubtel_post(
            cfg, "/otp/verify", {"requestId": request_id, "prefix": prefix, "code": f"{prefix}-{code}"}
        )
        if retry_status == 0:
            return {"ok": False, "upstreamError": True}
        if _hubtel_success(retry_status, retry_payload):
            return {"ok": True, "upstreamError": False}
        _hubtel_log_failure("verify retry", retry_status, retry_text)
        return {"ok": False, "upstreamError": retry_status >= 500}

    _hubtel_log_failure("verify", status, text)
    return {"ok": False, "upstreamError": status >= 500}


# --- Supabase PostgREST (service role, server-side only) ------------------
def postgrest_in_list(values):
    quoted = ",".join('"{}"'.format(str(value).replace('"', '""')) for value in values)
    return f"in.({quoted})"


def supabase_select(table, params, cfg):
    query = urllib.parse.urlencode(params)
    request = urllib.request.Request(
        f"{cfg['url']}/rest/v1/{table}?{query}",
        method="GET",
        headers={
            "apikey": cfg["service_key"],
            "Authorization": f"Bearer {cfg['service_key']}",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        try:
            detail = err.read().decode("utf-8", "replace")
        except Exception:
            detail = ""
        print(f"[supabase] {table} query failed: http={err.code} body={detail[:500]}")
        raise RuntimeError(f"Supabase query failed with status {err.code}")
    except Exception as exc:
        print(f"[supabase] {table} query error: {exc}")
        raise RuntimeError("Supabase query failed")
    return payload if isinstance(payload, list) else []


def lookup_customer(phone):
    """Never fails sign-in: an unset/unreachable Supabase just yields blank fields."""
    blank = {"phone": phone, "name": None, "email": None, "location": None}
    cfg = supabase_config()
    if not cfg["configured"]:
        return blank
    try:
        rows = supabase_select(
            "customers",
            {
                "select": "name,phone,email,location",
                "phone": postgrest_in_list(gh_phone_variants(phone)),
                "order": "updated_at.desc",
                "limit": "1",
            },
            cfg,
        )
    except RuntimeError:
        return blank
    if not rows:
        return blank
    row = rows[0]
    return {
        "phone": phone,
        "name": row.get("name") or None,
        "email": row.get("email") or None,
        "location": row.get("location") or None,
    }


def shape_order(row):
    items = row.get("order_items")
    payments = row.get("payments") if isinstance(row.get("payments"), list) else []
    payment_reference = None
    if payments:
        payment_reference = payments[0].get("reference") or None
    return {
        "id": row.get("id"),
        "receiptNo": row.get("receipt_no") or None,
        "status": row.get("status") or None,
        "total": float(row.get("total") or 0),
        "subtotal": float(row.get("subtotal") or 0),
        "paymentMethod": row.get("payment_method") or None,
        "paymentReference": payment_reference,
        "createdAt": row.get("created_at") or None,
        "customerName": row.get("customer_name") or None,
        "customerLocation": row.get("customer_location") or None,
        "items": [
            {
                "productId": item.get("product_id"),
                "productName": item.get("product_name"),
                "qty": int(item.get("qty") or 0),
                "unitPrice": float(item.get("unit_price") or 0),
                "lineTotal": float(item.get("line_total") or 0),
            }
            for item in (items if isinstance(items, list) else [])
        ],
    }


def build_tracking(row):
    status = str(row.get("status") or "PENDING").upper()
    placed_at = row.get("created_at") or None
    updated_at = row.get("updated_at") or None
    cancelled = status == "CANCELLED"
    reached = 0 if cancelled else ORDER_STATUS_RANK.get(status, 0)

    steps = []
    for index, (key, label) in enumerate(TRACKING_STEPS):
        if index == 0:
            at = placed_at
        elif not cancelled and index == reached:
            at = updated_at or placed_at
        else:
            at = None
        steps.append(
            {"key": key, "label": label, "done": (not cancelled) and index <= reached, "at": at}
        )

    if cancelled:
        steps[0]["done"] = True
        steps.append(
            {"key": "cancelled", "label": "Cancelled", "done": True, "at": updated_at or placed_at}
        )

    return {"status": status, "placedAt": placed_at, "steps": steps}


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    # 1. Customers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        email TEXT,
        ltv REAL DEFAULT 0.0,
        join_date TEXT,
        status TEXT DEFAULT 'Regular',
        zoho_id TEXT
    )
    """)
    
    # 2. Leads Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        searched_product TEXT,
        wishlist_product TEXT,
        status TEXT DEFAULT 'Warm',
        updated_at TEXT,
        zoho_id TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )
    """)
    
    # 3. Orders Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        items_json TEXT NOT NULL,
        total_price REAL NOT NULL,
        status TEXT DEFAULT 'Pending',
        order_date TEXT,
        zoho_id TEXT,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )
    """)
    
    # 4. Zoho Config Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS zoho_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT,
        client_secret TEXT,
        refresh_token TEXT,
        domain TEXT DEFAULT 'com',
        status TEXT DEFAULT 'Disconnected'
    )
    """)
    
    # Pre-populate some rich mock customers for luxury SaaS display if empty
    cursor.execute("SELECT COUNT(*) FROM customers")
    if cursor.fetchone()[0] == 0:
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cursor.executemany("""
        INSERT INTO customers (name, phone, email, ltv, join_date, status, zoho_id) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, [
            ("Kofi Mensah", "233501234567", "kofi@mensah.com", 2400.0, now, "VIP", "ZOHO_CON_492049102"),
            ("Ismail Ibrahim", "233540639091", "ismail@gadgetboss.com", 9500.0, now, "VIP", "ZOHO_CON_822359582"),
            ("Ebenezer Arthur", "233209876543", "ebenezer@arthur.net", 850.0, now, "Regular", None),
            ("Kwame Boahen", "233241112223", "kwame@boahen.org", 450.0, now, "Regular", None)
        ])
        
        # Log a mock order for Ismail
        cursor.execute("INSERT INTO orders (customer_id, items_json, total_price, status, order_date, zoho_id) VALUES (?, ?, ?, ?, ?, ?)", (
            2,
            json.dumps([{"name": "Playstation 5 DualSense Controller (Gilded Edition)", "price": 1400.0, "qty": 1}]),
            1400.0,
            "Dispatched",
            now,
            "ZOHO_SO_58230948"
        ))
        
        # Log a mock lead
        cursor.execute("INSERT INTO leads (customer_id, searched_product, wishlist_product, status, updated_at, zoho_id) VALUES (?, ?, ?, ?, ?, ?)", (
            3,
            "Airpods Pro Max",
            None,
            "Warm",
            now,
            None
        ))
        
    conn.commit()
    conn.close()

init_db()

# Zoho Sync Helper Functions
def get_zoho_access_token(config):
    try:
        client_id = config.get("client_id")
        client_secret = config.get("client_secret")
        refresh_token = config.get("refresh_token")
        domain = config.get("domain", "com")
        
        if not client_id or not client_secret or not refresh_token or domain not in ALLOWED_ZOHO_DOMAINS:
            return None
            
        url = f"https://accounts.zoho.{domain}/oauth/v2/token"
        data = urllib.parse.urlencode({
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "grant_type": "refresh_token"
        }).encode("utf-8")
        
        req = urllib.request.Request(url, data=data, headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0"
        })
        
        with urllib.request.urlopen(req, timeout=5) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            return res_data.get("access_token")
    except Exception as e:
        print(f"Error fetching Zoho Access Token: {e}")
        return None

def sync_entity_to_zoho(access_token, module, data, domain="com"):
    try:
        if domain not in ALLOWED_ZOHO_DOMAINS:
            return None
        url = f"https://www.zohoapis.{domain}/crm/v2/{module}"
        payload = json.dumps({"data": [data]}).encode("utf-8")
        
        req = urllib.request.Request(url, data=payload, method="POST", headers={
            "Authorization": f"Zoho-oauthtoken {access_token}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0"
        })
        
        with urllib.request.urlopen(req, timeout=5) as response:
            res = json.loads(response.read().decode("utf-8"))
            records = res.get("data", [])
            if records and records[0].get("status") == "success":
                return records[0].get("details", {}).get("id")
    except Exception as e:
        print(f"Error syncing {module} to Zoho: {e}")
    return None

def run_background_sync():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, client_id, client_secret, refresh_token, domain FROM zoho_config ORDER BY id DESC LIMIT 1")
    config_row = cursor.fetchone()
    
    if not config_row:
        conn.close()
        return
        
    config_id, client_id, client_secret, refresh_token, domain = config_row
    config = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh_token,
        "domain": domain
    }
    
    token = get_zoho_access_token(config)
    if not token:
        # Update Zoho config status to expired
        cursor.execute("UPDATE zoho_config SET status = 'Authentication Expired' WHERE id = ?", (config_id,))
        conn.commit()
        conn.close()
        return
        
    # Mark config as connected
    cursor.execute("UPDATE zoho_config SET status = 'Connected' WHERE id = ?", (config_id,))
    conn.commit()
    
    # 1. Sync Customers (where zoho_id is NULL) as Contacts
    cursor.execute("SELECT id, name, phone, email, ltv FROM customers WHERE zoho_id IS NULL")
    unsynced_customers = cursor.fetchall()
    
    for cust in unsynced_customers:
        c_id, name, phone, email, ltv = cust
        # Zoho Contact data format
        zoho_contact = {
            "Last_Name": name.split()[-1] if len(name.split()) > 1 else name,
            "First_Name": name.split()[0] if len(name.split()) > 1 else "",
            "Phone": phone,
            "Email": email or f"{phone}@gadgetboss.com",
            "Description": f"LTV: GHS {ltv} - Synced from GADGETBO$$ Storefront Console."
        }
        z_id = sync_entity_to_zoho(token, "Contacts", zoho_contact, config["domain"])
        if z_id:
            cursor.execute("UPDATE customers SET zoho_id = ? WHERE id = ?", (f"ZOHO_CON_{z_id}", c_id))
            conn.commit()
            
    # 2. Sync Leads (where zoho_id is NULL)
    cursor.execute("""
        SELECT l.id, c.name, c.phone, c.email, l.searched_product, l.wishlist_product 
        FROM leads l 
        JOIN customers c ON l.customer_id = c.id 
        WHERE l.zoho_id IS NULL
    """)
    unsynced_leads = cursor.fetchall()
    
    for lead in unsynced_leads:
        l_id, name, phone, email, search, wishlist = lead
        interest = search if search else wishlist
        zoho_lead = {
            "Last_Name": name.split()[-1] if len(name.split()) > 1 else name,
            "First_Name": name.split()[0] if len(name.split()) > 1 else "",
            "Company": "GADGETBO$$ Retail Client",
            "Phone": phone,
            "Email": email or f"{phone}@gadgetboss.com",
            "Lead_Source": "GADGETBO$$ Web Storefront",
            "Description": f"User Search/Wishlist Interest: {interest}"
        }
        z_id = sync_entity_to_zoho(token, "Leads", zoho_lead, config["domain"])
        if z_id:
            cursor.execute("UPDATE leads SET zoho_id = ? WHERE id = ?", (f"ZOHO_LEAD_{z_id}", l_id))
            conn.commit()
            
    # 3. Sync Orders (where zoho_id is NULL) as Sales_Orders
    cursor.execute("""
        SELECT o.id, c.name, c.zoho_id, o.items_json, o.total_price 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.zoho_id IS NULL
    """)
    unsynced_orders = cursor.fetchall()
    
    for order in unsynced_orders:
        o_id, name, c_zoho_id, items, total = order
        # Zoho Sales_Order data format
        zoho_so = {
            "Subject": f"GADGETBO$$ E-Commerce Order - GHS {total}",
            "Contact_Name": c_zoho_id.replace("ZOHO_CON_", "") if c_zoho_id else None,
            "Grand_Total": total,
            "Description": f"Consolidated Cart Items: {items}"
        }
        z_id = sync_entity_to_zoho(token, "Sales_Orders", zoho_so, config["domain"])
        if z_id:
            cursor.execute("UPDATE orders SET zoho_id = ? WHERE id = ?", (f"ZOHO_SO_{z_id}", o_id))
            conn.commit()
            
    conn.close()


# HTTP API Request Handler
class DynamicCRMServer(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".jsx": "text/javascript",
        ".json": "application/json",
    }

    def _request_path(self):
        return urllib.parse.urlparse(self.path).path

    def _is_safe_static_path(self):
        request_path = urllib.parse.unquote(self._request_path())
        relative_path = os.path.normpath(request_path.lstrip("/"))
        if relative_path in ("", "."):
            return True

        resolved_path = os.path.realpath(os.path.join(BASE_DIR, relative_path))
        if not resolved_path.startswith(BASE_DIR + os.sep):
            return False
        if os.path.isdir(resolved_path):
            return relative_path in {"assets", "crm", "showcase", "pos", "legal", "dist", "docs"}
        return os.path.splitext(resolved_path)[1].lower() in STATIC_FILE_EXTENSIONS

    def _is_authorized_admin(self):
        if not CRM_ADMIN_USER or not CRM_ADMIN_PASSWORD:
            return False

        authorization = self.headers.get("Authorization", "")
        if not authorization.startswith("Basic "):
            return False
        try:
            encoded_credentials = authorization.split(" ", 1)[1]
            supplied_credentials = base64.b64decode(encoded_credentials).decode("utf-8")
            supplied_user, supplied_password = supplied_credentials.split(":", 1)
        except (ValueError, UnicodeDecodeError):
            return False

        return (
            secrets.compare_digest(supplied_user, CRM_ADMIN_USER)
            and secrets.compare_digest(supplied_password, CRM_ADMIN_PASSWORD)
        )

    def _require_admin(self):
        if not CRM_ADMIN_USER or not CRM_ADMIN_PASSWORD:
            self.send_json_response(
                {"error": "CRM access is disabled until GADGETBOSS_CRM_USER and GADGETBOSS_CRM_PASSWORD are configured."},
                status=503,
            )
            return False
        if self._is_authorized_admin():
            return True

        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="GADGETBO$$ CRM"')
        self.end_headers()
        return False
    
    def end_headers(self):
        origin = self.headers.get("Origin")
        if ALLOWED_ORIGIN and origin == ALLOWED_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        # Without an explicit directive browsers heuristically cache CSS/JS/images
        # and serve stale assets for hours, so edits appear not to take effect.
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()
        
    def do_OPTIONS(self):
        if ALLOWED_ORIGIN and self.headers.get("Origin") == ALLOWED_ORIGIN:
            self.send_response(204)
            self.end_headers()
        else:
            self.send_error(403, "Cross-origin requests are not allowed.")
        
    def do_GET(self):
        request_path = self._request_path()
        # Customer-facing auth/account routes are intentionally outside the CRM gate.
        if request_path == "/api/public-config":
            self.handle_public_config()
            return
        if request_path == "/api/auth/session":
            self.handle_auth_session()
            return
        if request_path in {"/api/account/orders", "/api/account/orders/"}:
            self.handle_account_orders()
            return
        if request_path.startswith("/api/account/orders/"):
            self.handle_account_order_detail(request_path[len("/api/account/orders/"):])
            return

        if request_path.startswith("/api/crm/") or request_path == "/crm" or request_path.startswith("/crm/"):
            if not self._require_admin():
                return

        if request_path.startswith("/api/crm/"):
            self.handle_api_get()
        elif self._is_safe_static_path():
            super().do_GET()
        else:
            self.send_error(404, "Static file not found.")
            
    def do_POST(self):
        request_path = self._request_path()
        if request_path in {"/api/paystack/verify", "/api/paystack-verify"}:
            self.handle_paystack_verify()
            return
        if request_path == "/api/auth/request-otp":
            self.handle_auth_request_otp()
            return
        if request_path == "/api/auth/verify-otp":
            self.handle_auth_verify_otp()
            return
        if request_path == "/api/auth/resend-otp":
            self.handle_auth_resend_otp()
            return
        if request_path == "/api/auth/logout":
            self.handle_auth_logout()
            return
        if request_path == "/api/auth/claim-order":
            self.handle_auth_claim_order()
            return
        if request_path.startswith("/api/crm/"):
            if not self._require_admin():
                return
            self.handle_api_post()
        else:
            self.send_error(404, "Endpoint not found.")

    def handle_public_config(self):
        supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or ""
        supabase_anon = os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY") or ""
        self.send_json_response(
            {
                "PAYSTACK_PUBLIC_KEY": PAYSTACK_PUBLIC_KEY,
                "SUPABASE_URL": supabase_url.strip(),
                "SUPABASE_ANON_KEY": supabase_anon.strip(),
            }
        )

    def handle_paystack_verify(self):
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(post_data) if post_data else {}
        except (TypeError, ValueError, json.JSONDecodeError):
            self.send_json_response({"verified": False, "error": "Invalid JSON"}, status=400)
            return

        if not PAYSTACK_SECRET_KEY:
            self.send_json_response({"configured": False, "verified": False})
            return

        reference = str(data.get("reference") or "").strip()
        expected_amount = data.get("amount")
        if not reference:
            self.send_json_response({"verified": False, "error": "Missing reference"}, status=400)
            return

        req = urllib.request.Request(
            f"https://api.paystack.co/transaction/verify/{urllib.parse.quote(reference)}",
            headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
            method="GET",
        )
        try:
            with urllib.request.urlopen(req, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except urllib.error.HTTPError as err:
            try:
                payload = json.loads(err.read().decode("utf-8"))
            except Exception:
                self.send_json_response({"verified": False, "error": "Paystack verification failed"}, status=502)
                return
        except Exception:
            self.send_json_response({"verified": False, "error": "Paystack verification failed"}, status=502)
            return

        tx = payload.get("data") or {}
        paid = (
            payload.get("status") is True
            and tx.get("status") == "success"
            and str(tx.get("currency") or "").upper() == "GHS"
        )
        amount_ok = expected_amount in (None, "") or int(tx.get("amount") or 0) == int(expected_amount)
        verified = bool(paid and amount_ok)
        self.send_json_response(
            {
                "configured": True,
                "verified": verified,
                "reference": reference,
                "amount": tx.get("amount"),
                "status": tx.get("status"),
                "channel": tx.get("channel"),
            },
            status=200 if verified else 400,
        )

    # --- Passwordless customer auth ---------------------------------------
    def _read_json_body(self):
        """Always drains the request body. Returns (data, parsed_ok)."""
        try:
            content_length = int(self.headers.get("Content-Length", 0))
        except (TypeError, ValueError):
            return {}, False
        try:
            raw = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else ""
        except Exception:
            return {}, False
        if not raw:
            return {}, True
        try:
            parsed = json.loads(raw)
        except (ValueError, json.JSONDecodeError):
            return {}, False
        return (parsed if isinstance(parsed, dict) else {}), True

    def _is_secure_request(self):
        forwarded = self.headers.get("X-Forwarded-Proto", "") or ""
        first = forwarded.split(",")[0].strip().lower()
        # Plain HTTP on 127.0.0.1 must not get a Secure cookie or it is dropped.
        return first == "https"

    def _request_cookies(self):
        return parse_cookie_header(self.headers.get("Cookie", ""))

    def _otp_cookie_header(self, state, secret):
        return build_cookie(OTP_COOKIE, sign_payload(state, secret), OTP_MAX_AGE_SECONDS, self._is_secure_request())

    def _session_cookie_header(self, phone, secret):
        issued_at = now_seconds()
        state = {"phone": phone, "iat": issued_at, "exp": issued_at + SESSION_MAX_AGE_SECONDS}
        return build_cookie(
            SESSION_COOKIE, sign_payload(state, secret), SESSION_MAX_AGE_SECONDS, self._is_secure_request()
        )

    def _cleared_cookie_header(self, name):
        return build_cookie(name, "", 0, self._is_secure_request())

    def _pending_otp(self, secret):
        return verify_signed_payload(self._request_cookies().get(OTP_COOKIE), secret)

    def _session_phone(self):
        secret = session_secret()
        if not secret:
            return None
        payload = verify_signed_payload(self._request_cookies().get(SESSION_COOKIE), secret)
        if not payload:
            return None
        return normalize_gh_phone(payload.get("phone"))

    def _auth_not_configured_response(self):
        self.send_json_response(
            {"ok": False, "configured": False, "error": AUTH_ERR_NOT_CONFIGURED}, status=200
        )

    def handle_auth_request_otp(self):
        data, parsed_ok = self._read_json_body()
        secret = session_secret()
        cfg = hubtel_config()
        if not secret or not cfg["configured"]:
            self._auth_not_configured_response()
            return
        if not parsed_ok:
            self.send_json_response({"ok": False, "error": "Invalid JSON"}, status=400)
            return

        phone = normalize_gh_phone(data.get("phone"))
        if not phone:
            self.send_json_response({"ok": False, "error": AUTH_ERR_INVALID_PHONE}, status=400)
            return

        sent = hubtel_send_otp(phone, cfg)
        if not sent["ok"]:
            self.send_json_response({"ok": False, "error": AUTH_ERR_SEND_FAILED}, status=502)
            return

        issued_at = now_seconds()
        state = {
            "phone": phone,
            "requestId": sent["requestId"],
            "prefix": sent["prefix"],
            "attempts": 0,
            "lastSentAt": issued_at,
            "exp": issued_at + OTP_MAX_AGE_SECONDS,
        }
        self.send_json_response(
            pending_otp_response(phone), cookies=[self._otp_cookie_header(state, secret)]
        )

    def handle_auth_verify_otp(self):
        data, parsed_ok = self._read_json_body()
        secret = session_secret()
        cfg = hubtel_config()
        if not secret or not cfg["configured"]:
            self._auth_not_configured_response()
            return
        if not parsed_ok:
            self.send_json_response({"ok": False, "error": "Invalid JSON"}, status=400)
            return

        pending = self._pending_otp(secret)
        if not pending or not pending.get("phone") or not pending.get("requestId"):
            self.send_json_response(
                {"ok": False, "error": AUTH_ERR_EXPIRED, "expired": True},
                status=400,
                cookies=[self._cleared_cookie_header(OTP_COOKIE)],
            )
            return

        try:
            attempts = int(pending.get("attempts") or 0)
        except (TypeError, ValueError):
            attempts = 0
        if attempts >= MAX_OTP_ATTEMPTS:
            self.send_json_response({"ok": False, "error": AUTH_ERR_TOO_MANY}, status=429)
            return

        code = normalize_otp_code(data.get("code"))
        if not code:
            self.send_json_response(
                {
                    "ok": False,
                    "error": "Enter the code we sent you.",
                    "attemptsLeft": MAX_OTP_ATTEMPTS - attempts,
                },
                status=400,
            )
            return

        result = hubtel_verify_otp(pending["requestId"], pending.get("prefix") or "", code, cfg)
        if not result["ok"] and result["upstreamError"]:
            self.send_json_response({"ok": False, "error": AUTH_ERR_VERIFY_FAILED}, status=502)
            return

        if not result["ok"]:
            next_attempts = attempts + 1
            state = dict(pending)
            state["attempts"] = next_attempts
            cookies = [self._otp_cookie_header(state, secret)]
            if next_attempts >= MAX_OTP_ATTEMPTS:
                self.send_json_response(
                    {"ok": False, "error": AUTH_ERR_TOO_MANY}, status=429, cookies=cookies
                )
                return
            self.send_json_response(
                {
                    "ok": False,
                    "error": AUTH_ERR_WRONG_CODE,
                    "attemptsLeft": MAX_OTP_ATTEMPTS - next_attempts,
                },
                status=400,
                cookies=cookies,
            )
            return

        phone = pending["phone"]
        self.send_json_response(
            {
                "ok": True,
                "configured": True,
                "phone": phone,
                "maskedPhone": mask_gh_phone(phone),
                "customer": lookup_customer(phone),
            },
            cookies=[
                self._cleared_cookie_header(OTP_COOKIE),
                self._session_cookie_header(phone, secret),
            ],
        )

    def handle_auth_resend_otp(self):
        self._read_json_body()
        secret = session_secret()
        cfg = hubtel_config()
        if not secret or not cfg["configured"]:
            self._auth_not_configured_response()
            return

        pending = self._pending_otp(secret)
        if not pending or not pending.get("phone") or not pending.get("requestId"):
            self.send_json_response(
                {"ok": False, "error": AUTH_ERR_EXPIRED, "expired": True},
                status=400,
                cookies=[self._cleared_cookie_header(OTP_COOKIE)],
            )
            return

        try:
            last_sent_at = int(pending.get("lastSentAt") or 0)
        except (TypeError, ValueError):
            last_sent_at = 0
        elapsed = now_seconds() - last_sent_at
        if elapsed < RESEND_COOLDOWN_SECONDS:
            remaining = RESEND_COOLDOWN_SECONDS - elapsed
            self.send_json_response(
                {
                    "ok": False,
                    "error": AUTH_ERR_COOLDOWN,
                    # Clamped so a skewed clock can never advertise a nonsense wait.
                    "retryAfterSeconds": min(RESEND_COOLDOWN_SECONDS, max(1, remaining)),
                },
                status=429,
            )
            return

        resent = hubtel_resend_otp(pending["requestId"], pending.get("prefix") or "", cfg)
        if not resent["ok"]:
            self.send_json_response({"ok": False, "error": AUTH_ERR_SEND_FAILED}, status=502)
            return

        issued_at = now_seconds()
        state = {
            "phone": pending["phone"],
            "requestId": resent["requestId"] or pending["requestId"],
            "prefix": resent["prefix"] or pending.get("prefix") or "",
            "attempts": 0,
            "lastSentAt": issued_at,
            "exp": issued_at + OTP_MAX_AGE_SECONDS,
        }
        self.send_json_response(
            pending_otp_response(pending["phone"]),
            cookies=[self._otp_cookie_header(state, secret)],
        )

    def handle_auth_logout(self):
        self._read_json_body()
        self.send_json_response(
            {"ok": True},
            cookies=[
                self._cleared_cookie_header(SESSION_COOKIE),
                self._cleared_cookie_header(OTP_COOKIE),
            ],
        )

    def handle_auth_session(self):
        cfg = hubtel_config()
        configured = bool(session_secret() and cfg["configured"])
        orders_available = bool(supabase_config().get("configured"))
        phone = self._session_phone()
        if not phone:
            self.send_json_response(
                {"authenticated": False, "configured": configured, "ordersAvailable": orders_available}
            )
            return
        self.send_json_response(
            {
                "authenticated": True,
                "phone": phone,
                "maskedPhone": mask_gh_phone(phone),
                "configured": configured,
                "ordersAvailable": orders_available,
            }
        )

    def handle_auth_claim_order(self):
        data, parsed_ok = self._read_json_body()
        secret = session_secret()
        if not secret:
            self._auth_not_configured_response()
            return
        if not parsed_ok:
            self.send_json_response({"ok": False, "error": "Invalid JSON"}, status=400)
            return

        phone = normalize_gh_phone(data.get("phone"))
        if not phone:
            self.send_json_response({"ok": False, "error": AUTH_ERR_INVALID_PHONE}, status=400)
            return

        reference = str(data.get("reference") or "").strip()
        receipt_no = str(data.get("receiptNo") or "").strip()
        if not reference and not receipt_no:
            self.send_json_response(
                {"ok": False, "error": "Enter your receipt number or Paystack reference."},
                status=400,
            )
            return

        cfg = supabase_config()
        if not cfg["configured"]:
            self.send_json_response(
                {"ok": False, "ordersAvailable": False, "error": ACCOUNT_ERR_LOOKUP}
            )
            return

        phones = gh_phone_variants(phone)
        row = None
        try:
            if reference:
                paystack_ok = not PAYSTACK_SECRET_KEY
                if PAYSTACK_SECRET_KEY:
                    req = urllib.request.Request(
                        f"https://api.paystack.co/transaction/verify/{urllib.parse.quote(reference)}",
                        headers={"Authorization": f"Bearer {PAYSTACK_SECRET_KEY}"},
                        method="GET",
                    )
                    try:
                        with urllib.request.urlopen(req, timeout=20) as response:
                            payload = json.loads(response.read().decode("utf-8"))
                        tx = payload.get("data") or {}
                        paystack_ok = (
                            payload.get("status") is True
                            and tx.get("status") == "success"
                            and str(tx.get("currency") or "").upper() == "GHS"
                        )
                    except Exception:
                        paystack_ok = False
                if paystack_ok:
                    pay_rows = supabase_select(
                        "payments",
                        {
                            "select": "order_id,reference",
                            "reference": f"eq.{reference}",
                            "limit": "1",
                        },
                        cfg,
                    )
                    order_id = (pay_rows[0] or {}).get("order_id") if pay_rows else None
                    if order_id:
                        params = {
                            "select": ORDER_DETAIL_SELECT,
                            "customer_phone": postgrest_in_list(phones),
                            "id": f"eq.{order_id}",
                            "limit": "1",
                        }
                        found = supabase_select("orders", params, cfg)
                        row = found[0] if found else None
            if row is None and receipt_no:
                params = {
                    "select": ORDER_DETAIL_SELECT,
                    "customer_phone": postgrest_in_list(phones),
                    "receipt_no": f"eq.{receipt_no}",
                    "limit": "1",
                }
                found = supabase_select("orders", params, cfg)
                row = found[0] if found else None
        except RuntimeError:
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_LOOKUP}, status=502)
            return

        if not row:
            self.send_json_response(
                {"ok": False, "error": "No order matches that number and receipt."},
                status=404,
            )
            return

        self.send_json_response(
            {
                "ok": True,
                "authenticated": True,
                "phone": phone,
                "maskedPhone": mask_gh_phone(phone),
                "customer": lookup_customer(phone),
                "order": shape_order(row),
            },
            cookies=[self._session_cookie_header(phone, secret)],
        )

    # --- Customer account -------------------------------------------------
    def handle_account_orders(self):
        phone = self._session_phone()
        if not phone:
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_SIGN_IN}, status=401)
            return

        cfg = supabase_config()
        if not cfg["configured"]:
            self.send_json_response({"ok": True, "configured": False, "orders": []})
            return

        try:
            rows = supabase_select(
                "orders",
                {
                    "select": ORDER_SELECT,
                    "customer_phone": postgrest_in_list(gh_phone_variants(phone)),
                    "order": "created_at.desc",
                    "limit": "50",
                },
                cfg,
            )
        except RuntimeError:
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_LOOKUP}, status=502)
            return

        self.send_json_response(
            {"ok": True, "configured": True, "orders": [shape_order(row) for row in rows]}
        )

    def handle_account_order_detail(self, raw_id):
        phone = self._session_phone()
        if not phone:
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_SIGN_IN}, status=401)
            return

        try:
            order_id = urllib.parse.unquote(raw_id or "").strip("/")
        except Exception:
            order_id = ""

        # Anti-enumeration: "not yours", "bad id" and "doesn't exist" are one answer.
        def not_found():
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_NOT_FOUND}, status=404)

        if not order_id or len(order_id) > 64 or not ORDER_ID_PATTERN.match(order_id):
            not_found()
            return

        cfg = supabase_config()
        if not cfg["configured"]:
            not_found()
            return

        params = {
            "select": ORDER_DETAIL_SELECT,
            "customer_phone": postgrest_in_list(gh_phone_variants(phone)),
            "limit": "1",
        }
        params["id" if UUID_PATTERN.match(order_id) else "receipt_no"] = f"eq.{order_id}"

        try:
            rows = supabase_select("orders", params, cfg)
        except RuntimeError:
            self.send_json_response({"ok": False, "error": ACCOUNT_ERR_LOOKUP}, status=502)
            return

        if not rows:
            not_found()
            return

        order = shape_order(rows[0])
        order["tracking"] = build_tracking(rows[0])
        self.send_json_response({"ok": True, "configured": True, "order": order})

    def handle_api_get(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # --- 1. KPI Statistics Route ---
        if self.path == "/api/crm/stats":
            cursor.execute("SELECT SUM(total_price) FROM orders WHERE status IN ('Delivered', 'Dispatched')")
            rev = cursor.fetchone()[0] or 0.0
            
            cursor.execute("SELECT COUNT(DISTINCT id) FROM customers")
            cust_count = cursor.fetchone()[0] or 0
            
            cursor.execute("SELECT COUNT(*) FROM leads WHERE status = 'Warm'")
            lead_count = cursor.fetchone()[0] or 0
            
            cursor.execute("SELECT AVG(total_price) FROM orders WHERE status IN ('Delivered', 'Dispatched')")
            aov = cursor.fetchone()[0] or 0.0
            
            payload = {
                "totalRevenue": rev,
                "totalCustomers": cust_count,
                "activeLeads": lead_count,
                "averageOrderValue": round(aov, 2)
            }
            self.send_json_response(payload)
            
        # --- 2. Customer Base Route ---
        elif self.path == "/api/crm/customers":
            cursor.execute("SELECT id, name, phone, email, ltv, join_date, status, zoho_id FROM customers ORDER BY ltv DESC")
            rows = cursor.fetchall()
            customers = []
            for row in rows:
                customers.append({
                    "id": row[0],
                    "name": row[1],
                    "phone": row[2],
                    "email": row[3],
                    "ltv": row[4],
                    "joinDate": row[5],
                    "status": row[6],
                    "zohoId": row[7]
                })
            self.send_json_response(customers)
            
        # --- 3. Order Logs Route ---
        elif self.path == "/api/crm/orders":
            cursor.execute("""
                SELECT o.id, c.name, c.phone, o.items_json, o.total_price, o.status, o.order_date, o.zoho_id 
                FROM orders o 
                JOIN customers c ON o.customer_id = c.id 
                ORDER BY o.id DESC
            """)
            rows = cursor.fetchall()
            orders = []
            for row in rows:
                orders.append({
                    "id": row[0],
                    "customerName": row[1],
                    "customerPhone": row[2],
                    "items": json.loads(row[3]),
                    "totalPrice": row[4],
                    "status": row[5],
                    "orderDate": row[6],
                    "zohoId": row[7]
                })
            self.send_json_response(orders)
            
        # --- 4. Leads & Search Streams ---
        elif self.path == "/api/crm/leads":
            cursor.execute("""
                SELECT l.id, c.name, c.phone, l.searched_product, l.wishlist_product, l.status, l.updated_at, l.zoho_id 
                FROM leads l 
                JOIN customers c ON l.customer_id = c.id 
                ORDER BY l.id DESC
            """)
            rows = cursor.fetchall()
            leads = []
            for row in rows:
                leads.append({
                    "id": row[0],
                    "customerName": row[1],
                    "customerPhone": row[2],
                    "searchedProduct": row[3],
                    "wishlistProduct": row[4],
                    "status": row[5],
                    "updatedAt": row[6],
                    "zohoId": row[7]
                })
            self.send_json_response(leads)
            
        # --- 5. Zoho Configuration parameters ---
        elif self.path == "/api/crm/zoho/config":
            cursor.execute("SELECT client_id, client_secret, refresh_token, domain, status FROM zoho_config ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            if row:
                config = {
                    "clientId": row[0],
                    "clientSecret": "*" * len(row[1]) if row[1] else "",
                    "refreshToken": "*" * len(row[2]) if row[2] else "",
                    "domain": row[3],
                    "status": row[4]
                }
            else:
                config = {
                    "clientId": "",
                    "clientSecret": "",
                    "refreshToken": "",
                    "domain": "com",
                    "status": "Disconnected"
                }
            self.send_json_response(config)
            
        else:
            self.send_error(404, "API endpoint not found.")
            
        conn.close()
        
    def handle_api_post(self):
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        try:
            content_length = int(self.headers.get("Content-Length", 0))
            post_data = self.rfile.read(content_length).decode("utf-8")
            data = json.loads(post_data) if post_data else {}
        except (TypeError, ValueError, json.JSONDecodeError):
            conn.close()
            self.send_json_response({"error": "Request body must be valid JSON."}, status=400)
            return
        
        now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # --- 1. Customer Lead Track Injection ---
        if self.path == "/api/crm/leads":
            name = data.get("name", "Storefront Client")
            phone = data.get("phone", "233000000000")
            email = data.get("email", f"{phone}@gadgetboss.com")
            search = data.get("search")
            wishlist = data.get("wishlist")
            
            # Find or insert customer
            cursor.execute("SELECT id, ltv FROM customers WHERE phone = ?", (phone,))
            cust_row = cursor.fetchone()
            if cust_row:
                cust_id = cust_row[0]
            else:
                cursor.execute("""
                    INSERT INTO customers (name, phone, email, ltv, join_date, status) VALUES (?, ?, ?, 0.0, ?, 'Regular')
                """, (name, phone, email, now))
                cust_id = cursor.lastrowid
                
            # Log lead interest
            cursor.execute("""
                INSERT INTO leads (customer_id, searched_product, wishlist_product, status, updated_at) VALUES (?, ?, ?, 'Warm', ?)
            """, (cust_id, search, wishlist, now))
            
            conn.commit()
            self.send_json_response({"status": "success", "message": "Lead captured successfully."})
            
            # Auto background sync to Zoho CRM
            threading.Thread(target=run_background_sync, daemon=True).start()
            
        # --- 2. Order Checkout Insertion ---
        elif self.path == "/api/crm/orders":
            self.send_json_response(
                {"error": "Storefront checkout order capture is disabled. Use the verified checkout flow instead."},
                status=410,
            )
            
        # --- 3. Order Status Update ---
        elif self.path == "/api/crm/orders/update":
            order_id = data.get("orderId")
            status = data.get("status")
            
            cursor.execute("UPDATE orders SET status = ? WHERE id = ?", (status, order_id))
            conn.commit()
            self.send_json_response({"status": "success", "message": "Order fulfillment status updated."})
            
        # --- 4. Zoho Config Integration Route ---
        elif self.path == "/api/crm/zoho/config":
            client_id = (data.get("clientId") or "").strip()
            client_secret = data.get("clientSecret") or ""
            refresh_token = data.get("refreshToken") or ""
            domain = (data.get("domain") or "com").strip()

            if domain not in ALLOWED_ZOHO_DOMAINS:
                conn.close()
                self.send_json_response({"error": "Unsupported Zoho data-center domain."}, status=400)
                return
            
            cursor.execute("SELECT id FROM zoho_config ORDER BY id DESC LIMIT 1")
            prev_row = cursor.fetchone()

            if not client_id or not client_secret or not refresh_token:
                conn.close()
                self.send_json_response({"error": "A client ID, client secret, and refresh token are required."}, status=400)
                return
            
            if prev_row:
                cursor.execute("""
                    UPDATE zoho_config
                    SET client_id = ?, client_secret = ?, refresh_token = ?, domain = ?, status = 'Connecting'
                    WHERE id = ?
                """, (client_id, client_secret, refresh_token, domain, prev_row[0]))
            else:
                cursor.execute("""
                    INSERT INTO zoho_config (client_id, client_secret, refresh_token, domain, status) VALUES (?, ?, ?, ?, 'Connecting')
                """, (client_id, client_secret, refresh_token, domain))
            conn.commit()
            
            self.send_json_response({"status": "success", "message": "Zoho configuration updated. Launching sync test."})
            
            # Run background test sync instantly
            threading.Thread(target=run_background_sync, daemon=True).start()
            
        # --- 5. Zoho CRM Force Manual Synchronization Trigger ---
        elif self.path == "/api/crm/zoho/sync":
            threading.Thread(target=run_background_sync, daemon=True).start()
            self.send_json_response({"status": "success", "message": "Background sync scheduled to Zoho CRM."})
            
        else:
            self.send_error(404, "API route not matched.")
            
        conn.close()

    def send_json_response(self, data, status=200, cookies=None):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        for cookie in (cookies or []):
            self.send_header('Set-Cookie', cookie)
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))


# Run the Dynamic Server
def run_server(port=8080, host="127.0.0.1"):
    server_address = (host, port)
    httpd = HTTPServer(server_address, DynamicCRMServer)
    print(f"✅ GADGETBO$$ Backend CRM Server running on http://{host}:{port}...")
    if not CRM_ADMIN_USER or not CRM_ADMIN_PASSWORD:
        print("⚠️  CRM routes are disabled. Set GADGETBOSS_CRM_USER and GADGETBOSS_CRM_PASSWORD before using /crm/.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping CRM Server gracefully.")
        httpd.server_close()
        sys.exit(0)

if __name__ == '__main__':
    port_arg = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    host_arg = "127.0.0.1"
    run_server(port_arg, host_arg)
