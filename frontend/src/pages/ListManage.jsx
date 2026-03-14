import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

function EditableItemRow({ item, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [titleValue, setTitleValue] = useState(item.title);
  const [descValue, setDescValue] = useState(item.description || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!titleValue.trim()) return;
    setSaving(true);
    await onSave(item._id, titleValue.trim(), descValue.trim());
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setTitleValue(item.title);
    setDescValue(item.description || '');
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSave();
    if (e.key === 'Escape') handleCancel();
  };

  if (editing) {
    return (
      <div className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setTitleValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="input-field text-sm"
          autoFocus
          disabled={saving}
        />
        <input
          type="text"
          value={descValue}
          onChange={(e) => setDescValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Description (optional)"
          className="input-field text-sm"
          disabled={saving}
        />
        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary py-1 px-3 text-sm">
            {saving ? '...' : 'Save'}
          </button>
          <button onClick={handleCancel} disabled={saving} className="btn-secondary py-1 px-3 text-sm">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 group">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800">{item.title}</p>
        {item.description && (
          <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
        )}
      </div>
      <button
        onClick={() => setEditing(true)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
        title="Edit item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
      <button
        onClick={() => onDelete(item._id)}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all duration-150 opacity-0 group-hover:opacity-100"
        title="Delete item"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ListManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [savingTitle, setSavingTitle] = useState(false);

  // Share form
  const [shareEmail, setShareEmail] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareSuccess, setShareSuccess] = useState('');

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

  const isOwner = list && (list.owner?._id === user?._id || list.owner === user?._id);

  const startEditTitle = () => {
    setTitleValue(list.title);
    setEditingTitle(true);
  };

  const cancelEditTitle = () => {
    setEditingTitle(false);
    setTitleValue('');
  };

  const saveTitle = async () => {
    if (!titleValue.trim()) return;
    if (titleValue.trim() === list.title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    try {
      const res = await client.put(`/lists/${id}`, { title: titleValue.trim() });
      setList(res.data.data);
      setEditingTitle(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update title');
    } finally {
      setSavingTitle(false);
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') saveTitle();
    if (e.key === 'Escape') cancelEditTitle();
  };

  const handleSaveItem = async (itemId, title, description) => {
    try {
      const res = await client.put(`/lists/${id}/items/${itemId}`, { title, description });
      setList(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const res = await client.delete(`/lists/${id}/items/${itemId}`);
      setList(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    setShareError('');
    setShareSuccess('');
    if (!shareEmail.trim()) { setShareError('Please enter an email'); return; }
    setSharing(true);
    try {
      const res = await client.post(`/lists/${id}/share`, { email: shareEmail.trim() });
      setList(res.data.data);
      setShareEmail('');
      setShareSuccess('List shared successfully!');
      setTimeout(() => setShareSuccess(''), 3000);
    } catch (err) {
      setShareError(err.response?.data?.error || 'Failed to share list');
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveShare = async (userId) => {
    try {
      const res = await client.delete(`/lists/${id}/share/${userId}`);
      setList(res.data.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove user');
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
          <button onClick={() => navigate('/')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

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
          <h1 className="text-xl font-bold text-indigo-600">Manage list</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* List title */}
        <div className="card p-6">
          {editingTitle && isOwner ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                className="input-field text-xl font-bold flex-1"
                autoFocus
                disabled={savingTitle}
              />
              <button onClick={saveTitle} disabled={savingTitle} className="btn-primary py-1.5 px-3 text-sm">
                {savingTitle ? '...' : 'Save'}
              </button>
              <button onClick={cancelEditTitle} disabled={savingTitle} className="btn-secondary py-1.5 px-3 text-sm">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-800 flex-1">{list.title}</h2>
              {isOwner && (
                <button
                  onClick={startEditTitle}
                  className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors duration-150"
                  title="Edit title"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Share section (owner only) */}
        {isOwner && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Sharing</h3>
            <form onSubmit={handleShare} className="flex gap-2 mb-4">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="Share with email..."
                className="input-field flex-1"
                disabled={sharing}
              />
              <button type="submit" className="btn-primary" disabled={sharing}>
                {sharing ? 'Sharing...' : 'Share'}
              </button>
            </form>
            {shareError && <p className="text-sm text-red-600 mb-3">{shareError}</p>}
            {shareSuccess && <p className="text-sm text-green-600 mb-3">{shareSuccess}</p>}
            {list.sharedWith && list.sharedWith.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Shared with</p>
                {list.sharedWith.map((sharedUser) => (
                  <div key={sharedUser._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700">{sharedUser.email}</span>
                    <button
                      onClick={() => handleRemoveShare(sharedUser._id)}
                      className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors duration-150"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not shared with anyone yet.</p>
            )}
          </div>
        )}

        {/* Items list with edit/delete */}
        {list.items.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Items
                <span className="ml-2 text-sm font-normal text-gray-400">({list.items.length})</span>
              </h3>
            </div>
            <div className="p-3 space-y-1">
              {list.items.map((item) => (
                <EditableItemRow
                  key={item._id}
                  item={item}
                  onSave={handleSaveItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
