#!/usr/bin/env bash
# Point GitHub Pages at unfollowchecker.is-a.dev once its DNS is live.
#
# is-a.dev merges domain PRs by hand, so this is idempotent and safe to run on a
# schedule: it does nothing until the name actually resolves, and it only ever
# touches this repo's docs/CNAME + Pages setting.
set -uo pipefail

DOMAIN="unfollowchecker.is-a.dev"
REPO="sinnerk/unfollow-checker"
PROJECT="/c/Users/sxdem/Documents/Default Project/projects/unfollow-checker"
LOG="/c/Users/sxdem/AppData/Local/hermes/cache/scratch/custom-domain.log"

log() { echo "$(date -u +%FT%TZ) $*" | tee -a "$LOG"; }

# 1. Is the name resolving to something other than the is-a.dev wildcard?
A=$(python -c "import socket,sys
try: print(' '.join(sorted({ai[4][0] for ai in socket.getaddrinfo('$DOMAIN',443)})))
except Exception: print('')")

if [ -z "$A" ]; then
  log "not resolving yet — nothing to do"
  exit 0
fi

case "$A" in
  *"104.18.4.103"*|*"104.18.5.103"*)
    # is-a.dev wildcard/parking answers: still not our record.
    log "still wildcard ($A) — waiting for merge"
    exit 0
    ;;
esac

log "DNS live: $A"

# 2. Already configured?
CURRENT=$(gh api "repos/$REPO/pages" --jq '.cname // ""' 2>/dev/null)
if [ "$CURRENT" = "$DOMAIN" ] && [ -f "$PROJECT/docs/CNAME" ]; then
  log "already configured"
  exit 0
fi

# 3. Commit the CNAME file, then set the Pages custom domain.
cd "$PROJECT" || exit 1
printf '%s\n' "$DOMAIN" > docs/CNAME
git add docs/CNAME
git -c user.name=sinnerk -c user.email=sinnerk@users.noreply.github.com \
  commit -q -m "Point GitHub Pages at $DOMAIN" || true
git -c user.name=sinnerk -c user.email=sinnerk@users.noreply.github.com push -q origin main || true

gh api -X PUT "repos/$REPO/pages" -f "cname=$DOMAIN" \
  -f "source[branch]=main" -f "source[path]=/docs" >/dev/null 2>&1 && log "pages cname set"

sleep 60
CODE=$(curl.exe -s -o /dev/null -w '%{http_code}' "https://$DOMAIN/" 2>/dev/null)
log "https://$DOMAIN/ -> $CODE"
