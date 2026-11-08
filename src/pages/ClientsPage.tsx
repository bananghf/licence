import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useCrmStore } from '../store/useCrmStore'
import {
  Button,
  Field,
  Label,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import type { Company, Contact } from '../types'

export function ClientsPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'companies' ? 'companies' : 'contacts'
  const qParam = params.get('q') || ''
  const companies = useCrmStore((s) => s.companies)
  const contacts = useCrmStore((s) => s.contacts)
  const upsertCompany = useCrmStore((s) => s.upsertCompany)
  const deleteCompany = useCrmStore((s) => s.deleteCompany)
  const upsertContact = useCrmStore((s) => s.upsertContact)
  const deleteContact = useCrmStore((s) => s.deleteContact)

  const [q, setQ] = useState(qParam)
  const [companyForm, setCompanyForm] = useState<(Partial<Company> & { name: string }) | null>(
    null,
  )
  const [contactForm, setContactForm] = useState<(Partial<Contact> & { name: string }) | null>(
    null,
  )

  const setTab = (t: 'contacts' | 'companies') => {
    const next = new URLSearchParams(params)
    next.set('tab', t)
    setParams(next)
  }

  const companyMap = useMemo(
    () => Object.fromEntries(companies.map((c) => [c.id, c.name])),
    [companies],
  )

  const filteredContacts = useMemo(() => {
    const query = q.trim().toLowerCase()
    return contacts.filter((c) => {
      if (!query) return true
      return `${c.name} ${c.phone || ''} ${c.email || ''} ${companyMap[c.companyId || ''] || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [contacts, q, companyMap])

  const filteredCompanies = useMemo(() => {
    const query = q.trim().toLowerCase()
    return companies.filter((c) => {
      if (!query) return true
      return `${c.name} ${c.phone || ''} ${c.email || ''} ${c.inn || ''}`
        .toLowerCase()
        .includes(query)
    })
  }, [companies, q])

  return (
    <div>
      <PageHeader
        title="Клієнти"
        subtitle={`${contacts.length} контактів · ${companies.length} компаній`}
        actions={
          tab === 'contacts' ? (
            <Button
              variant="primary"
              onClick={() => setContactForm({ name: '', companyId: undefined })}
            >
              + Контакт
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setCompanyForm({ name: '' })}>
              + Компанія
            </Button>
          )
        }
      />

      <div className="tabs">
        <button
          type="button"
          className={`tab${tab === 'contacts' ? ' active' : ''}`}
          onClick={() => setTab('contacts')}
        >
          Контакти
        </button>
        <button
          type="button"
          className={`tab${tab === 'companies' ? ' active' : ''}`}
          onClick={() => setTab('companies')}
        >
          Компанії
        </button>
      </div>

      <div className="filters">
        <Field
          placeholder="Пошук…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ maxWidth: 280 }}
        />
      </div>

      <div className="panel">
        <div className="table-wrap">
          {tab === 'contacts' ? (
            <table className="data">
              <thead>
                <tr>
                  <th>Імʼя</th>
                  <th>Посада</th>
                  <th>Компанія</th>
                  <th>Телефон</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                    </td>
                    <td>{c.position || '—'}</td>
                    <td>{c.companyId ? companyMap[c.companyId] || '—' : '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>
                      <div className="btn-row">
                        <Button size="sm" variant="ghost" onClick={() => setContactForm(c)}>
                          Ред.
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Видалити ${c.name}?`)) deleteContact(c.id)
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">Немає контактів</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="data">
              <thead>
                <tr>
                  <th>Назва</th>
                  <th>ЄДРПОУ</th>
                  <th>Телефон</th>
                  <th>Email</th>
                  <th>Адреса</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCompanies.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <strong>{c.name}</strong>
                      {c.notes ? (
                        <div className="muted" style={{ fontSize: 12 }}>
                          {c.notes}
                        </div>
                      ) : null}
                    </td>
                    <td>{c.inn || '—'}</td>
                    <td>{c.phone || '—'}</td>
                    <td>{c.email || '—'}</td>
                    <td>{c.address || '—'}</td>
                    <td>
                      <div className="btn-row">
                        <Button size="sm" variant="ghost" onClick={() => setCompanyForm(c)}>
                          Ред.
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => {
                            if (confirm(`Видалити ${c.name}?`)) deleteCompany(c.id)
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">Немає компаній</div>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {contactForm ? (
        <Modal
          title={contactForm.id ? 'Редагувати контакт' : 'Новий контакт'}
          onClose={() => setContactForm(null)}
          footer={
            <>
              <Button onClick={() => setContactForm(null)}>Скасувати</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!contactForm.name.trim()) return
                  upsertContact(contactForm)
                  setContactForm(null)
                }}
              >
                Зберегти
              </Button>
            </>
          }
        >
          <div className="grid-2">
            <Label label="Імʼя">
              <Field
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                autoFocus
              />
            </Label>
            <Label label="Посада">
              <Field
                value={contactForm.position || ''}
                onChange={(e) => setContactForm({ ...contactForm, position: e.target.value })}
              />
            </Label>
            <Label label="Телефон">
              <Field
                value={contactForm.phone || ''}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
            </Label>
            <Label label="Email">
              <Field
                value={contactForm.email || ''}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
              />
            </Label>
            <Label label="Компанія">
              <Select
                value={contactForm.companyId || ''}
                onChange={(e) =>
                  setContactForm({
                    ...contactForm,
                    companyId: e.target.value || undefined,
                  })
                }
              >
                <option value="">—</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Label>
          </div>
          <Label label="Нотатки">
            <Textarea
              value={contactForm.notes || ''}
              onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
            />
          </Label>
        </Modal>
      ) : null}

      {companyForm ? (
        <Modal
          title={companyForm.id ? 'Редагувати компанію' : 'Нова компанія'}
          onClose={() => setCompanyForm(null)}
          footer={
            <>
              <Button onClick={() => setCompanyForm(null)}>Скасувати</Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (!companyForm.name.trim()) return
                  upsertCompany(companyForm)
                  setCompanyForm(null)
                }}
              >
                Зберегти
              </Button>
            </>
          }
        >
          <div className="grid-2">
            <Label label="Назва">
              <Field
                value={companyForm.name}
                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                autoFocus
              />
            </Label>
            <Label label="ЄДРПОУ / ІПН">
              <Field
                value={companyForm.inn || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, inn: e.target.value })}
              />
            </Label>
            <Label label="Телефон">
              <Field
                value={companyForm.phone || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
              />
            </Label>
            <Label label="Email">
              <Field
                value={companyForm.email || ''}
                onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
              />
            </Label>
          </div>
          <Label label="Адреса">
            <Field
              value={companyForm.address || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
            />
          </Label>
          <Label label="Нотатки">
            <Textarea
              value={companyForm.notes || ''}
              onChange={(e) => setCompanyForm({ ...companyForm, notes: e.target.value })}
            />
          </Label>
        </Modal>
      ) : null}
    </div>
  )
}
