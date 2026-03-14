import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

function ListCard({ list, currentUserId, onDelete }) {
  const navigate = useNavigate();
  const isOwner = list.owner?._id === currentUserId || list.owner === currentUserId;
  const totalItems = list.items?.length || 0;
  const resolvedItems = list.items?.filter((i) => i.resolved).length || 0;

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${list.title}"? This cannot be undone.`)) {
      onDelete(list._id);
    }
  };

  return (
    <div
      className="card p-5 cursor-pointer hover:shadow-md transition-shadow duration-150 group"
      onClick={() => navigate(`/lists/${list._id}`)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-lg font-semibold text-gray-800 truncate">{list.title}</h3>
            {isOwner ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                Owner
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Shared
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            {totalItems === 0
              ? 'No items yet'
              : `${resolvedItems} / ${totalItems} done`}
          </p>
          {totalItems > 0 && (
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(resolvedItems / totalItems) * 100}%` }}
              />
            </div>
          )}
        </div>
        {isOwner && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-150"
            title="Delete list"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const fetchLists = useCallback(async () => {
    try {
      setError('');
      const res = await client.get('/lists');
      setLists(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load lists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError('');
    if (!newTitle.trim()) {
      setCreateError('Please enter a title');
      return;
    }
    setCreating(true);
    try {
      const res = await client.post('/lists', { title: newTitle.trim() });
      setLists((prev) => [res.data.data, ...prev]);
      setNewTitle('');
      setShowCreateForm(false);
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create list');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/lists/${id}`);
      setLists((prev) => prev.filter((l) => l._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete list');
    }
  };

  const myLists = lists.filter(
    (l) => l.owner?._id === user?._id || l.owner === user?._id
  );
  const sharedLists = lists.filter(
    (l) => l.owner?._id !== user?._id && l.owner !== user?._id
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-indigo-600">ShopList</h1>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-gray-500">{user?.email}</span>
            <button
              onClick={logout}
              className="btn-secondary text-sm py-1.5 px-3"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Create list section */}
        <div className="mb-8">
          {!showCreateForm ? (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New list
            </button>
          ) : (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 mb-3">Create a new list</h3>
              {createError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {createError}
                </div>
              )}
              <form onSubmit={handleCreate} className="flex gap-2">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Weekly Groceries"
                  className="input-field flex-1"
                  autoFocus
                  disabled={creating}
                />
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setNewTitle(''); setCreateError(''); }}
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
            <button onClick={fetchLists} className="ml-2 underline text-sm">
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <>
            {/* My Lists */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-700 mb-3">
                My Lists
                <span className="ml-2 text-sm font-normal text-gray-400">({myLists.length})</span>
              </h2>
              {myLists.length === 0 ? (
                <div className="card p-8 text-center text-gray-400">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>No lists yet. Create your first one!</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {myLists.map((list) => (
                    <ListCard
                      key={list._id}
                      list={list}
                      currentUserId={user?._id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Shared with me */}
            {sharedLists.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">
                  Shared with me
                  <span className="ml-2 text-sm font-normal text-gray-400">({sharedLists.length})</span>
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {sharedLists.map((list) => (
                    <ListCard
                      key={list._id}
                      list={list}
                      currentUserId={user?._id}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
