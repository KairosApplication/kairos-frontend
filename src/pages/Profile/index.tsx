import { useState } from 'react'
import { Building2, Pencil, ShieldCheck } from 'lucide-react'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import Card from '../../components/Card'
import Feedback from '../../components/Feedback'
import Modal from '../../components/Modal'
import TextField from '../../components/TextField'
import VisualPage from '../../components/VisualPage'
import { useSessionIdentity } from '../../hooks/useSessionIdentity'
import { useAuth } from '../../hooks/useAuth'
import './styles.css'

export default function Profile() {
  const { email, initials, user, status } = useSessionIdentity()
  const { refreshSession } = useAuth()
  const [refreshing, setRefreshing] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const authorized = status === 'authenticated' && user?.roles.includes('MANAGER') === true

  return <VisualPage title="Meu perfil" description="Identificação e permissões da conta em uso." className="profile"
    footer={<><span>Identificação da conta</span><span>Somente consulta</span></>}
    actions={<Button loading={refreshing} onClick={() => { setRefreshing(true); void refreshSession().finally(() => setRefreshing(false)) }}>Atualizar identificação</Button>}>
    {!authorized ? <Feedback kind="error" title="Identificação indisponível." description="Entre com uma conta de gerente para consultar seu perfil." /> : <>
      <p className="visual-note">Seu perfil está disponível para consulta. Alterações de cadastro ainda não estão disponíveis neste painel.</p>
      <div className="profile__layout">
        <Card className="profile__identity" aria-label="Resumo da conta autenticada">
          <div className="profile__avatar" aria-hidden="true"><span>{initials}</span></div>
          <h2>{email}</h2><p>Gerente da loja</p><Badge tone="success">Conta autenticada</Badge>
          <div className="profile__store"><h3>Loja vinculada</h3><div><Building2 size={22} aria-hidden="true" /><p><strong>Não informada</strong><span>Unidade não informada</span></p></div></div>
          <small>Nome e vínculo com a loja não foram informados.</small>
        </Card>
        <div className="profile__content">
          <Card title="Informações pessoais" description="Dados de identificação disponíveis para esta conta" className="profile__personal">
            <div className="visual-form">
              <TextField label="Nome completo" value="" placeholder="Não informado" readOnly autoComplete="off" />
              <div className="visual-form-row"><TextField label="E-mail corporativo" type="email" value={email} readOnly autoComplete="off" /><TextField label="Telefone" type="tel" value="" placeholder="Não informado" readOnly autoComplete="off" /></div>
              <dl className="profile__permissions"><div><dt>Cargo</dt><dd>Gerente da loja</dd></div><div><dt>Permissão de acesso</dt><dd>Acesso ao painel do gerente</dd></div></dl>
            </div>
          </Card>
          <Card title="Segurança da conta" className="profile__security">
            <div className="profile__security-row"><ShieldCheck size={26} aria-hidden="true" /><div><h3>Senha de acesso</h3><p>Alteração indisponível neste painel.</p></div><Button variant="secondary" icon={<Pencil size={18} />} className="profile__password" onClick={() => setPasswordOpen(true)}>Alterar senha</Button></div>
            <div className="profile__security-row"><div><h3>Autenticação em duas etapas</h3><p>Configuração não informada.</p></div></div>
          </Card>
        </div>
      </div>
    </>}
    <Modal open={authorized && passwordOpen} onClose={() => setPasswordOpen(false)} title="Alterar senha"
      description="A alteração de senha não está disponível neste painel." actions={<Button variant="secondary" onClick={() => setPasswordOpen(false)}>Entendi</Button>}>
      <p>Este painel não recebe nem altera sua senha. Para solicitar a alteração, procure o administrador da loja.</p>
    </Modal>
  </VisualPage>
}
