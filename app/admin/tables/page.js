'use client';

import { useEffect, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';

const STORAGE_KEY = 'festival_admin_pin';

export default function AdminTablesPage() {
  const [pin, setPin] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [tables, setTables] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setTables([]);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved) setPin(saved);
  }, []);

  async function api(path, options = {}) {
    const res = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-staff-pin': pin,
        ...(options.headers || {})
      },
      cache: 'no-store'
    });
    const json = await res.json();
    if (res.status === 401) {
      logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
      throw new Error('PIN이 올바르지 않습니다.');
    }
    if (!res.ok) throw new Error(json.error || '요청 처리에 실패했습니다.');
    return json;
  }

  async function load() {
    if (!pin) return;
    setError('');
    try {
      const json = await api('/api/admin/tables');
      setTables(json.tables || []);
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    }
  }

  useEffect(() => { load(); }, [pin]);

  async function saveTable(number, patch) {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const json = await api('/api/admin/tables', {
        method: 'PATCH',
        body: JSON.stringify({ number, ...patch })
      });
      setTables((prev) => prev.map((item) => item.number === number ? json.table : item));
      setMessage(`${number}번 테이블 이미지를 저장했습니다.`);
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function setLocalTable(number, value) {
    setTables((prev) => prev.map((item) => item.number === number ? { ...item, hero_image_url: value } : item));
  }

  function fillDefaultPaths() {
    setTables((prev) => prev.map((item) => ({ ...item, hero_image_url: `/assets/bear_${item.number}_transparent.png` })));
  }

  async function saveAllDefaultPaths() {
    if (!window.confirm('1~22번 테이블 이미지를 /assets/bear_번호_transparent.png 경로로 일괄 저장할까요?')) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      for (const table of tables) {
        await api('/api/admin/tables', {
          method: 'PATCH',
          body: JSON.stringify({ number: table.number, hero_image_url: `/assets/bear_${table.number}_transparent.png` })
        });
      }
      setMessage('모든 테이블 이미지 경로를 저장했습니다.');
      await load();
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!pin) {
    return (
      <StaffLogin
        title="테이블 이미지 관리"
        description="각 테이블 메뉴판 상단에 들어가는 곰 이미지를 관리합니다."
        role="admin"
        storageKey={STORAGE_KEY}
        initialMessage={authMessage}
        onLogin={(nextPin) => { setAuthMessage(''); setPin(nextPin); }}
      />
    );
  }

  return (
    <main className="container admin-container">
      <div className="topbar">
        <div>
          <div className="eyebrow">Table Images</div>
          <h1>테이블 이미지 관리</h1>
          <p>각 테이블 주문 화면 상단에 들어가는 이미지를 별도로 관리합니다. 22번 이미지가 안 뜨면 파일명과 DB 경로를 먼저 확인하세요.</p>
        </div>
        <div className="row">
          <BackButton />
          <a className="btn" href="/admin">관리자</a>
          <a className="btn" href="/admin/qr">QR 출력</a>
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </div>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {busy && <div className="notice info">저장 중입니다.</div>}

      <section className="card stack">
        <div className="row-between">
          <div>
            <h2>일괄 경로 설정</h2>
            <p className="muted small">public/assets 안에 bear_1_transparent.png ~ bear_22_transparent.png가 있을 때 사용합니다.</p>
          </div>
          <div className="row">
            <button className="btn" onClick={fillDefaultPaths}>화면에 기본 경로 채우기</button>
            <button className="btn primary" disabled={busy} onClick={saveAllDefaultPaths}>기본 경로 일괄 저장</button>
          </div>
        </div>
        <div className="notice info">
          22번 이미지가 안 뜨면 <strong>public/assets/bear_22_transparent.png</strong> 파일이 실제로 있는지, 아래 22번 카드의 URL이 <strong>/assets/bear_22_transparent.png</strong>인지 확인하세요.
        </div>
      </section>

      <section className="table-image-grid admin-table-page-grid" style={{ marginTop: 14 }}>
        {tables.map((table) => (
          <article className="table-image-card" key={table.number}>
            <div className="row-between">
              <strong>{table.number}번 테이블</strong>
              <span className="badge dark">{table.public_code}</span>
            </div>
            {table.hero_image_url ? <img className="table-image-preview compact" src={table.hero_image_url} alt={`${table.number}번 테이블 이미지`} /> : <div className="table-image-empty">이미지 없음</div>}
            <input
              className="input"
              value={table.hero_image_url || ''}
              onChange={(e) => setLocalTable(table.number, e.target.value)}
              placeholder={`/assets/bear_${table.number}_transparent.png`}
            />
            <div className="row">
              <button className="btn primary full" disabled={busy} onClick={() => saveTable(table.number, { hero_image_url: table.hero_image_url || '' })}>저장</button>
              <a className="btn" href={`/order/${table.public_code || table.number}`} target="_blank" rel="noreferrer">보기</a>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
