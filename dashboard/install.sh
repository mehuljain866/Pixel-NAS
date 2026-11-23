#!/data/data/com.termux/files/usr/bin/bash
set -Eeuo pipefail

REPO_URL="https://github.com/mehuljain866/Pixel-NAS.git"
REPO_DIR="$HOME/Pixel-NAS"
DASHBOARD_DIR="$REPO_DIR/dashboard"

log() { printf '\n[Pixel-NAS] %s\n' "$1"; }
fail() { printf '\n[Pixel-NAS] ERROR: %s\n' "$1" >&2; exit 1; }

log "Installing Termux prerequisites..."
pkg update -y
pkg install -y nodejs git termux-api openssh
sshd || log "OpenSSH did not start; it may already be running. Verify separately if you use SSH access."

NODE_VERSION="$(node -p 'process.versions.node')"
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 13)) process.exit(1)' \
  || fail "Node.js 22.13.0 or newer is required; found ${NODE_VERSION}. Update Termux packages and retry."

if [ -d "$REPO_DIR/.git" ]; then
  if [ -n "$(git -C "$REPO_DIR" status --porcelain)" ]; then
    fail "Existing checkout has local changes. Back them up or commit them before updating; nothing was deleted."
  fi
  if git -C "$REPO_DIR" rev-parse --abbrev-ref --symbolic-full-name '@{upstream}' >/dev/null 2>&1; then
    log "Updating the existing clean checkout (fast-forward only)..."
    git -C "$REPO_DIR" pull --ff-only
  else
    log "No upstream is configured; using the current clean local branch without pulling."
  fi
elif [ -e "$REPO_DIR" ]; then
  fail "$REPO_DIR exists but is not a Git checkout. Move it aside manually; installer will not overwrite it."
else
  log "Cloning Pixel-NAS..."
  git clone --depth 1 "$REPO_URL" "$REPO_DIR"
fi

cd "$DASHBOARD_DIR"
log "Installing the exact locked dependencies..."
npm ci

if [ ! -f .env ]; then
  cp .env.example .env
  log "Created dashboard/.env from .env.example. Review it before starting the service."
fi
chmod 600 .env || log "Could not restrict .env permissions on this filesystem; verify the file is private."

log "Running lint and automated tests..."
npm run lint
npm test

log "Building the static dashboard..."
npm run build

log "Setup complete. Start with: cd ~/Pixel-NAS/dashboard && npm start"
printf '\nIMPORTANT SETUP NOTES\n'
printf '1. Grant Termux storage access with termux-setup-storage if needed, then set PIXEL_NAS_INBOX_DIR to the actual Resilio receive folder.\n'
printf '2. Confirm the MacroDroid stop webhook URL before relying on the storage pause request.\n'
printf '3. The dashboard defaults to 127.0.0.1. Remote/LAN binding requires a long auth token.\n'
printf '4. No READ_LOGS permission is required; Google Photos completion remains explicitly unverified.\n'
