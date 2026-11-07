import { create } from 'zustand'
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
import { api, setToken, getToken } from '../lib/api'
import { createSeedState } from '../data/seed'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
}

interface CrmActions {
  hydrated: boolean
  loading: boolean
  authUser: AuthUser | null
  authError: string | null

  bootstrap: () => Promise<void>
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  resetDemo: () => Promise<void>

  upsertCompany: (company: Partial<Company> & { name: string }) => string
  deleteCompany: (id: string) => void

  upsertContact: (contact: Partial<Contact> & { name: string }) => string
  deleteContact: (id: string) => void

  upsertCatalogItem: (
    item: Partial<CatalogItem> & { name: string; kind: CatalogItem['kind'] },
  ) => string
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

const emptySettings = createSeedState().settings

function nextOrderNumber(orders: Order[]): string {
  const nums = orders
    .map((o) => parseInt(o.number.replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1000
  return `З-${max + 1}`
}

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

async function syncFail(label: string, err: unknown) {
  console.error(`[CRM API] ${label}`, err)
}

export const useCrmStore = create<CrmStore>()((set, get) => ({
  companies: [],
  contacts: [],
  catalog: [],
  orders: [],
  purchases: [],
  settings: emptySettings,
  hydrated: false,
  loading: false,
  authUser: null,
  authError: null,

  bootstrap: async () => {
    set({ loading: true, authError: null })
    try {
      if (!getToken()) {
        set({ hydrated: true, loading: false, authUser: null })
        return
      }
      const me = await api<{ user: AuthUser }>('/auth/me')
      const state = await api<CrmState>('/bootstrap')
      set({
        ...state,
        authUser: me.user,
        hydrated: true,
        loading: false,
      })
    } catch (err) {
      setToken(null)
      set({
        authUser: null,
        hydrated: true,
        loading: false,
        authError:
          err instanceof Error ? err.message : 'Не вдалося увійти в сесію',
      })
    }
  },

  login: async (email, password) => {
    set({ loading: true, authError: null })
    try {
      const result = await api<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      setToken(result.token)
      const state = await api<CrmState>('/bootstrap')
      set({
        ...state,
        authUser: result.user,
        hydrated: true,
        loading: false,
        authError: null,
      })
      return true
    } catch (err) {
      set({
        loading: false,
        authError: err instanceof Error ? err.message : 'Помилка входу',
      })
      return false
    }
  },

  logout: async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    setToken(null)
    set({
      authUser: null,
      companies: [],
      contacts: [],
      catalog: [],
      orders: [],
      purchases: [],
      settings: emptySettings,
    })
  },

  resetDemo: async () => {
    try {
      const state = await api<CrmState>('/settings/reset-demo', {
        method: 'POST',
      })
      set({ ...state })
    } catch (err) {
      await syncFail('resetDemo', err)
      throw err
    }
  },

  upsertCompany: (company) => {
    const id = company.id || nanoid(8)
    const existing = get().companies.find((c) => c.id === id)
    const next: Company = existing
      ? { ...existing, ...company, id }
      : {
          id,
          name: company.name,
          inn: company.inn,
          phone: company.phone,
          email: company.email,
          address: company.address,
          notes: company.notes,
          createdAt: new Date().toISOString(),
        }
    set((state) => ({
      companies: existing
        ? state.companies.map((c) => (c.id === id ? next : c))
        : [...state.companies, next],
    }))
    if (existing) {
      void api(`/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertCompany', e))
    } else {
      void api('/companies', {
        method: 'POST',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertCompany', e))
    }
    return id
  },

  deleteCompany: (id) => {
    set((state) => ({
      companies: state.companies.filter((c) => c.id !== id),
      contacts: state.contacts.map((c) =>
        c.companyId === id ? { ...c, companyId: undefined } : c,
      ),
    }))
    void api(`/companies/${id}`, { method: 'DELETE' }).catch((e) =>
      syncFail('deleteCompany', e),
    )
  },

  upsertContact: (contact) => {
    const id = contact.id || nanoid(8)
    const existing = get().contacts.find((c) => c.id === id)
    const next: Contact = existing
      ? { ...existing, ...contact, id }
      : {
          id,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          position: contact.position,
          companyId: contact.companyId,
          notes: contact.notes,
          createdAt: new Date().toISOString(),
        }
    set((state) => ({
      contacts: existing
        ? state.contacts.map((c) => (c.id === id ? next : c))
        : [...state.contacts, next],
    }))
    if (existing) {
      void api(`/contacts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertContact', e))
    } else {
      void api('/contacts', {
        method: 'POST',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertContact', e))
    }
    return id
  },

  deleteContact: (id) => {
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
    }))
    void api(`/contacts/${id}`, { method: 'DELETE' }).catch((e) =>
      syncFail('deleteContact', e),
    )
  },

  upsertCatalogItem: (item) => {
    const id = item.id || nanoid(8)
    const existing = get().catalog.find((c) => c.id === id)
    const next: CatalogItem = existing
      ? { ...existing, ...item, id }
      : {
          id,
          kind: item.kind,
          name: item.name,
          category: item.category || 'Інше',
          unit: item.unit || 'шт.',
          price: item.price ?? 0,
          cost: item.cost ?? 0,
          description: item.description,
          tags: item.tags || [],
          composition: item.composition || [],
          active: item.active ?? true,
        }
    set((state) => ({
      catalog: existing
        ? state.catalog.map((c) => (c.id === id ? next : c))
        : [...state.catalog, next],
    }))
    if (existing) {
      void api(`/catalog/${id}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertCatalogItem', e))
    } else {
      void api('/catalog', {
        method: 'POST',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertCatalogItem', e))
    }
    return id
  },

  deleteCatalogItem: (id) => {
    set((state) => ({
      catalog: state.catalog.filter((c) => c.id !== id),
    }))
    void api(`/catalog/${id}`, { method: 'DELETE' }).catch((e) =>
      syncFail('deleteCatalogItem', e),
    )
  },

  createOrder: (partial) => {
    const state = get()
    const order = {
      ...blankOrder(state.settings.managers, nextOrderNumber(state.orders)),
      ...partial,
      id: partial?.id || nanoid(8),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    set({ orders: [order, ...state.orders] })
    void api('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }).catch((e) => syncFail('createOrder', e))
    return order.id
  },

  updateOrder: (id, patch) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? { ...o, ...patch, id, updatedAt: new Date().toISOString() }
          : o,
      ),
    }))
    const order = get().orders.find((o) => o.id === id)
    if (!order) return
    void api(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    }).catch((e) => syncFail('updateOrder', e))
  },

  deleteOrder: (id) => {
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== id),
    }))
    void api(`/orders/${id}`, { method: 'DELETE' }).catch((e) =>
      syncFail('deleteOrder', e),
    )
  },

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
    // Persist with the same client id so optimistic navigation stays valid
    void api('/orders', {
      method: 'POST',
      body: JSON.stringify(copy),
    }).catch((e) => syncFail('duplicateOrder', e))
    return copy.id
  },

  setOrderLines: (id, lines) => {
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === id
          ? { ...o, lines, updatedAt: new Date().toISOString() }
          : o,
      ),
    }))
    void api(`/orders/${id}/lines`, {
      method: 'PUT',
      body: JSON.stringify({ lines }),
    }).catch((e) => syncFail('setOrderLines', e))
  },

  addPayment: (orderId, payment) => {
    const full: Payment = { ...payment, id: nanoid(8) }
    set((state) => ({
      orders: state.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              payments: [...o.payments, full],
              updatedAt: new Date().toISOString(),
            }
          : o,
      ),
    }))
    void api(`/orders/${orderId}/payments`, {
      method: 'POST',
      body: JSON.stringify(full),
    }).catch((e) => syncFail('addPayment', e))
  },

  removePayment: (orderId, paymentId) => {
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
    }))
    void api(`/orders/${orderId}/payments/${paymentId}`, {
      method: 'DELETE',
    }).catch((e) => syncFail('removePayment', e))
  },

  upsertPurchase: (purchase) => {
    const id = purchase.id || nanoid(8)
    const existing = get().purchases.find((p) => p.id === id)
    const next: Purchase = existing
      ? { ...existing, ...purchase, id }
      : {
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
        }
    set((state) => ({
      purchases: existing
        ? state.purchases.map((p) => (p.id === id ? next : p))
        : [next, ...state.purchases],
    }))
    if (existing) {
      void api(`/purchases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertPurchase', e))
    } else {
      void api('/purchases', {
        method: 'POST',
        body: JSON.stringify(next),
      }).catch((e) => syncFail('upsertPurchase', e))
    }
    return id
  },

  setPurchaseStatus: (id, status) => {
    set((state) => ({
      purchases: state.purchases.map((p) =>
        p.id === id ? { ...p, status } : p,
      ),
    }))
    void api(`/purchases/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }).catch((e) => syncFail('setPurchaseStatus', e))
  },

  deletePurchase: (id) => {
    set((state) => ({
      purchases: state.purchases.filter((p) => p.id !== id),
    }))
    void api(`/purchases/${id}`, { method: 'DELETE' }).catch((e) =>
      syncFail('deletePurchase', e),
    )
  },

  generatePurchaseFromOrders: (orderIds, title) => {
    const tempId = nanoid(8)
    // Optimistic placeholder; replaced when API returns
    const placeholder: Purchase = {
      id: tempId,
      title: title || 'Закупка…',
      status: 'planned',
      orderIds,
      items: [],
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    }
    set((state) => ({ purchases: [placeholder, ...state.purchases] }))
    void api<Purchase>('/purchases/generate', {
      method: 'POST',
      body: JSON.stringify({ orderIds, title }),
    })
      .then((purchase) => {
        set((state) => ({
          purchases: state.purchases.map((p) =>
            p.id === tempId ? purchase : p,
          ),
        }))
      })
      .catch((e) => {
        set((state) => ({
          purchases: state.purchases.filter((p) => p.id !== tempId),
        }))
        void syncFail('generatePurchaseFromOrders', e)
      })
    return tempId
  },

  updateSettings: (patch) => {
    set((state) => ({
      settings: { ...state.settings, ...patch },
    }))
    const settings = get().settings
    void api('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }).catch((e) => syncFail('updateSettings', e))
  },

  addManager: (name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const managers = get().settings.managers.includes(trimmed)
      ? get().settings.managers
      : [...get().settings.managers, trimmed]
    get().updateSettings({ managers })
  },

  removeManager: (name) => {
    get().updateSettings({
      managers: get().settings.managers.filter((m) => m !== name),
    })
  },
}))
