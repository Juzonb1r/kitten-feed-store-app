pipeline {
  agent any

  environment {
    DOCKERHUB_USER = "juzonb1r"
    FE_IMAGE = "docker.io/${DOCKERHUB_USER}/kitten-frontend"
    BE_IMAGE = "docker.io/${DOCKERHUB_USER}/kitten-backend"

    GITOPS_REPO = "git@github.com:Juzonb1r/kitten-feed-store-gitops.git"
    GITOPS_BRANCH = "main"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("DockerHub Login") {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh '''
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
          '''
        }
      }
    }

    stage("Build & Push Images") {
      steps {
        script {
          def tag = sh(returnStdout: true, script: "git rev-parse --short HEAD").trim()
          env.IMAGE_TAG = tag

          sh """
            docker build -t ${BE_IMAGE}:${IMAGE_TAG} ./backend
            docker push ${BE_IMAGE}:${IMAGE_TAG}

            docker build -t ${FE_IMAGE}:${IMAGE_TAG} ./frontend
            docker push ${FE_IMAGE}:${IMAGE_TAG}
          """
        }
      }
    }

    stage("Update GitOps Repo") {
      steps {
        sshagent(credentials: ['gitops-ssh-key']) {
          sh """
            rm -rf gitops
            git clone ${GITOPS_REPO} gitops
            cd gitops

            sed -i "s/newTag: .*/newTag: ${IMAGE_TAG}/g" apps/base/kustomization.yaml

            git config user.email "jenkins@local"
            git config user.name "jenkins"

            git add .
            git commit -m "deploy: ${IMAGE_TAG}" || true
            git push origin ${GITOPS_BRANCH}
          """
        }
      }
    }
  }
}
