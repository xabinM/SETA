#!/bin/bash
set -e

BACKEND_IMAGE=$1
DEPLOY_USER=$2
DEPLOY_DIR="/home/${DEPLOY_USER}"
DOCKER_COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.server-a.yml"

if [ -z "$BACKEND_IMAGE" ] || [ -z "$DEPLOY_USER" ]; then
    echo "Usage: ./deploy.sh <BACKEND_IMAGE> <DEPLOY_USER>"
    exit 1
fi

ENV_FILE="${DEPLOY_DIR}/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env 파일이 존재하지 않습니다: $ENV_FILE"
    exit 1
fi

echo "=== Deploy 시작: $BACKEND_IMAGE ==="

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
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" logs backend --tail 50
exit 1