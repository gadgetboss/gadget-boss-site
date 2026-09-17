import os
import sys
import json
import sqlite3
import base64
import secrets
import urllib.request
import urllib.parse
from http.server import SimpleHTTPRequestHandler, HTTPServer
from datetime import datetime
import threading

# Application configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "crm.db")
ALLOWED_ZOHO_DOMAINS = {"com", "eu", "in", "com.au"}
STATIC_FILE_EXTENSIONS = {".css", ".html", ".ico", ".jpg", ".jpeg", ".js", ".jsx", ".json", ".png", ".svg", ".webp", ".woff", ".woff2"}
CRM_ADMIN_USER = os.environ.get("GADGETBOSS_CRM_USER")
CRM_ADMIN_PASSWORD = os.environ.get("GADGETBOSS_CRM_PASSWORD")
ALLOWED_ORIGIN = os.environ.get("GADGETBOSS_ALLOWED_ORIGIN")
PAYSTACK_SECRET_KEY = os.environ.get("PAYSTACK_SECRET_KEY", "").strip()

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
        if request_path.startswith("/api/crm/"):
            if not self._require_admin():
                return
            self.handle_api_post()
        else:
            self.send_error(404, "Endpoint not found.")

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

    def send_json_response(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
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
