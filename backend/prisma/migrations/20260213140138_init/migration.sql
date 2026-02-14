-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "document_id" TEXT NOT NULL,
    "chunk_text" TEXT NOT NULL,
    CONSTRAINT "Chunk_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
