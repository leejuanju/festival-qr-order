export function normalizeServeComponents(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((component) => {
      const name = String(component?.name || '').trim();
      const quantity = Number(component?.quantity ?? component?.qty ?? 1);
      if (!name) return null;
      return {
        name: name.slice(0, 80),
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.min(99, Math.round(quantity)) : 1
      };
    })
    .filter(Boolean);
}

function cleanComponentName(name) {
  return String(name || '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

export function inferServeComponentsFromName(menuName) {
  const raw = String(menuName || '').trim();
  if (!raw || !raw.includes('+')) return [];

  return raw
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const compact = part.replace(/\s+/g, ' ').trim();
      const match = compact.match(/^(.*?)(\d+)\s*(개|잔|병|캔|그릇|인분)?\s*$/);
      if (!match) return { name: cleanComponentName(compact), quantity: 1 };
      const name = cleanComponentName(match[1]);
      const quantity = Number(match[2]);
      if (!name || !Number.isFinite(quantity) || quantity <= 0) return { name: cleanComponentName(compact), quantity: 1 };
      return { name, quantity: Math.min(99, Math.round(quantity)) };
    })
    .filter((entry) => entry.name);
}

export function parseServeComponentsText(text) {
  const raw = String(text || '').trim();
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(/[|,]/).map((part) => part.trim()).filter(Boolean);
      const name = parts[0] || '';
      const quantity = Number(parts[1] || 1);
      if (!name) return null;
      return {
        name: name.slice(0, 80),
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.min(99, Math.round(quantity)) : 1
      };
    })
    .filter(Boolean);
}

export function serveComponentsToText(value) {
  return normalizeServeComponents(value)
    .map((component) => `${component.name}|${component.quantity}`)
    .join('\n');
}

function serviceItemId(index, name, prefix = '') {
  const safe = String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28) || 'item';
  const head = String(prefix || '').replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'x';
  return `svc-${head}-${index}-${safe}`;
}

function buildServiceItemsFromComponents(components, orderedQuantity = 1, prefix = '') {
  const orderQty = Number(orderedQuantity) > 0 ? Math.round(Number(orderedQuantity)) : 1;
  return components.map((component, index) => ({
    id: serviceItemId(index, component.name, prefix),
    name: component.name,
    quantity: component.quantity * orderQty,
    served: false,
    served_at: null
  }));
}

export function buildServiceItems(menuRow, orderedQuantity = 1) {
  const components = normalizeServeComponents(menuRow?.serve_components);
  const inferred = components.length > 0 ? components : inferServeComponentsFromName(menuRow?.name);
  const base = inferred.length > 0 ? inferred : [{ name: menuRow?.name || '메뉴', quantity: 1 }];
  return buildServiceItemsFromComponents(base, orderedQuantity, menuRow?.id || menuRow?.name);
}

function serviceItemsLookLikeUnsplitSet(item, serviceItems) {
  if (!String(item?.name || '').includes('+')) return false;
  if (!Array.isArray(serviceItems) || serviceItems.length !== 1) return false;
  return String(serviceItems[0]?.name || '').trim() === String(item?.name || '').trim();
}

export function normalizeOrderItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((item) => {
    const quantity = Number(item?.quantity) > 0 ? Number(item.quantity) : 1;
    let serviceItems = Array.isArray(item?.service_items) ? item.service_items : [];
    serviceItems = serviceItems
      .map((entry, index) => {
        const name = String(entry?.name || '').trim();
        if (!name) return null;
        const entryQuantity = Number(entry?.quantity ?? 1);
        return {
          id: String(entry?.id || serviceItemId(index, name, item?.menu_item_id || item?.name)),
          name: name.slice(0, 80),
          quantity: Number.isFinite(entryQuantity) && entryQuantity > 0 ? Math.min(999, Math.round(entryQuantity)) : 1,
          served: Boolean(entry?.served),
          served_at: entry?.served_at || null
        };
      })
      .filter(Boolean);

    if (serviceItems.length === 0 || serviceItemsLookLikeUnsplitSet(item, serviceItems)) {
      const inferred = inferServeComponentsFromName(item?.name);
      if (inferred.length > 0) {
        serviceItems = buildServiceItemsFromComponents(inferred, quantity, item?.menu_item_id || item?.name).map((entry) => ({
          ...entry,
          served: false,
          served_at: null
        }));
      }
    }

    if (serviceItems.length === 0) {
      serviceItems = [{
        id: serviceItemId(0, item?.name || '메뉴', item?.menu_item_id || item?.name),
        name: String(item?.name || '메뉴').slice(0, 80),
        quantity,
        served: ['served', true].includes(item?.served),
        served_at: item?.served_at || null
      }];
    }

    return { ...item, service_items: serviceItems };
  });
}

export function getServiceProgressFromItems(items) {
  const normalized = normalizeOrderItems(items);
  const all = normalized.flatMap((item) => item.service_items || []);
  const total = all.length;
  const served = all.filter((entry) => entry.served).length;
  return {
    total,
    served,
    remaining: Math.max(0, total - served),
    allServed: total > 0 && served === total,
    anyServed: served > 0
  };
}

export function getOrderServiceProgress(order) {
  return getServiceProgressFromItems(order?.items || []);
}
