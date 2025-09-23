pipeline {
    agent any
    
    environment {
        DEPLOY_DIR = "/home/ubuntu/seta-ml-api"

        ELASTICSEARCH_URL = credentials('elasticsearch-url')
        API_HOST          = credentials('api-host')
        API_PORT          = credentials('api-port')
        API_TITLE         = credentials('api-title')
        API_VERSION       = credentials('api-version')
        POSTGRES_HOST     = credentials('postgres-host')
        POSTGRES_PORT     = credentials('postgres-port')
        POSTGRES_USER     = credentials('postgres-user')
        POSTGRES_PASSWORD = credentials('postgres-password')
        POSTGRES_DB       = credentials('postgres-db')
        REDIS_HOST        = credentials('redis-host')
        GMS_API_KEY       = credentials('gms-api-key')
        GMS_API_URL       = credentials('gms-api-url')
        ENVIRONMENT       = credentials('environment')
        EMBED_INDEX_NAME  = credentials('embed-index-name')
        EMBED_MODEL_PATH  = credentials('embedding-model-path')
        EMBED_DIMS        = credentials('embed-dims')
        FILTER_MODEL_PATH = credentials('filter-model-path')

        KAFKA_BOOTSTRAP_SERVERS   = credentials('kafka-bootstrap-servers')
        KAFKA_TOPIC_IN_RAW        = credentials('kafka-topic-in-raw')
        KAFKA_TOPIC_FILTER_RESULT = credentials('kafka-topic-filter-result')
        KAFKA_TOPIC_IN_LLM        = credentials('kafka-topic-in-llm')
        KAFKA_TOPIC_OUT_LLM_DELTA = credentials('kafka-topic-out-llm-delta')
        KAFKA_TOPIC_OUT_LLM_DONE  = credentials('kafka-topic-out-llm-done')
    }
    
    stages {
        stage('Deploy ML API to EC2') {
            steps {
                echo "Deploying ML API to EC2 via SSH"
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        scp -o StrictHostKeyChecking=no -r ${WORKSPACE}/Data/ \
                                   ${WORKSPACE}/Spark/ \
                                   ubuntu@172.26.8.129:${DEPLOY_DIR}/
                        
                        ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                            cd ${DEPLOY_DIR}/Data &&
                            echo 'Creating .env file from Jenkins credentials...' &&
                            echo \"ELASTICSEARCH_URL=${ELASTICSEARCH_URL}\" > .env &&
                            echo \"API_HOST=${API_HOST}\" >> .env &&
                            echo \"API_PORT=${API_PORT}\" >> .env &&
                            echo \"API_TITLE=${API_TITLE}\" >> .env &&
                            echo \"API_VERSION=${API_VERSION}\" >> .env &&
                            echo \"POSTGRES_HOST=${POSTGRES_HOST}\" >> .env &&
                            echo \"POSTGRES_PORT=${POSTGRES_PORT}\" >> .env &&
                            echo \"POSTGRES_USER=${POSTGRES_USER}\" >> .env &&
                            echo \"POSTGRES_PASSWORD=${POSTGRES_PASSWORD}\" >> .env &&
                            echo \"POSTGRES_DB=${POSTGRES_DB}\" >> .env &&
                            echo \"REDIS_HOST=${REDIS_HOST}\" >> .env &&
                            echo \"REDIS_PORT=6379\" >> .env &&
                            echo \"GMS_API_KEY=${GMS_API_KEY}\" >> .env &&
                            echo \"GMS_API_URL=${GMS_API_URL}\" >> .env &&
                            echo \"ENVIRONMENT=${ENVIRONMENT}\" >> .env &&
                            echo \"EMBED_INDEX_NAME=${EMBED_INDEX_NAME}\" >> .env &&
                            echo \"EMBED_MODEL_PATH=${EMBED_MODEL_PATH}\" >> .env &&
                            echo \"EMBED_DIMS=${EMBED_DIMS}\" >> .env &&
                            echo \"FILTER_MODEL_PATH=${FILTER_MODEL_PATH}\" >> .env &&
                            echo \"LOG_LEVEL=INFO\" >> .env &&

                            # === Kafka 관련 변수 추가 ===
                            echo \"KAFKA_BOOTSTRAP_SERVERS=${KAFKA_BOOTSTRAP_SERVERS}\" >> .env &&
                            echo \"KAFKA_TOPIC_IN_RAW=${KAFKA_TOPIC_IN_RAW}\" >> .env &&
                            echo \"KAFKA_TOPIC_FILTER_RESULT=${KAFKA_TOPIC_FILTER_RESULT}\" >> .env &&
                            echo \"KAFKA_TOPIC_IN_LLM=${KAFKA_TOPIC_IN_LLM}\" >> .env &&
                            echo \"KAFKA_TOPIC_OUT_LLM_DELTA=${KAFKA_TOPIC_OUT_LLM_DELTA}\" >> .env &&
                            echo \"KAFKA_TOPIC_OUT_LLM_DONE=${KAFKA_TOPIC_OUT_LLM_DONE}\" >> .env &&

                            echo 'Forcefully stopping and cleaning up ML API containers...' &&
                            docker-compose down --remove-orphans || true &&
                            docker container prune -f || true &&
                            docker network prune -f || true &&
                            echo 'Checking for port conflicts...' &&
                            ss -tlnp | grep ':8000' || echo 'Port 8000 is free' &&
                            ss -tlnp | grep ':9200' || echo 'Port 9200 is free' &&
                            echo 'Stopping any conflicting containers...' &&
                            docker stop seta-ml-api_elasticsearch_1 seta-ml-api_ml-api_1 || true &&
                            docker rm seta-ml-api_elasticsearch_1 seta-ml-api_ml-api_1 || true &&
                            echo 'Starting ML API containers...' &&
                            docker-compose up -d --build &&
                            echo 'Waiting for containers to start...' &&
                            sleep 15 &&
                            echo 'ML API deployment completed'
                        "
                    '''
                }
            }
        }
        
        stage('Deploy Spark Services') {
            steps {
                echo "Deploying Spark Services to EC2"
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                            cd ${DEPLOY_DIR}/Spark &&
                            echo 'Creating .env file for Spark services...' &&
                            echo \"POSTGRES_HOST=${POSTGRES_HOST}\" > .env &&
                            echo \"POSTGRES_PORT=${POSTGRES_PORT}\" >> .env &&
                            echo \"POSTGRES_USER=${POSTGRES_USER}\" >> .env &&
                            echo \"POSTGRES_PASSWORD=${POSTGRES_PASSWORD}\" >> .env &&
                            echo \"POSTGRES_DB=${POSTGRES_DB}\" >> .env &&
                            docker-compose down --remove-orphans || true &&
                            docker container prune -f || true &&
                            docker network prune -f || true &&
                            echo 'Starting Spark services...' &&
                            docker-compose up --build -d &&
                            sleep 20 &&
                            docker-compose ps
                        "
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                            echo '=== ML API Status ===' &&
                            cd ${DEPLOY_DIR}/Data &&
                            docker-compose ps &&
                            echo '=== Spark Services Status ===' &&
                            cd ${DEPLOY_DIR}/Spark &&
                            docker-compose ps &&
                            echo '=== All Running Containers ===' &&
                            docker ps &&
                            echo '=== Port Usage Check ===' &&
                            ss -tlnp | grep ':8000' || echo 'Port 8000 not in use' &&
                            ss -tlnp | grep ':9200' || echo 'Port 9200 not in use' &&
                            ss -tlnp | grep ':8888' || echo 'Port 8888 not in use' &&
                            ss -tlnp | grep ':4040' || echo 'Port 4040 not in use' &&
                            ss -tlnp | grep ':9092' || echo 'Port 9092 not in use' &&
                            sleep 10 &&
                            echo '=== Health Check ===' &&
                            curl -f http://localhost:8000/health || echo 'ML API Health check failed'
                        "
                    '''
                }
            }
        }
    }
    
    post {
        success {
            sshagent(['ec2-ssh-key']) {
                sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                        echo 'Cleaning up unused Docker resources...' &&
                        docker image prune -f || true &&
                        docker builder prune -af || true &&
                        echo 'Cleanup completed'
                    "
                '''
            }
        }
        failure {
            echo "Deployment failed. Check logs for details."
            sshagent(['ec2-ssh-key']) {
                sh '''
                    ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                        echo '=== Debug Information ===' &&
                        docker ps -a &&
                        docker network ls &&
                        echo '=== .env file contents ===' &&
                        cat ${DEPLOY_DIR}/Data/.env || echo '.env file not found'
                    "
                '''
            }
        }
    }
}
