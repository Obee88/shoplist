import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';

function ItemRow({ item, onToggle }) {
  return (
    <button
      onClick={() => onToggle(item._id, !item.resolved)}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors duration-150 text-left active:scale-[0.99] ${
        item.resolved ? 'bg-gray-100' : 'bg-white border border-gray-200'
      }`}
    >
      <div
        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors duration-150 ${
          item.resolved
            ? 'bg-indigo-600 border-indigo-600'
            : 'border-gray-300'
        }`}
      >
        {item.resolved && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-base font-medium leading-5 ${item.resolved ? 'line-through text-gray-400' : 'text-gray-800'}`}>
          {item.title}
        </p>
        {item.description && (
          <p className={`text-sm mt-0.5 ${item.resolved ? 'text-gray-300 line-through' : 'text-gray-500'}`}>
            {item.description}
          </p>
        )}
      </div>
    </button>
  );
}

export default function ListDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchList = useCallback(async () => {
    try {
      setError('');
      const res = await client.get(`/lists/${id}`);
      setList(res.data.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('List not found');
      } else {
        setError(err.response?.data?.error || 'Failed to load list');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleToggleItem = async (itemId, resolved) => {
    try {
      const res = await client.put(`/lists/${id}/items/${itemId}`, { resolved });
      setList(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update item');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="card p-8 text-center max-w-sm w-full">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sortedItems = list
    ? [...list.items].sort((a, b) => {
        if (a.resolved === b.resolved) return 0;
        return a.resolved ? 1 : -1;
      })
    : [];

  const totalItems = list?.items?.length || 0;
  const resolvedItems = list?.items?.filter((i) => i.resolved).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-150"
            title="Back to Dashboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-gray-800 truncate">{list.title}</h2>
            {totalItems > 0 && (
              <p className="text-xs text-gray-400">{resolvedItems} / {totalItems} done</p>
            )}
          </div>

          <button
            onClick={() => navigate(`/lists/${id}/manage`)}
            className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-150"
            title="Manage list"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {sortedItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <p className="text-sm mb-4">No items yet.</p>
            <button onClick={() => navigate(`/lists/${id}/add`)} className="btn-primary text-sm">
              Add items
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedItems.map((item) => (
              <ItemRow key={item._id} item={item} onToggle={handleToggleItem} />
            ))}
          </div>
        )}
      </main>

      {/* Floating add button */}
      <button
        onClick={() => navigate(`/lists/${id}/add`)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors duration-150 active:scale-95"
        title="Add items"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
