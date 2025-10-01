import os
from datetime import datetime, timedelta, timezone
from pyspark.sql import SparkSession, functions as F
from pyspark.sql.window import Window

# -------------------------------------------------------------------
# Configurations
# -------------------------------------------------------------------
POSTGRES_HOST = os.environ.get("POSTGRES_HOST")
POSTGRES_PORT = os.environ.get("POSTGRES_PORT", "5432")
POSTGRES_DB = os.environ.get("POSTGRES_DB") 
POSTGRES_USER = os.environ.get("POSTGRES_USER")
POSTGRES_PASSWORD = os.environ.get("POSTGRES_PASSWORD")

JDBC_URL = f"jdbc:postgresql://{POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}"
JDBC_DRIVER = "org.postgresql.Driver"
CONNECTION_PROPERTIES = {
    "user": POSTGRES_USER,
    "password": POSTGRES_PASSWORD,
    "driver": JDBC_DRIVER
}
SOURCE_TABLE = "token_usage"
USER_DAILY_TABLE = "user_saved_token_daily"
USER_TOTAL_TABLE = "user_saved_token_total"
GLOBAL_DAILY_TABLE = "global_saved_token_daily"
GLOBAL_TOTAL_TABLE = "global_saved_token_total"

print(f"Connecting to main PostgreSQL at {POSTGRES_HOST}:{POSTGRES_PORT}/{POSTGRES_DB}")

# -------------------------------------------------------------------
# Spark Session
# -------------------------------------------------------------------
spark = SparkSession.builder \
    .appName("SETA Token Usage Hourly Aggregation") \
    .getOrCreate()

# -------------------------------------------------------------------
# INSERT
# -------------------------------------------------------------------
def insert_batch_results(df, target_table):
    """
    집계된 DataFrame을 지정된 테이블에 append 모드로 INSERT합니다.
    """
    if df.rdd.isEmpty():
        print(f"No data to insert into {target_table}. Skipping.")
        return

    print(f"--- Inserting data into {target_table}: ---")
    df.show(truncate=False)

    df.write.jdbc(
        url=JDBC_URL,
        table=target_table,
        mode="append",
        properties=CONNECTION_PROPERTIES
    )
    print(f"Successfully inserted data into {target_table}")

# -------------------------------------------------------------------
# Main Logic
# -------------------------------------------------------------------
now = datetime.now(timezone.utc)
print(f"[*] Current script execution time (UTC): {now}")

end_minute = now.minute - (now.minute % 5)
five_min_end_time = now.replace(minute=end_minute, second=0, microsecond=0)
five_min_start_time = five_min_end_time - timedelta(minutes=5)

twenty_four_hour_start_time = now - timedelta(hours=24)

print("\n--- Time Window Calculation ---")
print(f"Based on current minute ({now.minute}), calculated end minute for 5-min window: {end_minute}")
print(f"==> 5-min batch window: {five_min_start_time} to {five_min_end_time} (UTC)")
print(f"==> 24-hour rolling window: {twenty_four_hour_start_time} to {now} (UTC)\n")

base_df = spark.read.jdbc(
    url=JDBC_URL,   
    table=SOURCE_TABLE,
    properties=CONNECTION_PROPERTIES
).filter(F.col("user_id").isNotNull())

five_min_source_df = base_df.where(
    F.col("created_at").between(five_min_start_time, five_min_end_time)
)
five_min_source_df.cache()
print(f"--- Found {five_min_source_df.count()} records with valid user_id in the last 5 minutes. ---")
if not five_min_source_df.rdd.isEmpty():
    five_min_source_df.show(5, truncate=False)

twenty_four_hour_source_df = base_df.where(
    F.col("created_at").between(twenty_four_hour_start_time, now)
)
print(f"--- Found {twenty_four_hour_source_df.count()} records with valid user_id in the last 24 hours. ---")
if not twenty_four_hour_source_df.rdd.isEmpty():
    twenty_four_hour_source_df.show(5, truncate=False)


daily_user_agg = twenty_four_hour_source_df.groupBy(F.col("user_id").cast("string").alias("user_id")).agg(
    F.sum("saved_tokens").alias("saved_tokens"),
    F.sum("total_tokens").alias("token_sum"),
    F.sum("cost_usd").alias("cost_sum_usd"),
    F.count(F.lit(1)).alias("request_count")
).withColumn("window_start", F.lit(now))

daily_global_agg = twenty_four_hour_source_df.agg(
    F.sum("saved_tokens").alias("saved_tokens"),
    F.sum("total_tokens").alias("token_sum"),
    F.sum("cost_usd").alias("cost_sum_usd"),
    F.count(F.lit(1)).alias("request_count")
).withColumn("window_start", F.lit(now))

print("Inserting 24-hour rolling aggregation into daily tables...")
insert_batch_results(daily_user_agg, USER_DAILY_TABLE)
insert_batch_results(daily_global_agg, GLOBAL_DAILY_TABLE)


if five_min_source_df.rdd.isEmpty():
    print("No new data in the last 5 minutes to update total tables.")
else:
    print("Calculating and inserting cumulative totals based on 5-minute aggregation...")
    five_min_user_agg = five_min_source_df.groupBy(F.col("user_id").cast("string").alias("user_id")).agg(
        F.sum("saved_tokens").alias("new_saved_tokens"),
        F.sum("total_tokens").alias("new_token_sum"),
        F.sum("cost_usd").alias("new_cost_sum_usd"),
        F.count(F.lit(1)).alias("new_request_count")
    )
    five_min_global_agg = five_min_source_df.agg(
        F.sum("saved_tokens").alias("new_saved_tokens"),
        F.sum("total_tokens").alias("new_token_sum"),
        F.sum("cost_usd").alias("new_cost_sum_usd"),
        F.count(F.lit(1)).alias("new_request_count")
    )

    # Global Total
    try:
        prev_global_total_df = spark.read.jdbc(url=JDBC_URL, table=GLOBAL_TOTAL_TABLE, properties=CONNECTION_PROPERTIES)
        latest_global_total = prev_global_total_df.orderBy(F.desc("stat_date")).limit(1)

        if latest_global_total.rdd.isEmpty():
            new_global_total = five_min_global_agg.select(
                F.col("new_request_count").alias("request_count"),
                F.col("new_saved_tokens").alias("saved_tokens"),
                F.col("new_token_sum").alias("token_sum"),
                F.col("new_cost_sum_usd").alias("cost_sum_usd")
            )
        else:
            new_global_total = latest_global_total.crossJoin(five_min_global_agg).select(
                (F.col("request_count") + F.col("new_request_count")).alias("request_count"),
                (F.col("saved_tokens") + F.col("new_saved_tokens")).alias("saved_tokens"),
                (F.col("token_sum") + F.col("new_token_sum")).alias("token_sum"),
                (F.col("cost_sum_usd") + F.col("new_cost_sum_usd")).alias("cost_sum_usd")
            )
        
        global_total_to_insert = new_global_total.withColumn("stat_date", F.lit(now))
        insert_batch_results(global_total_to_insert, GLOBAL_TOTAL_TABLE)

    except Exception as e:
        print(f"Could not process {GLOBAL_TOTAL_TABLE}. It might be empty or an error occurred. Treating as first run. Error: {e}")
        first_global_total = five_min_global_agg.select(
            F.col("new_request_count").alias("request_count"),
            F.col("new_saved_tokens").alias("saved_tokens"),
            F.col("new_token_sum").alias("token_sum"),
            F.col("new_cost_sum_usd").alias("cost_sum_usd")
        ).withColumn("stat_date", F.lit(now))
        insert_batch_results(first_global_total, GLOBAL_TOTAL_TABLE)

    # User Total
    try:
        prev_user_total_df = spark.read.jdbc(url=JDBC_URL, table=USER_TOTAL_TABLE, properties=CONNECTION_PROPERTIES)
        window = Window.partitionBy("user_id").orderBy(F.desc("stat_date"))
        latest_user_total = prev_user_total_df.withColumn("rank", F.row_number().over(window)).filter(F.col("rank") == 1).drop("rank")

        new_user_total = latest_user_total.join(five_min_user_agg, "user_id", "full_outer").select(
            F.coalesce(latest_user_total.user_id, five_min_user_agg.user_id).alias("user_id"),
            (F.coalesce(F.col("request_count"), F.lit(0)) + F.coalesce(F.col("new_request_count"), F.lit(0))).alias("request_count"),
            (F.coalesce(F.col("saved_tokens"), F.lit(0)) + F.coalesce(F.col("new_saved_tokens"), F.lit(0))).alias("saved_tokens"),
            (F.coalesce(F.col("token_sum"), F.lit(0)) + F.coalesce(F.col("new_token_sum"), F.lit(0))).alias("token_sum"),
            (F.coalesce(F.col("cost_sum_usd"), F.lit(0)) + F.coalesce(F.col("new_cost_sum_usd"), F.lit(0))).alias("cost_sum_usd")
        )
        
        user_total_to_insert = new_user_total.withColumn("stat_date", F.lit(now))
        insert_batch_results(user_total_to_insert, USER_TOTAL_TABLE)

    except Exception as e:
        print(f"Could not process {USER_TOTAL_TABLE}. It might be empty or an error occurred. Treating as first run. Error: {e}")
        first_user_total = five_min_user_agg.select(
            "user_id",
            F.col("new_request_count").alias("request_count"),
            F.col("new_saved_tokens").alias("saved_tokens"),
            F.col("new_token_sum").alias("token_sum"),
            F.col("new_cost_sum_usd").alias("cost_sum_usd")
        ).withColumn("stat_date", F.lit(now))
        insert_batch_results(first_user_total, USER_TOTAL_TABLE)

spark.stop()
print("Batch aggregation job finished successfully.")