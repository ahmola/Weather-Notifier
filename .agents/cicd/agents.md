# Agents.md for CI/CD Pipeline

Github Actions를 기본으로 하는 CI/CD 파이프라인을 만든다.

타겟 파일 `.github/workflow/deploy.yaml`와 `.github/workflow/deploy_dev.yaml`에 내용을 작성한다.

## Steps

1. Github Actions의 Cloud Runner 환경에서 실행되도록 작성한다.

2. 서비스의 테스트를 진행한다.

2-1. `compose.yaml`에 있는 서비스들을 순서대로 빌드하여 각 서비스들을 띄운다.

2-2. `postgresql`을 띄우고, 헬스체크 - 연결 테스트 - 테이블 및 계정 권한 생성 유무 확인

2-3. 각 서비스들을 띄우고, 헬스체크와 서비스별로 작성된 모듈 테스트를 진행한다.

2-4. 각 서비스들의 모듈 테스트와 DB 정상 작동 확인 완료되었다면, 각 서비스들과 DB를 연결한다.

2-5. 연결이 잘 되었는지 통합 테스트 진행

3. 컨테이너 배포를 진행한다.

3-1. 배포의 경우 `deploy.yaml`은 실제 클라우드 환경에서 배포하는 것을 가정하여 작성한다. Terraform을 사용하여 AWS ECS로 Fargate를 사용하여 서버리스로 배포한다고 가정한다.

3-2. `deploy_dev.yaml`은 dev용 내부 서버에 배포하는 환경으로 가정하여 작성한다. Github Actions Local Runner로 등록된 dev host에 배포한다고 가정한다.