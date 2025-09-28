# 포팅 매뉴얼 (React + Spring Boot 프로젝트)

## 1. 시스템 개요
- **프로젝트**: Seta (Save the earth Through AI)
- **배포 환경**: Docker 컨테이너 + 호스트 서버(EC2)
---

## 2. 기술 스택 및 버전

| 서비스 | 위치 | 버전             | 역할 |
|--------|------|----------------|------|
| PostgreSQL | Docker 컨테이너(db) | 15.14          | DB |
| Redis | Docker 컨테이너(redis) | 7.4.5          | 캐시 |
| Kafka | Docker 컨테이너(bitnami/kafka:3.7) | 3.7            | 메시징 큐 |
| Spring Boot | Docker 컨테이너(backend_blue / backend_green) | 3.5.5, Java 17 | 백엔드 서비스 |
| React | Docker 컨테이너(frontend) | 19.1.1         | SPA 프론트엔드 |
| Nginx (프론트) | Docker 컨테이너(frontend) | 1.29.1         | React 정적 파일 서빙 |
| Nginx (호스트) | Ubuntu EC2 | 1.18.0         | Blue-Green 리버스 프록시, SSL/TLS, 로드밸런싱 |
| Jaeger | Docker 컨테이너 | 1.57           | 트레이싱 |

---

## 3. 포트 매핑 테이블

| 서비스 / 컨테이너                         | 호스트 포트 → 컨테이너 포트                                |
|------------------------------------|-------------------------------------------------|
| frontend (React + Nginx)           | 3000 → 80                                       |
| backend_green / blue (Spring Boot) | 8082 → 8080 / 8081 → 8080                       |
| db (PostgreSQL)                    | 5432 → 5432                                     |
| redis                              | 6379 → 6379                                     |
| kafka                              | 9092 → 9092 <br> 29092 → 29092 <br> 9093 → 9093 |
| jaeger                             | 16686 → 16686 <br> 4317 → 4317 <br> 4318 → 4318 |
| 호스트 Nginx                          | 80 → 80 <br> 443 → 443                          |

---

## 4. 사전 준비 사항
- **OS**: Ubuntu 22.04 (호스트)
- **필수 설치**: Docker, Docker Compose, Nginx (호스트)

### 호스트 Nginx 설치 후 conf 파일 정의(port 로드 밸런싱)
```bash
sudo nano /etc/nginx/conf.d/nginx.conf
```

- 아래 내용 복사
```bash
server {
    listen 443 ssl;
    server_name seta.ai.kr www.seta.ai.kr;

    ssl_certificate /etc/letsencrypt/live/seta.ai.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seta.ai.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /api/ {
        proxy_pass http://127.0.0.1:8082;  # 활성 Backend 컨테이너 포트
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;  # Frontend 컨테이너 포트
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name seta.ai.kr www.seta.ai.kr;

    # HTTP → HTTPS 리디렉션
    return 301 https://$host$request_uri;
}
```

## 5. 설치 및 실행 방법

### 1. 서버 접속
```bash
ssh <USER>@<SERVER_IP>
```

### 2. git clone
```bash
cd /home/<USER>
git clone https://lab.ssafy.com/s13-bigdata-dist-sub1/S13P21A403.git S13P21A403
```

### 3. docker-compose 환경 준비
- Devops 디렉토리 이동
```bash
cd /home/ubuntu/S13P21A403/Devops
```

- Backend 환경 변수 파일 생성(.env) (비밀값 주입 필)
```bash
# .env 파일 생성
cat > .env <<EOF
BACKEND_IMAGE=sabinm95/backend:ad75d3ed
FRONT_IMAGE=sabinm95/frontend:ad75d3ed

DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
DB_NAME=<DB_NAME>

JWT_SECRET=<JWT_SECRET>
JWT_ACCESSTOKENEXPIRATIONMS=<JWT_ACCESSTOKENEXPIRATIONMS>
JWT_REFRESHTOKENEXPIRATIONMS=<JWT_REFRESHTOKENEXPIRATIONMS>

GMS_OPENAI_API_KEY=<GMS_OPENAI_API_KEY>
GMS_OPENAI_BASE_URL=<GMS_OPENAI_BASE_URL>
GMS_OPENAI_COMPLETIONS_PATH=<GMS_OPENAI_COMPLETIONS_PATH>
GMS_OPENAI_MODEL=<GMS_OPENAI_MODEL>
GMS_OPENAI_TIMEOUT_MS=<GMS_OPENAI_TIMEOUT_MS>
EOF
```

- docker-compose 컨테이너 실행 명령
```bash
docker-compose -f docker-compose.frontend.yml -f docker-compose.backend.yml up -d
```

---
