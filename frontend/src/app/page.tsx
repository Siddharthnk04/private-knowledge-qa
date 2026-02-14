'use client';

import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Upload, FileText, Send, BookOpen } from 'lucide-react';

type Document = {
  id: string;
  name: string;
  uploaded_at: string;
  _count: { chunks: number };
};

type Source = {
  documentName: string;
  chunkText: string;
  highlights?: string[];
};

const SourceCard = ({ source }: { source: Source }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;
  const isLong = source.chunkText.length > maxLength;

  // Function to highlight text
  const getHighlightedText = (text: string, highlights: string[] = []) => {
    if (!highlights || highlights.length === 0) return text;

    // Sort highlights by length descending to match longest first (avoid nested issue)
    const sortedHighlights = [...highlights].sort((a, b) => b.length - a.length);

    // Create a regex pattern
    // Escape special characters in highlights
    const pattern = new RegExp(`(${sortedHighlights.map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');

    const parts = text.split(pattern);

    return parts.map((part, i) =>
      sortedHighlights.some(h => h.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="bg-yellow-200 rounded-sm font-semibold text-text-main px-0.5">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="p-4 bg-gray-50/80 rounded-lg border border-border-subtle hover:border-secondary transition-colors text-sm group flex flex-col items-start w-full">
      <p className="font-bold text-primary text-xs mb-2 bg-secondary/50 inline-block px-2 py-0.5 rounded-md group-hover:bg-secondary transition-colors">
        {source.documentName}
      </p>
      <div className="text-text-muted italic leading-snug break-words w-full">
        {isExpanded ? (
          <span>"{getHighlightedText(source.chunkText, source.highlights)}"</span>
        ) : (
          <span>
            "{getHighlightedText(source.chunkText.substring(0, maxLength), source.highlights)}
            {isLong && '...'}"
          </span>
        )}
      </div>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-2 text-xs font-semibold text-primary hover:underline focus:outline-none"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const fetchDocuments = () => {
    api.get('/documents').then(res => setDocuments(res.data)).catch(console.error);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const selected = e.target.files ? Array.from(e.target.files) : [];
    if (selected.length === 0) {
      setFiles([]);
      return;
    }

    // Validate files: only .txt and non-empty
    for (const f of selected) {
      if (!f.name.toLowerCase().endsWith('.txt')) {
        setUploadError('Only .txt files are allowed');
        setFiles([]);
        return;
      }
      if (f.size === 0) {
        setUploadError('One or more selected files are empty');
        setFiles([]);
        return;
      }
    }

    setFiles(selected);
  };

  const handleUpload = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();
    for (const f of files) {
      formData.append('files', f);
    }

    try {
      await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFiles([]);
      // Reset file input element (uncontrolled) by clearing value
      const input = document.querySelector('input[type=file]') as HTMLInputElement | null;
      if (input) input.value = '';

      fetchDocuments();
      alert('Upload successful!');
    } catch (err: any) {
      setUploadError(err.response?.data?.error || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

  useEffect(() => {
    if (selectedDoc) {
      setIsLoadingDoc(true);
      api.get(`/documents/${selectedDoc.id}`)
        .then(res => setDocContent(res.data.content))
        .catch(err => {
          console.error(err);
          setDocContent('Failed to load document content.');
        })
        .finally(() => setIsLoadingDoc(false));
    } else {
      setDocContent('');
    }
  }, [selectedDoc]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsAsking(true);
    setAnswer('');
    setSources([]);

    try {
      const res = await api.post('/ask', { question });
      setAnswer(res.data.answer);
      setSources(res.data.sources || []);
    } catch (err: any) {
      console.error(err);
      const serverMsg = err?.response?.data?.error || err?.response?.data?.message;
      setAnswer(serverMsg || 'Sorry, something went wrong while fetching the answer.');
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Header */}
      <header className="text-center pt-8">
        <h1 className="text-4xl font-bold text-text-main mb-3 tracking-tight">Private Knowledge Q&A</h1>
        <p className="text-text-muted text-lg">Securely ask questions about your documents using local RAG.</p>
      </header>

      {/* Main Content Area */}
      <div className="space-y-8">

        {/* Top Controls: Upload & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Card */}
          <section className="bg-surface p-6 rounded-xl shadow-md border border-border-subtle hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Upload Document
            </h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept=".txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-text-muted
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-secondary file:text-primary
                    hover:file:bg-indigo-200 transition-colors
                    cursor-pointer"
                />
                {files.length > 0 && (
                  <p className="text-xs text-text-muted mt-2">{files.length} file(s) selected</p>
                )}
              </div>
              {uploadError && <p className="text-red-500 text-sm font-medium">{uploadError}</p>}
              <button
                type="button"
                onClick={handleUpload}
                disabled={files.length === 0 || isUploading}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
              >
                {isUploading ? 'Uploading...' : 'Upload .txt'}
              </button>
            </form>
          </section>

          {/* Documents Card */}
          <section className="bg-surface p-6 rounded-xl shadow-md border border-border-subtle hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-lg font-bold text-text-main mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Uploaded Documents
            </h2>
            {documents.length === 0 ? (
              <div className="h-24 flex items-center justify-center border-2 border-dashed border-border-subtle rounded-lg bg-gray-50/50">
                <p className="text-text-muted text-sm">No documents uploaded yet.</p>
              </div>
            ) : (
              <ul className="space-y-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                {documents.map(doc => (
                  <li
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="text-sm p-3 bg-gray-50/80 hover:bg-secondary/30 rounded-lg flex justify-between items-center transition-colors border border-transparent hover:border-secondary mb-1 cursor-pointer"
                  >
                    <span className="truncate font-medium text-text-main">{doc.name}</span>
                    {/* Removed chunk count badge as requested */}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Q&A Section */}
        <section className="bg-surface p-8 rounded-xl shadow-md border border-border-subtle min-h-[400px] flex flex-col relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-secondary/20 rounded-full blur-3xl pointer-events-none"></div>

          <h2 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2 relative z-10">
            <Send className="w-6 h-6 text-primary" /> Ask a Question
          </h2>

          <form onSubmit={handleAsk} className="flex gap-3 mb-8 relative z-10">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something about your documents..."
              className="flex-1 p-4 bg-gray-50 border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-text-main placeholder-text-muted transition-all shadow-sm"
            />
            <button
              type="submit"
              disabled={!question.trim() || isAsking || documents.length === 0}
              className="bg-primary hover:bg-primary-hover text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform active:scale-95"
            >
              {isAsking ? 'Thinking...' : 'Ask'}
            </button>
          </form>

          {answer && (
            <div className="flex-1 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="p-6 bg-secondary/20 rounded-xl border-l-4 border-primary relative">
                <h3 className="font-bold text-primary mb-3 text-lg">Answer</h3>
                <p className="leading-relaxed text-text-main text-lg">{answer}</p>
              </div>

              {sources.length > 0 && (
                <div className="pt-4 border-t border-border-subtle">
                  <h3 className="font-semibold text-text-muted mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" /> Sources
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sources.map((source, idx) => (
                      <SourceCard key={idx} source={source} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Document Viewer Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-text-main">{selectedDoc.name}</h3>
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-text-muted hover:text-text-main transition-colors p-1 rounded-full hover:bg-gray-200"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
              {isLoadingDoc ? (
                <div className="flex justify-center items-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none text-text-main whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {docContent || 'No content available.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
