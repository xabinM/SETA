#!/bin/bash

source ~/.bashrc

SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit

echo "--- Running Spark batch aggregation at $(date) ---" >> cron.log

/usr/bin/docker-compose --file "$SCRIPT_DIR/docker-compose.yml" run --rm spark-batch \
  /opt/bitnami/spark/bin/spark-submit \
  --master local[*] \
  --packages org.postgresql:postgresql:42.7.3 \
  /opt/bitnami/spark/app/spark_batch_aggregation.py >> cron.log 2>&1