pipeline {
  agent any
  environment {
    CI = 'true'
  }
  stages {
    stage('Build') {
      steps {
        dir('orderprocessor') {
          sh 'npm install'
        }
      }
    }
    stage('Test') {
      steps {
        dir('orderprocessor') {
          sh 'npm run test:coverage'
        }
      }
    }
  }
}
