export type OrderStatus =
  | 'draft'
  | 'new'
  | 'sent'
  | 'confirmed'
  | 'done'
  | 'lost'

export type PaymentStatus = 'unpaid' | 'partial' | 'paid'

export type ServiceType =
  | 'banquet'
  | 'buffet'
  | 'coffee'
  | 'delivery'
  | 'box'
  | 'bar'

export type CatalogKind = 'product' | 'service' | 'ingredient'

export type PurchaseStatus = 'planned' | 'ordered' | 'received'

export type StockMovementType = 'intake' | 'writeoff' | 'purchase'

export interface StockBalance {
  catalogItemId: string
  name: string
  kind: CatalogKind
  category: string
  unit: string
  quantity: number
  minQuantity: number
  lowStock: boolean
  updatedAt?: string
}

export interface StockMovement {
  id: string
  catalogItemId: string
  name?: string
  unit?: string
  type: StockMovementType
  qty: number
  date: string
  supplier?: string
  note?: string
  purchaseId?: string
  createdAt: string
  createdBy?: string
}

/** One line of a dish tech card (ТТК / BOM). qty is per 1 portion of the product. */
export interface CompositionLine {
  ingredientId: string
  qty: number
}

export interface Company {
  id: string
  name: string
  inn?: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  createdAt: string
}

export interface Contact {
  id: string
  name: string
  phone?: string
  email?: string
  position?: string
  companyId?: string
  notes?: string
  createdAt: string
}

export interface CatalogItem {
  id: string
  kind: CatalogKind
  name: string
  category: string
  unit: string
  price: number
  cost: number
  description?: string
  tags: string[]
  /** Ingredient BOM for products — drives purchase lists from orders. */
  composition?: CompositionLine[]
  active: boolean
}

export interface EstimateLine {
  id: string
  catalogItemId?: string
  name: string
  kind: CatalogKind
  unit: string
  qty: number
  price: number
  cost: number
  section: string
}

export interface Payment {
  id: string
  amount: number
  method: string
  paidAt: string
  note?: string
}

export interface Order {
  id: string
  number: string
  internalNumber?: string
  title: string
  status: OrderStatus
  serviceType: ServiceType
  eventStart: string
  eventEnd?: string
  guests: number
  portions: number
  address: string
  companyId?: string
  contactId?: string
  manager: string
  discountPercent: number
  markupPercent: number
  lines: EstimateLine[]
  payments: Payment[]
  notes?: string
  kitchenNotes?: string
  /** Production / prep date shown on kitchen sheets. */
  productionDate?: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface PurchaseItem {
  id: string
  ingredientId?: string
  name: string
  unit: string
  qty: number
  price: number
}

export interface Purchase {
  id: string
  title: string
  status: PurchaseStatus
  supplier?: string
  orderIds: string[]
  items: PurchaseItem[]
  dueDate: string
  createdAt: string
}

export interface AppSettings {
  companyName: string
  logoText: string
  currency: string
  timezone: string
  managers: string[]
  /** Named payment accounts / methods (cash, bank, etc.). */
  paymentAccounts: string[]
  trackPayments: boolean
  serviceTypes: { id: ServiceType; label: string }[]
  orderStatuses: { id: OrderStatus; label: string; color: string }[]
}

export interface CrmState {
  companies: Company[]
  contacts: Contact[]
  catalog: CatalogItem[]
  orders: Order[]
  purchases: Purchase[]
  settings: AppSettings
}
