# Project Audit Report — Private Knowledge Q&A

Date: 2026-02-14

This audit inspects the workspace code and runtime behaviour to determine readiness, missing features, bugs, and risks. The findings are based solely on project files and quick runtime checks performed in the local environment.

---

## 1. Project Overview

- Detected tech stack:
  - Frontend: Next.js 14 (React 18, TypeScript), TailwindCSS styling, `axios` client.
  - Backend: Node.js + Express (TypeScript), `multer` for file upload, `natural` for TF-IDF, `axios` for LLM calls.
  - Database: Prisma ORM with SQLite (file `backend/prisma/dev.db`), models `Document` and `Chunk`.
  - LLM: Groq/OpenAI-style API invoked in `backend/src/routes/ask.ts` using `process.env.GROQ_API_KEY`.

- Frontend status: upload UI, document list, and Q&A UI present. File input and upload button implemented in `frontend/src/app/page.tsx` (multi-file support added). API base URL configurable via `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`).

- Backend status: `/upload`, `/ask`, `/documents`, `/status` routes implemented. Upload and chunking logic present, documents stored via Prisma. In-memory multipart buffering (`multer.memoryStorage`) is used.

- Database status: Prisma schema and migration exist and a local `dev.db` file is present. Migration SQL indicates the expected tables were created.

- LLM integration status: implemented but requires env var `GROQ_API_KEY`. When missing the server returns an error. No resilient networking features (retries/timeouts) implemented.

---

## 2. Functional Checklist

Each item includes a short justification based on code and runtime checks.

- Upload single file: ✅ Working — `POST /upload` accepts files and creates Document + Chunks (server routes and Prisma calls present).
- Upload multiple files: ✅ Working — backend uses `upload.array('files')` and frontend appends multiple `files` entries; verified with curl upload.
- File validation (.txt only): ✅ Working (basic) — frontend checks file extension and size; backend checks `mimetype` and filename extension. Note: mimetype and extension can be forged; validation is minimal but present.
- Empty file rejection: ✅ Working — frontend rejects size===0; backend rejects empty file content (after trimming).
- Document listing: ✅ Working — `GET /documents` returns documents with chunk counts; verified by querying the endpoint.
- Question input working: ✅ Working — input uses `value` + `onChange` and is writable.
- Ask button validation: ✅ Working — disabled when question is empty or when there are no documents; submit posts to `/ask`.
- TF-IDF retrieval logic correct: ⚠️ Partially Working — `natural.TfIdf` is used correctly but the approach recomputes TF-IDF on each request; preprocessing (lowercase, stop words, punctuation) is minimal.
- Correct chunk storage: ✅ Working — backend chunks by word count (`CHUNK_SIZE = 500`) and persists with `document_id` and `chunk_text`.
- Correct ranking: ⚠️ Partially Working — ranks by TF-IDF score; tie-breaking relies on array order. No normalization of scores or additional ranking signals.
- LLM API call working: ⚠️ Partially Working — implemented but requires `GROQ_API_KEY`; when missing it returns `LLM service not configured.`; no timeouts or retries.
- Citation (source excerpt) accurate: ⚠️ Partially Working — server returns the chosen chunk text and document name as `sources`; quality depends on TF-IDF selection.
- `/status` endpoint working: ⚠️ Partially Working — returns database connectivity check and a mocked `llm: 'reachable'` value (comment notes proper check to be implemented).
- Frontend-to-backend connectivity: ✅ Working in dev — `api.ts` points to backend and requests succeed locally.
- Error handling: ⚠️ Partially Working — try/catch present, but many errors return generic messages; no structured error format or client-friendly error codes beyond basic 400/500.
- Edge case handling: ⚠️ Partially Working — missing limits (file size), no transaction guard for `Document` + `Chunk`, potential for orphaned documents on chunk write failure.

---

## 3. Code Quality Review

- Separation of concerns: Partial — route handlers hold business logic. No dedicated service or domain layer.
- Service layer usage: ❌ Not implemented — extraction recommended for testability.
- Hardcoded secrets: ❌ None directly hard-coded; sensitive values expected from environment variables.
- `.env` usage: ✅ `dotenv` used, but there is no `.env.example` documenting required env vars (`DATABASE_URL`, `GROQ_API_KEY`, possibly `PORT`). Add `.env.example`.
- Proper HTTP status codes: Mostly OK (400 for invalid inputs, 404 when no documents, 500 for internal errors). Could improve consistency and payload structure.
- Proper try/catch usage: Present. Logging is to console; replace or wrap with a proper logger for production.
- Unhandled promise rejections: None obvious in inspected files. Consider `process.on('unhandledRejection', ...)` for hardening.
- Console logs in production code: `console.log`, `console.warn`, `console.error` used. Acceptable for dev; replace with structured logging for production.

---

## 4. Database Review

- Prisma schema correctness: ✅ `Document` and `Chunk` modeled appropriately with FK from `Chunk` -> `Document`.
- Migration applied? ✅ Migration SQL exists and `dev.db` is present.
- Potential query issues:
  - No transaction: `document.create` followed by `chunk.createMany` is not wrapped in a transaction — if chunk creation fails, the `Document` remains (orphan). Use a transaction.
  - `createMany` used without returning created row info — fine for bulk insert, but no per-chunk feedback.
- Risk of data inconsistency?: ⚠️ Medium — lack of transaction and no cleanup on failure could leave orphans.

---

## 5. Retrieval Logic Review

- TF-IDF correctness: Implementation uses `natural.TfIdf` correctly for basic ranking, but:
  - No text normalization (lowercasing, normalized punctuation) or stop-word removal.
  - Recomputes TF-IDF per request: poor performance at scale.
  - For large numbers of chunks, in-memory Tf-Idf calculation is likely a bottleneck.
- Chunk indexing: ✅ Chunks are persisted with `document_id` and `chunk_text`.
- Ranking determinism: ⚠️ Partially deterministic. Equal scores rely on array order.
- Scoring bug risks: ⚠️ Yes — short documents, common words, and lack of preprocessing can produce weak ranking.

---

## 6. LLM Integration Review

- `GROQ_API_KEY` usage: Present; the server verifies its presence and errors if missing.
- Error handling: Partial. Axios call in `ask` is in try/catch; server returns 500 with generic message on failure.
- If API fails: Client receives 500 `Failed to process question`. No detailed error relay.
- Timeout handling: ❌ No axios timeout configured — calls can hang.
- Retries/backoff: ❌ None implemented.

Recommendations: add request timeouts, retry/backoff, and circuit-breaker patterns for robustness.

---

## 7. Security Review

- File upload security:
  - Using multer `memoryStorage` with no `limits` allows an attacker or accident to exhaust server memory with large files. Add `limits: { fileSize: <max> }`.
  - Backend validates mimetype and filename extension, but these are easy to spoof — consider additional validation, e.g., content-type sniffing or server-side content checks.
  - No virus/malware scanning.
- File size limits: ❌ Missing — critical for production.
- Injection risks: Low for DB queries (Prisma parameterized). LLM prompt injection risk exists because raw chunk text + user question are sent directly to the model — instruct the model defensively and validate/escape user data.
- CORS configuration: `app.use(cors())` allows all origins by default — restrict to allowed origins for production.
- Environment variable protection: No `.env.example`; ensure `.env` is in `.gitignore` and keep secrets out of the repo.
- Authentication/Authorization: ❌ Not present. Upload and ask endpoints are public — if the app should be private, add auth.

---

## 8. Deployment Readiness

- Is project buildable? ✅ Frontend has `npm run build` script for Next; backend has `build` script `tsc` and `start` scripts. The backend production start expects compiled JS at `dist/server.js`.
- Production build configured? Partial — TypeScript build is configured via `tsconfig.json`, but no PM2/systemd/container scripts are provided. You must produce a production-ready start process (build -> start) and ensure environment variables are provided.
- Backend start script correct? Present (`start: node dist/server.js`). Dev uses `ts-node src/server.ts`.
- Frontend production build correct? Next.js scripts present.
- Render/Vercel risks:
  - Using SQLite (`dev.db`) is not appropriate for horizontal scaling in most cloud platforms; switch to a managed DB (Postgres) for production.
  - Memory-based upload handling and on-request TF-IDF regeneration are not cloud-friendly at scale.

---

## 9. Performance Risks

- Large document handling: multer memoryStorage is dangerous for large files; streaming or disk storage with size limits is safer.
- Memory issues: TF-IDF builds in-memory representation of all chunks for every `/ask`. With many chunks this will consume memory and CPU.
- Blocking operations: Current chunking and TF-IDF runs are synchronous CPU-bound work inside request handlers — can block event loop for long-running computations.
- Scale concerns: No batching, pagination, or incremental indexing; as documents grow the `/ask` route will degrade.

---

## 10. Final Verdict

- Is this project 100% ready for submission? ❌ No.

Major blockers (must fix before production):
1. No file size limits and using `memoryStorage` — risk of OOM. (High)
2. No authentication/authorization — endpoints are public. (High)
3. LLM integration has no timeout/retry and will fail if `GROQ_API_KEY` missing — must configure secrets and robust client. (High)
4. SQLite as the default datastore is not suitable for production with concurrent access or multiple instances. (High)
5. TF-IDF recomputation on each request is not scalable — indexing/embedding or caching required. (High)

Other important issues:
- No `.env.example` and no documented required env vars.
- No transaction around `Document` + `Chunk` writes (could leave orphans).
- Open CORS and console logging need tightening.


## 11. Action Plan (Prioritized)

Immediate critical fixes (1-2 days):
1. Add multer `limits` (file size) and switch to streaming/disk storage or enforce a safe max file size. Reject files above limit.
2. Add server-side upload validation: enforce `.txt` extension and content sanity checks; reject empty files. Add strict Content-Type/magic-bytes check if appropriate.
3. Add environment configuration documentation: create `.env.example` listing `DATABASE_URL`, `GROQ_API_KEY`, `PORT`, and `NEXT_PUBLIC_API_URL`.
4. Add axios timeouts and retry policy for LLM calls; surface friendly error messages to the client.
5. Add authentication/authorization to protect endpoints (e.g., simple API key or OAuth for private deployments).

Important improvements (2-5 days):
6. Move business logic into a service layer (extract upload processing and ask logic from routes) to improve testability.
7. Wrap `Document` + `Chunk` creation in a transaction; if `createMany` fails rollback document create.
8. Restrict CORS in production to allowed origins.
9. Replace console logs with a structured logger (winston/pino) and add log levels.

Nice-to-have improvements (weeks):
10. Replace TF-IDF per-request computation with precomputed indexes, vector embeddings, or incremental TF-IDF updates to scale retrieval. Consider using a vector DB or caching layer.
11. Add pagination for `/documents` and background workers for heavy tasks (chunking, indexing).
12. Add E2E tests for upload, ask, and document listing. Add unit tests for chunking and TF-IDF ranking.
13. Hardening: virus scanning of uploads, content size quotas per user, and RBAC if multi-user.

---

If you would like, I can now implement the highest-priority changes in a follow-up pass (file size limits, multer config, `.env.example`, axios timeout/retries, transaction for DB writes). Indicate which items you want prioritized first.

End of report.
