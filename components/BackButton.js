'use client';

export default function BackButton({ label = '뒤로가기', fallbackHref = '/' }) {
  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.href = fallbackHref;
  }

  return (
    <button type="button" className="btn ghost" onClick={goBack}>
      ← {label}
    </button>
  );
}
