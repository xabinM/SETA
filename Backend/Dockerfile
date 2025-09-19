# Backend/Dockerfile
FROM openjdk:17-jdk-slim

RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser

WORKDIR /app

COPY build/libs/*.jar app.jar
RUN chown appuser:appgroup app.jar

ENV JAVA_OPTS=""

USER appuser

ENTRYPOINT ["sh", "-c", "echo '--- Printing container environment variables ---' && printenv && echo '--- Starting application ---' && java $JAVA_OPTS -jar /app/app.jar"]