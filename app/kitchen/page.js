'use client';

import { useEffect, useMemo, useState } from 'react';
import BackButton from '@/components/BackButton';
import StaffLogin from '@/components/StaffLogin';
import { ageMinutes, formatShortTime } from '@/lib/format';
import ServiceItemChecklist from '@/components/ServiceItemChecklist';

const STORAGE_KEY = 'festival_kitchen_pin';

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
      setMessage(kitchenStatus === 'served' ? '제공완료 처리했습니다.' : '주문을 확인했습니다.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }


  async function setServiceItemStatus(orderId, serviceItemId, served) {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-staff-pin': pin },
        body: JSON.stringify({ action: 'set_service_item_served', serviceItemId, served })
      });
      const json = await res.json();
      if (res.status === 401) {
        logout('PIN이 올바르지 않습니다. 다시 입력하세요.');
        return;
      }
      if (!res.ok) throw new Error(json.error || '제공 체크 변경에 실패했습니다.');
      setMessage(served ? '제공 항목을 체크했습니다.' : '제공 체크를 되돌렸습니다.');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [orders]);

  const stats = useMemo(() => {
    return sortedOrders.reduce((acc, order) => {
      if (order.kitchen_status === 'received') acc.new += 1;
      else acc.checked += 1;
      return acc;
    }, { total: sortedOrders.length, new: 0, checked: 0 });
  }, [sortedOrders]);

  if (!pin) {
    return (
      <StaffLogin
        title="주방 주문표"
        description="접수된 주문을 한 줄 리스트로 보고 확인/제공완료만 처리합니다."
        role="kitchen"
        storageKey={STORAGE_KEY}
        initialMessage={authMessage}
        onLogin={(nextPin) => { setAuthMessage(''); setPin(nextPin); }}
      />
    );
  }

  return (
    <main className="container kitchen-container kitchen-simple-container">
      <div className="topbar kitchen-simple-topbar">
        <div>
          <div className="eyebrow">Kitchen List</div>
          <h1>주방 주문표</h1>
          <p>들어온 순서대로 처리하세요. 확인을 누르면 확인됨으로 표시되고, 제공완료를 누르면 목록에서 사라집니다.</p>
          <p className="small muted">마지막 갱신: {lastLoadedAt ? formatShortTime(lastLoadedAt) : '-'}</p>
        </div>
        <div className="row">
          <BackButton />
          <button className="btn" onClick={load}>새로고침</button>
          <button className="btn ghost" onClick={() => logout()}>PIN 변경</button>
        </div>
      </div>

      <section className="stat-grid kitchen-stat-grid-v6">
        <div className="stat-card urgent"><span>전체 대기 주문</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>새 주문</span><strong>{stats.new}</strong></div>
        <div className="stat-card"><span>확인됨</span><strong>{stats.checked}</strong></div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}
      {message && <div className="notice success">{message}</div>}
      {loading && <div className="notice info">처리 중입니다.</div>}

      {sortedOrders.length === 0 ? (
        <section className="card empty-kitchen-card" style={{ marginTop: 14 }}>
          <h2>현재 조리할 주문이 없습니다.</h2>
          <p className="muted">새 주문이 들어오면 이 화면에 자동으로 표시됩니다.</p>
        </section>
      ) : (
        <section className="kitchen-simple-list" style={{ marginTop: 14 }}>
          {sortedOrders.map((order, index) => {
            const checked = order.kitchen_status !== 'received';
            return (
              <article className={`kitchen-simple-card ${checked ? 'checked' : 'new'}`} key={order.id}>
                <div className="kitchen-simple-main">
                  <div className="kitchen-simple-rank">#{index + 1}</div>
                  <div className="kitchen-simple-table">{order.table_number}번</div>
                  <div className="kitchen-simple-content">
                    <div className="row">
                      <strong>{order.order_no}</strong>
                      <span className={`badge ${checked ? 'cooking' : 'received'}`}>{checked ? '확인됨' : '새 주문'}</span>
                      <span className="small muted">{formatShortTime(order.created_at)} · {ageMinutes(order.created_at)}분 경과</span>
                    </div>
                    <ServiceItemChecklist
                      order={order}
                      onToggle={setServiceItemStatus}
                      disabled={loading}
                      role="kitchen"
                    />
                    <div className="small muted">제공 체크 {order.serviceProgress?.served || 0}/{order.serviceProgress?.total || 0}</div>
                  </div>
                </div>
                <div className="kitchen-simple-actions">
                  <button
                    className="btn warn btn-lg"
                    disabled={checked || loading}
                    onClick={() => setKitchenStatus(order.id, 'cooking')}
                  >
                    확인
                  </button>
                  <button
                    className="btn ok btn-lg"
                    disabled={loading}
                    onClick={() => setKitchenStatus(order.id, 'served')}
                  >
                    전체 제공완료
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
