# AI Implementation Notes

## Architecture Decisions

### 1. Retrieval Strategy: TF-IDF
I chose **TF-IDF (Term Frequency-Inverse Document Frequency)** via the `natural` library for the retrieval layer.

**Why?**
-   **Speed:** calculating similarity scores on small-to-medium datasets is near-instant.
-   **Simplicity:** It requires no external vector database (like Pinecone or Weaviate) and no heavy embedding model downloads.
-   **Determinism:** It builds a direct mathematical relationship between query keywords and document terms, making debugging easier than opaque vector spaces.

**Trade-offs:**
-   It relies on exact keyword matching. A query for "canine" might not retrieve a document about "dogs" unless the terms overlap.
-   For this specific use case (technical documentation Q&A), utilizing specific domain terminology is common, making TF-IDF highly effective.

### 2. Generative Model: Groq (Llama 3 70B)
Utilized the Groq API to access the Llama 3 70B model.

**Why?**
-   **Inference Speed:** Groq's LPU (Language Processing Unit) architecture delivers tokens at unprecedented speeds, essential for a responsive UI.
-   **Accuracy:** Llama 3 70B is a state-of-the-art open-weights model comparable to GPT-4 for many reasoning tasks.
-   **JSON Mode:** Excellent adherence to complex output schemas (like our JSON requirement for highlighting).

## Where AI Tools Were Used
-   **Project Scaffolding:** Initial setup of the Next.js and Express structure.
-   **Algorithm Implementation:** Implementing the specific TF-IDF logic in Node.js.
-   **Debugging:** tracing "Unexpected end of JSON" errors in the API response.

## Future Improvements
-   **Hybrid Search:** Combining TF-IDF (keyword) with BERT embeddings (semantic) to get the best of both worlds.
-   **Local LLM:** Integrating Ollama to run the generation step locally, making the application 100% offline and air-gapped.
