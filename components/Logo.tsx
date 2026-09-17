// 뜰사람 로고 — 별도 이미지 파일 없이 인라인 SVG로 그린 심볼.
// 서로 맞닿은 두 개의 글러브(주먹 인사/friendly battle)를 원 배지 안에 넣은 마크.
// variant="dark"(기본)는 밝은 배경(헤더 등)에서, variant="light"는 어두운/색 배경(배너 등)에서 사용.
export default function Logo({
  className = 'w-8 h-8',
  variant = 'dark',
}: {
  className?: string;
  variant?: 'dark' | 'light';
}) {
  const ring = variant === 'light' ? '#ffffff' : '#4f46e5';
  const bg = variant === 'light' ? 'rgba(255,255,255,0.15)' : '#eef2ff';
  const glove = variant === 'light' ? '#ffffff' : '#4f46e5';

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill={bg} stroke={ring} strokeWidth="2" />

      {/* 왼쪽 글러브 */}
      <g fill={glove}>
        <rect x="4" y="21" width="9" height="8" rx="3" />
        <rect x="7" y="16" width="17" height="17" rx="8" />
        <circle cx="14" cy="15" r="4.2" />
      </g>

      {/* 오른쪽 글러브 (왼쪽을 좌우 반전) */}
      <g fill={glove} transform="scale(-1,1) translate(-48,0)">
        <rect x="4" y="21" width="9" height="8" rx="3" />
        <rect x="7" y="16" width="17" height="17" rx="8" />
        <circle cx="14" cy="15" r="4.2" />
      </g>

      {/* 맞닿는 지점의 "펑" 하는 임팩트 표시 */}
      <g stroke={ring} strokeWidth="1.6" strokeLinecap="round">
        <line x1="24" y1="10" x2="24" y2="14" />
        <line x1="18" y1="12" x2="20.5" y2="15" />
        <line x1="30" y1="12" x2="27.5" y2="15" />
      </g>
    </svg>
  );
}
