import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type {
  CatalogItem,
  Company,
  Contact,
  CrmState,
  Order,
  Purchase,
  AppSettings,
  EstimateLine,
  Payment,
} from '../types'
import { createSeedState } from '../data/seed'

interface CrmActions {
  resetDemo: () => void

  upsertCompany: (company: Partial<Company> & { name: string }) => string
  deleteCompany: (id: string) => void

  upsertContact: (contact: Partial<Contact> & { name: string }) => string
  deleteContact: (id: string) => void

  upsertCatalogItem: (item: Partial<CatalogItem> & { name: string; kind: CatalogItem['kind'] }) => string
  deleteCatalogItem: (id: string) => void

  createOrder: (partial?: Partial<Order>) => string
  updateOrder: (id: string, patch: Partial<Order>) => void
  deleteOrder: (id: string) => void
  duplicateOrder: (id: string) => string
  setOrderLines: (id: string, lines: EstimateLine[]) => void
  addPayment: (orderId: string, payment: Omit<Payment, 'id'>) => void
  removePayment: (orderId: string, paymentId: string) => void

  upsertPurchase: (purchase: Partial<Purchase> & { title: string }) => string
  setPurchaseStatus: (id: string, status: Purchase['status']) => void
  deletePurchase: (id: string) => void
  generatePurchaseFromOrders: (orderIds: string[], title?: string) => string

  updateSettings: (patch: Partial<AppSettings>) => void
  addManager: (name: string) => void
  removeManager: (name: string) => void
}

export type CrmStore = CrmState & CrmActions

const blankOrder = (managers: string[], nextNumber: string): Order => {
  const now = new Date().toISOString()
  return {
    id: nanoid(8),
    number: nextNumber,
    title: 'Нове замовлення',
    status: 'draft',
    serviceType: 'banquet',
    eventStart: new Date(Date.now() + 7 * 86400000).toISOString(),
    guests: 20,
    portions: 20,
    address: '',
    manager: managers[0] || '',
    discountPercent: 0,
    markupPercent: 0,
    lines: [],
    payments: [],
    published: false,
    createdAt: now,
    updatedAt: now,
  }
}

function nextOrderNumber(orders: Order[]): string {
  const nums = orders
    .map((o) => parseInt(o.number.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1000
  return `З-${max + 1}`
}

export const useCrmStore = create<CrmStore>()(
  persist(
    (set, get) => ({
      ...createSeedState(),

      resetDemo: () => set(createSeedState()),

      upsertCompany: (company) => {
        const id = company.id || nanoid(8)
        set((state) => {
          const existing = state.companies.find((c) => c.id === id)
          if (existing) {
            return {
              companies: state.companies.map((c) =>
                c.id === id ? { ...c, ...company, id } : c,
              ),
            }
          }
          return {
            companies: [
              ...state.companies,
              {
                id,
                name: company.name,
                inn: company.inn,
                phone: company.phone,
                email: company.email,
                address: company.address,
                notes: company.notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        })
        return id
      },

      deleteCompany: (id) =>
        set((state) => ({
          companies: state.companies.filter((c) => c.id !== id),
          contacts: state.contacts.map((c) =>
            c.companyId === id ? { ...c, companyId: undefined } : c,
          ),
        })),

      upsertContact: (contact) => {
        const id = contact.id || nanoid(8)
        set((state) => {
          const existing = state.contacts.find((c) => c.id === id)
          if (existing) {
            return {
              contacts: state.contacts.map((c) =>
                c.id === id ? { ...c, ...contact, id } : c,
              ),
            }
          }
          return {
            contacts: [
              ...state.contacts,
              {
                id,
                name: contact.name,
                phone: contact.phone,
                email: contact.email,
                position: contact.position,
                companyId: contact.companyId,
                notes: contact.notes,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        })
        return id
      },

      deleteContact: (id) =>
        set((state) => ({
          contacts: state.contacts.filter((c) => c.id !== id),
        })),

      upsertCatalogItem: (item) => {
        const id = item.id || nanoid(8)
        set((state) => {
          const existing = state.catalog.find((c) => c.id === id)
          if (existing) {
            return {
              catalog: state.catalog.map((c) =>
                c.id === id ? { ...c, ...item, id } : c,
              ),
            }
          }
          return {
            catalog: [
              ...state.catalog,
              {
                id,
                kind: item.kind,
                name: item.name,
                category: item.category || 'Інше',
                unit: item.unit || 'шт.',
                price: item.price ?? 0,
                cost: item.cost ?? 0,
                description: item.description,
                tags: item.tags || [],
                active: item.active ?? true,
              },
            ],
          }
        })
        return id
      },

      deleteCatalogItem: (id) =>
        set((state) => ({
          catalog: state.catalog.filter((c) => c.id !== id),
        })),

      createOrder: (partial) => {
        const state = get()
        const order = {
          ...blankOrder(state.settings.managers, nextOrderNumber(state.orders)),
          ...partial,
          id: nanoid(8),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set({ orders: [order, ...state.orders] })
        return order.id
      },

      updateOrder: (id, patch) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, ...patch, id, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      deleteOrder: (id) =>
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== id),
        })),

      duplicateOrder: (id) => {
        const source = get().orders.find((o) => o.id === id)
        if (!source) return ''
        const copy: Order = {
          ...structuredClone(source),
          id: nanoid(8),
          number: nextOrderNumber(get().orders),
          title: `${source.title} (копія)`,
          status: 'draft',
          published: false,
          payments: [],
          lines: source.lines.map((l) => ({ ...l, id: nanoid(8) })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ orders: [copy, ...state.orders] }))
        return copy.id
      },

      setOrderLines: (id, lines) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === id
              ? { ...o, lines, updatedAt: new Date().toISOString() }
              : o,
          ),
        })),

      addPayment: (orderId, payment) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payments: [...o.payments, { ...payment, id: nanoid(8) }],
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
        })),

      removePayment: (orderId, paymentId) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  payments: o.payments.filter((p) => p.id !== paymentId),
                  updatedAt: new Date().toISOString(),
                }
              : o,
          ),
        })),

      upsertPurchase: (purchase) => {
        const id = purchase.id || nanoid(8)
        set((state) => {
          const existing = state.purchases.find((p) => p.id === id)
          if (existing) {
            return {
              purchases: state.purchases.map((p) =>
                p.id === id ? { ...p, ...purchase, id } : p,
              ),
            }
          }
          return {
            purchases: [
              {
                id,
                title: purchase.title,
                status: purchase.status || 'planned',
                supplier: purchase.supplier,
                orderIds: purchase.orderIds || [],
                items: purchase.items || [],
                dueDate:
                  purchase.dueDate ||
                  new Date(Date.now() + 3 * 86400000).toISOString(),
                createdAt: new Date().toISOString(),
              },
              ...state.purchases,
            ],
          }
        })
        return id
      },

      setPurchaseStatus: (id, status) =>
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === id ? { ...p, status } : p,
          ),
        })),

      deletePurchase: (id) =>
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== id),
        })),

      generatePurchaseFromOrders: (orderIds, title) => {
        const state = get()
        const selected = state.orders.filter((o) => orderIds.includes(o.id))
        const ingredientMap = new Map<
          string,
          { ingredientId?: string; name: string; unit: string; qty: number; price: number }
        >()

        for (const order of selected) {
          for (const line of order.lines) {
            if (line.kind !== 'product' && line.kind !== 'ingredient') continue
            const catalogItem = line.catalogItemId
              ? state.catalog.find((c) => c.id === line.catalogItemId)
              : undefined

            if (line.kind === 'ingredient') {
              const key = line.catalogItemId || line.name
              const prev = ingredientMap.get(key)
              ingredientMap.set(key, {
                ingredientId: line.catalogItemId,
                name: line.name,
                unit: line.unit,
                qty: (prev?.qty || 0) + line.qty,
                price: line.cost || catalogItem?.cost || 0,
              })
              continue
            }

            // Heuristic: product lines pull matching ingredient categories by tags/name tokens
            if (catalogItem) {
              const related = state.catalog.filter(
                (c) =>
                  c.kind === 'ingredient' &&
                  (catalogItem.tags.some((t) => c.tags.includes(t)) ||
                    c.category === catalogItem.category),
              )
              const share = Math.max(line.qty * 0.05, 0.2)
              for (const ing of related.slice(0, 3)) {
                const prev = ingredientMap.get(ing.id)
                ingredientMap.set(ing.id, {
                  ingredientId: ing.id,
                  name: ing.name,
                  unit: ing.unit,
                  qty: Math.round(((prev?.qty || 0) + share) * 10) / 10,
                  price: ing.cost,
                })
              }
            }
          }
        }

        // Fallback: if empty, pull top used ingredients
        if (ingredientMap.size === 0) {
          state.catalog
            .filter((c) => c.kind === 'ingredient')
            .slice(0, 8)
            .forEach((ing) => {
              ingredientMap.set(ing.id, {
                ingredientId: ing.id,
                name: ing.name,
                unit: ing.unit,
                qty: 1,
                price: ing.cost,
              })
            })
        }

        const items = [...ingredientMap.values()].map((item) => ({
          id: nanoid(8),
          ...item,
        }))

        const id = nanoid(8)
        const purchase: Purchase = {
          id,
          title:
            title ||
            `Закупка: ${selected.map((o) => o.number).join(', ') || 'нове'}`,
          status: 'planned',
          orderIds,
          items,
          dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
          createdAt: new Date().toISOString(),
        }
        set({ purchases: [purchase, ...state.purchases] })
        return id
      },

      updateSettings: (patch) =>
        set((state) => ({
          settings: { ...state.settings, ...patch },
        })),

      addManager: (name) => {
        const trimmed = name.trim()
        if (!trimmed) return
        set((state) => ({
          settings: {
            ...state.settings,
            managers: state.settings.managers.includes(trimmed)
              ? state.settings.managers
              : [...state.settings.managers, trimmed],
          },
        }))
      },

      removeManager: (name) =>
        set((state) => ({
          settings: {
            ...state.settings,
            managers: state.settings.managers.filter((m) => m !== name),
          },
        })),
    }),
    {
      name: 'shastya-crm-v1',
    },
  ),
)
