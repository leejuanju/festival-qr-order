export default function StatusBadge({ value, labels, tone = value }) {
  return <span className={`badge ${tone || value}`}>{labels?.[value] || value}</span>;
}
