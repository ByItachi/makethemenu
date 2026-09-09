import http.server
import socketserver
import os
import sys

# Change to the dist/public directory where the built files are
os.chdir('dist/public')

PORT = 3000

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve index.html for any path that doesn't exist as a file
        if self.path != '/' and not os.path.exists('.' + self.path):
            self.path = '/'
        return super().do_GET()

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), Handler) as httpd:
        print(f"Server running at http://127.0.0.1:{PORT}/")
        httpd.serve_forever()
except OSError as e:
    print(f"Failed to bind to 127.0.0.1:{PORT} - {e}")
    print("Trying localhost instead...")
    try:
        with socketserver.TCPServer(("localhost", PORT), Handler) as httpd:
            print(f"Server running at http://localhost:{PORT}/")
            httpd.serve_forever()
    except OSError as e2:
        print(f"Failed to bind to localhost:{PORT} - {e2}")
        print("Trying 0.0.0.0...")
        try:
            with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
                print(f"Server running at http://0.0.0.0:{PORT}/")
                httpd.serve_forever()
        except OSError as e3:
            print(f"Failed to bind to 0.0.0.0:{PORT} - {e3}")
            print("All binding attempts failed. This appears to be a sandbox restriction.")
            sys.exit(1)