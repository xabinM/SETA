#!/bin/bash
set -e

DEPLOY_USER=$1
DEPLOY_DIR="/home/${DEPLOY_USER}"
DOCKER_COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.backend.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

echo "=== Deploy 시작 ==="

docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" stop backend || true
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" rm -f backend || true

docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up -d backend

PORT=8080
echo "=== 헬스 체크 시작 (http://localhost:$PORT/actuator/health) ==="
for i in {1..12}; do
    HTTP_STATUS=$(curl -o /dev/null -w "%{http_code}" -s --connect-timeout 3 http://localhost:$PORT/actuator/health) || true
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ Backend 컨테이너 실행 확인 (HTTP $HTTP_STATUS)"
        exit 0
    else
        echo "헬스 체크 실패 (HTTP $HTTP_STATUS), 5초 후 재시도..."
        sleep 5
    fi
done

echo "❌ Backend 컨테이너 시작 실패"
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" logs --tail 50 backend
exit 1