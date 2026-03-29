import os
import re
import threading
import time
import random
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from urllib.parse import urlparse, parse_qs, urlencode
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime

import requests

APP_TITLE = "Roblox Bulk Link Converter"

IPHONE_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
        "AppleWebKit/605.1.15 (KHTML, like Gecko) "
        "Version/17.0 Mobile/15E148 Safari/604.1"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


# -------------------------
# Proxy manager
# -------------------------

class ProxyPool:
    """Thread-safe proxy pool dengan blacklist sementara untuk 429."""

    def __init__(self):
        self._proxies: list[str] = []
        self._blacklist: dict[str, float] = {}  # proxy -> expired_at
        self._lock = threading.Lock()
        self.BLACKLIST_DURATION = 60.0  # detik

    def load(self, raw: str):
        """Parse proxy list dari string (satu per baris)."""
        lines = [l.strip() for l in raw.splitlines() if l.strip()]
        valid = []
        for line in lines:
            # tambah scheme kalau tidak ada
            if not re.match(r"^(socks5|http|https)://", line):
                line = "http://" + line
            valid.append(line)
        with self._lock:
            self._proxies = valid
            self._blacklist.clear()
        return len(valid)

    def count(self) -> int:
        with self._lock:
            return len(self._proxies)

    def get_random(self) -> str | None:
        """Ambil proxy random yang tidak sedang di-blacklist."""
        with self._lock:
            now = time.time()
            # bersihkan blacklist yang sudah expired
            self._blacklist = {k: v for k, v in self._blacklist.items() if v > now}
            available = [p for p in self._proxies if p not in self._blacklist]
            if not available:
                # semua di-blacklist → pakai semua (blacklist diabaikan)
                available = self._proxies
            return random.choice(available) if available else None

    def blacklist(self, proxy: str):
        """Tandai proxy sebagai 429, jangan pakai dulu selama BLACKLIST_DURATION detik."""
        with self._lock:
            self._blacklist[proxy] = time.time() + self.BLACKLIST_DURATION

    def is_empty(self) -> bool:
        with self._lock:
            return len(self._proxies) == 0


PROXY_POOL = ProxyPool()


# -------------------------
# URL helpers
# -------------------------

def is_share_link(link: str) -> bool:
    p = urlparse(link.strip())
    return p.netloc.endswith("roblox.com") and p.path.startswith("/share")


def is_games_link(link: str) -> bool:
    p = urlparse(link.strip())
    return p.netloc.endswith("roblox.com") and p.path.startswith("/games/")


def _normalize_games_url(url: str) -> str:
    p = urlparse(url)
    qs = parse_qs(p.query)

    code = None
    if "privateServerLinkCode" in qs and qs["privateServerLinkCode"]:
        code = qs["privateServerLinkCode"][0]
    elif "privateServerLink" in qs and qs["privateServerLink"]:
        code = qs["privateServerLink"][0]

    if not code:
        raise ValueError("Missing privateServerLinkCode")

    m = re.match(r"^/games/(\d+)(?:/.*)?$", p.path)
    if not m:
        raise ValueError("Bad /games/<placeId> path")

    place_id = m.group(1)
    base = f"{p.scheme}://{p.netloc}/games/{place_id}"
    return base + "?" + urlencode({"privateServerLinkCode": code})


def normalize_roblox_games_url(url: str) -> str:
    url = url.strip()
    if not url:
        raise ValueError("Empty URL")
    p = urlparse(url)
    if p.scheme not in ("http", "https"):
        raise ValueError("URL must start with http(s)://")
    if p.netloc.endswith("roblox.com") and p.path.startswith("/games/"):
        return _normalize_games_url(url)
    raise ValueError("Not a Roblox /games URL")


# -------------------------
# HTTP resolve with proxy
# -------------------------

def _make_proxy_dict(proxy_url: str) -> dict:
    return {"http": proxy_url, "https": proxy_url}


def resolve_share_once(share_url: str, timeout: int = 30, log_cb=None) -> str:
    share_url = share_url.strip()
    if not share_url:
        raise ValueError("Empty URL")

    proxy_url = PROXY_POOL.get_random() if not PROXY_POOL.is_empty() else None
    proxies   = _make_proxy_dict(proxy_url) if proxy_url else None

    if log_cb and proxy_url:
        short_proxy = proxy_url.split("@")[-1] if "@" in proxy_url else proxy_url
        log_cb(f"using proxy {short_proxy}", "attempt")

    session = requests.Session()
    session.headers.update(IPHONE_HEADERS)

    try:
        resp = session.get(
            share_url,
            timeout=timeout,
            allow_redirects=True,
            proxies=proxies,
        )
    except requests.exceptions.ProxyError as ex:
        if proxy_url:
            PROXY_POOL.blacklist(proxy_url)
        raise ValueError(f"Proxy error ({proxy_url}): {ex}") from ex
    except requests.exceptions.ConnectionError as ex:
        if proxy_url:
            PROXY_POOL.blacklist(proxy_url)
        raise ValueError(f"Connection error: {ex}") from ex

    if resp.status_code == 429:
        if proxy_url:
            PROXY_POOL.blacklist(proxy_url)
            short_proxy = proxy_url.split("@")[-1] if "@" in proxy_url else proxy_url
            raise ValueError(f"429 Too Many Requests — proxy {short_proxy} blacklisted 60s")
        raise ValueError("429 Too Many Requests (no proxy configured)")

    if resp.status_code >= 400:
        raise ValueError(f"HTTP {resp.status_code}")

    final_url = resp.url
    for r in resp.history:
        loc = r.headers.get("Location", "")
        if "/games/" in loc:
            final_url = loc
            if not final_url.startswith("http"):
                final_url = "https://www.roblox.com" + final_url
            break

    if "/games/" in final_url:
        return final_url

    body = resp.text
    patterns = [
        r'href=["\']([^"\']*roblox\.com/games/[^"\']+)["\']',
        r'url=([^"\'&\s]*roblox\.com/games/[^\s"\'&]+)',
        r'"(https://(?:www\.)?roblox\.com/games/\d+[^"]+)"',
    ]
    for pat in patterns:
        m = re.search(pat, body)
        if m:
            return m.group(1)

    raise ValueError(f"No /games/ in final URL: {final_url} (HTTP {resp.status_code})")


def resolve_share_retry5(share_url: str, log_cb=None) -> str:
    MAX_RETRY  = 5
    BASE_DELAY = 1.0
    last_err   = None

    for attempt in range(1, MAX_RETRY + 1):
        try:
            if log_cb:
                log_cb(f"attempt {attempt}/{MAX_RETRY}", "attempt")
            result = resolve_share_once(share_url, log_cb=log_cb)
            if log_cb:
                log_cb(f"attempt {attempt} OK ✓", "ok")
            return result
        except Exception as ex:
            last_err = ex
            if log_cb:
                log_cb(f"attempt {attempt} FAIL: {ex}", "fail")
            if attempt < MAX_RETRY:
                sleep_s = BASE_DELAY * (2 ** (attempt - 1)) + random.uniform(0.2, 0.6)
                time.sleep(sleep_s)

    raise last_err or Exception("Max retry reached")


# -------------------------
# Tkinter UI
# -------------------------

class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_TITLE)
        self.geometry("1280x900")
        self.minsize(1000, 700)

        self.status_var        = tk.StringVar(value="Ready.")
        self.proxy_count_var   = tk.StringVar(value="Proxies: 0")
        self.games_threads_var = tk.IntVar(value=min(16, (os.cpu_count() or 8)))
        self.share_threads_var = tk.IntVar(value=4)

        self._build_style()
        self._build_ui()

    def _build_style(self):
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except tk.TclError:
            pass
        style.configure("TButton", padding=8)
        style.configure("TLabelframe", padding=10)
        style.configure("TLabelframe.Label", font=("Segoe UI", 10, "bold"))
        style.configure("Title.TLabel",      font=("Segoe UI", 16, "bold"))
        style.configure("Sub.TLabel",        font=("Segoe UI", 10))
        style.configure("Proxy.TLabel",      font=("Segoe UI", 10, "bold"), foreground="#007acc")

    def _build_ui(self):
        # Header
        header = ttk.Frame(self, padding=(16, 14, 16, 8))
        header.pack(fill="x")
        ttk.Label(header, text="Roblox Bulk Link Converter", style="Title.TLabel").pack(anchor="w")
        ttk.Label(
            header,
            text="Emulated iPhone 14 Pro Max • HTTP resolve • Proxy rotation • Retry 5x",
            style="Sub.TLabel",
        ).pack(anchor="w", pady=(4, 0))

        # Proxy panel
        proxy_frame = ttk.Labelframe(self, text="Proxy Pool  (protocol://user:pass@host:port  —  socks5 / http / https)")
        proxy_frame.pack(fill="x", padx=16, pady=(10, 0))

        proxy_top = ttk.Frame(proxy_frame)
        proxy_top.pack(fill="x", pady=(0, 6))

        ttk.Label(proxy_top, textvariable=self.proxy_count_var, style="Proxy.TLabel").pack(side="left")
        ttk.Button(proxy_top, text="Load from File", command=self._load_proxy_file).pack(side="right")
        ttk.Button(proxy_top, text="Apply Proxy List", command=self._apply_proxies).pack(side="right", padx=8)
        ttk.Button(proxy_top, text="Clear Proxies", command=self._clear_proxies).pack(side="right")

        self.proxy_box = tk.Text(
            proxy_frame,
            height=5,
            wrap="none",
            font=("Consolas", 10),
        )
        psx = ttk.Scrollbar(proxy_frame, orient="horizontal", command=self.proxy_box.xview)
        self.proxy_box.configure(xscrollcommand=psx.set)
        psx.pack(side="bottom", fill="x")
        self.proxy_box.pack(fill="both", expand=True)
        self.proxy_box.insert("1.0", "# Paste proxy list di sini, satu per baris\n# Contoh:\n# socks5://user:pass@1.2.3.4:1080\n# http://user:pass@5.6.7.8:3128\n# https://9.10.11.12:443")

        # Threads
        thr = ttk.Labelframe(self, text="Threads")
        thr.pack(fill="x", padx=16, pady=(10, 0))
        trow = ttk.Frame(thr)
        trow.pack(fill="x")
        ttk.Label(trow, text="Games threads (fast):").pack(side="left")
        ttk.Spinbox(trow, from_=1, to=64,  textvariable=self.games_threads_var, width=6).pack(side="left", padx=8)
        ttk.Label(trow, text="Share threads:").pack(side="left", padx=(18, 0))
        ttk.Spinbox(trow, from_=1, to=100, textvariable=self.share_threads_var, width=6).pack(side="left", padx=8)

        # Input / Output
        main = ttk.Frame(self, padding=(16, 10, 16, 0))
        main.pack(fill="both", expand=True)

        paned = ttk.Panedwindow(main, orient="horizontal")
        paned.pack(fill="both", expand=True)

        left  = ttk.Labelframe(paned, text="Input (one link per line)")
        right = ttk.Labelframe(paned, text="Output (pure converted links)")
        paned.add(left,  weight=1)
        paned.add(right, weight=1)

        self.inp = tk.Text(left,  wrap="none", font=("Consolas", 11))
        self.out = tk.Text(right, wrap="none", font=("Consolas", 11))
        self.inp.pack(fill="both", expand=True, padx=10, pady=10)
        self.out.pack(fill="both", expand=True, padx=10, pady=10)

        # Controls
        ctl = ttk.Frame(self, padding=(16, 6, 16, 6))
        ctl.pack(fill="x")
        self.btn_convert = ttk.Button(ctl, text="▶ Convert All", command=self._convert_async)
        self.btn_convert.pack(side="left")
        ttk.Button(ctl, text="Copy Output", command=self._copy_output).pack(side="left", padx=10)
        ttk.Button(ctl, text="Clear All",   command=self._clear).pack(side="left")
        ttk.Button(ctl, text="Clear Log",   command=self._clear_log).pack(side="left", padx=10)
        ttk.Label(ctl, textvariable=self.status_var).pack(side="right")

        # Log panel
        log_frame = ttk.Labelframe(self, text="Log — progress & error detail per link")
        log_frame.pack(fill="x", padx=16, pady=(4, 12))

        log_inner = ttk.Frame(log_frame)
        log_inner.pack(fill="both", expand=True)

        self.log_box = tk.Text(
            log_inner,
            height=10,
            wrap="none",
            font=("Consolas", 9),
            bg="#1e1e1e",
            fg="#d4d4d4",
            insertbackground="white",
            state="disabled",
        )
        sy = ttk.Scrollbar(log_inner, orient="vertical",   command=self.log_box.yview)
        sx = ttk.Scrollbar(log_inner, orient="horizontal", command=self.log_box.xview)
        self.log_box.configure(yscrollcommand=sy.set, xscrollcommand=sx.set)
        sy.pack(side="right",  fill="y")
        sx.pack(side="bottom", fill="x")
        self.log_box.pack(fill="both", expand=True, padx=(6, 0), pady=6)

        self.log_box.tag_configure("ok",      foreground="#4ec94e")
        self.log_box.tag_configure("fail",    foreground="#f44747")
        self.log_box.tag_configure("info",    foreground="#569cd6")
        self.log_box.tag_configure("attempt", foreground="#ce9178")
        self.log_box.tag_configure("warn",    foreground="#dcdcaa")

    # -------------------------
    # Proxy actions
    # -------------------------

    def _apply_proxies(self):
        raw = self.proxy_box.get("1.0", "end")
        # buang baris komentar
        cleaned = "\n".join(
            l for l in raw.splitlines()
            if l.strip() and not l.strip().startswith("#")
        )
        count = PROXY_POOL.load(cleaned)
        self.proxy_count_var.set(f"Proxies: {count:,}")
        self._log(f"Proxy pool loaded: {count:,} proxies", "info")

    def _load_proxy_file(self):
        path = filedialog.askopenfilename(
            title="Load Proxy List",
            filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
        )
        if not path:
            return
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            self.proxy_box.delete("1.0", "end")
            self.proxy_box.insert("1.0", content)
            self._apply_proxies()
        except Exception as ex:
            messagebox.showerror("Error", str(ex))

    def _clear_proxies(self):
        PROXY_POOL.load("")
        self.proxy_box.delete("1.0", "end")
        self.proxy_count_var.set("Proxies: 0")
        self._log("Proxy pool cleared.", "warn")

    # -------------------------
    # Log helpers
    # -------------------------

    def _log(self, msg: str, tag: str = ""):
        def _do():
            self.log_box.configure(state="normal")
            ts = datetime.now().strftime("%H:%M:%S")
            self.log_box.insert("end", f"[{ts}] {msg}\n", tag)
            self.log_box.see("end")
            self.log_box.configure(state="disabled")
        self.after(0, _do)

    def _clear_log(self):
        self.log_box.configure(state="normal")
        self.log_box.delete("1.0", "end")
        self.log_box.configure(state="disabled")

    def _set_busy(self, busy: bool):
        self.btn_convert.configure(state="disabled" if busy else "normal")

    # -------------------------
    # Conversion
    # -------------------------

    def _convert_async(self):
        raw   = self.inp.get("1.0", "end").splitlines()
        links = [l.strip() for l in raw if l.strip()]

        if not links:
            messagebox.showinfo("Info", "Paste link dulu (satu per baris).")
            return

        games_workers = max(1,  min(int(self.games_threads_var.get() or 8),  64))
        share_workers = max(1,  min(int(self.share_threads_var.get() or 4),  100))

        self._set_busy(True)
        self.status_var.set(f"Converting {len(links)} links…")
        self.out.delete("1.0", "end")
        self._log(
            f"=== Start: {len(links)} links | games={games_workers}t share={share_workers}t | proxies={PROXY_POOL.count():,} ===",
            "info"
        )

        def worker():
            share_jobs, games_jobs = [], []
            for idx, link in enumerate(links):
                if is_share_link(link):
                    share_jobs.append((idx, link))
                else:
                    games_jobs.append((idx, link))

            self._log(f"  /games: {len(games_jobs)}   /share: {len(share_jobs)}", "info")

            results = [""] * len(links)
            done    = 0
            total   = len(links)

            def convert_games(item):
                idx, link = item
                short = (link[:80] + "…") if len(link) > 80 else link
                try:
                    if is_games_link(link):
                        out = normalize_roblox_games_url(link)
                        self._log(f"[#{idx+1:>5}] ✅ OK      {short}", "ok")
                        return idx, out
                    else:
                        self._log(f"[#{idx+1:>5}] ⚠️  SKIP   Not /games or /share → {short}", "warn")
                        return idx, ""
                except Exception as ex:
                    self._log(f"[#{idx+1:>5}] ❌ FAIL    {short}  →  {ex}", "fail")
                    return idx, ""

            def convert_share(item):
                idx, link = item
                short = (link[:80] + "…") if len(link) > 80 else link
                self._log(f"[#{idx+1:>5}] 🔗 Resolving → {short}", "info")

                def attempt_log(msg, tag="attempt"):
                    self._log(f"[#{idx+1:>5}]    ↳ {msg}", tag)

                try:
                    resolved = resolve_share_retry5(link, log_cb=attempt_log)
                    out = normalize_roblox_games_url(resolved)
                    self._log(f"[#{idx+1:>5}] ✅ OK      → {out}", "ok")
                    return idx, out
                except Exception as ex:
                    self._log(f"[#{idx+1:>5}] ❌ FAIL    All retries exhausted → {ex}", "fail")
                    return idx, ""

            with ThreadPoolExecutor(max_workers=games_workers) as ex:
                futures = [ex.submit(convert_games, j) for j in games_jobs]
                for f in as_completed(futures):
                    idx, result = f.result()
                    results[idx] = result
                    done += 1
                    self.after(0, lambda a=done, b=total: self.status_var.set(f"Converting {a}/{b}…"))

            with ThreadPoolExecutor(max_workers=share_workers) as ex:
                futures = [ex.submit(convert_share, j) for j in share_jobs]
                for f in as_completed(futures):
                    idx, result = f.result()
                    results[idx] = result
                    done += 1
                    self.after(0, lambda a=done, b=total: self.status_var.set(f"Converting {a}/{b}…"))

            ok_count   = sum(1 for r in results if r)
            fail_count = total - ok_count
            self._log(
                f"=== Done: {ok_count} OK  /  {fail_count} FAIL  /  {total} total ===",
                "info"
            )
            out_text = "\n".join(results)
            self.after(0, lambda t=out_text: self._on_done(t, ok_count, fail_count, total))

        threading.Thread(target=worker, daemon=True).start()

    def _on_done(self, text: str, ok: int, fail: int, total: int):
        self._set_busy(False)
        self.out.delete("1.0", "end")
        self.out.insert("1.0", text)
        self.status_var.set(f"Done — {ok}/{total} OK, {fail} FAIL  (blank = failed/invalid)")

    # ---- misc ----

    def _copy_output(self):
        content = self.out.get("1.0", "end").strip("\n")
        if not content:
            return
        self.clipboard_clear()
        self.clipboard_append(content)
        self.status_var.set("Output copied.")

    def _clear(self):
        self.inp.delete("1.0", "end")
        self.out.delete("1.0", "end")
        self._clear_log()
        self.status_var.set("Cleared.")


if __name__ == "__main__":
    App().mainloop()
