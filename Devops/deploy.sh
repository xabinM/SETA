#!/bin/bash
set -e

# docker-compose.server-a.yml에서 사용할 이미지 변수 export
export BACKEND_IMAGE=$1

echo "=== Deploy 시작: $BACKEND_IMAGE ==="

# 1. 최신 이미지 가져오기
docker pull $BACKEND_IMAGE

# 2. 현재 동작 중인 색상 확인
if docker ps --format '{{.Names}}' | grep -q 'backend-blue'; then   # 실행 중인 컨테이너 목록에서 backend-blue 컨테이너 찾기
    TARGET="green"                                                  # grep은 해당 패턴이 일치하는 라인을 출력 -q와 함께면 조용히 true,false 판단
    CURRENT="blue"
else
    TARGET="blue"
    CURRENT="green"
fi

echo "현재 실행 중: $CURRENT, 새로 배포할 대상: $TARGET"

# 3. 새 컨테이너 실행 (CI에서 이미 빌드했으므로 --build 옵션 제거)
echo "docker-compose로 $TARGET 컨테이너 실행"
docker-compose -f docker-compose.server-a.yml up -d --no-deps backend-$TARGET

# 4. 헬스 체크를 위한 포트 설정
if [ "$TARGET" == "blue" ]; then
    PORT=8081
else
    PORT=8082
fi

# 5. 새 컨테이너가 완전히 실행될 때까지 반복해서 헬스 체크 (최대 60초)
echo "새 컨테이너($TARGET) 헬스 체크... (최대 60초)"
for i in {1..12}; do
    # -f 옵션: HTTP 상태 코드가 200-399가 아니면 실패로 간주
    if curl -f http://localhost:$PORT/actuator/health; then
        echo "✅ 새 컨테이너($TARGET) 헬스체크 성공"
        
        # 6. Nginx 라우팅 전환
        echo "Nginx 라우팅을 $TARGET 으로 전환합니다."
        echo "set \$service_url http://127.0.0.1:$PORT;" | sudo tee /etc/nginx/conf.d/service-url.inc
        
        echo "Nginx 리로드..."
        sudo nginx -s reload

        # 7. 이전 컨테이너 정리
        echo "이전 컨테이너($CURRENT) 종료 및 삭제"
        docker-compose -f docker-compose.server-a.yml stop backend-$CURRENT
        docker-compose -f docker-compose.server-a.yml rm -f backend-$CURRENT

        echo "✅ $CURRENT → $TARGET 무중단 배포 완료"
        exit 0
    fi
    echo "헬스체크 실패. 5초 후 재시도... ($i/12)"
    sleep 5
done

# 8. 롤백: 헬스 체크 실패 시 새 컨테이너 정리
echo "❌ 롤백: 새 컨테이너($TARGET)가 60초 내에 정상적으로 시작되지 않았습니다."
docker-compose -f docker-compose.server-a.yml logs backend-$TARGET # 실패 원인 파악을 위한 로그 출력
docker-compose -f docker-compose.server-a.yml stop backend-$TARGET
docker-compose -f docker-compose.server-a.yml rm -f backend-$TARGET
exit 1
