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
| Backend | `PORT` | API port, defaults to `4000` locally |
| Backend | `ADMIN_API_KEY` | Bearer token for moderation routes |
| Frontend | `NEXT_PUBLIC_API_URL` | Backend base URL |

## API

Public backend: `https://imhuntcollege.onrender.com`
Local backend: `http://localhost:4000`

Main routes are available with and without `/api`, including:

| Method | Path |
| --- | --- |
| GET | `/api/colleges` |
| GET | `/api/colleges/:id` |
| GET | `/api/colleges/compare?ids=1,2,3` |
| GET | `/api/colleges/:id/career-trends` |
| GET | `/api/colleges/:id/reviews` |
| POST | `/api/colleges/:id/reviews` |
| POST | `/api/score` |
| POST | `/api/shortlist` |
| GET | `/api/shortlist/:session_id` |
| DELETE | `/api/shortlist/:session_id/:college_id` |
| GET | `/api/predictor/:college_id` |
| GET | `/api/openapi.json` |
| GET | `/api/docs` |

## Curl Examples

Filter colleges:

```bash
curl "https://imhuntcollege.onrender.com/api/colleges?stream=Engineering&city=New%20Delhi&type=GOVT&fees_max=250000&sort=nirf_rank&q=IIT"
```

Score colleges:

```bash
curl -X POST "https://imhuntcollege.onrender.com/api/score" \
  -H "Content-Type: application/json" \
  -d "{\"weights\":{\"placement\":0.6,\"fees\":0.3,\"location\":0.1},\"filters\":{\"stream\":\"Engineering\"}}"
```

Persistent shortlist:

```bash
curl -X POST "https://imhuntcollege.onrender.com/api/shortlist" \
  -H "Content-Type: application/json" \
  -H "x-session-token: demo-session-1" \
  -d "{\"college_id\":1}"

curl "https://imhuntcollege.onrender.com/api/shortlist/demo-session-1"
```

Invalid review validation:

```bash
curl -X POST "https://imhuntcollege.onrender.com/api/colleges/1/reviews" \
  -H "Content-Type: application/json" \
  -d "{\"author_name\":\"A Student\",\"batch_year\":2009,\"stream\":\"Engineering\",\"rating_overall\":5,\"rating_placement\":5,\"rating_faculty\":4,\"rating_infra\":4,\"body\":\"Too short\"}"
```

Expected validation shape:

```json
{
  "errors": {
    "batch_year": "batch_year must be between 2010 and the current year",
    "body": "body must be at least 80 characters"
  }
}
```

Paginated approved reviews:

```bash
curl "https://imhuntcollege.onrender.com/api/colleges/1/reviews?limit=10&offset=0"
```

Invalid pagination:

```bash
curl "https://imhuntcollege.onrender.com/api/colleges/1/reviews?limit=100&offset=-1"
```

Admin review moderation:

```bash
curl -X POST "https://imhuntcollege.onrender.com/api/admin/reviews/1/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"

curl -X POST "https://imhuntcollege.onrender.com/api/admin/reviews/1/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

Career trends:

```bash
curl "https://imhuntcollege.onrender.com/api/colleges/1/career-trends"
```

OpenAPI:

```bash
curl "https://imhuntcollege.onrender.com/api/openapi.json"
```

## Backend Strengthening

- Shortlists are stored in PostgreSQL by anonymous session token.
- `/api/score` has in-memory LRU response caching for repeated weights and filters.
- `/api/score` is rate limited to 30 requests per minute per IP.
- JEE predictor responses include an approximate percentile-to-rank context.
- Predictor cutoff context is seeded across three years.
- Reviews are pending by default and require admin approval before public display.
- Name and city search use `ILIKE` backed by PostgreSQL trigram indexes.
- OpenAPI JSON is available at `/api/openapi.json`; a readable docs page is available at `/api/docs`.

## Verification

```bash
npm test
npm run build
cd frontend
npm run build
```
