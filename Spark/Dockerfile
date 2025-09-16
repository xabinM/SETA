FROM jupyter/pyspark-notebook:3.5.0

USER root

# 필요한 시스템 패키지 설치
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    netcat \
    && rm -rf /var/lib/apt/lists/*

USER $NB_UID

# Python 패키지 설치를 위한 requirements.txt 복사
COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

# 작업 파일들 복사
COPY kafka_spark_filtering.py /home/jovyan/work/
COPY filter_word.json /home/jovyan/work/
COPY response.json /home/jovyan/work/

# 작업 디렉토리 설정
WORKDIR /home/jovyan/work

# Jupyter 설정
EXPOSE 8888
EXPOSE 4040

CMD ["start-notebook.sh", "--NotebookApp.token=''", "--NotebookApp.password=''"]