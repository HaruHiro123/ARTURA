export function isBuyable(artwork) {
  return Boolean(
    artwork &&
    artwork.collectionType === 'shop' &&
    artwork.status === 'available' &&
    Number.isSafeInteger(Number(artwork.price)) &&
    Number(artwork.price) > 0
  )
}

export function sanitizeCartIds(value, catalog) {
  if (!Array.isArray(value)) return []
  const allowed = new Set(catalog.filter(isBuyable).map((artwork) => artwork.id))
  return [...new Set(value)].filter((id) => allowed.has(id))
}

export function cartReducer(ids, action) {
  switch (action.type) {
    case 'replace': return action.ids
    case 'add': return ids.includes(action.id) ? ids : [...ids, action.id]
    case 'remove': return ids.filter((id) => id !== action.id)
    case 'clear': return []
    default: return ids
  }
}
