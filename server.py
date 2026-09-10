import http.server
import socketserver
import os
import sys
import mimetypes

PORT = int(os.environ.get('PORT', 3000))
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')
mimetypes.add_type('font/woff2', '.woff2')
mimetypes.add_type('font/woff', '.woff')

class DonorPulseHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # Extract path without query parameters or fragments
        clean_path = self.path.split('?')[0].split('#')[0]
        full_path = os.path.normpath(os.path.join(DIRECTORY, clean_path.lstrip('/\\')))

        # Prevent directory traversal outside of DIRECTORY
        if not full_path.startswith(DIRECTORY):
            self.send_error(403, "Forbidden")
            return

        # If file doesn't exist, check if appending .html matches a file (Clean URLs)
        if not os.path.exists(full_path) and os.path.isfile(full_path + '.html'):
            query_part = ('?' + self.path.split('?')[1]) if '?' in self.path else ''
            self.path = clean_path + '.html' + query_part
        elif not os.path.exists(full_path) and not os.path.isfile(full_path):
            # SPA fallback to /index.html
            self.path = '/index.html'

        return super().do_GET()

def start_server(port=PORT, max_tries=10):
    for p in range(port, port + max_tries):
        try:
            socketserver.TCPServer.allow_reuse_address = True
            with socketserver.TCPServer(("", p), DonorPulseHTTPHandler) as httpd:
                url = f"http://localhost:{p}"
                print("\n" + "=" * 54)
                print("  DonorPulse Web Server is Running!")
                print(f"  Local URL:   {url}")
                print(f"  Directory:   {DIRECTORY}")
                print("=" * 54 + "\n", flush=True)
                httpd.serve_forever()
                return
        except OSError as e:
            if e.errno in (98, 10048):  # Address already in use
                print(f"Port {p} in use, trying {p + 1}...", flush=True)
                continue
            else:
                raise e
    print(f"Could not bind to any port in range {port}-{port+max_tries}")

if __name__ == '__main__':
    start_server(PORT)
