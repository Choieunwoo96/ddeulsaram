'use client';

// 관리자 페이지 전용 삭제 버튼. 어떤 항목을 지울지는 바깥에서 서버 액션을
// roomId/entryId로 미리 bind해서 action prop으로 넘겨준다.
export default function AdminDeleteButton({
  action,
  confirmText = '삭제할까요?',
}: {
  action: (formData: FormData) => void | Promise<void>;
  confirmText?: string;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(confirmText)) {
            e.preventDefault();
          }
        }}
        className="text-xs px-2.5 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 whitespace-nowrap"
      >
        삭제
      </button>
    </form>
  );
}
