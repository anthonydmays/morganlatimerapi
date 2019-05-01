pipeline {
  agent any
  environment {
    CI = 'true'
  }
  stages {
    stage('Build') {
      steps {
        sh 'npm install'
      }
    }
    stage('Test') {
      steps {
        sh 'npm run test:coverage'
      }
    }
  }
  post {
    always {
      emailextrecipients([developers(), culprits(), requestor()])
      step([$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
      cleanWs()
    }

  }
}
