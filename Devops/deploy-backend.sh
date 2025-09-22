#!/bin/bash
set -e

DEPLOY_USER=$1
DEPLOY_DIR="/home/${DEPLOY_USER}"
DOCKER_COMPOSE_FILE="${DEPLOY_DIR}/docker-compose.backend.yml"
ENV_FILE="${DEPLOY_DIR}/.env"

# nginx에서 backend_blue 또는 backend_green 포트를 바라보게 할 예정
BLUE_PORT=8081
GREEN_PORT=8082
HEALTH_PATH="/actuator/health"

# upstream 설정 파일 경로
UPSTREAM_DIR="/home/${DEPLOY_USER}/nginx_upstreams"
UPSTREAM_BLUE="${UPSTREAM_DIR}/backend_upstream_blue.conf"
UPSTREAM_GREEN="${UPSTREAM_DIR}/backend_upstream_green.conf"
NGINX_UPSTREAM_LINK="/etc/nginx/conf.d/backend_upstream.conf"

echo "=== Blue/Green 배포 시작 ==="

# 현재 활성화된 컨테이너 확인 (nginx가 바라보는 대상 파악)
if grep -q "$BLUE_PORT" "$NGINX_UPSTREAM_LINK" 2>/dev/null; then
    CURRENT="blue"
    NEXT="green"
    NEXT_PORT=$GREEN_PORT
    NEXT_CONF=$UPSTREAM_GREEN
else
    CURRENT="green"
    NEXT="blue"
    NEXT_PORT=$BLUE_PORT
    NEXT_CONF=$UPSTREAM_BLUE
fi

echo "현재 활성화: $CURRENT → 신규 배포 대상: $NEXT (port $NEXT_PORT)"

# 기존 동일 이름 컨테이너가 있으면 제거
EXISTING_CONTAINER=$(docker ps -aq -f name="backend_$NEXT")
if [ -n "$EXISTING_CONTAINER" ]; then
    echo "⚠️ 기존 $NEXT 컨테이너($EXISTING_CONTAINER) 발견 → 제거"
    docker rm -f "$EXISTING_CONTAINER"
fi

# 새 컨테이너 실행
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" up -d --remove-orphans backend_$NEXT

# 헬스체크
echo "=== 헬스 체크 시작 (http://localhost:$NEXT_PORT$HEALTH_PATH) ==="
for i in {1..12}; do
    HTTP_STATUS=$(curl -o /dev/null -w "%{http_code}" -s --connect-timeout 3 http://localhost:$NEXT_PORT$HEALTH_PATH) || true
    if [ "$HTTP_STATUS" -eq 200 ]; then
        echo "✅ $NEXT 컨테이너 실행 확인 (HTTP $HTTP_STATUS)"
        break
    else
        echo "헬스 체크 실패 (HTTP $HTTP_STATUS), 5초 후 재시도..."
        sleep 5
    fi

    if [ $i -eq 12 ]; then
        echo "❌ 새 컨테이너($NEXT) 헬스체크 실패"
        docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" logs --tail 50 backend_$NEXT
        exit 1
    fi
done

# nginx 업스트림 전환 (symlink 교체)
echo "=== nginx upstream 전환 ==="
sudo ln -sfn "$NEXT_CONF" "$NGINX_UPSTREAM_LINK"
sudo nginx -s reload

echo "=== 트래픽 전환 완료 → $NEXT 컨테이너 서비스 시작 ==="

# 이전 컨테이너 중단
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" stop backend_$CURRENT || true
docker-compose --env-file "$ENV_FILE" -f "$DOCKER_COMPOSE_FILE" rm -f backend_$CURRENT || true

echo "✅ 무중단 배포 완료 ($CURRENT → $NEXT)"
