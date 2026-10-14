import { ArrowRight, ChartColumn, Eye, EyeOff, Lightbulb, Mail, Map, RefreshCw, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import logo from '../../assets/kairos-logo.svg'
import { login } from '../../services/authService'
import './styles.css'

type FieldErrors = { email?: string; password?: string }

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    const nextErrors: FieldErrors = {}
    if (!email.trim()) nextErrors.email = 'Informe seu e-mail corporativo.'
    else if (emailRef.current?.validity.typeMismatch) nextErrors.email = 'Informe um e-mail válido.'
    if (!password) nextErrors.password = 'Informe sua senha.'
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) emailRef.current?.focus()
      else passwordRef.current?.focus()
      return
    }

    submittingRef.current = true
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/dashboard', { replace: true })
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setPassword('')
      setShowPassword(false)
      submittingRef.current = false
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <aside className="login-brand" aria-label="Sobre o KAIROS">
        <img className="login-brand__logo" src={logo} alt="KAIROS" />
        <div className="login-brand__intro">
          <p className="login-brand__eyebrow">Gestão no tempo certo</p>
          <h2>Sua loja conectada.<br />Suas decisões<br />mais inteligentes.</h2>
          <p className="login-brand__description">Vendas, estoque e pessoas em um só lugar.<br />Mais clareza para cuidar do que importa.</p>
        </div>
        <section className="login-brand__card" aria-labelledby="login-brand-card-title">
          <div className="login-brand__card-heading">
            <span className="login-brand__card-icon"><ChartColumn size={24} aria-hidden="true" /></span>
            <div>
              <h3 id="login-brand-card-title">Tudo no seu tempo.</h3>
              <p>Uma visão completa da operação.</p>
            </div>
          </div>
          <ul>
            <li><Map size={18} aria-hidden="true" />Visibilidade</li>
            <li><RefreshCw size={18} aria-hidden="true" />Agilidade</li>
            <li><Lightbulb size={18} aria-hidden="true" />Inteligência</li>
          </ul>
        </section>
        <p className="login-brand__footer">KAIROS · Gestão que acompanha o seu ritmo</p>
      </aside>

      <div className="login-access">
        <section className="login-access__content" aria-labelledby="login-title">
          <span className="login-access__badge">Acesso do gerente</span>
          <h1 id="login-title">Bem-vindo de volta</h1>
          <p className="login-access__intro">Entre na sua conta para acompanhar a loja.</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <div className="login-form__field">
              <label htmlFor="login-email">E-mail corporativo</label>
              <div className="login-form__input">
                <input
                  id="login-email" name="email" type="email" autoComplete="username"
                  autoCapitalize="none" spellCheck={false} required
                  placeholder="nome@empresa.com.br" value={email} ref={emailRef}
                  disabled={loading} aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'login-email-error' : undefined}
                  onChange={(event) => { setEmail(event.target.value); setErrors((previous) => ({ ...previous, email: undefined })) }}
                />
                <Mail size={18} aria-hidden="true" />
              </div>
              {errors.email && <p className="login-form__field-error" id="login-email-error" role="alert">{errors.email}</p>}
            </div>

            <div className="login-form__field">
              <label htmlFor="login-password">Senha</label>
              <div className="login-form__input">
                <input
                  id="login-password" name="password" type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password" required placeholder="Digite sua senha"
                  value={password} ref={passwordRef} disabled={loading}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'login-password-error' : undefined}
                  onChange={(event) => { setPassword(event.target.value); setErrors((previous) => ({ ...previous, password: undefined })) }}
                />
                <button type="button" className="login-form__visibility" disabled={loading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}
                  aria-controls="login-password" onClick={() => setShowPassword((show) => !show)}>
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p className="login-form__field-error" id="login-password-error" role="alert">{errors.password}</p>}
            </div>

            <div className="login-form__recovery">
              <button type="button" className="login-form__help-button" aria-expanded={showHelp}
                aria-controls="login-recovery-help" onClick={() => setShowHelp((show) => !show)}>
                Esqueci minha senha
              </button>
            </div>
            {showHelp && <p className="login-form__help" id="login-recovery-help" role="status">Para recuperar seu acesso, fale com o administrador da loja.</p>}
            {error && <p className="login-form__error" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}

            <button className="login-form__submit" type="submit" disabled={loading}>
              <ArrowRight size={20} aria-hidden="true" />
              {loading ? 'Entrando…' : 'Entrar no painel'}
            </button>
            <p className="login-form__status" role="status">{loading ? 'Verificando seu acesso. Aguarde.' : ''}</p>
          </form>

          <p className="login-access__exclusive">Acesso exclusivo a contas autorizadas pela loja.</p>
          <p className="login-access__security"><ShieldCheck size={20} aria-hidden="true" />Seus dados protegidos em cada acesso.</p>
        </section>
        <p className="login-access__footer">Precisa de ajuda? Fale com o administrador da loja.</p>
      </div>
    </main>
  )
}

export default Login
