// 사이트 전역에서 쓰는 기본 정보 (SEO 메타데이터, sitemap, robots.txt 등에서 사용).
// NEXT_PUBLIC_SITE_URL 환경변수로 실제 배포 주소를 지정하는 걸 강력히 권장한다.
// (지정 안 하면 아래 기본값을 쓰는데, 나중에 커스텀 도메인을 연결하면 반드시
// 환경변수로 실제 도메인을 넣어줘야 사이트맵/구조화 데이터가 정확해진다.)
const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://ddeulsaram96.vercel.app';

export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');
export const SITE_NAME = '뜰사람';
export const SITE_DESCRIPTION =
  '온라인 게임부터 오락실, 오프라인 액티비티까지 — 배틀 상대를 구하는 매칭 플랫폼. 방을 만들어 상대를 모집하거나, 조건을 등록해두면 자동으로 매칭됩니다.';
export const CONTACT_EMAIL = 'pliviskr@gmail.com';
