pipeline {
    agent any
    
    environment {
        DEPLOY_DIR = "/home/ubuntu/seta-ml-api"
        ELASTICSEARCH_URL = credentials('elasticsearch-url')
        API_HOST = credentials('api-host')
        API_PORT = credentials('api-port')
    }
    
    stages {
        stage('Deploy to EC2') {
            steps {
                echo "Deploying to EC2 via SSH"
                sshagent(['ec2-ssh-key']) {
                    sh '''
                        scp -o StrictHostKeyChecking=no -r ${WORKSPACE}/Data/* ubuntu@172.26.8.129:${DEPLOY_DIR}/
                        
                        ssh -o StrictHostKeyChecking=no ubuntu@172.26.8.129 "
                            cd ${DEPLOY_DIR} &&
                            echo 'Stopping containers...' &&
                            docker-compose down &&
                            docker-compose rm -f &&
                            echo 'Starting new containers...' &&
                            docker-compose up -d --build &&
                            echo 'Deployment completed'
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
                            cd ${DEPLOY_DIR} &&
                            docker-compose ps &&
                            sleep 10 &&
                            curl -f http://localhost:8000/health || echo 'Health check failed'
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