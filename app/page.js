export default function HomePage() {
  return (
    <main className="container narrow">
      <section className="card strong stack ops-hero" style={{ marginTop: 26 }}>
        <div className="eyebrow">Operator Home</div>
        <h1 className="huge" style={{ margin: 0 }}>축제 QR 주문 운영 홈</h1>
        <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
          이 화면은 손님용이 아니라 운영자용 허브입니다. 손님은 테이블에 붙은 QR을 통해 각 테이블 주문 화면만 사용합니다.
        </p>
      </section>

      <section className="grid grid-2 ops-link-grid" style={{ marginTop: 16 }}>
        <a className="card ops-link" href="/hall">
          <span className="ops-icon">₩</span>
          <div>
            <h2>홀 / 결제확인</h2>
            <p className="muted">개별 결제확인, 묶음 결제확인, 테이블 비우기.</p>
          </div>
        </a>
        <a className="card ops-link" href="/kitchen">
          <span className="ops-icon">KDS</span>
          <div>
            <h2>주방 주문표</h2>
            <p className="muted">접수된 주문을 한 줄 리스트로 보고 확인/제공완료 처리.</p>
          </div>
        </a>
        <a className="card ops-link" href="/admin">
          <span className="ops-icon">⚙</span>
          <div>
            <h2>관리자</h2>
            <p className="muted">운영 ON/OFF, 대기시간, 결제문구, 메뉴 수정.</p>
          </div>
        </a>
        <a className="card ops-link" href="/admin/qr">
          <span className="ops-icon">QR</span>
          <div>
            <h2>테이블 QR 출력</h2>
            <p className="muted">배포 주소 기준 1~22번 테이블 비공개 QR 생성.</p>
          </div>
        </a>
      </section>

      <section className="notice info" style={{ marginTop: 16 }}>
        손님에게 직접 공유할 주소는 숫자 URL이 아니라 <strong>/admin/qr</strong>에서 출력한 테이블별 QR입니다. 운영자 화면 주소와 PIN은 담당자에게만 공유하세요.
      </section>

      <p className="footer-note">
        현장 QR은 반드시 Netlify 배포 주소의 /admin/qr 화면에서 출력하세요. localhost QR은 손님 휴대폰에서 동작하지 않습니다.
      </p>
    </main>
  );
}
