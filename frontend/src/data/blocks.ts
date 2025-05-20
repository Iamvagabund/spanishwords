export interface Block {
  id: number
  title: string
  title_es: string
  description: string
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1'
  words: number[]
}

export const blocks: Block[] = [
  {
    id: 1,
    title: 'Базові привітання 1',
    title_es: 'Saludos básicos 1',
    description: 'Learn essential Spanish greetings',
    level: 'A1',
    words: [1, 2]
  },
  {
    id: 2,
    title: 'Базові привітання 2',
    title_es: 'Saludos básicos 2',
    description: 'More Spanish greetings and introductions',
    level: 'A1',
    words: [3, 4]
  },
  {
    id: 3,
    title: 'Базові привітання 3',
    title_es: 'Saludos básicos 3',
    description: 'Essential Spanish greetings',
    level: 'A1',
    words: [5, 6]
  },
  {
    id: 4,
    title: 'Базові привітання 4',
    title_es: 'Saludos básicos 4',
    description: 'Basic Spanish greetings',
    level: 'A1',
    words: [7, 8]
  },
  {
    id: 5,
    title: 'Базові привітання 5',
    title_es: 'Saludos básicos 5',
    description: 'Common Spanish greetings',
    level: 'A1',
    words: [9, 10]
  },
  {
    id: 6,
    title: 'Базові слова 1',
    title_es: 'Palabras básicas 1',
    description: 'Essential Spanish words',
    level: 'A1',
    words: [11, 12]
  },
  {
    id: 7,
    title: 'Їжа та напої 1',
    title_es: 'Comida y bebidas 1',
    description: 'Basic food and drinks vocabulary',
    level: 'A1',
    words: [13, 14]
  },
  {
    id: 8,
    title: 'Дім та транспорт 1',
    title_es: 'Casa y transporte 1',
    description: 'Words about home and transport',
    level: 'A1',
    words: [15, 16]
  },
  {
    id: 9,
    title: 'Робота та час 1',
    title_es: 'Trabajo y tiempo 1',
    description: 'Words about work and time',
    level: 'A2',
    words: [17, 18]
  },
  {
    id: 10,
    title: 'Сім\'я та друзі 1',
    title_es: 'Familia y amigos 1',
    description: 'Words about family and friends',
    level: 'A2',
    words: [19, 20]
  },
  {
    id: 11,
    title: 'Міське життя 1',
    title_es: 'Vida urbana 1',
    description: 'Words about city life',
    level: 'A2',
    words: [21, 22]
  },
  {
    id: 12,
    title: 'Бізнес 1',
    title_es: 'Negocios 1',
    description: 'Basic business vocabulary',
    level: 'B1',
    words: [23, 24]
  },
  {
    id: 13,
    title: 'Освіта та суспільство 1',
    title_es: 'Educación y sociedad 1',
    description: 'Words about education and society',
    level: 'B1',
    words: [25, 26]
  }
] 