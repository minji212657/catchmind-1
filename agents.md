# AGENTS.md — CatchTable Lifestyle POI (Codex rules)

## 기본 톤
- 모든 설명/주석/대화는 한국어로.
- 작업 시작 시: 목표 / 수정 파일 / 검증 방법(테스트 or 수동 시나리오)을 먼저 제시.

## PRD 불변 규칙(도메인)
- 다이닝(restaurant)이 "앵커". 문화·예술 POI는 앵커 주변 반경 기반으로 매핑.
- 반경은 최소 100m / 500m / 3km 지원.
- 기간형 콘텐츠(전시/팝업/공연): endDate 지난 경우 리스트/추천에서 자동 비노출.
- 딥링크로 상세 진입 시 "종료됨" 라벨 + 대체 추천 제공.
- 기본 CTA는 “지금 예약”보다 “이용 가능 여부 확인”을 우선.

## 데이터/스키마 최소 기준
- POI: id, name, category, address, lat, lng, openHours, closedDays, isFree/isPaid, endDate, reservable
- 타임슬롯형: sessions(time, capacity, status, price), entryMethod(QR|reservationCode)
- 예약 타입: Free Reservation(결제 없음) vs Ticketing(결제+발권) 구분.

## 분석 이벤트(이름 고정)
- view_dining_detail
- view_place_poi_module
- click_place_poi
- view_place_poi_detail
- place_poi_conversion
- external_app_exit
- session_start / session_end

## 작업 방식
- 작은 diff로 쪼개서 구현(한 번에 한 기능).
- 거리 필터/종료 비노출/이벤트 로깅은 최소 테스트로 누락 방지.

For every request:

1. Always refer to the documentation files stored under `/vooster-docs` (accessible via the relative paths below):
<vooster-docs>
- prd.md: ./vooster-docs/prd.md
- step-by-step.md: ./vooster-docs/step-by-step.md
- clean-code.md: ./vooster-docs/clean-code.md
</vooster-docs>

2. Use the relevant file(s) depending on the context of the request.
3. Never ignore these files. Consider them for:
    - Providing accurate information
    - Ensuring consistency
    - Following documented guidelines
    - Making decisions or generating content

