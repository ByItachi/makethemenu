import http.server
import socketserver
import os
import json
import time
from urllib.parse import urlparse, parse_qs

PORT = 5001
DIRECTORY = "dist/public"

# Mock Data
restaurant_profile = {
    "name": "RestoPOS Restoranı",
    "phone": "+90 (555) 123-4567",
    "address": "Örnek Mah. Lezzet Cad. No:123, İstanbul",
    "email": "info@restopos.com",
    "taxNumber": "1234567890",
    "taxOffice": "İstanbul"
}

categories = [
    {"id": 1, "name": "Ana Yemekler", "slug": "ana-yemekler", "imageUrl": "http://localhost:5000/images/ana-yemekler.svg", "icon": "Utensils"},
    {"id": 2, "name": "İçecekler", "slug": "icecekler", "imageUrl": "http://localhost:5000/images/icecekler.svg", "icon": "Coffee"},
    {"id": 3, "name": "Tatlılar", "slug": "tatlilar", "imageUrl": "http://localhost:5000/images/tatlilar.svg", "icon": "Dessert"},
    {"id": 4, "name": "Başlangıçlar", "slug": "baslangiclar", "imageUrl": "http://localhost:5000/images/baslangiclar.svg", "icon": "Salad"},
]

products = [
    {"id": 1, "categoryId": 1, "name": "Izgara Köfte", "description": "Özel baharatlarla hazırlanmış ızgara köfte, pilav ve salata ile.", "price": "250.00", "imageUrl": "http://localhost:5000/images/izgara-kofte.svg", "isAvailable": True},
    {"id": 2, "categoryId": 1, "name": "Adana Kebap", "description": "Zırh kıyması ile hazırlanmış acılı Adana kebap.", "price": "280.00", "imageUrl": "http://localhost:5000/images/adana-kebap.svg", "isAvailable": True},
    {"id": 3, "categoryId": 1, "name": "Tavuk Şiş", "description": "Marine edilmiş tavuk göğsü şiş, közlenmiş biber ile.", "price": "220.00", "imageUrl": "http://localhost:5000/images/tavuk-sis.svg", "isAvailable": True},
    {"id": 4, "categoryId": 2, "name": "Ayran", "description": "Ev yapımı yayık ayranı.", "price": "30.00", "imageUrl": "http://localhost:5000/images/ayran.svg", "isAvailable": True},
    {"id": 5, "categoryId": 2, "name": "Kola", "description": "Soğuk kutu kola.", "price": "40.00", "imageUrl": "http://localhost:5000/images/kola.svg", "isAvailable": True},
    {"id": 6, "categoryId": 2, "name": "Türk Kahvesi", "description": "Geleneksel Türk kahvesi, lokum ile.", "price": "60.00", "imageUrl": "http://localhost:5000/images/turk-kahvesi.svg", "isAvailable": True},
    {"id": 7, "categoryId": 3, "name": "Künefe", "description": "Hatay usulü peynirli künefe.", "price": "180.00", "imageUrl": "http://localhost:5000/images/kunefe.svg", "isAvailable": True},
    {"id": 8, "categoryId": 3, "name": "Sütlaç", "description": "Fırınlanmış köy sütlacı.", "price": "90.00", "imageUrl": "http://localhost:5000/images/sutlac.svg", "isAvailable": True},
    {"id": 9, "categoryId": 4, "name": "Mercimek Çorbası", "description": "Sıcak mercimek çorbası, limon ile.", "price": "70.00", "imageUrl": "http://localhost:5000/images/mercimek-corbasi.svg", "isAvailable": True},
    {"id": 10, "categoryId": 4, "name": "Mevsim Salatası", "description": "Taze mevsim yeşillikleri ile.", "price": "80.00", "imageUrl": "http://localhost:5000/images/mevsim-salatasi.svg", "isAvailable": True},
]

tables = [
    {"id": 1, "name": "Masa 1", "capacity": 4, "x": 0, "y": 0, "status": "available"},
    {"id": 2, "name": "Masa 2", "capacity": 2, "x": 1, "y": 0, "status": "available"},
    {"id": 3, "name": "Masa 3", "capacity": 4, "x": 2, "y": 0, "status": "occupied"},
    {"id": 4, "name": "Masa 4", "capacity": 6, "x": 0, "y": 1, "status": "reserved"},
    {"id": 5, "name": "Masa 5", "capacity": 4, "x": 1, "y": 1, "status": "available"},
    {"id": 6, "name": "Masa 6", "capacity": 2, "x": 2, "y": 1, "status": "available"},
    {"id": 7, "name": "Bahçe 1", "capacity": 8, "x": 0, "y": 2, "status": "available"},
    {"id": 8, "name": "Bahçe 2", "capacity": 4, "x": 1, "y": 2, "status": "available"},
]

restaurants = [
    {"id": 1, "name": "Lezzet Durağı", "type": "Restoran", "address": "Kadıköy, İstanbul", "city": "İstanbul", "country": "Türkiye", "coordinates": {"lat": 40.99, "lng": 29.02}, "status": "active", "joinedAt": "2024-01-15", "license": "Pro", "licenseCode": "L-1001", "licenseExpiry": "2025-01-15"},
    {"id": 2, "name": "Kahve Diyarı", "type": "Kafe", "address": "Beşiktaş, İstanbul", "city": "İstanbul", "country": "Türkiye", "coordinates": {"lat": 41.04, "lng": 29.00}, "status": "active", "joinedAt": "2024-02-01", "license": "Basic", "licenseCode": "L-1002", "licenseExpiry": "2025-02-01"},
    {"id": 3, "name": "Deniz Kenarı Balıkçısı", "type": "Restoran", "address": "Sarıyer, İstanbul", "city": "İstanbul", "country": "Türkiye", "coordinates": {"lat": 41.16, "lng": 29.05}, "status": "pending", "joinedAt": "2024-02-10", "license": "Enterprise", "licenseCode": "L-1003", "licenseExpiry": "2025-02-10"},
    {"id": 4, "name": "Kitap & Kahve", "type": "Kafe", "address": "Üsküdar, İstanbul", "city": "İstanbul", "country": "Türkiye", "coordinates": {"lat": 41.02, "lng": 29.01}, "status": "active", "joinedAt": "2024-02-12", "license": "Basic", "licenseCode": "L-1004", "licenseExpiry": "2025-02-12"},
    {"id": 5, "name": "Ankara Döner", "type": "Restoran", "address": "Çankaya, Ankara", "city": "Ankara", "country": "Türkiye", "coordinates": {"lat": 39.93, "lng": 32.85}, "status": "active", "joinedAt": "2024-03-01", "license": "Pro", "licenseCode": "L-1005", "licenseExpiry": "2025-03-01"},
    {"id": 6, "name": "İzmir Kumru", "type": "Büfe", "address": "Konak, İzmir", "city": "İzmir", "country": "Türkiye", "coordinates": {"lat": 38.42, "lng": 27.14}, "status": "active", "joinedAt": "2024-03-05", "license": "Basic", "licenseCode": "L-1006", "licenseExpiry": "2025-03-05"},
    {"id": 7, "name": "Berlin Döner", "type": "Restoran", "address": "Mitte, Berlin", "city": "Berlin", "country": "Almanya", "coordinates": {"lat": 52.52, "lng": 13.40}, "status": "active", "joinedAt": "2024-03-10", "license": "Pro", "licenseCode": "L-1007", "licenseExpiry": "2025-03-10"},
    {"id": 8, "name": "London Coffee", "type": "Kafe", "address": "Soho, London", "city": "London", "country": "İngiltere", "coordinates": {"lat": 51.50, "lng": -0.12}, "status": "active", "joinedAt": "2024-03-15", "license": "Basic", "licenseCode": "L-1008", "licenseExpiry": "2025-03-15"},
]

licenses = [
    {"id": 1, "code": "L-1001", "type": "Pro", "status": "Active", "business": "Lezzet Durağı", "expiry": "2025-01-15"},
    {"id": 2, "code": "L-1002", "type": "Basic", "status": "Active", "business": "Kahve Diyarı", "expiry": "2025-02-01"},
    {"id": 3, "code": "L-1003", "type": "Enterprise", "status": "Pending", "business": "Deniz Kenarı Balıkçısı", "expiry": "2025-02-10"},
    {"id": 4, "code": "L-1004", "type": "Basic", "status": "Active", "business": "Kitap & Kahve", "expiry": "2025-02-12"},
]

license_activities = [
    {"id": 1, "action": "Created", "code": "L-1001", "date": "2024-01-15 10:00", "details": "Pro license created for Lezzet Durağı"},
    {"id": 2, "action": "Assigned", "code": "L-1001", "date": "2024-01-15 10:05", "details": "Assigned to Lezzet Durağı"},
    {"id": 3, "action": "Created", "code": "L-1002", "date": "2024-02-01 09:30", "details": "Basic license created for Kahve Diyarı"},
    {"id": 4, "action": "Renewed", "code": "L-1001", "date": "2025-01-14 15:20", "details": "Pro license renewed for 1 year"},
    {"id": 5, "action": "Expired", "code": "L-999", "date": "2024-12-31 23:59", "details": "Trial license expired"},
]

pending_payments = [
    {"id": 1, "businessName": "Deniz Kenarı Balıkçısı", "amount": "1500.00", "currency": "TRY", "date": "2024-02-10", "plan": "Enterprise", "status": "Pending"},
    {"id": 2, "businessName": "Yeni Nesil Kahve", "amount": "500.00", "currency": "TRY", "date": "2024-03-12", "plan": "Basic", "status": "Pending"},
    {"id": 3, "businessName": "Burger King", "amount": "2500.00", "currency": "TRY", "date": "2024-03-14", "plan": "Pro", "status": "Pending"},
]

notifications = [
    {"id": 1, "type": "support", "title": "Destek Talebi: Menü Düzenleme", "message": "Menüye yeni kategori ekleyemiyorum, hata alıyorum.", "status": "unread", "createdAt": "2024-03-15T14:30:00", "contact": "info@lezzetduragi.com"},
    {"id": 2, "type": "system", "title": "Yeni Üyelik", "message": "Yeni bir restoran (Ankara Döner) sisteme kayıt oldu.", "status": "read", "createdAt": "2024-03-14T10:15:00", "contact": "-"},
    {"id": 3, "type": "payment", "title": "Ödeme Alındı", "message": "Lezzet Durağı lisans yenileme ödemesi yaptı.", "status": "unread", "createdAt": "2024-03-13T09:45:00", "contact": "-"},
]

orders = [
    {"id": 1, "tableId": 1, "status": "preparing", "items": [{"productId": 1, "quantity": 1}], "total": 150, "createdAt": "2024-03-15T12:00:00"}
]

class APIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "no-referrer")
        super().end_headers()

    def _read_json(self, max_bytes=1048576):
        try:
            length = int(self.headers.get('Content-Length') or 0)
        except (TypeError, ValueError):
            length = 0
        if length > max_bytes:
            self.send_response(413)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Payload too large"}).encode("utf-8"))
            return None
        raw = self.rfile.read(length) if length > 0 else b"{}"
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": "Invalid JSON"}).encode("utf-8"))
            return None
    def do_GET(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        
        if path == "/api/logout":
            self.send_response(302)
            self.send_header("Location", "/giris")
            self.end_headers()
            return

        if path == "/api/auth/user":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            # Mock authenticated user
            user = {"id": 1, "username": "admin", "role": "admin", "fullName": "Admin User"}
            self.wfile.write(json.dumps(user).encode('utf-8'))
            return

        if path == '/api/license-check':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            # Mock license response
            response = {"status": "valid", "expiry": "2026-12-31", "message": "License verified via Panel"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            return
 
        if path.startswith("/api/"):
            self.handle_api(path, parsed_url.query)
            return

        # SPA Fallback: If path is not a file and not an API call, serve index.html
        fpath = self.translate_path(self.path)
        if not os.path.exists(fpath) and not path.startswith("/api/") and "." not in os.path.basename(path):
            self.path = "/index.html"

        # Ensure proper MIME type for SVG
        if path.endswith(".svg"):
            self.send_response(200)
            self.send_header("Content-type", "image/svg+xml")
            self.end_headers()
            try:
                # Serve from DIRECTORY + path
                file_path = os.path.join(DIRECTORY, path.lstrip("/"))
                with open(file_path, "rb") as f:
                    self.wfile.write(f.read())
                return
            except Exception:
                # If failed (not found or error), let super() handle it (which will probably 404)
                pass

        super().do_GET()

    def do_POST(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if path.startswith("/api/"):
            self.handle_api(path, parsed_url.query)
            return
        super().do_POST()

    def do_DELETE(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if path.startswith("/api/"):
            self.handle_api(path, parsed_url.query)
            return
        self.send_error(405, "Method Not Allowed")

    def do_PUT(self):
        parsed_url = urlparse(self.path)
        path = parsed_url.path
        if path.startswith("/api/"):
            self.handle_api(path, parsed_url.query)
            return
        self.send_error(405, "Method Not Allowed")

    def handle_api(self, path, query_string):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        
        response_data = []
        
        if path == "/api/categories":
            response_data = categories
        elif path == "/api/products":
            params = parse_qs(query_string)
            category_id = params.get('categoryId', [None])[0]
            if category_id:
                response_data = [p for p in products if str(p['categoryId']) == str(category_id)]
            else:
                response_data = products
        elif path == "/api/tables":
            response_data = tables
        elif path == "/api/orders":
            if self.command == 'POST':
                from datetime import datetime
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                order_data = json.loads(post_data)
                
                new_id = len(orders) + 1
                order_data['id'] = new_id
                order_data['status'] = 'pending'
                order_data['createdAt'] = datetime.now().isoformat()
                orders.append(order_data)
                response_data = order_data
            else:
                response_data = orders
        elif path == "/api/admin/restaurants":
            if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                new_restaurant = json.loads(post_data)
                
                new_id = len(restaurants) + 1
                new_restaurant['id'] = new_id
                # Ensure default fields
                if 'status' not in new_restaurant:
                    new_restaurant['status'] = "active"
                if 'joinedAt' not in new_restaurant:
                    from datetime import datetime
                    new_restaurant['joinedAt'] = datetime.now().strftime("%Y-%m-%d")
                
                restaurants.append(new_restaurant)
                response_data = new_restaurant
            elif self.command == 'DELETE':
                params = parse_qs(query_string)
                restaurant_id = int(params.get('id', [0])[0])
                if restaurant_id:
                    deleted = False
                    for i, r in enumerate(restaurants):
                        if r['id'] == restaurant_id:
                            del restaurants[i]
                            deleted = True
                            break
                    if deleted:
                        response_data = {"success": True}
                    else:
                        response_data = {"error": "Restaurant not found"}
                else:
                    response_data = {"error": "Missing ID"}
            elif self.command == 'PUT':
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_data = json.loads(put_data)
                restaurant_id = updated_data.get('id')
                
                found = False
                for i, r in enumerate(restaurants):
                    if r['id'] == restaurant_id:
                        restaurants[i].update(updated_data)
                        response_data = restaurants[i]
                        found = True
                        break
                if not found:
                    response_data = {"error": "Restaurant not found"}
            else:
                response_data = restaurants
        elif path == "/api/admin/settings":
             if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                # Just mock saving settings
                response_data = {"success": True, "message": "Settings saved"}
             else:
                response_data = {"success": True}
        elif path == "/api/admin/licenses":
            if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                new_license = json.loads(post_data)
                
                # Mock ID and simple logic
                new_id = len(licenses) + 1
                new_license['id'] = new_id
                new_license['status'] = "Active" # Default active for now
                licenses.append(new_license)
                
                # Add to activities
                license_activities.insert(0, {
                    "id": len(license_activities) + 1,
                    "action": "Created",
                    "code": new_license['code'],
                    "date": "Just now",
                    "details": f"{new_license['type']} license created for {new_license['business']}"
                })
                
                response_data = new_license
            elif self.command == 'DELETE':
                params = parse_qs(query_string)
                license_id = int(params.get('id', [0])[0])
                if license_id:
                    deleted_license = next((l for l in licenses if l['id'] == license_id), None)
                    if deleted_license:
                        licenses[:] = [l for l in licenses if l['id'] != license_id]
                        license_activities.insert(0, {
                            "id": len(license_activities) + 1,
                            "action": "Deleted",
                            "code": deleted_license['code'],
                            "date": "Just now",
                            "details": f"License for {deleted_license['business']} deleted"
                        })
                        response_data = {"success": True}
                    else:
                        response_data = {"error": "License not found"}
                else:
                    response_data = {"error": "Missing ID"}
            elif self.command == 'PUT':
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_data = json.loads(put_data)
                license_id = updated_data.get('id')
                
                found = False
                for i, l in enumerate(licenses):
                    if l['id'] == license_id:
                        licenses[i].update(updated_data)
                        license_activities.insert(0, {
                            "id": len(license_activities) + 1,
                            "action": "Updated",
                            "code": licenses[i]['code'],
                            "date": "Just now",
                            "details": f"License for {licenses[i]['business']} updated"
                        })
                        response_data = licenses[i]
                        found = True
                        break
                if not found:
                    response_data = {"error": "License not found"}
            else:
                response_data = licenses
        elif path == "/api/admin/license-activities":
            response_data = license_activities
        elif path == "/api/admin/pending-payments":
            response_data = pending_payments
        elif path == "/api/payment/providers":
            response_data = {
                "providers": [
                    {"id": "paytr", "name": "PayTR", "enabled": True, "testMode": True},
                    {"id": "iyzico", "name": "İyzico", "enabled": False, "testMode": True},
                    {"id": "shopier", "name": "Shopier", "enabled": False, "testMode": True},
                ]
            }
        elif path == "/api/admin/payment-providers":
            if self.command == 'GET':
                # Return current payment provider configurations
                response_data = {
                    "providers": [
                        {
                            "id": 'paytr',
                            "name": 'PayTR',
                            "enabled": True,
                            "testMode": True,
                            "merchantId": None,
                            "merchantKey": None,
                            "merchantSalt": None,
                            "callbackUrl": 'https://restopos.com.tr/api/payment/callback/paytr'
                        },
                        {
                            "id": 'iyzico',
                            "name": 'İyzico',
                            "enabled": True,
                            "testMode": True,
                            "apiKey": None,
                            "secretKey": None,
                            "publicKey": None,
                            "callbackUrl": 'https://restopos.com.tr/api/payment/callback/iyzico'
                        },
                        {
                            "id": 'shopier',
                            "name": 'Shopier',
                            "enabled": True,
                            "testMode": True,
                            "apiKey": None,
                            "secretKey": None,
                            "callbackUrl": 'https://restopos.com.tr/api/payment/callback/shopier'
                        }
                    ]
                }
            elif self.command == 'POST':
                config_data = self._read_json()
                if config_data is None:
                    return
                
                response_data = {"success": True, "message": "Payment provider configuration saved"}
        elif path == "/api/admin/payment-providers/test":
            if self.command == 'POST':
                test_data = self._read_json()
                if test_data is None:
                    return
                
                provider_id = test_data.get('providerId')
                config = test_data.get('config', {})
                
                if provider_id and config.get('testMode'):
                    response_data = {"success": True, "message": f"{provider_id} connection test successful"}
                else:
                    response_data = {"success": False, "message": f"{provider_id} connection test failed"}
        elif path == "/api/payment/create":
            if self.command == 'POST':
                payment_data = self._read_json()
                if payment_data is None:
                    return
                
                provider_id = payment_data.get('providerId')
                payment_request = payment_data.get('paymentRequest', {})
                try:
                    amount = float(payment_request.get('amount', 0))
                except (TypeError, ValueError):
                    amount = 0.0
                currency = str(payment_request.get('currency', 'TRY'))[:3]
                order_id = str(payment_request.get('orderId', ''))[:64]
                if amount <= 0 or amount > 10000000:
                    response_data = {"success": False, "message": "Invalid amount"}
                elif currency not in ['TRY', 'USD', 'EUR']:
                    response_data = {"success": False, "message": "Unsupported currency"}
                elif not order_id:
                    response_data = {"success": False, "message": "Missing orderId"}
                elif provider_id not in ['paytr', 'iyzico', 'shopier']:
                    response_data = {"success": False, "message": "Unsupported provider"}
                else:
                    payment_token = f"mock_token_{provider_id}_{int(amount)}_{int(time.time())}"
                    payment_url = f"https://mock-payment-gateway.com/3d-secure?token={payment_token}&amount={amount}&currency={currency}"
                    response_data = {
                        "success": True,
                        "paymentUrl": payment_url,
                        "token": payment_token,
                        "message": "Payment initiated successfully"
                    }
        elif path == "/api/payment/callback":
            if self.command == 'POST':
                callback_data = self._read_json()
                if callback_data is None:
                    return
                
                provider_id = callback_data.get('providerId')
                callback_info = callback_data.get('callbackData', {})
                transaction_id = f"TXN_{provider_id}_{int(time.time())}"
                
                response_data = {
                    "success": True,
                    "transactionId": transaction_id,
                    "orderId": callback_info.get('orderId', ''),
                    "amount": callback_info.get('amount', 0),
                    "currency": callback_info.get('currency', 'TRY'),
                    "status": 'success',
                    "message": "Payment processed successfully"
                }
        elif path == "/api/admin/notifications":
            if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                new_notification = json.loads(post_data)
                
                from datetime import datetime
                new_id = len(notifications) + 1
                new_notification['id'] = new_id
                if 'status' not in new_notification:
                    new_notification['status'] = 'unread'
                if 'createdAt' not in new_notification:
                    new_notification['createdAt'] = datetime.now().isoformat()
                
                notifications.insert(0, new_notification)
                response_data = new_notification
            elif self.command == 'PUT':
                content_length = int(self.headers['Content-Length'])
                put_data = self.rfile.read(content_length)
                updated_data = json.loads(put_data)
                notification_id = updated_data.get('id')
                
                found = False
                for i, n in enumerate(notifications):
                    if n['id'] == notification_id:
                        notifications[i].update(updated_data)
                        response_data = notifications[i]
                        found = True
                        break
                if not found:
                    response_data = {"error": "Notification not found"}
            elif self.command == 'DELETE':
                params = parse_qs(query_string)
                notif_id = int(params.get('id', [0])[0])
                if notif_id:
                    deleted = False
                    for i, n in enumerate(notifications):
                        if n['id'] == notif_id:
                            del notifications[i]
                            deleted = True
                            break
                    if deleted:
                        response_data = {"success": True}
                    else:
                        response_data = {"error": "Notification not found"}
                else:
                    response_data = {"error": "Missing ID"}
            else:
                response_data = notifications
        elif path == "/api/settings/profile":
            if self.command == 'POST':
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                updated_profile = json.loads(post_data)
                restaurant_profile.update(updated_profile)
                response_data = restaurant_profile
            else:
                response_data = restaurant_profile
        else:
            response_data = {"error": "Endpoint not found"}

        self.wfile.write(json.dumps(response_data).encode('utf-8'))

# Try to find a working port starting from 5000
port = 5000
while port < 5010:
    try:
        # Bind to 0.0.0.0 to allow access from all interfaces (fixes some localhost resolution issues)
        with socketserver.TCPServer(("", port), APIHandler) as httpd:
            print(f"Serving API and SPA at http://localhost:{port}")
            httpd.serve_forever()
            break
    except OSError as e:
        print(f"Port {port} failed: {e}")
        port += 1
