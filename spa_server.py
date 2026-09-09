import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = "dist/public"

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # If the path doesn't exist, serve index.html (SPA fallback)
        # But exclude /assets/ to avoid infinite loops for missing assets
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith("/assets/"):
            self.path = "/"
        super().do_GET()

with socketserver.TCPServer(("", PORT), SPAHandler) as httpd:
    print(f"Serving {DIRECTORY} at http://localhost:{PORT}")
    httpd.serve_forever()
