import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function ListAdd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [added, setAdded] = useState([]);

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) { setError('Title is required'); return; }
    setAdding(true);
    try {
      await client.post(`/lists/${id}/items`, {
        title: title.trim(),
        description: desc.trim()
      });
      setAdded((prev) => [...prev, title.trim()]);
      setTitle('');
      setDesc('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    } finally {
      setAdding(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd(e);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/lists/${id}`)}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            title="Back to list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-indigo-600 flex-1">Add items</h1>
          {added.length > 0 && (
            <button
              onClick={() => navigate(`/lists/${id}`)}
              className="btn-primary py-1.5 px-4 text-sm"
            >
              Done
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Item title *"
              className="input-field text-base"
              disabled={adding}
              autoFocus
            />
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Description (optional)"
              className="input-field"
              disabled={adding}
            />
            <button
              onClick={handleAdd}
              disabled={adding || !title.trim()}
              className="btn-primary w-full"
            >
              {adding ? 'Adding...' : 'Add item'}
            </button>
          </div>
        </div>

        {added.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-500">Added this session</p>
            </div>
            <div className="p-3 space-y-1">
              {added.map((name, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                  <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-gray-700">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
