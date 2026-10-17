import { expectTypeOf, it } from 'vitest'
import type {
  AlertRequest, AlertResponse, CategoryUpdateRequest, CustomerRequest,
  EmployeeRequest, EmployeeResponse, EmployeeUpdateRequest, ProductRequest,
  ProductResponse, ProductUpdateRequest, RestockingRequest, RestockingResponse,
  SessionUser, UserRequest, UserResponse,
} from './index'

// These assertions are checked by tsc during npm run build, not by runtime JSON parsing.
it('separa o cargo retornado do cargo enviado e da role de autenticação', () => {
  expectTypeOf<EmployeeResponse['position']>().not.toExtend<EmployeeRequest['position']>()
  expectTypeOf<'MANAGER'>().toExtend<EmployeeRequest['position']>()
  expectTypeOf<'manager'>().toExtend<EmployeeResponse['position']>()
  expectTypeOf<'EMPLOYEE'>().toExtend<SessionUser['roles'][number]>()
  expectTypeOf<'EMPLOYEE'>().not.toExtend<EmployeeRequest['position']>()
})

it('exige campos de criação e permite atualizações parciais somente onde a API aceita', () => {
  expectTypeOf<{ name: string }>().not.toExtend<ProductRequest>()
  expectTypeOf<{ name: string }>().toExtend<ProductUpdateRequest>()
  expectTypeOf<{ price: null }>().toExtend<ProductUpdateRequest>()
  expectTypeOf<object>().not.toExtend<CategoryUpdateRequest>()
  expectTypeOf<object>().not.toExtend<EmployeeUpdateRequest>()
  expectTypeOf<{ userId: number }>().not.toExtend<CustomerRequest>()
})

it('preserva ausência e nulidade de campos opcionais dos alertas e avarias', () => {
  expectTypeOf<null>().toExtend<AlertResponse['employeeId']>()
  expectTypeOf<null>().toExtend<AlertResponse['resolutionDate']>()
  expectTypeOf<undefined>().not.toExtend<AlertResponse['employeeId']>()
  expectTypeOf<undefined>().toExtend<AlertRequest['employeeId']>()
  expectTypeOf<undefined>().toExtend<RestockingRequest['damagedQuantity']>()
  expectTypeOf<null | undefined>().not.toExtend<RestockingResponse['damagedQuantity']>()
})

it('mantém senha somente nos contratos de entrada e não inventa campos dos protótipos', () => {
  expectTypeOf<UserRequest>().toHaveProperty('password')
  expectTypeOf<UserResponse>().not.toHaveProperty('password')
  expectTypeOf<SessionUser>().not.toHaveProperty('password')
  expectTypeOf<ProductResponse>().not.toHaveProperty('sku')
  expectTypeOf<RestockingResponse>().not.toHaveProperty('status')
})
