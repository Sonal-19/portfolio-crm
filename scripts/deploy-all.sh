#!/usr/bin/env bash
set -euo pipefail
D="$(dirname "${BASH_SOURCE[0]}")"
case "${1:-all}" in
  backend)  bash "$D/deploy-backend.sh" ;;
  frontend) bash "$D/deploy-frontend.sh" ;;
  all)      bash "$D/deploy-backend.sh"; bash "$D/deploy-frontend.sh" ;;
  *) echo "usage: $0 [all|backend|frontend]"; exit 1 ;;
esac
