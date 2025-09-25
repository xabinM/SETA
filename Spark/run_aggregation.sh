#!/bin/bash

source ~/.bashrc

# 1. 스파크 작업이 있는 폴더로 이동
cd "$(dirname "$0")" || exit

# 2. "cron.log"라는 업무 일지에 "지금부터 작업 시작!"이라고 시간과 함께 기록
echo "--- Running Spark batch aggregation at $(date) ---" >> cron.log

# 3. 스파크 집계 작업을 실행하고, 그 과정과 결과를 모두 업무 일지에 자세히 기록
/usr/local/bin/docker-compose run --rm spark-batch-processor \
  /opt/bitnami/spark/bin/spark-submit \
  --master local[*] \
  --packages org.postgresql:postgresql:42.7.3 \
  /opt/bitnami/spark/app/spark_batch_aggregation.py >> cron.log 2>&1