#!/usr/bin/env bash
set -euo pipefail

# ====== CONFIG ======
REMOTE="root@oc"
REMOTE_DIR="/root/shimlawale/server"
SESSION="shimlawale-api"
PORT="4200"

log() { echo -e "\033[0;32m$1\033[0m"; }
err() { echo -e "\033[0;31m$1\033[0m"; }

cd "$(dirname "${BASH_SOURCE[0]:-$0}")/.."

log "📦 Building server..."
(cd apps/api && bun run build)
[ -f apps/api/server.js ] || { err "❌ Build failed! server.js not found."; exit 1; }

# ====== DATABASE: backup, migrate, seed (via SSH tunnel to prod postgres) ======
TUNNEL_PORT=15433
log "🗄️  Backing up prod database..."
ssh "$REMOTE" "mkdir -p /root/backups && set -a && . $REMOTE_DIR/.env && set +a && pg_dump -Fc \"\${DATABASE_URL%%\?*}\" -f /root/backups/shimlawale-\$(date +%Y%m%d-%H%M%S).dump"

log "🗄️  Opening tunnel and syncing schema..."
PROD_DB_URL="$(ssh "$REMOTE" "set -a && . $REMOTE_DIR/.env && set +a && printf %s \"\$DATABASE_URL\"" | sed "s#@localhost:5432/#@127.0.0.1:$TUNNEL_PORT/#")"
ssh -f -N -o ExitOnForwardFailure=yes -L "$TUNNEL_PORT:127.0.0.1:5432" "$REMOTE"
TUNNEL_PID="$(pgrep -f "ssh -f -N .*-L $TUNNEL_PORT:127.0.0.1:5432" | head -1)"
trap 'kill "$TUNNEL_PID" 2>/dev/null || true' EXIT
(
  cd apps/api
  export DATABASE_URL="$PROD_DB_URL"
  bun run db:baseline
  bun run db:migrate
  bun run db:seed:prod
)
kill "$TUNNEL_PID" 2>/dev/null || true
log "✅ Database up to date"

log "📤 Copying files to $REMOTE..."
ssh "$REMOTE" "mkdir -p $REMOTE_DIR/logs $REMOTE_DIR/uploads"
scp apps/api/server.js scripts/run-server-daemon.sh "$REMOTE:$REMOTE_DIR/"
# Seed uploads only add/refresh files, never delete admin-uploaded ones
rsync -a --exclude=".DS_Store" apps/api/uploads/ "$REMOTE:$REMOTE_DIR/uploads/"

log "🔄 Restarting server..."
ssh "$REMOTE" bash <<REMOTE_EOF
  set -e
  tmux kill-session -t "$SESSION" 2>/dev/null || true
  chmod +x "$REMOTE_DIR/run-server-daemon.sh"
  cd "$REMOTE_DIR"
  tmux new-session -d -s "$SESSION" "./run-server-daemon.sh"
  sleep 3
  tmux has-session -t "$SESSION" && echo "✅ tmux session '$SESSION' running"
  curl -fsS http://127.0.0.1:$PORT/health && echo
REMOTE_EOF

log "✅ Backend deployed: https://shimlawale.com.u4.lol/api/"
echo "  Logs:   ssh $REMOTE 'tail -f $REMOTE_DIR/server.log'"
echo "  Attach: ssh $REMOTE -t 'tmux attach -t $SESSION'"
