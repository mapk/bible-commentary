#!/bin/sh
# Schedules scripts/backup.mjs to run daily at 3:00 on this Mac. If the Mac is
# asleep then, macOS runs it on wake. If the Mac is off, that run is skipped.
#
#   sh scripts/schedule-backup.sh          install or update
#   sh scripts/schedule-backup.sh remove   stop scheduled backups
set -eu

LABEL="com.tolkovanye.backup"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
DOMAIN="gui/$(id -u)"

launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true

if [ "${1:-}" = "remove" ]; then
  rm -f "$PLIST"
  echo "Scheduled backups removed. Existing backups were not touched."
  exit 0
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NODE="$(command -v node)"
mkdir -p "$ROOT/backups" "$(dirname "$PLIST")"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$NODE</string>
    <string>$ROOT/scripts/backup.mjs</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key><integer>3</integer>
    <key>Minute</key><integer>0</integer>
  </dict>
  <key>StandardOutPath</key><string>$ROOT/backups/launchd.log</string>
  <key>StandardErrorPath</key><string>$ROOT/backups/launchd.log</string>
</dict>
</plist>
PLIST

launchctl bootstrap "$DOMAIN" "$PLIST"
echo "Backups scheduled daily at 3:00 using $NODE"
