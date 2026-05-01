'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import StatusBadge from '@/components/StatusBadge';
import { ageMinutes, formatShortTime, kitchenLabels } from '@/lib/format';

const STORAGE_KEY = 'festival_kitchen_pin';
const columns = [
  { key: 'received', title: '주문접수', help: '들어온 순서대로 처리' },
  { key: 'cooking', title: '조리중', help: '현재 준비 중' },
  { key: 'ready', title: '준비완료', help: '홀/서빙 대기' }
];

export default function KitchenPage() {
  const [pin, setPin] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);

  function logout(nextMessage = '') {
    localStorage.removeItem(STORAGE_KEY);
    setPin('');
    setAuthMessage(nextMessage);
    setOrders([]);
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved) setPin(saved);
  }, []);

  async function load() {
    if (!pin) return;
    setError('');
    try {
      const res = await fetch('/api/kitchen', { headers: { 'x-staff-pin': pin }, cache: 'no-store' });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '주문을 불러오지 못했습니다.');
      setOrders(json.orders || []);
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

  async function setKitchenStatus(orderId, kitchenStatus) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': pin },
        body: JSON.stringify({ action: 'set_kitchen_status', kitchenStatus })
      });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '상태 변경에 실패했습니다.');
      setMessage(kitchenLabels[kitchenStatus] ? `${kitchenLabels[kitchenStatus]} 처리했습니다.` : '처리했습니다.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const grouped = useMemo(() => {
    const map = new Map(columns.map((column) => [column.key, []]));
    const sorted = [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    for (const order of sorted) {
      if (!map.has(order.kitchen_status)) map.set(order.kitchen_status, []);
      map.get(order.kitchen_status).push(order);
    }
    return map;
  }, [orders]);

  if (!pin) {
    return (
      <StaffLogin
        title="주방 주문표"
        description="주문이 들어온 순서대로 접수, 조리중, 준비완료만 관리합니다."
        role="kitchen"
        storageKey={STORAGE_KEY}
        initialMessage={authMessage}
        onLogin={(nextPin) => { setAuthMessage(''); setPin(nextPin); }}
      />
    );
  }

  return (
    <main className="container kitchen-container">
      <div className="topbar">
        <div>
          <div className="eyebrow">Kitchen Board</div>
          <h1>주방 주문표</h1>
          <p>주문접수, 조리중, 준비완료만 표시합니다. 주문접수 칸은 들어온 순서대로 정렬됩니다.</p>
          <p className="small muted">마지막 갱신: {lastLoadedAt ? formatShortTime(lastLoadedAt) : '-'}</p>
        </div>
        <div className="row">
          <BackButton />
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </div>

      <section className="stat-grid kitchen-stat-grid">
        <div className="stat-card"><span>주문접수</span><strong>{grouped.get('received')?.length || 0}</strong></div>
        <div className="stat-card"><span>조리중</span><strong>{grouped.get('cooking')?.length || 0}</strong></div>
        <div className="stat-card"><span>준비완료</span><strong>{grouped.get('ready')?.length || 0}</strong></div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {loading && <div className="notice info">처리 중입니다.</div>}

      {orders.length === 0 ? (
        <section className="card" style={{ marginTop: 14 }}>
          <h2>현재 조리할 주문이 없습니다.</h2>
          <p className="muted">새 주문이 들어오면 이 화면에 자동으로 표시됩니다.</p>
        </section>
      ) : (
        <section className="board-grid" style={{ marginTop: 14 }}>
          {columns.map((column) => {
            const columnOrders = grouped.get(column.key) || [];
            return (
              <div className="column" key={column.key}>
                <div className="column-title">
                  <div>
                    <h2>{column.title}</h2>
                    <p className="small muted" style={{ margin: 0 }}>{column.help}</p>
                  </div>
                  <span className="badge dark">{columnOrders.length}</span>
                </div>

                {columnOrders.map((order, index) => (
                  <article className={`card order-card kitchen-card ${order.kitchen_status}`} key={order.id}>
                    <div className="row-between">
                      <div>
                        <div className="table-number">{order.table_number}번</div>
                        <strong>{order.order_no}</strong>
                      </div>
                      <div className="stack" style={{ alignItems: 'flex-end', gap: 6 }}>
                        <span className="badge dark">#{index + 1}</span>
                        <StatusBadge value={order.kitchen_status} labels={kitchenLabels} />
                      </div>
                    </div>

                    <ul className="order-items kitchen-items">
                      {order.items.map((item) => (
                        <li key={item.menu_item_id}><strong>{item.name}</strong><span>{item.quantity}개</span></li>
                      ))}
                    </ul>
                    <div className="hr" />
                    <div className="row-between">
                      <span className="small muted">{formatShortTime(order.created_at)} · {ageMinutes(order.created_at)}분 경과</span>
                      <span className="small muted">접수순 정렬</span>
                    </div>
                    <div className="grid" style={{ marginTop: 12 }}>
                      {order.kitchen_status !== 'cooking' && (
                        <button className="btn warn btn-lg" onClick={() => setKitchenStatus(order.id, 'cooking')}>조리중으로 이동</button>
                      )}
                      {order.kitchen_status !== 'ready' && (
                        <button className="btn ok btn-lg" onClick={() => setKitchenStatus(order.id, 'ready')}>준비완료</button>
                      )}
                      <button className="btn btn-lg" onClick={() => setKitchenStatus(order.id, 'served')}>제공완료</button>
                    </div>
                  </article>
                ))}
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
