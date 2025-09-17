pipeline {
    agent any
    
    environment {
        DEPLOY_DIR = "/home/ubuntu/seta-ml-api"
        ELASTICSEARCH_URL = credentials('elasticsearch-url')
        API_HOST = credentials('api-host')
        API_PORT = credentials('api-port')
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
                            echo 'ELASTICSEARCH_URL=${ELASTICSEARCH_URL}' > .env &&
                            echo 'API_HOST=${API_HOST}' >> .env &&
                            echo 'API_PORT=${API_PORT}' >> .env &&
                            echo 'LOG_LEVEL=INFO' >> .env &&
                            echo 'ENV=development' >> .env &&
                            echo 'Forcefully stopping and cleaning up ML API containers...' &&
                            docker-compose down --remove-orphans --volumes || true &&
                            docker container prune -f || true &&
                            docker network prune -f || true &&
                            echo 'Checking for port conflicts...' &&
                            netstat -tlnp | grep ':8000' || echo 'Port 8000 is free' &&
                            netstat -tlnp | grep ':9200' || echo 'Port 9200 is free' &&
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
                            echo 'Current directory:' && pwd &&
                            echo 'Files in Spark directory:' &&
                            ls -la &&
                            echo 'Forcefully stopping existing Spark services...' &&
                            docker-compose down --remove-orphans --volumes || true &&
                            docker container prune -f || true &&
                            docker network prune -f || true &&
                            echo 'Checking for Spark port conflicts...' &&
                            netstat -tlnp | grep ':8888' || echo 'Port 8888 is free' &&
                            netstat -tlnp | grep ':4040' || echo 'Port 4040 is free' &&
                            netstat -tlnp | grep ':9092' || echo 'Port 9092 is free' &&
                            netstat -tlnp | grep ':29092' || echo 'Port 29092 is free' &&
                            echo 'Starting Spark services...' &&
                            docker-compose up --build -d &&
                            echo 'Waiting for Spark services to start...' &&
                            sleep 20 &&
                            echo 'Spark deployment completed' &&
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
                            echo 'Checking ML API ports:' &&
                            netstat -tlnp | grep ':8000' || echo 'Port 8000 not in use' &&
                            netstat -tlnp | grep ':9200' || echo 'Port 9200 not in use' &&
                            echo 'Checking Spark ports:' &&
                            netstat -tlnp | grep ':8888' || echo 'Port 8888 not in use' &&
                            netstat -tlnp | grep ':4040' || echo 'Port 4040 not in use' &&
                            netstat -tlnp | grep ':9092' || echo 'Port 9092 not in use' &&
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
                        docker volume prune -f || true &&
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
                        echo '=== Port Usage ===' &&
                        netstat -tlnp | grep ':8000' || echo 'Port 8000 not in use' &&
                        netstat -tlnp | grep ':9200' || echo 'Port 9200 not in use' &&
                        netstat -tlnp | grep ':8888' || echo 'Port 8888 not in use' &&
                        netstat -tlnp | grep ':4040' || echo 'Port 4040 not in use' &&
                        netstat -tlnp | grep ':9092' || echo 'Port 9092 not in use' &&
                        echo '=== Docker Networks ===' &&
                        docker network ls &&
                        echo '=== .env file contents ===' &&
                        cat ${DEPLOY_DIR}/Data/.env || echo '.env file not found'
                    "
                '''
            }
        }
    }
}