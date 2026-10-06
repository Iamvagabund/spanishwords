# Multi-language contract

Shared contract between backend, content, frontend and admin work. Languages are identified by code: `es`, `en`. The learner's native/UI language is Ukrainian.

## Content shape (seed JSON + API)

`backend/src/seed/content/<code>.json`:

```json
{
  "language": { "code": "es", "name": "Іспанська", "nativeName": "Español", "flag": "🇪🇸" },
  "blocks": [
    {
      "order": 1,
      "title": "Привітання",
      "titleTarget": "Saludos",
      "description": "Базові привітання та прощання",
      "level": "A1",
      "words": [
        { "term": "hola", "translation": "привіт", "example": "¡Hola! ¿Qué tal?", "exampleTranslation": "Привіт! Як справи?" }
      ]
    }
  ]
}
```

- `term` is in the target language (what the learner types), `translation` is Ukrainian.
- `level`: `A1 | A2 | B1 | B2 | C1`. `order` is 1-based and unique per language.

## Mongo models

- `Language { code (unique), name, nativeName, flag, isActive (default true) }`
- `Block { language (code, indexed), order, title, titleTarget, description, level, words: [{ _id, term, translation, example?, exampleTranslation? }] }`, unique index on `(language, order)`. Words are embedded.
- `User.progress`: `Map<code, LangProgress>`; `User.selectedLanguage?: string`.
- `LangProgress { completedBlocks: [{ blockId: string, score: number (1-10), completedAt: ISO string }], mistakes: { [wordId]: number }, learnedWords: string[], currentLevel: number, averageScore: number }`.
  `blockId` and `wordId` are Mongo `_id` strings.

## Public API (base `/api`)

| Method | Path | Auth | Response |
|---|---|---|---|
| GET | `/languages` | none | `[{ code, name, nativeName, flag, blockCount }]` (active only) |
| GET | `/languages/:code/blocks` | none | `[{ id, order, title, titleTarget, description, level, words: [{ id, term, translation, example?, exampleTranslation? }] }]` sorted by `order` |
| GET | `/user/profile` | user | user without password, includes `role`, `selectedLanguage` |
| PUT | `/user/profile` | user | accepts `nickname`, `avatar`, `selectedLanguage` |
| GET | `/user/progress` | user | `{ [code]: LangProgress }` |
| PUT | `/user/progress/:code` | user | body `LangProgress`, validated, returns saved |
| DELETE | `/user/progress/:code` | user | resets that language |

Auth responses (`/auth/login`, `/auth/register`) return `{ token, user: { id, email, nickname, avatar, role, selectedLanguage } }`.

## Admin API (auth + role `admin`)

| Method | Path | Body / notes |
|---|---|---|
| GET | `/admin/languages` | all languages incl. inactive |
| POST | `/admin/languages` | `{ code, name, nativeName, flag }` |
| PUT | `/admin/languages/:code` | partial update (`isActive` etc.) |
| GET | `/admin/blocks?language=es` | same shape as public blocks |
| POST | `/admin/blocks` | `{ language, order?, title, titleTarget, description, level, words: [{ term, translation, example?, exampleTranslation? }] }`; `order` defaults to last+1 |
| PUT | `/admin/blocks/:id` | full replace (words keep `id` if provided) |
| DELETE | `/admin/blocks/:id` | |
| POST | `/admin/blocks/reorder` | `{ language, ids: string[] }` |
| POST | `/admin/blocks/import` | `{ language, blocks: [...] }` (seed-JSON block shape), appended after last order |
| GET | `/admin/users` | users without password, with `progress` summary |
| PATCH | `/admin/users/:id/role` | `{ role: 'user' \| 'admin' }` |
| POST | `/admin/users/:id/reset-progress` | `{ language? }` (omit = all) |
| GET | `/admin/statistics` | `{ totalUsers, totalAdmins, perLanguage: [{ code, learners, blocks, words, avgScore, completedBlocks }] }` |

Errors: `{ status: 'fail' | 'error', message }` with proper HTTP code.

## Admin bootstrap

Env `ADMIN_EMAILS` (comma-separated): on startup, matching users get `role: 'admin'`. Seeding happens on startup for any language whose block collection is empty.

## Frontend routes

- `/auth`, `/` (redirect to `/:lang` from `selectedLanguage`, or language picker if none)
- `/:lang` home, `/:lang/block/:order`, `/:lang/block/:order/completion`, `/:lang/review`, `/:lang/stats`, `/profile`
- `/admin/*` (admin only), exported as `adminRoute: RouteObject` from `frontend/src/pages/admin/index.tsx`.

## v2 additions: tips, resources, daily activity

### Block tip
`Block.tip?: { title: string, body: string }`. `body` is plain text with `\n` line breaks and `**bold**` only. Returned in public and admin block payloads; editable in admin (PUT/POST blocks). Seed JSON blocks may include `tip`. On startup, for existing blocks whose `tip` is missing, backfill it from the seed file by `(language, order)` (never overwrite a tip an admin set).

### Resources (useful materials)
Model `Resource { language, level: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2'|'all', type: 'book'|'podcast'|'youtube'|'app'|'website'|'series', title, author?, description, url, order }`.
Seed file `backend/src/seed/content/resources-<code>.json` = `{ "resources": [ ...Resource without language ] }`, inserted on startup when the language has no resources.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/languages/:code/resources` | none | `[{ id, level, type, title, author?, description, url, order }]` sorted by level then order |
| GET | `/admin/resources?language=es` | admin | same shape |
| POST | `/admin/resources` | admin | `{ language, level, type, title, author?, description, url }` (url must be http/https) |
| PUT | `/admin/resources/:id` | admin | partial update |
| DELETE | `/admin/resources/:id` | admin | |

### Daily activity & goal
`User.activity: { [YYYY-MM-DD]: number }` (words answered correctly that day, all languages, client local date). `User.dailyGoal: number` (default 10, allowed 5–100), returned in profile/auth user and accepted by `PUT /user/profile`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/user/activity` | user | `{ dailyGoal, activity: { [date]: count } }` (last 90 days) |
| POST | `/user/activity` | user | `{ date: 'YYYY-MM-DD', delta: number (1–100) }` → increments, returns `{ dailyGoal, activity }`. Reject dates more than 1 day from server date. |

Streak is computed on the client: consecutive days up to today (or yesterday if today is 0) with count ≥ 1.
