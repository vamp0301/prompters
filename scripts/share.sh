#!/usr/bin/env bash
# Share the local app on a public HTTPS link (Cloudflare quick tunnel) — no deployment, no account.
#
#   ./scripts/share.sh            # prints https://<random>.trycloudflare.com ; Ctrl+C stops everything
#
# Runs a separate copy next to your dev servers (they keep running on :3000 / :4000):
#   API on :4200 (your backend/.env, with the tunnel URL allowed as origin)
#   production-built frontend on :3200, proxying /api to :4200
# Top-100 / PDFs still need the worker: keep `cd backend && npm run dev:worker` running.
# NOTE: backend/.env points at your real Neon database — anyone with the link uses real data.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
API_PORT=4200
WEB_PORT=3200
LOGS="$(mktemp -d)"
pids=()
cleanup() { for p in "${pids[@]}"; do kill "$p" 2>/dev/null || true; done; }
trap cleanup EXIT INT TERM

command -v cloudflared >/dev/null || { echo "Install it first: brew install cloudflared"; exit 1; }

echo "1/4 Opening the tunnel…"
cloudflared tunnel --no-autoupdate --url "http://localhost:$WEB_PORT" >"$LOGS/tunnel.log" 2>&1 &
pids+=($!)
URL=""
for _ in $(seq 1 60); do
  URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$LOGS/tunnel.log" | grep -v '//api\.' | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
[ -n "$URL" ] || { echo "Tunnel failed:"; tail -5 "$LOGS/tunnel.log"; exit 1; }

echo "2/4 Building the frontend (1–2 min)…"
(cd "$ROOT/frontend" && NEXT_PUBLIC_API_URL="http://localhost:$API_PORT" npm run build >"$LOGS/build.log" 2>&1) || { tail -20 "$LOGS/build.log"; exit 1; }

echo "3/4 Starting the API on :$API_PORT…"
# Values set here win over backend/.env (it never overrides existing variables).
(cd "$ROOT/backend" && PORT=$API_PORT CORS_ORIGIN="$URL,http://localhost:$WEB_PORT" APP_URL="$URL" npx tsx src/server/index.ts >"$LOGS/api.log" 2>&1) &
pids+=($!)
until curl -sf "http://localhost:$API_PORT/live" >/dev/null; do sleep 1; done

echo "4/4 Starting the frontend on :$WEB_PORT…"
(cd "$ROOT/frontend" && npx next start -p $WEB_PORT >"$LOGS/web.log" 2>&1) &
pids+=($!)
until curl -sf -o /dev/null "http://localhost:$WEB_PORT"; do sleep 1; done

echo
echo "  Public link:  $URL"
echo "  (logs in $LOGS — Ctrl+C to stop)"
echo "  Google sign-in works only if $URL is added to the OAuth client's Authorized JavaScript origins; email login always works."
wait
