# Prompts Used During Development

## Initial Architecture Prompt

> "Build a lightweight Private Knowledge Q&A web application using Next.js 14 (App Router, TypeScript) for the frontend and Node.js + Express + Prisma + SQLite for the backend.
>
> The system must allow users to:
> - Upload multiple .txt files
> - Store documents and chunk them (~500 words per chunk)
> - Ask questions
> - Retrieve relevant chunks using TF-IDF (natural library)
> - Generate answers using Groq (llama3-8b-8192)
> - Return the answer along with document name and exact chunk excerpt
>
> Do not use heavy embedding models. Keep architecture clean and lightweight.
> Separate route logic and retrieval logic clearly.
> Include a /status endpoint checking backend, database, and LLM connectivity.
> Do not hardcode secrets.
> Use environment variables for configuration."

---

## Full Setup & Installation Prompt

> "Initialize the full project structure with separate frontend and backend folders.
>
> Backend:
> - Express + TypeScript
> - Prisma + SQLite
> - Multer for file uploads
> - natural for TF-IDF
> - Axios for Groq API
>
> Frontend:
> - Next.js 14 + TypeScript
> - Tailwind CSS
> - Axios for API calls
>
> Install all required dependencies.
> Configure Prisma schema (Document + Chunk models).
> Ensure backend runs on port 5000.
> Ensure frontend runs on port 3000.
> Verify both run without TypeScript errors."

---

## Multi-File Upload Fix Prompt

> "Update the upload feature to support multiple .txt files in a single request.
>
> Frontend:
> - Add multiple attribute to file input
> - Append each file to FormData under 'files'
> - Add a dedicated Upload button (no auto-upload)
>
> Backend:
> - Change multer from upload.single() to upload.array('files')
> - Loop through req.files and process each document separately
> - Maintain existing chunking logic
>
> Do not modify database schema or retrieval logic."

---

## UI Simplification Prompt

> "Refine the UI to be clean and minimal.
> Remove technical badges such as 'TF-IDF Retrieval • Groq Llama 3 • Private Data'.
> Remove the 4-step guide section.
> Center layout with max width ~800px.
> Use soft gray background and indigo accent buttons.
> Keep functionality unchanged.
> Do not modify backend or API routes."

---

## Debug & Stabilization Prompt

> "Audit the project and fix any issues preventing the frontend and backend from running.
> Do not regenerate architecture.
> Fix missing dependencies, incorrect scripts, Prisma initialization issues, and CORS configuration.
> Ensure:
> - Backend starts without errors
> - Frontend connects to backend
> - /status endpoint works
> - Upload and ask flows function correctly."

---

## LLM Integration Fix Prompt

> "Fix the /ask endpoint integration with Groq.
> Use model 'llama3-8b-8192'.
> Ensure Authorization header uses Bearer ${process.env.GROQ_API_KEY}.
> Add axios timeout.
> Return meaningful error messages if LLM fails.
> Do not change retrieval logic."

---

## Documentation Generation Prompt

> "Generate professional documentation files for evaluation submission:
> - README.md
> - AI_NOTES.md
>
> Do not modify source code.