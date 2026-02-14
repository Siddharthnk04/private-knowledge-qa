# Private Knowledge Q&A

A secure, privacy-focused RAG (Retrieval-Augmented Generation) application that enables users to upload local documents and ask questions grounded in their private data.

## Problem Statement

In an era of increasing data privacy concerns, sending sensitive internal documents to public cloud LLMs can be risky. This project solves that problem by:
1.  **Local Processing:** Parsing and chunking documents locally.
2.  **Privacy-First:** Sending only relevant text snippets to the LLM, not the entire document set.
3.  **Transparency:** Citing exact sources and highlighting the specific text segments used to generate answers.

## Application Links
## Live Demo

Frontend: Vervel - https://private-knowledge-qa-phi.vercel.app 
Backend: Render - https://private-knowledge-qa-olyn.onrender.com/status


## Architecture

The system is built as a monolithic full-stack application for simplicity and ease of deployment.

### Frontend
-   **Framework:** Next.js 
-   **Styling:** Tailwind CSS.
-   **Key Components:**
    -   `FileUploader`: Handling multi-file uploads.
    -   `SourceCard`: Expandable source display with text highlighting.
    -   `DocumentViewer`: Modal for viewing full document content.

### Backend
-   **Runtime:** Node.js with Express.
-   **Database:** SQLite (via Prisma ORM) for storing document metadata and text chunks.
-   **Search Engine:** `natural` (TF-IDF) for efficient, in-memory keyword similarity search.
-   **LLM Integration:** Groq API (Llama 3 70B) for high-speed, accurate generation.

### RAG Flow
1.  **Ingestion:** User uploads a `.txt` file.
2.  **Processing:** Backend reads the file, splits it into 500-word chunks, and stores them in SQLite.
3.  **Retrieval:** When a question is asked, the system calculates TF-IDF scores between the question and all stored chunks.
4.  **Selection:** The top 3 most relevant chunks are retrieved.
5.  **Generation:** These chunks are formatted into a system prompt and sent to the Groq API.
6.  **Response:** The LLM returns the answer and exact quotes, which are then displayed to the user.

## Features

-   **Multi-Document Upload:** Upload multiple text files simultaneously.
-   **Smart Context:** Retrieves the most relevant sections from your library.
-   **Precision Highlighting:** Highlights the exact sentences in the source text that answer your question.
-   **Source Citations:** Always know which document the information came from.
-   **Full Document Viewer:** Inspect the complete context of any source document.
-   **Reset Functionality:** One-click database clearing for a fresh start.

## Setup Instructions

### Prerequisites
-   Node.js 18+ installed.
-   A Groq API Key (get one [here](https://console.groq.com/)).

### 1. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```env
PORT=3001
DATABASE_URL="file:./dev.db"
GROQ_API_KEY=your_groq_api_key_here
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Initialize the database:
```bash
npx prisma migrate dev --name init
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
| :--- | :--- |
| `GROQ_API_KEY` | Required for the LLM generation step. |
| `DATABASE_URL` | Connection string for Prisma (defaults to local SQLite file). |
| `PORT` | Backend server port (Default: 3001). |

## Health Check
You can verify the backend status by visiting:
`http://localhost:3001/status`


