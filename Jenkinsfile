pipeline {
    agent any

    environment {
        DEPLOY_DIR = "/home/ubuntu/seta-ml-api"
    }

    stages {
        stage('Deploy to EC2') {
            steps {
                echo "Deploying latest code to EC2"
                script {
                    sh '''
                        # GitLab에서 체크아웃된 파일들을 실제 배포 디렉터리로 복사
                        cp -r ${WORKSPACE}/Data/* ${DEPLOY_DIR}/
                        
                        # 배포 디렉터리에서 Docker 재빌드
                        cd ${DEPLOY_DIR}
                        docker-compose down
                        docker-compose up -d --build
                    '''
                }
            }
        }
        
        stage('Deployment Complete') {
            steps {
                echo "Deployment finished successfully"
            }
        }
    }
}