#!/bin/bash
set -e  # 오류 발생 시 스크립트 종료

# --- 입력 값 ---
BACKEND_IMAGE=$1  # docker-compose.server-a.yml에서 사용할 이미지 변수
export BACKEND_IMAGE

echo "=== 환경변수 디버깅 ==="
echo "DB_USER from .env: '$(grep DB_USER .env || echo 'NOT FOUND')'"
echo "DB_PASSWORD from .env: '$(grep DB_PASSWORD .env || echo 'NOT FOUND')'"
echo "DB_NAME from .env: '$(grep DB_NAME .env || echo 'NOT FOUND')'"

# --- 최소 출력 ---
echo "=== Deploy 시작: $BACKEND_IMAGE ==="

# 1. 최신 이미지 가져오기
docker pull $BACKEND_IMAGE

# 2. 현재 실행 중인 컨테이너 색상 확인
if docker ps --format '{{.Names}}' | grep -q 'backend-blue'; then
    TARGET="green"
    CURRENT="blue"
else
    TARGET="blue"
    CURRENT="green"
fi

echo "현재 실행 중: $CURRENT, 새 배포 대상: $TARGET"

# DB 컨테이너 실행 - 무중단 배포 위해 --no-deps 를 걸어 두었기에 DB는 따로 실행 시켜야함
# -d는 이미 컨테이너가 떠있으면 재실행 X
docker-compose -f docker-compose.server-a.yml up -d db redis --wait

echo "=============================="
echo $REDIS_HOST
echo $REDIS_PORT
echo "=============================="

# 3. 새 컨테이너 실행
docker-compose -f docker-compose.server-a.yml up -d --no-deps backend-$TARGET

# 4. 헬스 체크 포트 설정
PORT=$([ "$TARGET" == "blue" ] && echo 8081 || echo 8082)

# 5. 헬스 체크 (최대 60초)
for i in {1..12}; do
    if curl -fsS http://localhost:$PORT/actuator/health >/dev/null 2>&1; then
        # 6. Nginx 라우팅 전환
        echo "Nginx 라우팅을 $TARGET 으로 전환"
        echo "set \$service_url http://127.0.0.1:$PORT;" | sudo tee /etc/nginx/conf.d/service-url.inc >/dev/null
        sudo nginx -s reload

        # 7. 이전 컨테이너 정리
        docker-compose -f docker-compose.server-a.yml stop backend-$CURRENT
        docker-compose -f docker-compose.server-a.yml rm -f backend-$CURRENT

        echo "✅ $CURRENT → $TARGET 무중단 배포 완료"
        exit 0
    fi
    sleep 5
done

# 8. 롤백
echo "❌ 롤백: 새 컨테이너($TARGET) 60초 내 시작 실패"
docker-compose -f docker-compose.server-a.yml logs backend-$TARGET
docker-compose -f docker-compose.server-a.yml stop backend-$TARGET
docker-compose -f docker-compose.server-a.yml rm -f backend-$TARGET
exit 1
