import { useRef, useState } from 'react'
import { Bell, Building2, Settings2, ShieldCheck, UserRound } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import { useAuth } from '../../hooks/useAuth'
import { useSessionIdentity } from '../../hooks/useSessionIdentity'
import useTheme from '../../hooks/useTheme'
import './styles.css'
const sections = [{ id: 'overview', title: 'Visão geral', icon: Settings2 }, { id: 'store', title: 'Dados da loja', icon: Building2 }, { id: 'notifications', title: 'Notificações', icon: Bell }, { id: 'security', title: 'Segurança', icon: ShieldCheck }, { id: 'preferences', title: 'Preferências', icon: UserRound }]
export default function Settings() {
  const { email, user } = useSessionIdentity()
  const { state, signOut, refreshSession } = useAuth()
  const { theme, setTheme } = useTheme()
  const [section, setSection] = useState('overview')
  const [accessOpen, setAccessOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failure, setFailure] = useState('')
  const pending = useRef(false)
  function navigate(id: string) { setSection(id); const target = document.getElementById(`settings-${id}`); target?.focus({ preventScroll: true }); target?.scrollIntoView?.({ block: 'nearest' }) }
  async function refresh() {
    if (pending.current) return
    pending.current = true; setBusy(true); setFailure(''); setMessage('')
    try { await refreshSession(); setMessage('Verificação da sessão concluída.') } catch { setFailure('Não foi possível verificar a sessão.') }
    finally { pending.current = false; setBusy(false) }
  }
  async function logout() {
    if (pending.current) return
    pending.current = true; setBusy(true); setFailure('')
    try { await signOut() } catch { setFailure('Não foi possível encerrar a sessão.') }
    finally { pending.current = false; setBusy(false) }
  }
  return <VisualPage title="Configurações" description="Preferências do navegador e acesso da conta autenticada." className="settings" footer="Tema salvo neste navegador · dados da sessão autenticada"
    actions={<Button loading={busy} onClick={() => void refresh()}>Verificar sessão</Button>}>
    {message && <p role="status">{message}</p>}{!accessOpen && (failure || state.error) && <p role="alert">{failure || state.error}</p>}
    <div className="settings__layout"><aside className="settings__sidebar"><h2>Preferências</h2><nav aria-label="Seções de configurações">{sections.map(s => <button type="button" key={s.id} aria-current={section === s.id ? 'location' : undefined} onClick={() => navigate(s.id)}><s.icon size={18} aria-hidden="true" />{s.title}</button>)}</nav><Card tone="warm" className="settings__unit"><h3>Dados da loja</h3><p>Nome e unidade não foram informados nesta sessão.</p></Card></aside>
      <div className="settings__content" id="settings-overview" tabIndex={-1}>
        <Card title="Dados da loja" className="settings__store" id="settings-store" tabIndex={-1}><p>Estes dados estão disponíveis somente para consulta.</p><div className="visual-form"><div className="visual-form-row"><TextField label="Nome da loja" readOnly value="" placeholder="Não informado" /><TextField label="Unidade" readOnly value="" placeholder="Não informada" /></div><div className="visual-form-row"><TextField label="E-mail da conta" readOnly value={email} /><TextField label="Telefone da loja" readOnly value="" placeholder="Não informado" /></div></div></Card>
        <div className="settings__cards"><Card title="Preferências" className="settings__preferences" id="settings-preferences" tabIndex={-1}>
          <div className="settings__preference-row"><span>Idioma da aplicação</span><strong>Português (Brasil)</strong></div><div className="settings__preference-row"><span>Fuso do navegador</span><strong>{Intl.DateTimeFormat().resolvedOptions().timeZone}</strong></div>
          <div className="settings__preference-row"><span>Tema</span><div className="settings__theme" role="group" aria-label="Tema da interface">{(['light', 'dark'] as const).map(t => <button type="button" key={t} aria-pressed={theme === t} onClick={() => setTheme(t)}>{t === 'light' ? 'Claro' : 'Escuro'}</button>)}</div></div><p className="settings__theme-note">A escolha é aplicada imediatamente e salva neste navegador.</p>
        </Card><Card title="Notificações" className="settings__notifications" id="settings-notifications" tabIndex={-1}><div><div><h3>Alertas de ruptura</h3><p>Preferência não disponível para alteração.</p></div><Badge tone="neutral">Não informado</Badge></div><div><div><h3>Resumo por e-mail</h3><p>Preferência não disponível para alteração.</p></div><Badge tone="neutral">Não informado</Badge></div></Card></div>
        <section className="settings__security" id="settings-security" tabIndex={-1} aria-label="Segurança da sessão"><ShieldCheck aria-hidden="true" /><div><h2>Sessão autenticada</h2><p>{email}</p></div><Button variant="secondary" onClick={() => { setFailure(''); setAccessOpen(true) }}>Gerenciar acessos</Button></section>
      </div></div>
    <Modal open={accessOpen} onClose={() => { if (!pending.current) setAccessOpen(false) }} title="Gerenciar acessos" description="Ações sobre a sessão atual."
      actions={<><Button variant="secondary" disabled={busy} onClick={() => setAccessOpen(false)}>Fechar</Button><Button variant="danger" loading={busy || state.signingOut} onClick={() => void logout()}>Encerrar sessão atual</Button></>}>
      <dl className="visual-details"><div><dt>E-mail</dt><dd>{email}</dd></div><div><dt>Permissões</dt><dd>{user?.roles.join(', ') || 'Não informadas'}</dd></div></dl><p>Encerrar a sessão sai da conta neste navegador. A lista de outras sessões não está disponível.</p>{(failure || state.error) && <p role="alert">{failure || state.error}</p>}
    </Modal>
  </VisualPage>
}
