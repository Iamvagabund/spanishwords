export interface Word {
  id: number
  ukrainian: string
  spanish: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
}

export const words: Word[] = [
  {
    id: 1,
    ukrainian: 'Привіт',
    spanish: 'Hola',
    level: 'A1'
  },
  {
    id: 2,
    ukrainian: 'Доброго ранку',
    spanish: 'Buenos días',
    level: 'A1'
  },
  {
    id: 3,
    ukrainian: 'Добрий вечір',
    spanish: 'Buenas noches',
    level: 'A1'
  },
  {
    id: 4,
    ukrainian: 'Дякую',
    spanish: 'Gracias',
    level: 'A1'
  },
  {
    id: 5,
    ukrainian: 'Будь ласка',
    spanish: 'Por favor',
    level: 'A1'
  },
  {
    id: 6,
    ukrainian: 'До побачення',
    spanish: 'Adiós',
    level: 'A1'
  },
  {
    id: 7,
    ukrainian: 'Так',
    spanish: 'Sí',
    level: 'A1'
  },
  {
    id: 8,
    ukrainian: 'Ні',
    spanish: 'No',
    level: 'A1'
  },
  {
    id: 9,
    ukrainian: 'Як справи?',
    spanish: '¿Cómo estás?',
    level: 'A1'
  },
  {
    id: 10,
    ukrainian: 'Добре',
    spanish: 'Bien',
    level: 'A1'
  }
] 