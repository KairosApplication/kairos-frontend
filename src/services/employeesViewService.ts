import { employeesDemo } from '../mocks/employeesView'
import type { EmployeeView } from '../types/employeesView'
export function getEmployeesView(): Promise<EmployeeView[]> { return Promise.resolve(structuredClone(employeesDemo)) }
