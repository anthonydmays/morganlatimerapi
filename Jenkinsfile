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
      emailext body: "${DEFAULT_CONTENT}",
        recipientProviders: [[$class: 'DevelopersRecipientProvider'],
        [$class: 'RequesterRecipientProvider']],
        subject: "${DEFAULT_SUBJECT}"
      step([$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
      cleanWs()
    }

  }
}
