// 뜰사람 로고 — 별도 이미지 파일 없이 인라인 SVG로 그린 심볼.
// "마주보는 두 칼(배틀·대결)"을 단순한 원 배지 안에 넣은 추상 마크.
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
  const blade = variant === 'light' ? '#ffffff' : '#4f46e5';

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="24" cy="24" r="22" fill={bg} stroke={ring} strokeWidth="2" />
      <g stroke={blade} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 14 L28 28" />
        <path d="M14 14 L14 19" />
        <path d="M14 14 L19 14" />
        <path d="M34 34 L20 20" />
        <path d="M34 34 L34 29" />
        <path d="M34 34 L29 34" />
      </g>
      <circle cx="24" cy="24" r="2.2" fill={blade} />
    </svg>
  );
}
