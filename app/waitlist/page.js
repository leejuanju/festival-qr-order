'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import BackButton from '@/components/BackButton';
import { formatShortTime } from '@/lib/format';

const STORAGE_KEY = 'festival_waitlist_watch_no';
const statusLabels = {
  waiting: '대기중',
  called: '호출됨',
  seated: '입장완료',
  cancelled: '취소'
};

function normalizeNumber(value) {
  const n = Number(String(value || '').trim());
  if (!Number.isInteger(n) || n < 1) return '';
  return String(n);
}

export default function PublicWaitlistPage() {
  const [entries, setEntries] = useState([]);
  const [summary, setSummary] = useState({ waiting: 0, called: 0, active: 0 });
  const [watchedNo, setWatchedNo] = useState('');
  const [watchInput, setWatchInput] = useState('');
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [notificationReady, setNotificationReady] = useState(false);
  const [error, setError] = useState('');
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const audioRef = useRef(null);
  const previousStatusRef = useRef('');

  async function load() {
    setError('');
    try {
      const res = await fetch('/api/waitlist', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || '대기열을 불러오지 못했습니다.');
      setEntries(json.entries || []);
      setSummary(json.summary || { waiting: 0, called: 0, active: 0 });
      setLastLoadedAt(new Date());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || '';
    const params = new URLSearchParams(window.location.search);
    const fromUrl = normalizeNumber(params.get('no'));
    const initial = fromUrl || normalizeNumber(saved);
    if (initial) {
      setWatchedNo(initial);
      setWatchInput(initial);
    }
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
  }, []);

  const activeEntries = useMemo(() => entries.filter((entry) => entry.status === 'waiting' || entry.status === 'called'), [entries]);
  const calledEntries = useMemo(() => activeEntries.filter((entry) => entry.status === 'called'), [activeEntries]);
  const watchedEntry = useMemo(() => activeEntries.find((entry) => String(entry.queue_no) === String(watchedNo)), [activeEntries, watchedNo]);
  const watchedPosition = useMemo(() => {
    if (!watchedEntry) return null;
    const index = activeEntries.findIndex((entry) => String(entry.queue_no) === String(watchedNo));
    return index >= 0 ? index + 1 : null;
  }, [activeEntries, watchedEntry, watchedNo]);

  function beep() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = audioRef.current || new AudioContext();
      audioRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.58);
    } catch (_) {
      // 모바일 브라우저가 소리를 막으면 조용히 무시합니다.
    }
  }

  async function enableAlerts() {
    setAlertsEnabled(true);
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationReady(permission === 'granted');
      } catch (_) {
        setNotificationReady(false);
      }
    }
    beep();
    if ('vibrate' in navigator) navigator.vibrate(80);
  }

  function triggerCalledAlert(entry) {
    if ('vibrate' in navigator) navigator.vibrate([320, 140, 320, 140, 520]);
    beep();
    if (notificationReady && 'Notification' in window) {
      try {
        new Notification(`${entry.queue_no}번 대기 호출`, {
          body: '직원 안내에 따라 입장 대기해주세요.',
          tag: `waitlist-called-${entry.queue_no}`
        });
      } catch (_) {
        // 일부 모바일 브라우저는 Notification 생성이 제한됩니다.
      }
    }
  }

  useEffect(() => {
    if (!watchedEntry) {
      previousStatusRef.current = '';
      return;
    }
    const previous = previousStatusRef.current;
    if (alertsEnabled && watchedEntry.status === 'called' && previous !== 'called') {
      triggerCalledAlert(watchedEntry);
    }
    previousStatusRef.current = watchedEntry.status;
  }, [watchedEntry?.status, watchedEntry?.queue_no, alertsEnabled]);

  function saveWatch(event) {
    event.preventDefault();
    const no = normalizeNumber(watchInput);
    if (!no) {
      setError('대기번호를 숫자로 입력하세요.');
      return;
    }
    localStorage.setItem(STORAGE_KEY, no);
    setWatchedNo(no);
    previousStatusRef.current = '';
    const url = new URL(window.location.href);
    url.searchParams.set('no', no);
    window.history.replaceState(null, '', url.toString());
  }

  return (
    <main className="container narrow waitlist-page">
      <section className="waitlist-guest-hero">
        <div>
          <div className="eyebrow">Waiting List</div>
          <h1>대기번호 현황</h1>
          <p>직원에게 받은 대기번호를 입력하면 호출 상태를 확인할 수 있습니다. 화면을 켜두면 호출 시 진동/알림을 시도합니다.</p>
        </div>
        <div className="row waitlist-guest-actions">
          <BackButton />
          <button className="btn" onClick={load}>새로고침</button>
        </div>
      </section>

      {error && <div className="notice error" role="alert">{error}</div>}

      <section className="stat-grid waitlist-public-stats">
        <div className="stat-card urgent"><span>현재 대기</span><strong>{summary.active || 0}</strong></div>
        <div className="stat-card"><span>호출됨</span><strong>{summary.called || 0}</strong></div>
        <div className="stat-card"><span>대기중</span><strong>{summary.waiting || 0}</strong></div>
      </section>

      <section className="card stack watch-card" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div>
            <h2>내 대기번호 확인</h2>
            <p className="muted small">대기번호를 입력하고 알림을 활성화하세요. 모바일 진동은 기기와 브라우저에 따라 제한될 수 있습니다.</p>
          </div>
          <button className={`btn ${alertsEnabled ? 'ok' : 'blue'}`} onClick={enableAlerts} type="button">
            {alertsEnabled ? '알림 활성화됨' : '진동/알림 활성화'}
          </button>
        </div>
        <form className="waitlist-watch-form" onSubmit={saveWatch}>
          <input className="input" value={watchInput} onChange={(e) => setWatchInput(e.target.value)} placeholder="예: 12" inputMode="numeric" />
          <button className="btn primary" type="submit">내 번호 보기</button>
        </form>

        {watchedNo && (
          <div className={`my-wait-card ${watchedEntry?.status || 'missing'}`}>
            <div className="my-wait-no">{watchedNo}번</div>
            {watchedEntry ? (
              <div>
                <span className={`badge ${watchedEntry.status}`}>{statusLabels[watchedEntry.status] || watchedEntry.status}</span>
                <h3>{watchedEntry.status === 'called' ? '호출되었습니다' : watchedPosition ? `현재 ${watchedPosition}번째 대기입니다` : '대기 중입니다'}</h3>
                <p className="muted">{watchedEntry.name || '호출명 없음'} · {watchedEntry.party_size}명</p>
                {watchedEntry.status === 'called' && <p className="call-message">직원 안내에 따라 입장 대기해주세요.</p>}
              </div>
            ) : (
              <div>
                <span className="badge">확인 안 됨</span>
                <h3>현재 대기 목록에 없습니다</h3>
                <p className="muted">이미 입장완료/취소되었거나 번호를 잘못 입력했을 수 있습니다.</p>
              </div>
            )}
          </div>
        )}
      </section>

      {calledEntries.length > 0 && (
        <section className="card called-board" style={{ marginTop: 14 }}>
          <div className="row-between">
            <h2>지금 호출된 번호</h2>
            <span className="badge called">호출 확인</span>
          </div>
          <div className="called-number-grid">
            {calledEntries.map((entry) => (
              <div className="called-number" key={entry.queue_no}>
                <strong>{entry.queue_no}</strong>
                <span>{entry.name || '호출명 없음'} · {entry.party_size}명</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card" style={{ marginTop: 14 }}>
        <div className="row-between">
          <div>
            <h2>대기 순서</h2>
            <p className="muted small">호출된 번호와 대기중 번호를 함께 표시합니다. 마지막 갱신: {lastLoadedAt ? formatShortTime(lastLoadedAt) : '-'}</p>
          </div>
          <span className="badge dark">3초마다 갱신</span>
        </div>
        <div className="public-waitlist-list">
          {activeEntries.length === 0 && <div className="notice info">현재 대기자가 없습니다.</div>}
          {activeEntries.map((entry, index) => (
            <article className={`public-waitlist-card ${entry.status} ${String(entry.queue_no) === String(watchedNo) ? 'mine' : ''}`} key={entry.queue_no}>
              <div className="public-wait-rank">{index + 1}</div>
              <div className="public-wait-no">{entry.queue_no}번</div>
              <div className="public-wait-info">
                <strong>{entry.name || '호출명 없음'}</strong>
                <span>{entry.party_size}명 · {formatShortTime(entry.created_at)}</span>
              </div>
              <span className={`badge ${entry.status}`}>{statusLabels[entry.status] || entry.status}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
