import React, { useState, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { FileType, Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react';
import BackToTools from '../components/BackToTools';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
];

const WordToPdfPage: React.FC = () => {
  const { theme } = useTheme();
  const { token } = useAuth();
  const isDark = theme === 'dark';

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadName, setDownloadName] = useState('');

  const handleFile = (f: File) => {
    setError('');
    setDownloadUrl(null);
    const isDocx = f.name.toLowerCase().endsWith('.docx');
    const isDoc  = f.name.toLowerCase().endsWith('.doc');
    if (!isDocx && !isDoc && !ACCEPTED_MIME.includes(f.type)) {
      setError('Please upload a Word file (.docx or .doc).');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File size must be under 20 MB.');
      return;
    }
    setFile(f);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setConverting(true);
    setError('');
    setDownloadUrl(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${BACKEND_URL}/api/convert/word-to-pdf`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        let msg = `Conversion failed (${res.status})`;
        try { const j = await res.json(); msg = j.detail || j.error || msg; } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = file.name.replace(/\.docx?$/i, '.pdf');
      setDownloadUrl(url);
      setDownloadName(name);
    } catch (e: any) {
      setError(e.message || 'Conversion failed. Please try again.');
    } finally {
      setConverting(false);
    }
  };

  const reset = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setFile(null);
    setDownloadUrl(null);
    setDownloadName('');
    setError('');
  };

  return (
    <div className={`min-h-screen px-6 py-10 ${isDark ? 'bg-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-2xl mx-auto">
        <BackToTools />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-indigo-500/20">
              <FileType className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-black">Word to PDF</h1>
          </div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Convert a Word (.docx / .doc) document into a PDF file.
          </p>
        </div>

        {/* Drop Zone */}
        {!downloadUrl && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => document.getElementById('word-upload')?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-indigo-500 bg-indigo-500/10'
                : isDark ? 'border-gray-600 hover:border-indigo-500 hover:bg-indigo-500/5' : 'border-gray-300 hover:border-indigo-400 hover:bg-indigo-50'
            }`}
          >
            <input
              id="word-upload"
              type="file"
              accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-xl bg-indigo-500/20">
                  <FileType className="w-8 h-8 text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{file.name}</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); reset(); }}
                  className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${isDark ? 'bg-dark-400 text-gray-400 hover:text-red-400' : 'bg-gray-100 text-gray-500 hover:text-red-500'}`}
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-dark-400' : 'bg-gray-100'}`}>
                  <Upload className={`w-8 h-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                </div>
                <div>
                  <p className="font-semibold text-sm">Drop your Word file here</p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    .docx or .doc · Max 20 MB · or click to browse
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Convert Button */}
        {file && !downloadUrl && (
          <button
            onClick={handleConvert}
            disabled={converting}
            className="mt-6 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
          >
            {converting
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Converting...</>
              : <><FileType className="w-5 h-5" /> Convert to PDF</>}
          </button>
        )}

        {/* Success + Download */}
        {downloadUrl && (
          <div className={`mt-6 rounded-2xl border p-6 flex flex-col items-center gap-4 ${isDark ? 'bg-dark-300 border-gray-700' : 'bg-white border-gray-200'}`}>
            <div className="p-3 rounded-xl bg-green-500/20">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-center">
              <p className="font-bold text-base">Conversion complete!</p>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{downloadName}</p>
            </div>
            <a
              href={downloadUrl}
              download={downloadName}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF
            </a>
            <button
              onClick={reset}
              className={`text-sm font-medium transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Convert another file
            </button>
          </div>
        )}

        {/* Info */}
        <div className={`mt-8 rounded-xl border p-4 text-xs ${isDark ? 'bg-dark-300 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <p className="font-semibold mb-1">Supported input</p>
          <p>.docx and .doc files up to 20 MB. Fonts, tables, images, and formatting are preserved where possible. Complex layouts may vary slightly in the output PDF.</p>
        </div>
      </div>
    </div>
  );
};

export default WordToPdfPage;
