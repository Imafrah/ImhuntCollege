export const openApiDocument: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "CollegeHunt API",
    version: "1.0.0",
    description: "College discovery, comparison, scoring, shortlist, predictor, and review APIs.",
  },
  servers: [
    {
      url: "https://imhuntcollege.onrender.com/api",
      description: "Production",
    },
    {
      url: "http://localhost:3000/api",
      description: "Local development",
    },
  ],
  paths: {
    "/colleges": {
      get: {
        summary: "List colleges with filtering and search",
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "stream", in: "query", schema: { type: "string" } },
          { name: "city", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["GOVT", "PRIVATE", "DEEMED"] } },
          { name: "fees_max", in: "query", schema: { type: "integer", minimum: 1 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["nirf_rank", "avg_pkg", "fees"] } },
        ],
        responses: {
          "200": { description: "Filtered college summaries" },
          "400": { description: "Invalid query" },
        },
      },
    },
    "/colleges/{id}": {
      get: {
        summary: "Get a college with fees, placements, cutoffs, and approved reviews",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: {
          "200": { description: "College detail" },
          "404": { description: "College not found" },
        },
      },
    },
    "/colleges/compare": {
      get: {
        summary: "Compare up to three colleges",
        parameters: [{ name: "ids", in: "query", required: true, schema: { type: "string", example: "1,2,3" } }],
        responses: {
          "200": { description: "Merged comparison object with winners" },
          "400": { description: "Invalid ids or more than three colleges" },
        },
      },
    },
    "/colleges/{id}/career-trends": {
      get: {
        summary: "Get career trend enrichment for top recruiters",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: {
          "200": { description: "Recruiter industries, role clusters, salary bands, and growth tags" },
          "404": { description: "College not found" },
        },
      },
    },
    "/colleges/{id}/reviews": {
      get: {
        summary: "List approved reviews with pagination and live aggregates",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 50, default: 10 } },
          { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
        ],
        responses: {
          "200": { description: "Approved reviews, total count, and rating aggregates" },
          "400": { description: "Invalid pagination" },
        },
      },
      post: {
        summary: "Submit a pending review",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: [
                  "author_name",
                  "batch_year",
                  "stream",
                  "rating_overall",
                  "rating_placement",
                  "rating_faculty",
                  "rating_infra",
                  "body",
                ],
              },
            },
          },
        },
        responses: {
          "201": { description: "Review created with pending status" },
          "400": { description: "Field-level validation errors" },
        },
      },
    },
    "/score": {
      post: {
        summary: "Rank colleges by weighted decision score",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["weights"],
                properties: {
                  weights: {
                    type: "object",
                    required: ["placement", "fees", "location"],
                    properties: {
                      placement: { type: "number", minimum: 0, maximum: 1 },
                      fees: { type: "number", minimum: 0, maximum: 1 },
                      location: { type: "number", minimum: 0, maximum: 1 },
                    },
                  },
                  filters: {
                    type: "object",
                    properties: {
                      stream: { type: "string" },
                      city: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Ranked scored colleges" },
          "400": { description: "Invalid weights or filters" },
          "429": { description: "Rate limited" },
        },
      },
    },
    "/shortlist": {
      post: {
        summary: "Add a college to an anonymous session shortlist",
        parameters: [{ name: "x-session-token", in: "header", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated shortlist" },
          "400": { description: "Invalid request" },
        },
      },
    },
    "/shortlist/{session_id}": {
      get: {
        summary: "Get a session shortlist",
        parameters: [{ name: "session_id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Shortlisted college summaries" },
          "404": { description: "Session not found" },
        },
      },
    },
    "/shortlist/{session_id}/{college_id}": {
      delete: {
        summary: "Remove a college from an anonymous session shortlist",
        parameters: [
          { name: "session_id", in: "path", required: true, schema: { type: "string" } },
          { name: "college_id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
        ],
        responses: {
          "200": { description: "Updated shortlist" },
          "404": { description: "Session not found" },
        },
      },
    },
    "/predictor/{college_id}": {
      get: {
        summary: "Predict admission probability from recent cutoffs",
        parameters: [
          { name: "college_id", in: "path", required: true, schema: { type: "integer", minimum: 1 } },
          { name: "exam", in: "query", required: true, schema: { type: "string", example: "JEE" } },
          { name: "percentile", in: "query", required: true, schema: { type: "number", minimum: 0 } },
          { name: "category", in: "query", required: true, schema: { type: "string", enum: ["GENERAL", "OBC", "SC", "ST"] } },
        ],
        responses: {
          "200": { description: "Probability, rank context, and cutoff context" },
          "404": { description: "No cutoff data found" },
        },
      },
    },
    "/admin/reviews/{id}/approve": {
      post: {
        summary: "Approve a pending review",
        security: [{ adminApiKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: {
          "200": { description: "Approved review" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/admin/reviews/{id}/reject": {
      post: {
        summary: "Reject a pending review",
        security: [{ adminApiKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer", minimum: 1 } }],
        responses: {
          "200": { description: "Rejected review" },
          "401": { description: "Unauthorized" },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      adminApiKey: {
        type: "http",
        scheme: "bearer",
      },
    },
  },
};
