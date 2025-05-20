export interface Word {
  id: number
  ukrainian: string
  spanish: string
  translation?: string
  word?: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
} 