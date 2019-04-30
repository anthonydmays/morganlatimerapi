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
          step([$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
          publishCoverage adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('NEVER_STORE')
      }
  }
}
