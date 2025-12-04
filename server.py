import urllib.error
import urllib.parse
import urllib.request
from http.server import SimpleHTTPRequestHandler, HTTPServer
import os

# Ayarlar
PORT = 8000
TEFAS_URL = "https://www.tefas.gov.tr/api/DB/BindHistoryInfo"
YAHOO_URL_TEMPLATE = (
    "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?interval=1m&range=1d"
)

class ProxyHandler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/api/tefas":
            self.handle_tefas()
        else:
            self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path.startswith("/api/yahoo"):
            self.handle_yahoo()
        else:
            # CSS, JS ve HTML dosyalari icin varsayilan davranis
            super().do_GET()

    def handle_tefas(self):
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0

        body = self.rfile.read(length) if length > 0 else b""

        req = urllib.request.Request(
            TEFAS_URL,
            data=body,
            headers={
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                "User-Agent": "curl/8.7.1", # Basit UA
                "Accept": "*/*",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                status = resp.status
                content_type = resp.headers.get("Content-Type", "application/json; charset=utf-8")
        except urllib.error.HTTPError as exc:
            data = exc.read()
            status = exc.code
            content_type = exc.headers.get("Content-Type", "text/plain; charset=utf-8")
        except Exception as exc:
            error_msg = str(exc).encode("utf-8", errors="ignore")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(error_msg)
            print("TEFAS proxy error:", exc)
            return

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def handle_yahoo(self):
        parsed = urllib.parse.urlparse(self.path)
        query = urllib.parse.parse_qs(parsed.query)
        symbols = query.get("symbol")

        if not symbols:
            self.send_error(400, "Symbol required")
            return

        symbol = symbols[0]
        remote_url = YAHOO_URL_TEMPLATE.format(symbol=urllib.parse.quote(symbol, safe=""))

        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
        }

        req = urllib.request.Request(remote_url, headers=headers, method="GET")

        try:
            with urllib.request.urlopen(req) as resp:
                data = resp.read()
                status = resp.status
                content_type = resp.headers.get("Content-Type", "application/json; charset=utf-8")
        except urllib.error.HTTPError as exc:
            data = exc.read()
            status = exc.code
            content_type = exc.headers.get("Content-Type", "text/plain")
        except Exception as exc:
            error_msg = str(exc).encode("utf-8", errors="ignore")
            self.send_response(502)
            self.wfile.write(error_msg)
            return

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

def run():
    server_address = ("", PORT)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f"Serving on http://localhost:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == "__main__":
    run()