'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import { formatWon } from '@/lib/format';

const STORAGE_KEY = 'festival_admin_pin';
const emptyMenu = { name: '', description: '', category: '메뉴', price: 0, sort_order: 100, is_visible: true, is_sold_out: false };

function MenuEditor({ item, onSave, busy }) {
  const [draft, setDraft] = useState(() => ({
    name: item.name,
    description: item.description || '',
    category: item.category || '메뉴',
    price: item.price,
    sort_order: item.sort_order,
    is_visible: item.is_visible,
    is_sold_out: item.is_sold_out
  }));

  useEffect(() => {
    setDraft({
      name: item.name,
      description: item.description || '',
      category: item.category || '메뉴',
      price: item.price,
      sort_order: item.sort_order,
      is_visible: item.is_visible,
      is_sold_out: item.is_sold_out
    });
  }, [item]);

  return (
    <article className="card admin-menu-card">
      <div className="stack">
        <label>
          <span className="label">메뉴명</span>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <label>
          <span className="label">설명</span>
          <input className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        </label>
      </div>

      <div className="stack">
        <div className="mini-grid">
          <label>
            <span className="label">카테고리</span>
            <input className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          </label>
          <label>
            <span className="label">가격</span>
            <input className="input" type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
          </label>
          <label>
            <span className="label">순서</span>
            <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
          </label>
        </div>
        <div className="row">
          <button
            className={`btn ${draft.is_visible ? 'ok' : 'warn'}`}
            type="button"
            onClick={() => setDraft({ ...draft, is_visible: !draft.is_visible })}
          >
            {draft.is_visible ? '노출중' : '숨김'}
          </button>
          <button
            className={`btn ${draft.is_sold_out ? 'danger' : ''}`}
            type="button"
            onClick={() => setDraft({ ...draft, is_sold_out: !draft.is_sold_out })}
          >
            {draft.is_sold_out ? '품절' : '판매가능'}
          </button>
          <span className="muted small">현재 {formatWon(draft.price)}</span>
        </div>
      </div>

      <button className="btn primary btn-lg" disabled={busy} onClick={() => onSave(item.id, draft)}>
        저장
      </button>
    </article>
  );
}

function NewMenuForm({ onCreate, busy }) {
  const [draft, setDraft] = useState(emptyMenu);

  async function submit(event) {
    event.preventDefault();
    await onCreate(draft);
    setDraft(emptyMenu);
  }

  return (
    <form className="card admin-create-card" onSubmit={submit}>
      <div>
        <h3>새 메뉴 추가</h3>
        <p className="muted small">행사 중 메뉴 추가가 필요할 때 사용합니다.</p>
      </div>
      <div className="mini-grid create-grid">
        <label>
          <span className="label">메뉴명</span>
          <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="예: 컵닭강정" />
        </label>
        <label>
          <span className="label">가격</span>
          <input className="input" type="number" min="0" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} />
        </label>
        <label>
          <span className="label">카테고리</span>
          <input className="input" value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
        </label>
        <label>
          <span className="label">순서</span>
          <input className="input" type="number" value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: e.target.value })} />
        </label>
      </div>
      <label>
        <span className="label">설명</span>
        <input className="input" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="짧은 설명" />
      </label>
      <button className="btn primary btn-lg" disabled={busy} type="submit">메뉴 추가</button>
    </form>
  );
}

export default function AdminPage() {
  const [pin, setPin] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [settings, setSettings] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setSettings(null);
    setMenuItems([]);
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
      const [settingsJson, menuJson] = await Promise.all([
        api('/api/admin/settings'),
        api('/api/admin/menu')
      ]);
      setSettings(settingsJson.settings);
      setMenuItems(menuJson.menuItems || []);
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    }
  }

  useEffect(() => { load(); }, [pin]);

  async function saveSettings(patch) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const json = await api('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(patch)
      });
      setSettings(json.settings);
      setMessage('운영 설정을 저장했습니다.');
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function createMenu(patch) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api('/api/admin/menu', { method: 'POST', body: JSON.stringify(patch) });
      setMessage('메뉴를 추가했습니다.');
      await load();
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function patchMenu(id, patch) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api('/api/admin/menu', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...patch })
      });
      setMessage('메뉴를 저장했습니다.');
      await load();
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const visibleCount = useMemo(() => menuItems.filter((item) => item.is_visible).length, [menuItems]);
  const soldOutCount = useMemo(() => menuItems.filter((item) => item.is_sold_out).length, [menuItems]);
  const activeCount = useMemo(() => menuItems.filter((item) => item.is_visible && !item.is_sold_out).length, [menuItems]);

  if (!pin) {
    return (
      <StaffLogin
        title="관리자 화면"
        description="영업상태, 대기시간, 결제문구, 메뉴 노출·가격·품절을 관리합니다."
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
          <div className="eyebrow">Admin</div>
          <h1>관리자</h1>
          <p>행사 중 운영자가 가장 많이 쓰는 설정만 전면에 배치했습니다.</p>
        </div>
        <div className="row">
          <BackButton />
          <a className="btn" href="/admin/qr">QR 출력</a>
          <a className="btn" href="/hall">홀 화면</a>
          <a className="btn" href="/kitchen">주방 화면</a>
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </div>

      <section className="stat-grid">
        <div className={`stat-card ${settings?.is_open ? '' : 'urgent'}`}><span>주문 상태</span><strong>{settings?.is_open ? 'ON' : 'OFF'}</strong></div>
        <div className="stat-card"><span>대기시간</span><strong>{settings?.wait_time_minutes ?? '-'}분</strong></div>
        <div className="stat-card"><span>판매 가능</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>품절 메뉴</span><strong>{soldOutCount}</strong></div>
        <div className="stat-card wide"><span>노출 메뉴</span><strong>{visibleCount}</strong></div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {busy && <div className="notice info">저장 중입니다.</div>}

      {settings && (
        <section className="card stack" style={{ marginTop: 14 }}>
          <div className="row-between">
            <div>
              <h2>운영 설정</h2>
              <p className="muted small">주문 폭주 시에는 주문 접수를 OFF로 전환하세요.</p>
            </div>
            <div className="row">
              <button className={`btn ${settings.is_open ? 'ok' : ''}`} onClick={() => saveSettings({ is_open: true })}>주문 접수 ON</button>
              <button className={`btn ${!settings.is_open ? 'danger' : ''}`} onClick={() => saveSettings({ is_open: false })}>주문 접수 OFF</button>
            </div>
          </div>

          <div className="grid grid-2">
            <label>
              <span className="label">예상 대기시간</span>
              <input
                className="input"
                type="number"
                min="0"
                max="240"
                value={settings.wait_time_minutes}
                onChange={(e) => setSettings({ ...settings, wait_time_minutes: e.target.value })}
              />
            </label>
            <label>
              <span className="label">손님 화면 공지</span>
              <input
                className="input"
                value={settings.notice || ''}
                onChange={(e) => setSettings({ ...settings, notice: e.target.value })}
                placeholder="예: 현재 주문량이 많아 대기시간이 길어질 수 있습니다."
              />
            </label>
          </div>

          <label>
            <span className="label">결제 안내 문구</span>
            <textarea
              className="textarea"
              value={settings.payment_message}
              onChange={(e) => setSettings({ ...settings, payment_message: e.target.value })}
            />
          </label>

          <button className="btn primary btn-lg" disabled={busy} onClick={() => saveSettings({
            wait_time_minutes: Number(settings.wait_time_minutes),
            payment_message: settings.payment_message,
            notice: settings.notice
          })}>설정 저장</button>
        </section>
      )}

      <section className="grid" style={{ marginTop: 14 }}>
        <NewMenuForm onCreate={createMenu} busy={busy} />
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div>
            <h2>메뉴 관리</h2>
            <p className="muted small">행사 중에는 삭제보다 숨김 처리가 안전합니다. 품절과 숨김은 즉시 손님 화면에 반영됩니다.</p>
          </div>
        </div>
        <div className="grid" style={{ marginTop: 12 }}>
          {menuItems.map((item) => (
            <MenuEditor key={item.id} item={item} onSave={patchMenu} busy={busy} />
          ))}
        </div>
      </section>
    </main>
  );
}
