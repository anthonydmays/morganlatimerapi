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
      emailext attachLog: true, body: '$DEFAULT_CONTENT', mimeType: 'text/html', subject: '$DEFAULT_SUBJECT', to: '$DEFAULT_RECIPIENTS'
      junit 'junit_report.xml'
      publishHTML([allowMissing: false, alwaysLinkToLastBuild: false, keepAll: false, reportDir: 'coverage/', reportFiles: 'index.html', reportName: 'HTML Report', reportTitles: ''])
      step([$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
      cleanWs()
    }

  }
}
