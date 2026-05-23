'use client';

import { useEffect, useMemo, useState } from 'react';
import StaffLogin from '@/components/StaffLogin';
import BackButton from '@/components/BackButton';
import { formatWon } from '@/lib/format';

const STORAGE_KEY = 'festival_admin_pin';
const categoryOrder = ['전체', '메인', '세트', '음료', '기록 메뉴', '기타'];

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function buildCsv(rows) {
  const headers = ['카테고리', '메뉴명', '단가', '총 주문수량', '결제완료수량', '미결제수량', '취소수량', '총 주문금액', '결제완료금액', '미결제금액', '취소금액'];
  const lines = rows.map((row) => [
    row.category,
    row.name,
    row.price,
    row.totalQty,
    row.paidQty,
    row.unpaidQty,
    row.cancelledQty,
    row.totalAmount,
    row.paidAmount,
    row.unpaidAmount,
    row.cancelledAmount
  ].map(csvEscape).join(','));
  return [headers.map(csvEscape).join(','), ...lines].join('\n');
}

export default function MenuStatsPage() {
  const [pin, setPin] = useState('');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [generatedAt, setGeneratedAt] = useState('');
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    if (saved) setPin(saved);
  }, []);

  useEffect(() => {
    if (pin) load();
  }, [pin]);

  async function api(path) {
    const res = await fetch(path, { headers: { 'x-staff-pin': pin } });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || '데이터를 불러오지 못했습니다.');
    return json;
  }

  async function load() {
    setLoading(true);
    setError('');
    try {
      const json = await api('/api/admin/menu-stats');
      setRows(json.rows || []);
      setSummary(json.summary || null);
      setGeneratedAt(json.generatedAt || '');
    } catch (err) {
      setError(err.message || '집계 데이터를 불러오지 못했습니다.');
      if (String(err.message || '').includes('PIN')) {
        localStorage.removeItem(STORAGE_KEY);
        setPin('');
      }
    } finally {
      setLoading(false);
    }
  }

  const categories = useMemo(() => {
    const set = new Set(rows.map((row) => row.category || '기타'));
    return categoryOrder.filter((name) => name === '전체' || set.has(name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (category !== '전체' && row.category !== category) return false;
      if (!keyword) return true;
      return `${row.name} ${row.category}`.toLowerCase().includes(keyword);
    });
  }, [rows, category, query]);

  function downloadCsv() {
    const csv = buildCsv(filteredRows);
    const blob = new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menu-stats-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  if (!pin) {
    return (
      <StaffLogin
        title="메뉴별 주문 집계"
        description="총 주문수량, 결제완료수량, 미결제수량을 확인합니다. 운영홈에는 노출되지 않는 관리자 전용 페이지입니다."
        role="admin"
        storageKey={STORAGE_KEY}
        onLogin={setPin}
      />
    );
  }

  return (
    <main className="container admin-container stats-page">
      <div className="topbar">
        <div>
          <div className="eyebrow">Hidden Report</div>
          <h1>메뉴별 주문·결제 집계</h1>
          <p>주문 기록 기준으로 각 메뉴가 몇 개 주문됐고, 그중 몇 개가 결제확인됐는지 확인합니다.</p>
        </div>
        <div className="row no-print">
          <BackButton />
          <button className="btn" onClick={load} disabled={loading}>{loading ? '새로고침 중...' : '새로고침'}</button>
          <button className="btn primary" onClick={downloadCsv} disabled={filteredRows.length === 0}>CSV 다운로드</button>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      {summary && (
        <section className="grid grid-4 stats-summary-grid compact-4">
          <div className="stat-card paid"><span>결제완료 금액</span><strong>{formatWon(summary.paidAmount)}</strong></div>
          <div className="stat-card urgent"><span>미결제 금액</span><strong>{formatWon(summary.unpaidAmount)}</strong></div>
          <div className="stat-card"><span>총 주문수량</span><strong>{summary.totalQty.toLocaleString('ko-KR')}개</strong></div>
          <div className="stat-card"><span>결제완료 수량</span><strong>{summary.paidQty.toLocaleString('ko-KR')}개</strong></div>
        </section>
      )}

      <section className="card toolbar-card no-print">
        <div className="segmented stats-segmented">
          {categories.map((name) => (
            <button key={name} className={category === name ? 'active' : ''} onClick={() => setCategory(name)}>
              {name}
            </button>
          ))}
        </div>
        <input className="input stats-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="메뉴명 검색" />
      </section>

      <section className="card stats-card">
        <div className="row-between">
          <h2>메뉴별 상세</h2>
          <span className="small muted">마지막 갱신: {generatedAt ? new Date(generatedAt).toLocaleString('ko-KR') : '-'}</span>
        </div>
        <div className="stats-table-wrap">
          <table className="stats-table">
            <thead>
              <tr>
                <th>메뉴</th>
                <th>총 주문</th>
                <th>결제완료</th>
                <th>미결제</th>
                <th>취소</th>
                <th>결제금액</th>
                <th>미결제금액</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={`${row.id || row.name}-${row.price}`} className={row.totalQty === 0 && row.cancelledQty === 0 ? 'is-empty' : ''}>
                  <td>
                    <div className="stats-menu-cell">
                      {row.image_url ? <img src={row.image_url} alt="" /> : <div className="stats-thumb-placeholder">No image</div>}
                      <div>
                        <strong>{row.name}</strong>
                        <span>{row.category} · {formatWon(row.price)}</span>
                      </div>
                    </div>
                  </td>
                  <td><strong>{row.totalQty.toLocaleString('ko-KR')}개</strong></td>
                  <td className="ok-text"><strong>{row.paidQty.toLocaleString('ko-KR')}개</strong></td>
                  <td className="warn-text"><strong>{row.unpaidQty.toLocaleString('ko-KR')}개</strong></td>
                  <td>{row.cancelledQty.toLocaleString('ko-KR')}개</td>
                  <td className="ok-text">{formatWon(row.paidAmount)}</td>
                  <td className="warn-text">{formatWon(row.unpaidAmount)}</td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr><td colSpan="7" className="muted">표시할 메뉴가 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-note">
        기준: 취소되지 않은 주문은 총 주문수량에 포함됩니다. 주문이 결제확인 상태이면 해당 주문 안의 모든 메뉴 수량이 결제완료 수량으로 집계됩니다.
      </p>
    </main>
  );
}
