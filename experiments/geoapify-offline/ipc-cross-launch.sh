#!/bin/sh
set -eu
[ "$(id -u)" -eq 65533 ] && [ "$(id -g)" -eq 65534 ] || exit 70
[ "$#" -eq 2 ] || exit 71
DB_DIR=$(dirname -- "$2")
[ "$(stat -c %u:%a -- "$DB_DIR")" = '65533:700' ] || exit 72
exec flock -n -F -E 73 "$DB_DIR/owner.lock" node "$(dirname -- "$0")/ipc-cross-owner.worker.mjs" "$1" "$2"
