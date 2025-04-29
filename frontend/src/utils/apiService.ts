import axios from '@/utils/axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface Account {
  id: number
  number: string
  name: string
  type: string
  subtype: string
  balance: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export const accountService = {
  getAll: async (): Promise<Account[]> => {
    const response = await api.get<Account[]>('/accounts')
    return response.data
  },

  getById: async (id: number): Promise<Account> => {
    const response = await api.get<Account>(`/accounts/${id}`)
    return response.data
  },

  create: async (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> => {
    const response = await api.post<Account>('/accounts', account)
    return response.data
  },

  update: async (id: number, account: Partial<Account>): Promise<Account> => {
    const response = await api.patch<Account>(`/accounts/${id}`, account)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/accounts/${id}`)
  },
} 