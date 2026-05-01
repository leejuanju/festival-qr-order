import './globals.css';

export const metadata = {
  title: '축제 QR 주문',
  description: '단기 축제부스용 QR 주문 시스템'
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
