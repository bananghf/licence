import { format, parseISO, isValid } from 'date-fns'
import { uk } from 'date-fns/locale'
import type { EstimateLine, Order, PaymentStatus } from '../types'

export function money(value: number, currency = '₴'): string {
  return `${new Intl.NumberFormat('uk-UA', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))} ${currency}`
}

export function moneyExact(value: number, currency = '₴'): string {
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} ${currency}`
}

export function formatDate(iso?: string, pattern = 'd MMM yyyy'): string {
  if (!iso) return '—'
  const date = parseISO(iso)
  if (!isValid(date)) return '—'
  return format(date, pattern, { locale: uk })
}

export function formatDateTime(iso?: string): string {
  return formatDate(iso, 'd MMM yyyy, HH:mm')
}

export function lineTotal(line: EstimateLine): number {
  return line.qty * line.price
}

export function lineCost(line: EstimateLine): number {
  return line.qty * line.cost
}

export function orderSubtotal(order: Order): number {
  return order.lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function orderCost(order: Order): number {
  return order.lines.reduce((sum, line) => sum + lineCost(line), 0)
}

export function orderTotal(order: Order): number {
  const subtotal = orderSubtotal(order)
  const withMarkup = subtotal * (1 + (order.markupPercent || 0) / 100)
  return withMarkup * (1 - (order.discountPercent || 0) / 100)
}

export function orderPaid(order: Order): number {
  return order.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

export function orderPaymentStatus(order: Order): PaymentStatus {
  const total = orderTotal(order)
  const paid = orderPaid(order)
  if (paid <= 0) return 'unpaid'
  if (paid + 0.01 >= total) return 'paid'
  return 'partial'
}

export function orderMargin(order: Order): number {
  const total = orderTotal(order)
  if (total <= 0) return 0
  return ((total - orderCost(order)) / total) * 100
}

export function paymentLabel(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'Оплачено'
    case 'partial':
      return 'Частково'
    default:
      return 'Не оплачено'
  }
}
