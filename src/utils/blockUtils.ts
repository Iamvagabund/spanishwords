interface BlockTitle {
  uk: string
  es: string
}

const titles: Record<string, BlockTitle> = {
  'Базові привітання 1': {
    uk: 'Базові привітання 1',
    es: 'Saludos básicos 1'
  },
  'Базові привітання 2': {
    uk: 'Базові привітання 2',
    es: 'Saludos básicos 2'
  },
  'Базові слова 1': {
    uk: 'Базові слова 1',
    es: 'Palabras básicas 1'
  }
}

export function getBlockTitle(title: string): BlockTitle {
  return titles[title] || { uk: title, es: title }
} 