#!/usr/bin/env bash
set -e

# Sync all 15 issues into GitHub Projects (Kanban Board)
PROJECT_NUM="${1:-1}"
OWNER="chanoknanpiim"

echo "Syncing PLODPLOI issues to GitHub Project #${PROJECT_NUM} for owner ${OWNER}..."

node scripts/sync-kanban-board.mjs
