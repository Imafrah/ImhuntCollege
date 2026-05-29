# CollegeHunt

CollegeHunt is a full-stack college discovery platform for Indian students.

## Structure

| Path | Purpose |
| --- | --- |
| `/` | Express, Prisma, PostgreSQL backend |
| `/frontend` | Next.js 14 App Router frontend |

## Backend Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

## Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Environment Variables

| App | Variable | Description |
| --- | --- | --- |
| Backend | `DATABASE_URL` | PostgreSQL connection string |
| Backend | `PORT` | API port, defaults to `3000` |
| Backend | `ADMIN_API_KEY` | Bearer token for moderation routes |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend base URL |

## API

Public backend: `https://imhuntcollege.onrender.com`

Main routes are available with and without `/api`, including:

| Method | Path |
| --- | --- |
| GET | `/api/colleges` |
| GET | `/api/colleges/:id` |
| GET | `/api/colleges/compare?ids=1,2,3` |
| GET | `/api/colleges/:id/reviews` |
| POST | `/api/colleges/:id/reviews` |
| POST | `/api/score` |
| GET | `/api/predictor/:college_id` |

## Verification

```bash
npm test
npm run build
cd frontend
npm run build
```
