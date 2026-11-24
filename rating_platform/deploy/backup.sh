#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/opt/rating_platform"
BACKUP_DIR="/opt/rating_backups"
STAMP="$(date +%Y-%m-%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [ -f "$APP_DIR/data/study.db" ]; then
  python3 -c "
import sqlite3
src = sqlite3.connect('$APP_DIR/data/study.db')
dst = sqlite3.connect('$BACKUP_DIR/study_${STAMP}.db')
src.backup(dst)
dst.close()
src.close()
"
  gzip -f "$BACKUP_DIR/study_${STAMP}.db"
fi

if [ -f "$APP_DIR/data/faces.csv" ]; then
  cp "$APP_DIR/data/faces.csv" "$BACKUP_DIR/faces_${STAMP}.csv"
fi

# Retain 30 days of daily backups
find "$BACKUP_DIR" -type f -mtime +30 -delete

