pipeline {
  agent any

  environment {
    DOCKERHUB_USER = "REPLACE_ME"
    FE_IMAGE = "docker.io/${DOCKERHUB_USER}/kitten-frontend"
    BE_IMAGE = "docker.io/${DOCKERHUB_USER}/kitten-backend"

    GITOPS_REPO = "git@github.com:Juzonb1r/kitten-feed-store-gitops.git"
    GITOPS_BRANCH = "main"
  }

  stages {
    stage("Checkout") {
      steps { checkout scm }
    }

    stage("Docker Hub Login") {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DH_USER', passwordVariable: 'DH_PASS')]) {
          sh """
            echo "$DH_PASS" | docker login -u "$DH_USER" --password-stdin
          """
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

            # frontend calls backend via /api (same domain via ingress later)
            docker build -t ${FE_IMAGE}:${IMAGE_TAG} --build-arg VITE_API_BASE= ./frontend
            docker push ${FE_IMAGE}:${IMAGE_TAG}
          """
        }
      }
    }

    stage("Update GitOps Repo") {
      steps {
        sshagent(credentials: ['gitops-ssh-key']) {
          sh """
            rm -rf gitops && git clone -b ${GITOPS_BRANCH} ${GITOPS_REPO} gitops
            cd gitops

            # Update DockerHub username (first time) + tag (every time)
            sed -i.bak "s|docker.io/REPLACE_DOCKERHUB_USER/kitten-backend|${BE_IMAGE}|g" apps/base/kustomization.yaml
            sed -i.bak "s|docker.io/REPLACE_DOCKERHUB_USER/kitten-frontend|${FE_IMAGE}|g" apps/base/kustomization.yaml

            # Update tags (replace both occurrences)
            perl -0777 -i -pe 's/newTag: (latest|[0-9a-f]{7,})/newTag: ${IMAGE_TAG}/g' apps/base/kustomization.yaml

            git config user.email "jenkins@local"
            git config user.name "jenkins"

            git add apps/base/kustomization.yaml
            git commit -m "deploy: set images to ${IMAGE_TAG}" || true
            git push origin ${GITOPS_BRANCH}
          """
        }
      }
    }
  }
}
