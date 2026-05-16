'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import QRCode from 'qrcode';

const STORAGE_KEY = 'festival_admin_pin';

export default function QRPrintPage() {
  const [pin, setPin] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [origin, setOrigin] = useState('');
  const [codes, setCodes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setCodes([]);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved) setPin(saved);
  }, []);

  useEffect(() => {
    if (!pin) return;
    const base = window.location.origin;
    setOrigin(base);

    async function makeCodes() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/admin/tables', { headers: { 'x-staff-pin': pin }, cache: 'no-store' });
        const json = await res.json();
        if (res.status === 401) {
          logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
          return;
        }
        if (!res.ok) throw new Error(json.error || '테이블 정보를 불러오지 못했습니다.');
        const next = [];
        for (const table of json.tables || []) {
          const url = `${base}/order/${table.public_code}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 360, margin: 2 });
          next.push({ table: table.number, label: table.label, publicCode: table.public_code, url, dataUrl });
        }
        setCodes(next);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    makeCodes();
  }, [pin]);

  if (!pin) {
    return (
      <StaffLogin
        title="테이블 QR 출력"
        description="1~22번 테이블의 비공개 주문 QR을 출력하는 관리자 화면입니다."
        role="admin"
        storageKey={STORAGE_KEY}
        initialMessage={authMessage}
        onLogin={(nextPin) => { setAuthMessage(''); setPin(nextPin); }}
      />
    );
  }

  return (
    <main className="container">
      <div className="header no-print">
        <div>
          <h1>테이블 QR 출력</h1>
          <p>배포 주소 기준으로 1~22번 테이블 주문 QR을 생성합니다. QR 주소는 숫자가 아니라 비공개 코드로 구성됩니다.</p>
          <p className="small muted">현재 기준 주소: {origin}</p>
        </div>
        <div className="row">
          <BackButton fallbackHref="/admin" />
          <button className="btn primary" onClick={() => window.print()}>인쇄</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
          <a className="btn" href="/admin">관리자로 돌아가기</a>
        </div>
      </div>
      {error && <div className="notice error no-print">{error}</div>}
      {loading && <div className="notice info no-print">QR을 생성하는 중입니다.</div>}
      <div className="qr-grid qr-grid-v6">
        {codes.map((code) => (
          <section className="qr-card" key={code.table}>
            <h2>{code.table}번 테이블</h2>
            <img src={code.dataUrl} alt={`${code.table}번 테이블 QR`} />
            <p className="small">휴대폰 카메라로 스캔해 주문하세요.</p>
            <p className="small muted">QR 코드: {code.publicCode}</p>
            <p className="small muted qr-url-line">{code.url}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
