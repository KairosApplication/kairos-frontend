export type LoginCredentials = {
  email: string
  password: string
}

export type AuthRole = 'MANAGER' | 'EMPLOYEE' | 'CUSTOMER'

export type SessionUser = {
  email: string
  roles: AuthRole[]
}

export type CsrfResponse = {
  headerName: string
  token: string
}
