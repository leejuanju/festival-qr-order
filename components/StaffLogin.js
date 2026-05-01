'use client';

import { useEffect, useRef, useState } from 'react';

export default function StaffLogin({ title, description, role, storageKey, onLogin, initialMessage = '' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(initialMessage);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setError(initialMessage || '');
  }, [initialMessage]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(event) {
    event.preventDefault();
    const nextPin = pin.trim();
    if (!nextPin) {
      setError('PIN을 입력하세요.');
      inputRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, pin: nextPin })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'PIN 확인에 실패했습니다.');
      localStorage.setItem(storageKey, nextPin);
      onLogin(nextPin);
    } catch (err) {
      localStorage.removeItem(storageKey);
      setError(err.message || 'PIN이 올바르지 않습니다. 다시 입력하세요.');
      setPin('');
      setTimeout(() => inputRef.current?.focus(), 0);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="eyebrow">Festival QR Order</div>
        <h1>{title}</h1>
        <p>{description}</p>
        <form className="stack" onSubmit={submit}>
          <label>
            <span className="label">PIN</span>
            <input
              ref={inputRef}
              className="input auth-input"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="PIN 입력"
            />
          </label>
          {error && <div className="notice error" role="alert">{error}</div>}
          <button className="btn primary full btn-lg" disabled={submitting} type="submit">
            {submitting ? '확인 중...' : '입장'}
          </button>
          <p className="small muted" style={{ margin: 0 }}>
            틀린 PIN은 저장되지 않습니다. PIN을 바꾼 뒤에는 이 화면에서 다시 입력하면 됩니다.
          </p>
        </form>
      </section>
    </main>
  );
}
