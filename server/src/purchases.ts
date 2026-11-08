import { nanoid } from 'nanoid'
import type { CatalogItem, Order, Purchase, PurchaseItem } from './types.js'

/** Build purchase items from order lines using product ТТК/BOM. */
export function generatePurchaseItems(
  orders: Order[],
  catalog: CatalogItem[],
): PurchaseItem[] {
  const ingredientMap = new Map<
    string,
    { ingredientId?: string; name: string; unit: string; qty: number; price: number }
  >()

  const addIng = (
    key: string,
    data: {
      ingredientId?: string
      name: string
      unit: string
      qty: number
      price: number
    },
  ) => {
    const prev = ingredientMap.get(key)
    ingredientMap.set(key, {
      ...data,
      qty: Math.round(((prev?.qty || 0) + data.qty) * 1000) / 1000,
    })
  }

  for (const order of orders) {
    for (const line of order.lines) {
      if (line.kind !== 'product' && line.kind !== 'ingredient') continue
      const catalogItem = line.catalogItemId
        ? catalog.find((c) => c.id === line.catalogItemId)
        : undefined

      if (line.kind === 'ingredient') {
        addIng(line.catalogItemId || line.name, {
          ingredientId: line.catalogItemId,
          name: line.name,
          unit: line.unit,
          qty: line.qty,
          price: line.cost || catalogItem?.cost || 0,
        })
        continue
      }

      const bom = catalogItem?.composition?.filter((c) => c.qty > 0) || []
      if (bom.length > 0) {
        for (const row of bom) {
          const ing = catalog.find((c) => c.id === row.ingredientId)
          if (!ing) continue
          addIng(ing.id, {
            ingredientId: ing.id,
            name: ing.name,
            unit: ing.unit,
            qty: row.qty * line.qty,
            price: ing.cost,
          })
        }
        continue
      }

      if (catalogItem) {
        const related = catalog.filter(
          (c) =>
            c.kind === 'ingredient' &&
            (catalogItem.tags.some((t) => c.tags.includes(t)) ||
              c.category === catalogItem.category),
        )
        const share = Math.max(line.qty * 0.05, 0.2)
        for (const ing of related.slice(0, 3)) {
          addIng(ing.id, {
            ingredientId: ing.id,
            name: ing.name,
            unit: ing.unit,
            qty: share,
            price: ing.cost,
          })
        }
      }
    }
  }

  if (ingredientMap.size === 0) {
    catalog
      .filter((c) => c.kind === 'ingredient')
      .slice(0, 8)
      .forEach((ing) => {
        addIng(ing.id, {
          ingredientId: ing.id,
          name: ing.name,
          unit: ing.unit,
          qty: 1,
          price: ing.cost,
        })
      })
  }

  return [...ingredientMap.values()]
    .sort((a, b) => a.name.localeCompare(b.name, 'uk'))
    .map((item) => ({
      id: nanoid(8),
      ...item,
    }))
}

export function buildPurchaseFromOrders(
  orders: Order[],
  catalog: CatalogItem[],
  title?: string,
): Purchase {
  const items = generatePurchaseItems(orders, catalog)
  return {
    id: nanoid(8),
    title:
      title ||
      `Закупка: ${orders.map((o) => o.number).join(', ') || 'нове'}`,
    status: 'planned',
    orderIds: orders.map((o) => o.id),
    items,
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  }
}
