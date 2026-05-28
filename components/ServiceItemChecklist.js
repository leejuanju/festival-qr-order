'use client';

function sameOneToOne(item, serviceItems) {
  if (!Array.isArray(serviceItems) || serviceItems.length !== 1) return false;
  const entry = serviceItems[0];
  return String(entry.name || '').trim() === String(item.name || '').trim() && Number(entry.quantity || 0) === Number(item.quantity || 0);
}

export default function ServiceItemChecklist({ order, onToggle, disabled = false, compact = false, role = 'kitchen' }) {
  const items = Array.isArray(order?.items) ? order.items : [];

  return (
    <div className={`serve-menu-groups ${compact ? 'compact' : ''} ${role}`} aria-label="제공 체크 목록">
      {items.map((item) => {
        const serviceItems = Array.isArray(item.service_items) ? item.service_items : [];
        const isComposite = serviceItems.length > 1 || !sameOneToOne(item, serviceItems);
        const itemServed = serviceItems.length > 0 && serviceItems.every((entry) => entry.served);
        const itemPartial = serviceItems.some((entry) => entry.served) && !itemServed;

        if (!isComposite) {
          const entry = serviceItems[0] || { id: item.menu_item_id || item.name, name: item.name, quantity: item.quantity, served: false };
          return (
            <button
              type="button"
              key={item.menu_item_id || item.name}
              className={`serve-menu-row ${entry.served ? 'served' : ''}`}
              onClick={() => onToggle(order.id, entry.id, !entry.served)}
              disabled={disabled}
              aria-pressed={entry.served}
            >
              <span className="serve-check-dot">{entry.served ? '✓' : ''}</span>
              <span className="serve-row-name">{item.name}</span>
              <span className="serve-row-qty">{item.quantity}개</span>
            </button>
          );
        }

        return (
          <article className={`serve-set-card ${itemServed ? 'served' : ''} ${itemPartial ? 'partial' : ''}`} key={item.menu_item_id || item.name}>
            <div className="serve-set-head">
              <div>
                <span className="serve-set-label">세트/구성 제공 체크</span>
                <strong>{item.name}</strong>
              </div>
              <span className="serve-row-qty">{item.quantity}개</span>
            </div>
            <div className="serve-set-components">
              {serviceItems.map((entry) => (
                <button
                  type="button"
                  key={entry.id}
                  className={`serve-component-chip ${entry.served ? 'served' : ''}`}
                  onClick={() => onToggle(order.id, entry.id, !entry.served)}
                  disabled={disabled}
                  aria-pressed={entry.served}
                >
                  <span className="serve-check-dot">{entry.served ? '✓' : ''}</span>
                  <span className="serve-row-name">{entry.name}</span>
                  <span className="serve-row-qty">{entry.quantity}개</span>
                </button>
              ))}
            </div>
          </article>
        );
      })}
    </div>
  );
}
