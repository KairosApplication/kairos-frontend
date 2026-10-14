export type LoginCredentials = {
  email: string
  password: string
}

export type SessionUser = {
  email: string
  roles: ('MANAGER' | 'EMPLOYEE' | 'CUSTOMER')[]
}

export type CsrfResponse = {
  headerName: string
  token: string
}
