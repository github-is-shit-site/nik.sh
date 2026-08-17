"""nik.sh — a tiny, dependency-free Python site directory."""

from __future__ import annotations

import json
import mimetypes
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
STATIC = ROOT / "static"

SITES = [
    {
        "id": "mail",
        "name": "Mail",
        "url": "https://mail.nik.sh",
        "description": "Почта без лишнего шума.",
        "symbol": "@",
        "accent": "#ff5c35",
        "tags": ["письма", "общение"],
        "shortcut": "M",
    },
    {
        "id": "sms",
        "name": "SMS",
        "url": "https://sms.nik.sh",
        "description": "Сообщения — быстро и прямо.",
        "symbol": "//",
        "accent": "#b6ff5c",
        "tags": ["сообщения", "телефон"],
        "shortcut": "S",
    },
    {
        "id": "2fa",
        "name": "2FA",
        "url": "https://2fa.nik.sh",
        "description": "Второй фактор под рукой.",
        "symbol": "02",
        "accent": "#57d6ff",
        "tags": ["коды", "безопасность"],
        "shortcut": "2",
    },
    {
        "id": "eclipse",
        "name": "Eclipse",
        "url": "https://eclipse.nik.sh",
        "description": "Проекты на тёмной стороне.",
        "symbol": "◒",
        "accent": "#9c7cff",
        "tags": ["инструменты", "проекты"],
        "shortcut": "E",
    },
    {
        "id": "guides",
        "name": "Guides",
        "url": "https://guides.nik.sh",
        "source": "https://github.com/github-is-shit-site/guides",
        "description": "Короткие инструкции, которые работают.",
        "symbol": "↗",
        "accent": "#ffc857",
        "tags": ["гайды", "знания"],
        "shortcut": "G",
    },
]


class SiteHandler(SimpleHTTPRequestHandler):
    """Serve the interface and a small JSON API."""

    def do_GET(self) -> None:  # noqa: N802 — stdlib handler API
        path = urlparse(self.path).path
        if path == "/api/sites":
            self._send_json({"sites": SITES, "count": len(SITES)})
            return
        if path == "/api/health":
            self._send_json({"ok": True, "service": "nik.sh"})
            return

        if path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def translate_path(self, path: str) -> str:
        clean_path = urlparse(path).path.lstrip("/")
        candidate = (STATIC / clean_path).resolve()
        try:
            candidate.relative_to(STATIC.resolve())
        except ValueError:
            return str(STATIC / "404.html")
        return str(candidate)

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Cache-Control", "no-cache" if self.path == "/" else "public, max-age=3600")
        super().end_headers()

    def _send_json(self, payload: dict) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        print(f"[nik.sh] {self.address_string()} — {fmt % args}")


def run() -> None:
    mimetypes.add_type("text/javascript", ".js")
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer((host, port), SiteHandler)
    print(f"nik.sh is live at http://{host}:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down.")
    finally:
        server.server_close()


if __name__ == "__main__":
    run()
