-- 업데이트: "자동매칭 대기열 삭제" 기능 추가를 위한 마이그레이션
-- Supabase 대시보드 > SQL Editor 에서 이 파일 내용을 그대로 붙여넣고 Run 하세요.
-- (queue_entries 테이블에 컬럼 하나만 추가하는 것이라 기존 데이터는 안전합니다.)

alter table queue_entries add column if not exists entry_token text;

-- 참고: 이 마이그레이션 이전에 등록된 대기열 항목은 entry_token이 비어있어서
-- 그 항목들은 삭제 메뉴가 보이지 않습니다. 새로 등록하는 항목부터 정상 작동합니다.
