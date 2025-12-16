# CatchTable Lifestyle POI Web

React 18 + Vite 4 기반 모바일 웹 환경으로, 다이닝 앵커 주변 문화·예술 POI를 탐색할 수 있는 CatchTable Lifestyle 프로젝트의 기초 구조다.

## 프로젝트 개요

- **React + TypeScript + Vite 4**: 빠른 개발과 자동 번들링
- **폴더 구조**: `src/{components,pages,services,assets}`로 지도/POI 레이어 확장 대비
- **지도 연동 준비**: `MapClient` + Kakao Map SDK로 실지도 렌더링 및 카테고리별 마커/요약 팝업 제공
- **모바일 퍼스트 UI**: 기본적인 헤더/섹션/카드 컴포넌트, 반응형 상세뷰, 실시간 필터 오버레이

## 사용 방법

```bash
npm run mock:api # Mock API 서버 (별도 터미널)
npm install
npm run dev      # 개발 서버
npm run build    # 타입 검사 + 프로덕션 빌드
npm run lint     # ESLint 검사
npm run format   # Prettier 포맷
npm run typecheck
```

## 환경 변수

Kakao Map JS SDK 키를 `.env`에 설정해야 지도가 렌더링된다. 템플릿은 `.env.example`을 참고한다.

```bash
cp .env.example .env
# .env 파일을 열어 VITE_KAKAO_MAP_KEY 값을 입력
# API mock 서버 기본 포트는 http://localhost:4174
```

Mock API 서버(`npm run mock:api`)를 실행하면 `VITE_API_BASE_URL`에 맞춰 POI 데이터가 HTTP로 제공된다. API가 응답하지 않으면 클라이언트는 자동으로 정적 데이터로 대체한다.

## 폴더 구조

```
src/
  components/     # 레이아웃, 지도, POI UI 컴포넌트
  pages/          # 페이지 단위 뷰 (현재 HomePage)
  services/       # 지도/POI 도메인 서비스 레이어
  data/           # JSON 기반 문화·예술 POI 정적 데이터
  types/          # 도메인 스키마 (LifestylePoi 등)
```

`src/types/poi.schema.json`은 JSON Schema로 `src/data/poi.json` 필드 무결성을 정의한다.

## 품질 도구

- **ESLint + Prettier**: import 정렬 포함
- **Husky + lint-staged**: 커밋 전 Lint/Format 자동 실행
- **GitHub Actions**: `npm ci`, `npm run lint`, `npm run build` 파이프라인

## 다음 단계

- 지도 이벤트 로깅(view_dining_detail 등)과 사용자 상호작용 트래킹
- 데이터 소스 연동 및 거리/종료일 필터 로직 추가
- 지도 마커 커스텀/거리 반경 시각화 및 반응형 제스처 튜닝
