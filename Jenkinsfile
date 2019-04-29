pipeline {
  agent any
  environment {
    CI = 'true'
  }
  stages {
    stage('Build') {
      dir('orderprocessor') {
        steps {
          sh 'npm install'
        }
      }
    }
    stage('Test') {
      dir('orderprocessor') {
        steps {
          sh 'npm run test'
        }
      }
    }
  }
}
