import http.server
import socketserver
import os
import sys
import mimetypes

# Change to the dist/public directory where the built files are
os.chdir('dist/public')

PORT = 3000

class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Check if the requested path exists as a file
        path = self.path
        
        # Remove leading slash for file system check
        file_path = path.lstrip('/')
        
        # If path is empty or directory, serve index.html
        if not file_path or file_path.endswith('/'):
            file_path = 'index.html'
        
        # Check if the file exists
        if not os.path.exists(file_path):
            # For SPA routing, serve index.html for non-existent files
            # but preserve the original path for React Router
            file_path = 'index.html'
        
        # Serve the file
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
                
            # Guess content type
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
            
        except Exception as e:
            self.send_error(404, f"File not found: {file_path}")

try:
    with socketserver.TCPServer(("127.0.0.1", PORT), SPAHandler) as httpd:
        print(f"SPA Server running at http://127.0.0.1:{PORT}/")
        print("Ready to serve RestoPOS integrations!")
        httpd.serve_forever()
except OSError as e:
    print(f"Failed to bind to 127.0.0.1:{PORT} - {e}")
    print("Trying localhost instead...")
    try:
        with socketserver.TCPServer(("localhost", PORT), SPAHandler) as httpd:
            print(f"SPA Server running at http://localhost:{PORT}/")
            print("Ready to serve RestoPOS integrations!")
            httpd.serve_forever()
    except OSError as e2:
        print(f"Failed to bind to localhost:{PORT} - {e2}")
        print("Trying 0.0.0.0...")
        try:
            with socketserver.TCPServer(("0.0.0.0", PORT), SPAHandler) as httpd:
                print(f"SPA Server running at http://0.0.0.0:{PORT}/")
                print("Ready to serve RestoPOS integrations!")
                httpd.serve_forever()
        except OSError as e3:
            print(f"Failed to bind to 0.0.0.0:{PORT} - {e3}")
            print("All binding attempts failed. This appears to be a sandbox restriction.")
            sys.exit(1)