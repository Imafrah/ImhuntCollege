# CollegeHunt API

Public API: https://imhuntcollege.onrender.com

## Stack

Node.js, Express, TypeScript, PostgreSQL, Prisma, Docker, Render.

## Setup

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | HTTP server port |
| `ADMIN_API_KEY` | Bearer token for review moderation |

On Render, use the Internal Database URL for `DATABASE_URL`. Locally, use the External Database URL.

## API Reference

Assignment-compatible routes:

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Health check |
| GET | `/colleges` | List colleges with `stream`, `city`, `type`, `fees_max`, `sort`, and `q` search |
| GET | `/colleges/compare?ids=1,2,3` | Compare up to 3 colleges |
| GET | `/colleges/:id` | Full college detail with fees, placements, cutoffs, approved reviews, and rating aggregates |
| POST | `/score` | Weighted decision scoring |
| POST | `/shortlist` | Add a college to an anonymous session shortlist |
| GET | `/shortlist/:session_id` | Get shortlisted college summaries |
| GET | `/predictor/:college_id` | Admission probability predictor |
| POST | `/colleges/:id/reviews` | Submit a pending review |
| GET | `/colleges/:id/reviews` | Paginated approved reviews with aggregate ratings |
| POST | `/admin/reviews/:id/approve` | Approve a review |
| POST | `/admin/reviews/:id/reject` | Reject a review |

The same routes are also available under `/api`, for example `/api/colleges`.

## Examples

List and filter colleges:

```bash
curl "https://imhuntcollege.onrender.com/colleges?stream=Engineering&city=New%20Delhi&type=GOVT&fees_max=250000&sort=nirf_rank&q=IIT"
```

College details:

```bash
curl "https://imhuntcollege.onrender.com/colleges/1"
```

Compare colleges:

```bash
curl "https://imhuntcollege.onrender.com/colleges/compare?ids=1,2,3"
```

Score colleges:

```bash
curl -X POST "https://imhuntcollege.onrender.com/score" \
  -H "Content-Type: application/json" \
  -d "{\"weights\":{\"placement\":0.6,\"fees\":0.3,\"location\":0.1},\"filters\":{\"stream\":\"Engineering\"}}"
```

Shortlist:

```bash
curl -X POST "https://imhuntcollege.onrender.com/shortlist" \
  -H "Content-Type: application/json" \
  -H "x-session-token: demo-session-1" \
  -d "{\"college_id\":1}"

curl "https://imhuntcollege.onrender.com/shortlist/demo-session-1"
```

Predictor:

```bash
curl "https://imhuntcollege.onrender.com/predictor/1?exam=JEE&percentile=92&category=GENERAL"
```

Review validation example:

```bash
curl -X POST "https://imhuntcollege.onrender.com/colleges/1/reviews" \
  -H "Content-Type: application/json" \
  -d "{\"author_name\":\"A Student\",\"batch_year\":2024,\"stream\":\"Engineering\",\"rating_overall\":5,\"rating_placement\":5,\"rating_faculty\":4,\"rating_infra\":4,\"body\":\"Too short\"}"
```

Paginated reviews:

```bash
curl "https://imhuntcollege.onrender.com/colleges/1/reviews?limit=10&offset=0"
```

Admin moderation:

```bash
curl -X POST "https://imhuntcollege.onrender.com/admin/reviews/1/approve" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"

curl -X POST "https://imhuntcollege.onrender.com/admin/reviews/1/reject" \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY"
```

## Seeding

```bash
npm run seed
```

The seed script loads 20 Indian colleges with course fees, placement stats for 2022, 2023, and 2024, and admission cutoffs for 2023 and 2024 across GENERAL, OBC, SC, and ST categories.

## Tests

```bash
npm test
npx tsc --noEmit
```
