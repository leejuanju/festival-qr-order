export function formatWon(value) {
  return `${Number(value || 0).toLocaleString('ko-KR')}원`;
}

export const paymentLabels = {
  unpaid: '미결제',
  paid: '결제확인',
  cancelled: '결제취소'
};

export const kitchenLabels = {
  received: '주문접수',
  cooking: '조리중',
  ready: '준비완료',
  served: '제공완료',
  cancelled: '취소'
};

export function summarizeItems(items) {
  if (!Array.isArray(items)) return '';
  return items.map((item) => `${item.name} ${item.quantity}개`).join(', ');
}

export function formatShortTime(value) {
  if (!value) return '-';
  return new Date(value).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export function ageMinutes(value) {
  if (!value) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
}
