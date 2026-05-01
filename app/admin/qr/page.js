'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import QRCode from 'qrcode';

export default function QRPrintPage() {
  const [origin, setOrigin] = useState('');
  const [codes, setCodes] = useState([]);

  useEffect(() => {
    const base = window.location.origin;
    setOrigin(base);
    async function makeCodes() {
      const next = [];
      for (let n = 1; n <= 10; n += 1) {
        const url = `${base}/order/${n}`;
        const dataUrl = await QRCode.toDataURL(url, { width: 360, margin: 2 });
        next.push({ table: n, url, dataUrl });
      }
      setCodes(next);
    }
    makeCodes();
  }, []);

  return (
    <main className="container">
      <div className="header no-print">
        <div>
          <h1>테이블 QR 출력</h1>
          <p>배포 주소 기준으로 1~10번 테이블 주문 QR을 생성합니다.</p>
          <p className="small muted">현재 기준 주소: {origin}</p>
        </div>
        <div className="row">
          <BackButton fallbackHref="/admin" />
          <button className="btn primary" onClick={() => window.print()}>인쇄</button>
          <a className="btn" href="/admin">관리자로 돌아가기</a>
        </div>
      </div>
      <div className="qr-grid">
        {codes.map((code) => (
          <section className="qr-card" key={code.table}>
            <h2>{code.table}번 테이블</h2>
            <img src={code.dataUrl} alt={`${code.table}번 테이블 QR`} />
            <p className="small">휴대폰 카메라로 스캔해 주문하세요.</p>
            <p className="small muted">{code.url}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
