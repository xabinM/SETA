# Backend/Dockerfile (Spring Boot 예시)
FROM openjdk:17-jdk-slim

# 보안 강화를 위해 non-root 유저 생성
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

# 빌드 아티팩트 복사
COPY build/libs/*.jar app.jar
# 파일 소유권을 non-root 유저에게 부여
RUN chown appuser:appgroup app.jar

# (옵션) JVM 옵션 환경변수
ENV JAVA_OPTS=""

# non-root 유저로 전환
USER appuser

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]