import { profileDemo } from '../mocks/profileView'
import type { ProfileView } from '../types/profileView'
export function getProfileView(): Promise<ProfileView> { return Promise.resolve(structuredClone(profileDemo)) }
