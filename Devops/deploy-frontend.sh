#!/bin/bash
set -e

FRONTEND_IMAGE=$1
export FRONTEND_IMAGE

DEPLOY_USER=$2
DEPLOY_DIR="/home/${DEPLOY_USER}"
DOCKER_COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.frontend.yml"

ENV_FILE="${DEPLOY_DIR}/.env.front"

echo "=== Frontend Deploy 시작 ==="

docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" stop frontend || true
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" rm -f frontend || true

docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up -d frontend

PORT=80
echo "=== 헬스 체크 시작 (http://localhost:$PORT) ==="
for i in {1..12}; do
    HTTP_STATUS=$(curl -o /dev/null -w "%{http_code}" -s --connect-timeout 3 http://localhost:$PORT) || true
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Frontend 컨테이너 실행 확인 (HTTP $HTTP_STATUS)"
        exit 0
    else
        echo "헬스 체크 실패 (HTTP $HTTP_STATUS), 5초 후 재시도..."
        sleep 5
    fi
done

echo "❌ Frontend 컨테이너 시작 실패"
docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail 50 frontend
exit 1
