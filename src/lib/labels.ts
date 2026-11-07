import type {
  OrderStatus,
  PaymentStatus,
  PurchaseStatus,
  ServiceType,
} from '../types'

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Чернетка',
  new: 'Нове',
  sent: 'Надіслано',
  confirmed: 'Підтверджено',
  done: 'Виконано',
  lost: 'Втрачено',
}

export const STATUS_COLORS: Record<OrderStatus, string> = {
  draft: '#8a8578',
  new: '#2f6fed',
  sent: '#c47a12',
  confirmed: '#0f7a4d',
  done: '#1f4d3a',
  lost: '#b42318',
}

export const SERVICE_LABELS: Record<ServiceType, string> = {
  banquet: 'Банкет',
  buffet: 'Фуршет',
  coffee: 'Кава-брейк',
  delivery: 'Доставка',
  box: 'Ланч-бокси',
  bar: 'Бар',
}

export const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'Не оплачено',
  partial: 'Частково',
  paid: 'Оплачено',
}

export const PURCHASE_LABELS: Record<PurchaseStatus, string> = {
  planned: 'Заплановано',
  ordered: 'Замовлено',
  received: 'Отримано',
}

export const KIND_LABELS = {
  product: 'Страви',
  service: 'Послуги',
  ingredient: 'Інгредієнти',
} as const
