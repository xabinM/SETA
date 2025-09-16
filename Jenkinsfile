pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/home/ubuntu/seta-ml-api"
    }

    stages {
        stage('Pull from GitLab') {
            steps {
                echo "📥 Pulling latest code from GitLab"
                dir("${env.DEPLOY_DIR}") {
                    sh 'git pull origin infra/ml-api'
                }
            }
        }

        stage('Rebuild Docker Containers') {
            steps {
                echo "🐳 Stopping and rebuilding containers"
                dir("${env.DEPLOY_DIR}") {
                    sh 'docker-compose down'
                    sh 'docker-compose up -d --build'
                }
            }
        }

        stage('Deployment Complete') {
            steps {
                echo "✅ Deployment finished successfully"
            }
        }
    }
}