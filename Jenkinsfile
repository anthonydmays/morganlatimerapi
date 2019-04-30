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
  post {
      always {
          steps {
              [$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
              publishCoverage adapters: [coberturaAdapter('orderprocessor/coverage/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('NEVER_STORE')
          }
      }
  }
}
