import { useState, type SubmitEvent } from 'react'
import { ArrowRight, Bell, Building2, Check, ChevronDown, Settings2, ShieldCheck, UserRound } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DemoToggle from '../../components/DemoToggle'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import { getSettingsView } from '../../services/settingsViewService'
import type { SettingsView } from '../../types/settingsView'
import './styles.css'

const sections = [{ id: 'overview', title: 'Visão geral', icon: Settings2 }, { id: 'store', title: 'Dados da loja', icon: Building2 }, { id: 'notifications', title: 'Notificações', icon: Bell }, { id: 'security', title: 'Segurança', icon: ShieldCheck }, { id: 'preferences', title: 'Preferências', icon: UserRound }]

export default function Settings() {
  const { data, loading, error, retry } = useDemoData(getSettingsView)
  const [draft, setDraft] = useState<Partial<SettingsView>>({})
  const [section, setSection] = useState('overview')
  const [theme, setTheme] = useState('light')
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [accessOpen, setAccessOpen] = useState(false)
  const [exampleSession, setExampleSession] = useState(true)
  const [sessionMessage, setSessionMessage] = useState('')
  const settings = data ? { ...data, ...draft } : null

  function navigateSection(id: string) {
    setSection(id)
    const target = document.getElementById(`settings-${id}`)
    target?.focus({ preventScroll: true }); target?.scrollIntoView?.({ block: 'nearest' })
  }
  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!settings?.store.trim() || !settings.unit.trim()) { setFormError('Informe o nome da loja e a unidade.'); return }
    setDraft({ ...settings, store: settings.store.trim(), unit: settings.unit.trim(), email: settings.email.trim() })
    setFormError(''); setMessage('Preferências salvas somente nesta demonstração. Recarregar restaura os exemplos; a loja real não foi alterada.')
  }

  return <VisualPage title="Configurações" description="Personalize a loja, as notificações e as preferências do sistema." className={`settings${theme === 'dark' ? ' settings--dark' : ''}`}
    actions={<Button type="submit" form="settings-form" disabled={!settings} icon={<Check />}>Salvar alterações</Button>}>
    {message && <p className="visual-message" role="status">{message}</p>}{formError && <p role="alert" className="settings__error">{formError}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar as configurações." onRetry={retry} /> : loading || !settings ? <Feedback kind="loading" title="Carregando configurações…" /> : <div className="settings__layout" id="settings-overview" tabIndex={-1}>
      <aside className="settings__sidebar"><h2>Preferências da loja</h2><nav aria-label="Seções das configurações">{sections.map(({ id, title, icon: Icon }) => <button type="button" key={id} aria-current={section === id ? 'location' : undefined} onClick={() => navigateSection(id)}><Icon size={20} aria-hidden="true" />{title}</button>)}</nav>
        <Card tone="warm" className="settings__unit"><Building2 size={24} aria-hidden="true" /><h3>Unidade {settings.unit}</h3><p>As preferências desta página se aplicam à loja selecionada.</p></Card>
      </aside>
      <form id="settings-form" onSubmit={save} className="settings__content">
        <Card id="settings-store" tabIndex={-1} title="Dados da loja" description="Informações usadas no painel e nos relatórios" className="settings__store">
          <div className="visual-form"><div className="visual-form-row"><TextField label="Nome da loja" value={settings.store} required maxLength={80} onChange={(event) => setDraft({ ...draft, store: event.target.value })} /><TextField label="Unidade" value={settings.unit} required maxLength={60} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} /></div>
            <div className="visual-form-row"><TextField label="E-mail de contato" type="email" required maxLength={120} value={settings.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /><TextField label="Telefone" type="tel" maxLength={25} value={settings.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></div>
          </div><p className="settings__address">{settings.address}</p>
        </Card>
        <div className="settings__cards"><Card id="settings-preferences" tabIndex={-1} title="Preferências" className="settings__preferences">
          <div className="settings__preference-row"><label htmlFor="settings-language">Idioma</label><div className="settings__select"><select id="settings-language" defaultValue="pt-BR"><option value="pt-BR">Português (Brasil)</option></select><ChevronDown size={18} aria-hidden="true" /></div></div>
          <div className="settings__preference-row"><label htmlFor="settings-timezone">Fuso horário</label><div className="settings__select"><select id="settings-timezone" value={settings.timezone} onChange={(event) => setDraft({ ...draft, timezone: event.target.value })}><option value="America/Sao_Paulo">Brasília (GMT−3)</option><option value="America/Manaus">Manaus (GMT−4)</option></select><ChevronDown size={18} aria-hidden="true" /></div></div>
          <div className="settings__preference-row"><span>Tema</span><div className="settings__theme"><button type="button" aria-pressed={theme === 'light'} onClick={() => setTheme('light')}>Claro</button><button type="button" aria-pressed={theme === 'dark'} onClick={() => setTheme('dark')}>Escuro</button></div></div>
          {theme === 'dark' && <p className="settings__theme-note">Prévia do tema nesta página.</p>}
        </Card>
        <Card id="settings-notifications" tabIndex={-1} title="Notificações" className="settings__notifications"><div><div><h3>Alertas de ruptura</h3><p>Quando faltar produto na gôndola.</p></div><DemoToggle label="Alertas de ruptura" checked={settings.ruptureAlerts} onChange={(ruptureAlerts) => setDraft({ ...draft, ruptureAlerts })} /></div>
          <div><div><h3>Resumo por e-mail</h3><p>Indicadores ao final do expediente.</p></div><DemoToggle label="Resumo por e-mail" checked={settings.emailSummary} onChange={(emailSummary) => setDraft({ ...draft, emailSummary })} /></div>
        </Card></div>
        <section id="settings-security" tabIndex={-1} className="settings__security" aria-label="Sessões protegidas"><ShieldCheck size={28} aria-hidden="true" /><div><h2>Sessões protegidas</h2><p>Encerrar sessão após 30 minutos de inatividade · exemplo</p></div><Button variant="secondary" icon={<ArrowRight size={18} />} className="settings__manage" onClick={() => setAccessOpen(true)}>Gerenciar acessos</Button></section>
      </form>
    </div>}
    <Modal open={accessOpen} onClose={() => setAccessOpen(false)} title="Gerenciar acessos" description="Sessões fictícias. Nenhum acesso real é consultado ou encerrado." actions={<Button variant="secondary" onClick={() => setAccessOpen(false)}>Fechar</Button>}>
      <ul className="settings__sessions"><li><div><strong>Chrome · Windows</strong><p>Dispositivo de exemplo · Unidade Centro</p></div><Badge tone="success">Atual · Demo</Badge></li>
        {exampleSession && <li><div><strong>Celular de exemplo</strong><p>Último acesso ilustrativo: ontem, às 18:20</p></div><Button variant="secondary" onClick={() => { setExampleSession(false); setSessionMessage('Sessão de exemplo removida desta prévia. Nenhum acesso real foi encerrado.') }}>Encerrar exemplo</Button></li>}</ul>
      {sessionMessage && <p role="status" className="visual-message">{sessionMessage}</p>}
    </Modal>
  </VisualPage>
}
