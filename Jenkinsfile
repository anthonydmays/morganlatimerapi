pipeline {
  agent any
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
    stage('Post-process') {
      steps {
        cobertura(coberturaReportFile: 'coverage/cobertura-coverage.xml')
      }
    }
  }
  environment {
    CI = 'true'
  }
  post {
    always {
      step([$class: 'CoberturaPublisher', coberturaReportFile: '**/cobertura-coverage.xml'])
      publishCoverage(adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')], sourceFileResolver: sourceFiles('NEVER_STORE'))
      cleanWs()

    }

  }
}