import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { STATUS_COLORS, STATUS_LABELS, SERVICE_LABELS, PAYMENT_LABELS, PURCHASE_LABELS } from '../lib/labels'
import type { OrderStatus, PaymentStatus, PurchaseStatus, ServiceType } from '../types'

export function Button({
  variant = 'default',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary' | 'accent' | 'ghost' | 'danger'
  size?: 'md' | 'sm'
}) {
  const v =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'accent'
        ? 'btn-accent'
        : variant === 'ghost'
          ? 'btn-ghost'
          : variant === 'danger'
            ? 'btn-danger'
            : ''
  return (
    <button
      className={`btn ${v} ${size === 'sm' ? 'btn-sm' : ''} ${className}`}
      {...props}
    />
  )
}

export function Field(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className="field" {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="select" {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="textarea" {...props} />
}

export function Label({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="label">
      <span>{label}</span>
      {children}
    </label>
  )
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className="badge" style={{ color: STATUS_COLORS[status] }}>
      {STATUS_LABELS[status]}
    </span>
  )
}

export function ServiceBadge({ type }: { type: ServiceType }) {
  return <span className="badge">{SERVICE_LABELS[type]}</span>
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const color =
    status === 'paid' ? 'var(--ok)' : status === 'partial' ? 'var(--warn)' : 'var(--muted)'
  return (
    <span className="badge" style={{ color }}>
      {PAYMENT_LABELS[status]}
    </span>
  )
}

export function PurchaseBadge({ status }: { status: PurchaseStatus }) {
  const color =
    status === 'received'
      ? 'var(--ok)'
      : status === 'ordered'
        ? 'var(--info)'
        : 'var(--warn)'
  return (
    <span className="badge" style={{ color }}>
      {PURCHASE_LABELS[status]}
    </span>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Modal({
  title,
  children,
  onClose,
  footer,
  wide,
}: {
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        style={wide ? { width: 'min(960px, 100%)' } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} type="button">
            ✕
          </Button>
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className="btn-row">{actions}</div> : null}
    </div>
  )
}

export function Stat({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="stat">
      <div className="k">{label}</div>
      <div className="v">{value}</div>
      {hint ? <div className="s">{hint}</div> : null}
    </div>
  )
}
