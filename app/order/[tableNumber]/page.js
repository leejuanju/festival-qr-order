import OrderClient from './OrderClient';

export default async function OrderPage({ params }) {
  const { tableNumber } = await params;
  return <OrderClient tableNumber={Number(tableNumber)} />;
}
