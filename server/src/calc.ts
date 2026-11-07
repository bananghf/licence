import type { EstimateLine, Order, OrderTotals, PaymentStatus } from './types.js'

export function lineTotal(line: EstimateLine): number {
  return line.qty * line.price
}

export function lineCost(line: EstimateLine): number {
  return line.qty * line.cost
}

export function orderSubtotal(order: Pick<Order, 'lines'>): number {
  return order.lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function orderCost(order: Pick<Order, 'lines'>): number {
  return order.lines.reduce((sum, line) => sum + lineCost(line), 0)
}

export function orderTotal(
  order: Pick<Order, 'lines' | 'discountPercent' | 'markupPercent'>,
): number {
  const subtotal = orderSubtotal(order)
  const withMarkup = subtotal * (1 + (order.markupPercent || 0) / 100)
  return withMarkup * (1 - (order.discountPercent || 0) / 100)
}

export function orderPaid(order: Pick<Order, 'payments'>): number {
  return order.payments.reduce((sum, payment) => sum + payment.amount, 0)
}

export function orderPaymentStatus(
  order: Pick<Order, 'lines' | 'discountPercent' | 'markupPercent' | 'payments'>,
): PaymentStatus {
  const total = orderTotal(order)
  const paid = orderPaid(order)
  if (paid <= 0) return 'unpaid'
  if (paid + 0.01 >= total) return 'paid'
  return 'partial'
}

export function orderMargin(
  order: Pick<Order, 'lines' | 'discountPercent' | 'markupPercent'>,
): number {
  const total = orderTotal(order)
  if (total <= 0) return 0
  return ((total - orderCost(order)) / total) * 100
}

export function computeOrderTotals(
  order: Pick<Order, 'lines' | 'discountPercent' | 'markupPercent' | 'payments'>,
): OrderTotals {
  return {
    subtotal: orderSubtotal(order),
    cost: orderCost(order),
    total: orderTotal(order),
    paid: orderPaid(order),
    paymentStatus: orderPaymentStatus(order),
    marginPercent: orderMargin(order),
  }
}
