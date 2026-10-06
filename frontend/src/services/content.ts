import { http } from './http'
import type { Block, Language, Resource } from '../types'

export async function fetchLanguages(): Promise<Language[]> {
  const { data } = await http.get<Language[]>('/languages')
  return data
}

export async function fetchBlocks(code: string): Promise<Block[]> {
  const { data } = await http.get<Block[]>(`/languages/${encodeURIComponent(code)}/blocks`)
  return [...data].sort((a, b) => a.order - b.order)
}

export async function fetchResources(code: string): Promise<Resource[]> {
  const { data } = await http.get<Resource[]>(`/languages/${encodeURIComponent(code)}/resources`)
  return data
}
