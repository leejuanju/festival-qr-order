'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatShortTime, formatWon, kitchenLabels, paymentLabels } from '@/lib/format';

function statusClass(value) {
  return `badge ${value || ''}`;
}

function TableOrderHistory({ tableNumber, data, loading, error, onClose, onRefresh }) {
  const session = data?.session || null;
  const orders = data?.orders || [];
  const summary = data?.summary || { totalAmount: 0, paidAmount: 0, unpaidAmount: 0, cancelledAmount: 0 };

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section className="review-sheet order-history-sheet" role="dialog" aria-modal="true" aria-label="주문 내역" onClick={(event) => event.stopPropagation()}>
        <div className="row-between">
          <div>
            <div className="eyebrow">Order History</div>
            <h2>{tableNumber}번 테이블 주문내역</h2>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              현재 이용 중인 손님 세션 기준입니다. 테이블이 비워지면 새 주문내역으로 시작됩니다.
            </p>
          </div>
          <div className="row">
            <button className="btn" onClick={onRefresh} disabled={loading}>새로고침</button>
            <button className="btn ghost" onClick={onClose}>닫기</button>
          </div>
        </div>

        {loading && <div className="notice info">주문내역을 불러오는 중입니다.</div>}
        {error && <div className="notice error">{error}</div>}

        {!loading && !session && (
          <div className="card inner-card" style={{ marginTop: 14 }}>
            <h3>현재 주문내역이 없습니다.</h3>
            <p className="muted" style={{ marginBottom: 0 }}>메뉴를 선택해 첫 주문을 접수하면 이곳에 내역이 표시됩니다.</p>
          </div>
        )}

        {session && (
          <>
            <section className="history-summary-grid" style={{ marginTop: 14 }}>
              <div className="history-summary-card"><span>총 주문금액</span><strong>{formatWon(summary.totalAmount)}</strong></div>
              <div className="history-summary-card paid"><span>결제확인</span><strong>{formatWon(summary.paidAmount)}</strong></div>
              <div className="history-summary-card unpaid"><span>남은 결제금액</span><strong>{formatWon(summary.unpaidAmount)}</strong></div>
            </section>

            <div className="session-note">
              <strong>S{String(session.session_no).padStart(3, '0')}</strong>
              <span>현재 테이블 이용 회차</span>
            </div>

            <div className="history-list">
              {orders.length === 0 && <div className="card inner-card">아직 주문이 없습니다.</div>}
              {orders.map((order) => (
                <article className="history-order-card" key={order.id}>
                  <div className="row-between">
                    <div>
                      <div className="small muted">주문번호</div>
                      <strong>{order.order_no}</strong>
                    </div>
                    <div className="row">
                      <span className={statusClass(order.payment_status)}>{paymentLabels[order.payment_status] || order.payment_status}</span>
                      <span className={statusClass(order.kitchen_status)}>{kitchenLabels[order.kitchen_status] || order.kitchen_status}</span>
                    </div>
                  </div>
                  <ul className="order-items history-items">
                    {order.items.map((item) => (
                      <li key={item.menu_item_id}>
                        <span>{item.name} {item.quantity}개</span>
                        <strong>{formatWon(item.subtotal)}</strong>
                      </li>
                    ))}
                  </ul>
                  <div className="row-between history-total-row">
                    <span className="small muted">{formatShortTime(order.created_at)}</span>
                    <strong>{formatWon(order.total_amount)}</strong>
                  </div>
                </article>
              ))}
            </div>

            <p className="small muted" style={{ marginBottom: 0 }}>
              여러 번 추가 주문했다면 미결제 금액을 모아서 한 번에 결제해도 됩니다. 결제확인은 직원이 홀 화면에서 처리합니다.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

export default function OrderClient({ tableNumber }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [cart, setCart] = useState({});
  const [error, setError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [historyData, setHistoryData] = useState(null);

  async function loadMenu() {
    setError('');
    try {
      const res = await fetch('/api/menu', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '메뉴를 불러오지 못했습니다.');
      setMenuItems(json.menuItems || []);
      setSettings(json.settings);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTableHistory() {
    if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) return;
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await fetch(`/api/orders/table/${tableNumber}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '주문내역을 불러오지 못했습니다.');
      setHistoryData(json);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  function openHistory() {
    setHistoryOpen(true);
    loadTableHistory();
  }

  useEffect(() => { loadMenu(); }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const item of menuItems) {
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return Array.from(map.entries());
  }, [menuItems]);

  const cartLines = useMemo(() => {
    return menuItems
      .map((item) => ({ ...item, quantity: cart[item.id] || 0 }))
      .filter((item) => item.quantity > 0);
  }, [menuItems, cart]);

  const totalQuantity = cartLines.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cartLines.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const canOrder = Boolean(settings?.is_open) && cartLines.length > 0 && !submitting;

  function updateQty(id, nextQty) {
    setCart((prev) => {
      const qty = Math.max(0, Math.min(50, nextQty));
      const next = { ...prev };
      if (qty === 0) delete next[id];
      else next[id] = qty;
      return next;
    });
  }

  async function submitOrder() {
    if (cartLines.length === 0) {
      setError('주문할 메뉴를 선택하세요.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const items = cartLines.map((item) => ({ id: item.id, quantity: item.quantity }));
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableNumber, items })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '주문에 실패했습니다.');
      setCreatedOrder(json.order);
      setCart({});
      setReviewOpen(false);
      setHistoryData(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.message);
      setReviewOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!Number.isInteger(tableNumber) || tableNumber < 1 || tableNumber > 10) {
    return (
      <main className="container narrow">
        <div className="card">
          <h1>잘못된 테이블 QR입니다.</h1>
          <p className="muted">테이블 번호는 1~10번만 사용할 수 있습니다.</p>
        </div>
      </main>
    );
  }

  if (createdOrder) {
    return (
      <main className="container narrow guest-page">
        <section className="card order-success stack">
          <div>
            <span className="badge received">주문접수</span>
            <h1 className="huge" style={{ margin: '12px 0 8px' }}>주문 완료</h1>
            <p className="muted">아래 주문번호와 결제 완료 화면을 직원에게 보여주세요.</p>
          </div>

          <div className="success-ticket">
            <div className="ticket-label">주문번호</div>
            <div className="ticket-number">{createdOrder.order_no}</div>
            <div className="ticket-grid">
              <span>테이블</span><strong>{createdOrder.table_number}번</strong>
              <span>이번 주문금액</span><strong>{formatWon(createdOrder.total_amount)}</strong>
              <span>예상 대기시간</span><strong>약 {settings?.wait_time_minutes ?? 0}분</strong>
            </div>
          </div>

          <div className="card inner-card" style={{ textAlign: 'left' }}>
            <h2>이번 주문내역</h2>
            <ul className="order-items">
              {createdOrder.items.map((item) => (
                <li key={item.menu_item_id}>{item.name} {item.quantity}개 · {formatWon(item.subtotal)}</li>
              ))}
            </ul>
          </div>

          <div className="card inner-card" style={{ textAlign: 'left' }}>
            <h2>결제 안내</h2>
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{settings?.payment_message}</p>
            <p className="small muted">추가 주문이 있으면 미결제 금액을 모아서 한 번에 결제해도 됩니다.</p>
          </div>

          <div className="grid grid-2 success-actions">
            <button className="btn primary full btn-lg" onClick={() => setCreatedOrder(null)}>추가 주문하기</button>
            <button className="btn full btn-lg" onClick={openHistory}>주문내역 보기</button>
          </div>
        </section>

        {historyOpen && (
          <TableOrderHistory
            tableNumber={tableNumber}
            data={historyData}
            loading={historyLoading}
            error={historyError}
            onRefresh={loadTableHistory}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </main>
    );
  }

  return (
    <main className="container narrow guest-page">
      <section className="guest-hero guest-hero-v4">
        <div className="hero-copy">
          <div className="eyebrow hero-eyebrow">Festival Table Order</div>
          <h1>{tableNumber}번 테이블</h1>
          <p>원하는 메뉴를 담고 주문을 접수하세요. 추가 주문과 미결제 금액은 주문내역에서 한 번에 확인할 수 있습니다.</p>
          <div className="hero-meta-row">
            <span>대기 약 {settings?.wait_time_minutes ?? '-'}분</span>
            <span>직원 결제확인</span>
          </div>
        </div>
        <div className="hero-side">
          <div className={`service-chip ${settings?.is_open ? 'open' : 'closed'}`}>
            {settings?.is_open ? '주문 가능' : '주문 중지'}
          </div>
          <button className="btn hero-history-btn" onClick={openHistory}>주문내역</button>
        </div>
      </section>

      {loading && <div className="card skeleton-card">메뉴를 불러오는 중입니다.</div>}
      {error && <div className="notice error" role="alert">{error}</div>}
      {settings && !settings.is_open && (
        <div className="notice error">현재 주문 접수가 일시중지되어 있습니다. 직원을 불러주세요.</div>
      )}
      {settings?.notice && <div className="notice info">{settings.notice}</div>}

      {settings && (
        <section className="service-summary">
          <div><span>예상 대기</span><strong>약 {settings.wait_time_minutes}분</strong></div>
          <div><span>결제 방식</span><strong>QR/계좌 후 확인</strong></div>
          <div><span>테이블</span><strong>{tableNumber}번</strong></div>
        </section>
      )}

      <div className="category-nav" aria-label="메뉴 카테고리">
        {grouped.map(([category]) => <a key={category} href={`#cat-${category}`}>{category}</a>)}
      </div>

      <div className="stack" style={{ marginTop: 14 }}>
        {grouped.map(([category, items]) => (
          <section className="card menu-section" id={`cat-${category}`} key={category}>
            <div className="row-between">
              <h2>{category}</h2>
              <span className="badge">{items.length}개</span>
            </div>
            <div>
              {items.map((item) => {
                const qty = cart[item.id] || 0;
                return (
                  <div className={`menu-item ${item.is_sold_out ? 'soldout' : ''}`} key={item.id}>
                    <div>
                      <div className="menu-title">
                        <strong>{item.name}</strong>
                        {item.is_sold_out && <span className="badge cancelled">품절</span>}
                      </div>
                      {item.description && <div className="muted small" style={{ marginTop: 4 }}>{item.description}</div>}
                      <div className="price" style={{ marginTop: 6 }}>{formatWon(item.price)}</div>
                    </div>
                    <div className="qty" aria-label={`${item.name} 수량 조절`}>
                      <button type="button" disabled={item.is_sold_out || qty === 0} onClick={() => updateQty(item.id, qty - 1)} aria-label="수량 감소">−</button>
                      <span>{qty}</span>
                      <button type="button" disabled={item.is_sold_out} onClick={() => updateQty(item.id, qty + 1)} aria-label="수량 증가">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <section className="card cart-bar">
        <div className="row-between">
          <div>
            <div className="muted small">선택 {totalQuantity}개</div>
            <div className="big">{formatWon(totalAmount)}</div>
          </div>
          <button
            className="btn primary btn-lg"
            disabled={!canOrder}
            onClick={() => setReviewOpen(true)}
          >
            주문 확인
          </button>
        </div>
        {cartLines.length > 0 && (
          <div className="small muted" style={{ marginTop: 8 }}>
            {cartLines.map((item) => `${item.name} ${item.quantity}개`).join(' · ')}
          </div>
        )}
      </section>

      {reviewOpen && (
        <div className="sheet-backdrop" role="presentation" onClick={() => !submitting && setReviewOpen(false)}>
          <section className="review-sheet" role="dialog" aria-modal="true" aria-label="주문 확인" onClick={(event) => event.stopPropagation()}>
            <div className="row-between">
              <div>
                <div className="eyebrow">Review</div>
                <h2>주문 확인</h2>
              </div>
              <button className="btn ghost" disabled={submitting} onClick={() => setReviewOpen(false)}>닫기</button>
            </div>
            <ul className="order-items review-list">
              {cartLines.map((item) => (
                <li key={item.id}>
                  <span>{item.name} {item.quantity}개</span>
                  <strong>{formatWon(item.price * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <div className="hr" />
            <div className="row-between">
              <span className="big">총 {totalQuantity}개</span>
              <strong className="big">{formatWon(totalAmount)}</strong>
            </div>
            <button className="btn primary full btn-lg" disabled={submitting} onClick={submitOrder}>
              {submitting ? '주문 접수 중...' : '이대로 주문 접수'}
            </button>
            <p className="small muted" style={{ marginBottom: 0 }}>
              주문 후 직원에게 결제 완료 화면을 보여주세요. 주문은 결제 전에도 주방에 전달됩니다.
            </p>
          </section>
        </div>
      )}

      {historyOpen && (
        <TableOrderHistory
          tableNumber={tableNumber}
          data={historyData}
          loading={historyLoading}
          error={historyError}
          onRefresh={loadTableHistory}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </main>
  );
}
