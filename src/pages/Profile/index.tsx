import { useEffect, useRef, useState, type ChangeEvent, type SubmitEvent } from 'react'
import { Building2, Check, Pencil, ShieldCheck } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import DemoToggle from '../../components/DemoToggle'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import useDemoData from '../../hooks/useDemoData'
import { getProfileView } from '../../services/profileViewService'
import type { ProfileView } from '../../types/profileView'
import './styles.css'

export default function Profile() {
  const { data, loading, error, retry } = useDemoData(getProfileView)
  const [draft, setDraft] = useState<Partial<ProfileView>>({})
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [avatar, setAvatar] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const nameInput = useRef<HTMLInputElement>(null)
  const profile = data ? { ...data, ...draft } : null
  useEffect(() => () => { if (avatar) URL.revokeObjectURL(avatar) }, [avatar])

  function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!profile) return
    if (!profile.name.trim()) { setFormError('Informe seu nome.'); nameInput.current?.focus(); return }
    setDraft({ ...profile, name: profile.name.trim(), email: profile.email.trim() })
    setFormError(''); setMessage('Perfil demonstrativo atualizado. Sua conta real não foi alterada; recarregar restaura os exemplos.')
  }
  function photo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setFormError('Escolha uma imagem PNG, JPEG ou WebP de até 2 MB.'); event.target.value = ''; return
    }
    try { setAvatar(URL.createObjectURL(file)); setFormError(''); setMessage('Foto em prévia local. Nenhum arquivo foi enviado à loja.') }
    catch { setFormError('Não foi possível abrir a imagem. Tente outro arquivo.') }
    event.target.value = ''
  }

  return <VisualPage title="Meu perfil" description="Mantenha suas informações e preferências de acesso atualizadas." className="profile"
    actions={<Button type="submit" form="profile-form" disabled={!profile} icon={<Check />}>Salvar alterações</Button>}>
    {message && <p role="status" className="visual-message">{message}</p>}{formError && <p role="alert" className="profile__error">{formError}</p>}
    {error ? <Feedback kind="error" title="Não foi possível carregar o perfil." onRetry={retry} /> : loading || !profile ? <Feedback kind="loading" title="Carregando perfil…" /> : <div className="profile__layout">
      <Card className="profile__identity" aria-label="Resumo do perfil demonstrativo"><div className="profile__avatar">{avatar ? <img src={avatar} alt="Prévia da foto de perfil" /> : <span>{profile.name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('')}</span>}</div>
        <h2>{profile.name}</h2><p>{profile.role}</p><Badge tone="success">Conta ativa</Badge>
        <Button variant="secondary" icon={<Pencil size={18} />} onClick={() => fileInput.current?.click()}>Alterar foto</Button><input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" onChange={photo} aria-label="Selecionar foto do perfil" hidden />
        <div className="profile__store"><h3>Loja vinculada</h3><div><Building2 size={22} aria-hidden="true" /><p><strong>{profile.store}</strong><span>{profile.unit}</span></p></div></div>
        <small>Gerente desde {profile.since}</small>
      </Card>
      <div className="profile__content"><Card title="Informações pessoais" description="Dados usados para identificação e contato" className="profile__personal">
        <form id="profile-form" onSubmit={save} className="visual-form"><TextField ref={nameInput} label="Nome completo" required maxLength={80} autoComplete="name" value={profile.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
          <div className="visual-form-row"><TextField label="E-mail corporativo" type="email" required maxLength={120} autoComplete="email" value={profile.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /><TextField label="Telefone" type="tel" autoComplete="tel" maxLength={25} value={profile.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} /></div>
          <dl className="profile__permissions"><div><dt>Cargo</dt><dd>{profile.role}</dd></div><div><dt>Permissão de acesso</dt><dd>{profile.permission}</dd></div></dl>
        </form>
      </Card>
      <Card title="Segurança da conta" className="profile__security"><div className="profile__security-row"><ShieldCheck size={26} aria-hidden="true" /><div><h3>Senha de acesso</h3><p>Última alteração há 30 dias · exemplo</p></div><Button variant="secondary" icon={<Pencil size={18} />} className="profile__password" onClick={() => setPasswordOpen(true)}>Alterar senha</Button></div>
        <div className="profile__security-row"><div><h3>Autenticação em duas etapas</h3><p>Uma camada extra de proteção para sua conta.</p></div><DemoToggle label="Autenticação em duas etapas" checked={profile.twoFactor} onChange={(twoFactor) => { setDraft({ ...draft, twoFactor }); setMessage('Prévia de segurança alterada. Nenhuma configuração real da conta foi modificada.') }} /></div>
      </Card></div>
    </div>}
    <Modal open={passwordOpen} onClose={() => setPasswordOpen(false)} title="Alterar senha" description="Prévia da área de segurança, sem alteração da sua conta." actions={<Button variant="secondary" onClick={() => setPasswordOpen(false)}>Entendi</Button>}><p>Esta demonstração não recebe nem altera sua senha. A troca de senha será disponibilizada com a autenticação integrada.</p></Modal>
  </VisualPage>
}
