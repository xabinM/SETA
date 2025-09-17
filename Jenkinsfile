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
                            cat > .env << EOF
ELASTICSEARCH_URL=${ELASTICSEARCH_URL}
API_HOST=${API_HOST}
API_PORT=${API_PORT}
LOG_LEVEL=INFO
ENV=development
EOF
                            echo 'Stopping ML API containers...' &&
                            docker-compose down &&
                            docker-compose rm -f &&
                            echo 'Starting ML API containers...' &&
                            docker-compose up -d --build &&
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
                            echo 'Stopping existing Spark services...' &&
                            docker-compose down --remove-orphans || echo 'No existing Spark services to stop' &&
                            echo 'Starting Spark services..' &&
                            docker-compose up --build -d &&
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
                        docker image prune -f || true &&
                        docker builder prune -af || true
                    "
                '''
            }
        }
        failure {
            echo "Deployment failed. Check logs for details."
        }
    }
}