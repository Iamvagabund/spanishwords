export const normalizeAnswer = (answer: string): [string, string] => {
  // Видаляємо всі знаки пунктуації та пробіли
  const cleanAnswer = answer
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
    .replace(/\s+/g, '')
    .trim()

  // Нормалізуємо акценти
  const normalized = cleanAnswer
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  // Зберігаємо версію з акцентами
  const withAccents = cleanAnswer
    .replace(/[^a-z0-9áéíóúñü]/g, '')

  return [normalized, withAccents]
} 