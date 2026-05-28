'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import { formatWon } from '@/lib/format';
import { serveComponentsToText } from '@/lib/serviceItems';

const STORAGE_KEY = 'festival_admin_pin';
const emptyMenu = { name: '', description: '', category: '메인', price: 0, image_url: '', sort_order: 100, is_visible: true, is_sold_out: false, serve_components_text: '' };

const waitStatusLabels = {
  waiting: '대기중',
  called: '호출됨',
  seated: '입장완료',
  cancelled: '취소'
};


function MenuEditor({ item, onSave, busy }) {
  const [draft, setDraft] = useState(() => ({
    name: item.name,
    description: item.description || '',
    category: item.category || '메뉴',
    price: item.price,
    sort_order: item.sort_order,
    image_url: item.image_url || '',
    is_visible: item.is_visible,
    is_sold_out: item.is_sold_out,
    serve_components_text: serveComponentsToText(item.serve_components)
  }));

  useEffect(() => {
    setDraft({
      name: item.name,
      description: item.description || '',
      category: item.category || '메뉴',
      price: item.price,
      sort_order: item.sort_order,
      image_url: item.image_url || '',
      is_visible: item.is_visible,
      is_sold_out: item.is_sold_out,
      serve_components_text: serveComponentsToText(item.serve_components)
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
        <label>
          <span className="label">이미지 URL</span>
          <input className="input" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." />
        </label>
        {draft.image_url && <img className="admin-menu-thumb" src={draft.image_url} alt="메뉴 이미지 미리보기" />}
        <label>
          <span className="label">제공 체크 구성</span>
          <textarea
            className="textarea compact"
            value={draft.serve_components_text}
            onChange={(e) => setDraft({ ...draft, serve_components_text: e.target.value })}
            placeholder={"세트일 때만 입력. 예:\n닭꼬치|2\n염통꼬치|3\n하이볼|2"}
          />
          <span className="small muted">한 줄에 하나씩 <strong>이름|수량</strong> 형식입니다. 비워두면 메뉴명 1개 단위로 제공 체크됩니다.</span>
        </label>
      </div>

      <div className="stack">
        <div className="mini-grid">
          <label>
            <span className="label">카테고리</span>
            <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
              <option value="메인">메인</option>
              <option value="세트">세트</option>
              <option value="음료">음료</option>
            </select>
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
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
            <option value="메인">메인</option>
            <option value="세트">세트</option>
            <option value="음료">음료</option>
          </select>
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
      <label>
        <span className="label">이미지 URL</span>
        <input className="input" value={draft.image_url} onChange={(e) => setDraft({ ...draft, image_url: e.target.value })} placeholder="https://..." />
      </label>
      <label>
        <span className="label">제공 체크 구성</span>
        <textarea
          className="textarea compact"
          value={draft.serve_components_text}
          onChange={(e) => setDraft({ ...draft, serve_components_text: e.target.value })}
          placeholder={"세트일 때만 입력. 예:\n어묵탕|1\n닭꼬치|2\n소주/맥주|1"}
        />
        <span className="small muted">세트 추가 시 구성품을 입력하면 주방/홀에서 각각 제공 체크할 수 있습니다.</span>
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
  const [sales, setSales] = useState({ paidAmount: 0, paidCount: 0, totalAmount: 0, unpaidAmount: 0 });
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [waitlistSummary, setWaitlistSummary] = useState({ waiting: 0, called: 0, active: 0 });
  const [waitlistDraft, setWaitlistDraft] = useState({ name: '', party_size: 2, memo: '' });
  const [includeDoneWaitlist, setIncludeDoneWaitlist] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setSettings(null);
    setMenuItems([]);
    setSales({ paidAmount: 0, paidCount: 0, totalAmount: 0, unpaidAmount: 0 });
    setWaitlistEntries([]);
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
      const [settingsJson, menuJson, waitlistJson, salesJson] = await Promise.all([
        api('/api/admin/settings'),
        api('/api/admin/menu'),
        api(`/api/admin/waitlist?includeDone=${includeDoneWaitlist ? 'true' : 'false'}`),
        api('/api/admin/sales')
      ]);
      setSettings(settingsJson.settings);
      setMenuItems(menuJson.menuItems || []);
      setWaitlistEntries(waitlistJson.entries || []);
      setWaitlistSummary(waitlistJson.summary || { waiting: 0, called: 0, active: 0 });
      setSales(salesJson.sales || { paidAmount: 0, paidCount: 0, totalAmount: 0, unpaidAmount: 0 });
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    }
  }

  useEffect(() => { load(); }, [pin, includeDoneWaitlist]);

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

  async function createWaitlistEntry(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const json = await api('/api/admin/waitlist', { method: 'POST', body: JSON.stringify(waitlistDraft) });
      setWaitlistDraft({ name: '', party_size: 2, memo: '' });
      setMessage(`대기번호 ${json.entry.queue_no}번을 발급했습니다.`);
      await load();
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function patchWaitlistEntry(id, patch) {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api('/api/admin/waitlist', { method: 'PATCH', body: JSON.stringify({ id, ...patch }) });
      setMessage('대기열 상태를 변경했습니다.');
      await load();
    } catch (err) {
      if (err.message !== 'PIN이 올바르지 않습니다.') setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function clearDoneWaitlist() {
    if (!confirm('입장완료/취소된 대기 기록을 정리할까요?')) return;
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api('/api/admin/waitlist?mode=done', { method: 'DELETE' });
      setMessage('완료된 대기 기록을 정리했습니다.');
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
      <section
        className="admin-hero"
        style={settings?.admin_hero_image_url ? { backgroundImage: `linear-gradient(90deg, rgba(15,23,42,.88), rgba(15,23,42,.56)), url(${settings.admin_hero_image_url})` } : undefined}
      >
        <div>
          <div className="eyebrow hero-eyebrow">Admin</div>
          <h1>{settings?.admin_hero_title || '관리자'}</h1>
          <p>{settings?.admin_hero_subtitle || '메뉴, 품절, 대기열, 운영 상태를 한곳에서 관리합니다.'}</p>
        </div>
        <div className="row admin-hero-actions">
          <BackButton />
          <a className="btn" href="/admin/qr">QR 출력</a>
          <a className="btn" href="/admin/tables">테이블 이미지</a>
          <a className="btn" href="/waitlist" target="_blank" rel="noreferrer">손님 대기화면</a>
          <a className="btn" href="/hall">홀 화면</a>
          <a className="btn" href="/kitchen">주방 화면</a>
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </section>

      <section className="stat-grid admin-stat-grid compact-3">
        <div className={`stat-card ${settings?.is_open ? '' : 'urgent'}`}><span>주문 상태</span><strong>{settings?.is_open ? 'ON' : 'OFF'}</strong></div>
        <div className="stat-card"><span>대기시간</span><strong>{settings?.wait_time_minutes ?? '-'}분</strong></div>
        <div className="stat-card paid"><span>팔린 총액</span><strong>{formatWon(sales.paidAmount || 0)}</strong></div>
        <div className="stat-card"><span>판매 가능</span><strong>{activeCount}</strong></div>
        <div className="stat-card"><span>품절 메뉴</span><strong>{soldOutCount}</strong></div>
        <div className="stat-card"><span>대기중</span><strong>{waitlistSummary.active || 0}</strong></div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {busy && <div className="notice info">저장 중입니다.</div>}

      <section className="card stack" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div>
            <h2>대기열 번호표</h2>
            <p className="muted small">테이블이 없어 기다리는 손님에게 번호를 발급하고 호출/입장완료를 관리합니다.</p>
          </div>
          <div className="row">
            <a className="btn" href="/waitlist" target="_blank" rel="noreferrer">손님 화면 열기</a>
            <button className="btn" onClick={() => setIncludeDoneWaitlist(!includeDoneWaitlist)}>
              {includeDoneWaitlist ? '완료 숨기기' : '완료 포함'}
            </button>
            <button className="btn ghost" onClick={clearDoneWaitlist}>완료 정리</button>
          </div>
        </div>

        <form className="waitlist-form" onSubmit={createWaitlistEntry}>
          <label>
            <span className="label">이름/호출명</span>
            <input className="input" value={waitlistDraft.name} onChange={(e) => setWaitlistDraft({ ...waitlistDraft, name: e.target.value })} placeholder="예: 홍길동 / 전화 뒷자리 1234" />
          </label>
          <label>
            <span className="label">인원</span>
            <input className="input" type="number" min="1" max="50" value={waitlistDraft.party_size} onChange={(e) => setWaitlistDraft({ ...waitlistDraft, party_size: e.target.value })} />
          </label>
          <label>
            <span className="label">메모</span>
            <input className="input" value={waitlistDraft.memo} onChange={(e) => setWaitlistDraft({ ...waitlistDraft, memo: e.target.value })} placeholder="예: 4인 테이블 희망" />
          </label>
          <button className="btn primary btn-lg" type="submit" disabled={busy}>번호 발급</button>
        </form>

        <div className="waitlist-list">
          {waitlistEntries.length === 0 && <div className="notice info">현재 표시할 대기자가 없습니다.</div>}
          {waitlistEntries.map((entry) => (
            <article className={`waitlist-card ${entry.status}`} key={entry.id}>
              <div>
                <div className="queue-no">{entry.queue_no}번</div>
                <div className="muted small">{entry.name || '이름 없음'} · {entry.party_size}명</div>
                {entry.memo && <div className="small" style={{ marginTop: 5 }}>{entry.memo}</div>}
              </div>
              <div className="row">
                <span className={`badge ${entry.status}`}>{waitStatusLabels[entry.status] || entry.status}</span>
                {entry.status === 'waiting' && <button className="btn blue" onClick={() => patchWaitlistEntry(entry.id, { status: 'called' })}>호출</button>}
                {(entry.status === 'waiting' || entry.status === 'called') && <button className="btn ok" onClick={() => patchWaitlistEntry(entry.id, { status: 'seated' })}>입장완료</button>}
                {(entry.status === 'waiting' || entry.status === 'called') && <button className="btn danger" onClick={() => patchWaitlistEntry(entry.id, { status: 'cancelled' })}>취소</button>}
              </div>
            </article>
          ))}
        </div>
      </section>

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

          <div className="grid grid-2">
            <label>
              <span className="label">손님 메뉴판 상단 제목</span>
              <input className="input" value={settings.guest_hero_title || ''} onChange={(e) => setSettings({ ...settings, guest_hero_title: e.target.value })} />
            </label>
            <label>
              <span className="label">관리자 상단 제목</span>
              <input className="input" value={settings.admin_hero_title || ''} onChange={(e) => setSettings({ ...settings, admin_hero_title: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-2">
            <label>
              <span className="label">손님 메뉴판 상단 설명</span>
              <input className="input" value={settings.guest_hero_subtitle || ''} onChange={(e) => setSettings({ ...settings, guest_hero_subtitle: e.target.value })} />
            </label>
            <label>
              <span className="label">관리자 상단 설명</span>
              <input className="input" value={settings.admin_hero_subtitle || ''} onChange={(e) => setSettings({ ...settings, admin_hero_subtitle: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-2">
            <label>
              <span className="label">손님 메뉴판 배경 이미지 URL</span>
              <input className="input" value={settings.guest_hero_image_url || ''} onChange={(e) => setSettings({ ...settings, guest_hero_image_url: e.target.value })} placeholder="https://..." />
            </label>
            <label>
              <span className="label">손님 메뉴판 기본 캐릭터 이미지 URL</span>
              <input className="input" value={settings.guest_character_image_url || ''} onChange={(e) => setSettings({ ...settings, guest_character_image_url: e.target.value })} placeholder="테이블별 이미지가 없을 때 사용" />
            </label>
          </div>
          <div className="grid grid-2">
            <label>
              <span className="label">주문완료 이미지 URL</span>
              <input className="input" value={settings.order_success_image_url || ''} onChange={(e) => setSettings({ ...settings, order_success_image_url: e.target.value })} placeholder="/assets/bear-order-complete.png" />
            </label>
            <label>
              <span className="label">관리자 상단 이미지 URL</span>
              <input className="input" value={settings.admin_hero_image_url || ''} onChange={(e) => setSettings({ ...settings, admin_hero_image_url: e.target.value })} placeholder="https://..." />
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
            notice: settings.notice,
            guest_hero_image_url: settings.guest_hero_image_url,
            admin_hero_image_url: settings.admin_hero_image_url,
            guest_character_image_url: settings.guest_character_image_url,
            order_success_image_url: settings.order_success_image_url,
            guest_hero_title: settings.guest_hero_title,
            guest_hero_subtitle: settings.guest_hero_subtitle,
            admin_hero_title: settings.admin_hero_title,
            admin_hero_subtitle: settings.admin_hero_subtitle
          })}>설정 저장</button>
        </section>
      )}

      <section className="notice info admin-table-link-notice" style={{ marginTop: 14 }}>
        테이블별 상단 이미지는 별도 화면에서 관리합니다. <a href="/admin/tables"><strong>테이블 이미지 관리로 이동</strong></a>
      </section>

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
