'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import StatusBadge from '@/components/StatusBadge';
import { ageMinutes, formatShortTime, formatWon, kitchenLabels, paymentLabels } from '@/lib/format';

const STORAGE_KEY = 'festival_admin_pin';
const filters = [
  { key: 'all', label: '전체' },
  { key: 'unpaid', label: '미결제' },
  { key: 'ready', label: '준비완료' },
  { key: 'clearable', label: '비우기 가능' }
];

function emptyStats() {
  return { openTables: 0, unpaidOrders: 0, unservedOrders: 0, readyOrders: 0, liveAmount: 0, unpaidAmount: 0, paidAmount: 0 };
}

export default function HallPage() {
  const [pin, setPin] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [tables, setTables] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const [filter, setFilter] = useState('all');

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setSessions([]);
    setTables([]);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved) setPin(saved);
  }, []);

  async function load() {
    if (!pin) return;
    setError('');
    try {
      const res = await fetch('/api/hall', { headers: { 'x-staff-pin': pin }, cache: 'no-store' });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했습니다.');
      setSessions(json.sessions || []);
      setTables(json.tables || []);
      setLastLoadedAt(new Date());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    if (!pin) return undefined;
    const timer = setInterval(() => setTick((value) => value + 1), 2000);
    return () => clearInterval(timer);
  }, [pin]);

  useEffect(() => { load(); }, [tick]);

  async function patchOrder(id, body, successMessage = '') {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': pin },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '처리에 실패했습니다.');
      if (successMessage) setMessage(successMessage);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function markSessionPaid(session) {
    if (!session?.id || session.unpaidCount === 0) return;
    const ok = window.confirm(`${session.table_number}번 테이블의 미결제 ${session.unpaidCount}건, ${formatWon(session.unpaidAmount)}을 한 번에 결제확인 처리할까요?`);
    if (!ok) return;

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/sessions/${session.id}/payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': pin },
        body: JSON.stringify({ action: 'mark_unpaid_paid' })
      });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '묶음 결제확인에 실패했습니다.');
      setMessage(`${session.table_number}번 테이블 미결제 ${json.updatedCount}건, ${formatWon(json.paidAmount)}을 결제확인 처리했습니다.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function clearTable(tableNumber, force = false) {
    const confirmMessage = force
      ? `${tableNumber}번 테이블을 강제로 비우겠습니까? 미결제/미제공 주문이 있어도 현재 화면에서 숨겨집니다.`
      : `${tableNumber}번 테이블의 현재 손님 세션을 종료하겠습니까?`;
    if (!window.confirm(confirmMessage)) return;

    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/tables/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': pin },
        body: JSON.stringify({ tableNumber, force })
      });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) {
        if (json.message === 'not_clearable') {
          throw new Error(`미결제 또는 미제공 주문이 ${json.blockers}건 남아 있습니다. 필요하면 강제비우기를 사용하세요.`);
        }
        throw new Error(json.error || json.message || '테이블 비우기에 실패했습니다.');
      }
      setMessage(`${tableNumber}번 테이블을 비웠습니다. 다음 손님은 새 세션으로 주문합니다.`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const tableSummary = useMemo(() => {
    const map = new Map();
    for (const session of sessions) map.set(session.table_number, session);
    return tables.map((table) => {
      const session = map.get(table.number) || null;
      const className = session
        ? session.clearable ? 'clearable' : 'warn'
        : '';
      return { ...table, session, className };
    });
  }, [tables, sessions]);

  const stats = useMemo(() => {
    if (!sessions.length) return emptyStats();
    return sessions.reduce((acc, session) => {
      acc.openTables += 1;
      acc.unpaidOrders += session.unpaidCount || 0;
      acc.unservedOrders += session.unservedCount || 0;
      acc.readyOrders += session.orders.filter((order) => order.kitchen_status === 'ready').length;
      acc.liveAmount += Number(session.totalAmount || 0);
      acc.unpaidAmount += Number(session.unpaidAmount || 0);
      acc.paidAmount += Number(session.paidAmount || 0);
      return acc;
    }, emptyStats());
  }, [sessions]);

  const visibleSessions = useMemo(() => {
    if (filter === 'all') return sessions;
    return sessions
      .map((session) => {
        if (filter === 'clearable') return session.clearable ? session : null;
        const orders = session.orders.filter((order) => {
          if (filter === 'unpaid') return order.payment_status === 'unpaid';
          if (filter === 'ready') return order.kitchen_status === 'ready';
          return true;
        });
        if (orders.length === 0) return null;
        return { ...session, orders };
      })
      .filter(Boolean);
  }, [filter, sessions]);

  if (!pin) {
    return (
      <StaffLogin
        title="홀 / 결제확인"
        description="결제 확인, 주문 취소, 테이블 비우기를 처리하는 화면입니다. 틀린 PIN은 저장되지 않습니다."
        role="admin"
        storageKey={STORAGE_KEY}
        initialMessage={authMessage}
        onLogin={(nextPin) => { setAuthMessage(''); setPin(nextPin); }}
      />
    );
  }

  return (
    <main className="container">
      <div className="topbar">
        <div>
          <div className="eyebrow">Hall Control</div>
          <h1>홀 / 결제확인</h1>
          <p>주문은 결제 전에도 주방에 표시됩니다. 홀은 결제상태와 테이블 종료를 관리합니다.</p>
          <p className="small muted">마지막 갱신: {lastLoadedAt ? formatShortTime(lastLoadedAt) : '-'}</p>
        </div>
        <div className="row">
          <BackButton />
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </div>

      <section className="stat-grid">
        <div className="stat-card"><span>이용중 테이블</span><strong>{stats.openTables}</strong></div>
        <div className="stat-card urgent"><span>미결제 주문</span><strong>{stats.unpaidOrders}</strong></div>
        <div className="stat-card urgent"><span>남은 결제금액</span><strong>{formatWon(stats.unpaidAmount)}</strong></div>
        <div className="stat-card"><span>미제공 주문</span><strong>{stats.unservedOrders}</strong></div>
        <div className="stat-card"><span>준비완료</span><strong>{stats.readyOrders}</strong></div>
        <div className="stat-card wide"><span>열린 세션 총액</span><strong>{formatWon(stats.liveAmount)}</strong></div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {loading && <div className="notice info">처리 중입니다.</div>}

      <section className="card" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div>
            <h2>테이블 상태판</h2>
            <p className="muted small">미결제 0 · 미제공 0이면 테이블 비우기가 가능합니다. 새 손님 착석 전 반드시 비우기를 누르세요.</p>
          </div>
        </div>
        <div className="table-list" style={{ marginTop: 12 }}>
          {tableSummary.map((table) => (
            <div className={`table-pill ${table.session ? 'occupied' : ''} ${table.className}`} key={table.number}>
              <strong>{table.number}번</strong>
              {table.session ? (
                <>
                  <div className="small">S{String(table.session.session_no).padStart(3, '0')} 이용중</div>
                  <div className="small muted">미결제 {table.session.unpaidCount}건 · {formatWon(table.session.unpaidAmount)}</div>
                  <div className="small muted">미제공 {table.session.unservedCount}건</div>
                  {table.session.clearable ? (
                    <button className="btn ok full" style={{ marginTop: 8 }} onClick={() => clearTable(table.number)}>비우기</button>
                  ) : table.session.unpaidCount > 0 ? (
                    <button className="btn ok full" style={{ marginTop: 8 }} onClick={() => markSessionPaid(table.session)}>미결제 전체확인</button>
                  ) : (
                    <div className="tiny muted" style={{ marginTop: 8 }}>처리 필요</div>
                  )}
                </>
              ) : (
                <div className="small muted">비어있음</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="toolbar-card">
        <div className="segmented" role="tablist" aria-label="주문 필터">
          {filters.map((item) => (
            <button key={item.key} className={filter === item.key ? 'active' : ''} onClick={() => setFilter(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
        <p className="small muted">개별 주문 결제확인과 테이블 단위 묶음 결제확인을 모두 지원합니다.</p>
      </section>

      <div className="grid" style={{ marginTop: 14 }}>
        {visibleSessions.length === 0 && <div className="card">현재 조건에 맞는 테이블 세션이 없습니다.</div>}
        {visibleSessions.map((session) => (
          <section className="card session-card" key={session.id}>
            <div className="row-between">
              <div>
                <div className="eyebrow">Table Session</div>
                <h2>{session.table_number}번 테이블 · S{String(session.session_no).padStart(3, '0')}</h2>
                <p className="muted">
                  총 {formatWon(session.totalAmount)} · 결제확인 {formatWon(session.paidAmount)} · 남은 결제 {formatWon(session.unpaidAmount)} · 미제공 {session.unservedCount}건
                </p>
              </div>
              <div className="row">
                <button className="btn ok" disabled={session.unpaidCount === 0} onClick={() => markSessionPaid(session)}>미결제 전체 결제확인</button>
                <button className="btn ok" disabled={!session.clearable} onClick={() => clearTable(session.table_number)}>테이블 비우기</button>
                <button className="btn danger" onClick={() => clearTable(session.table_number, true)}>강제비우기</button>
              </div>
            </div>

            <section className="history-summary-grid hall-summary-grid" style={{ marginTop: 12 }}>
              <div className="history-summary-card"><span>총 주문금액</span><strong>{formatWon(session.totalAmount)}</strong></div>
              <div className="history-summary-card paid"><span>결제확인</span><strong>{formatWon(session.paidAmount)}</strong></div>
              <div className="history-summary-card unpaid"><span>남은 결제</span><strong>{formatWon(session.unpaidAmount)}</strong></div>
            </section>

            <div className="grid grid-2" style={{ marginTop: 12 }}>
              {session.orders.map((order) => (
                <article className={`card order-card ${order.payment_status === 'unpaid' ? 'unpaid' : ''} ${order.kitchen_status}`} key={order.id}>
                  <div className="row-between">
                    <div>
                      <div className="small muted">주문번호</div>
                      <strong>{order.order_no}</strong>
                    </div>
                    <div className="row">
                      <StatusBadge value={order.payment_status} labels={paymentLabels} />
                      <StatusBadge value={order.kitchen_status} labels={kitchenLabels} />
                    </div>
                  </div>
                  <ul className="order-items">
                    {order.items.map((item) => (
                      <li key={item.menu_item_id}>{item.name} {item.quantity}개 · {formatWon(item.subtotal)}</li>
                    ))}
                  </ul>
                  <div className="hr" />
                  <div className="row-between">
                    <strong className="big">{formatWon(order.total_amount)}</strong>
                    <span className="small muted">{formatShortTime(order.created_at)} · {ageMinutes(order.created_at)}분 경과</span>
                  </div>
                  <div className="row actions">
                    {order.payment_status !== 'paid' && order.payment_status !== 'cancelled' && (
                      <button className="btn ok btn-lg" onClick={() => patchOrder(order.id, { action: 'mark_paid' }, '결제확인 처리했습니다.')}>이 주문 결제확인</button>
                    )}
                    {order.payment_status === 'paid' && (
                      <button className="btn" onClick={() => patchOrder(order.id, { action: 'mark_unpaid' }, '미결제로 되돌렸습니다.')}>미결제로 되돌림</button>
                    )}
                    {order.kitchen_status !== 'served' && order.kitchen_status !== 'cancelled' && (
                      <button className="btn blue" onClick={() => patchOrder(order.id, { action: 'set_kitchen_status', kitchenStatus: 'served' }, '제공완료 처리했습니다.')}>제공완료</button>
                    )}
                    {order.payment_status !== 'cancelled' && (
                      <button className="btn danger" onClick={() => window.confirm('이 주문을 취소 처리할까요?') && patchOrder(order.id, { action: 'cancel' }, '주문을 취소했습니다.')}>취소</button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
