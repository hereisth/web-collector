import { createFileRoute } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { bookmarkApi } from '@/lib/api'
import type { Bookmark, CreateBookmarkRequest } from '@/types/bookmark'

export const Route = createFileRoute('/')({
  component: BookmarksPage,
})

function BookmarksPage() {
  const queryClient = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null)

  // Fetch bookmarks
  const {
    data: bookmarks,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: bookmarkApi.getAll,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: bookmarkApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      setIsFormOpen(false)
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBookmarkRequest }) =>
      bookmarkApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      setEditingBookmark(null)
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: bookmarkApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    },
  })

  const handleSubmit = (data: CreateBookmarkRequest) => {
    if (editingBookmark) {
      updateMutation.mutate({ id: editingBookmark.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个书签吗？')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark)
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingBookmark(null)
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200">
          <p className="font-medium">加载失败</p>
          <p className="text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Web Collector
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">你的书签管理器</p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium 
                       hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md
                       flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            添加书签
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : bookmarks && bookmarks.length > 0 ? (
          <div className="grid gap-4">
            {bookmarks.map((bookmark) => (
              <BookmarkCard
                key={bookmark.id}
                bookmark={bookmark}
                onEdit={handleEdit}
                onDelete={handleDelete}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        ) : (
          <EmptyState onAddClick={() => setIsFormOpen(true)} />
        )}
      </main>

      {/* Form Modal */}
      {isFormOpen && (
        <BookmarkFormModal
          bookmark={editingBookmark}
          onSubmit={handleSubmit}
          onClose={handleCloseForm}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  )
}

// Bookmark Card Component
function BookmarkCard({
  bookmark,
  onEdit,
  onDelete,
  isDeleting,
}: {
  bookmark: Bookmark
  onEdit: (bookmark: Bookmark) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}) {
  const hostname = (() => {
    try {
      return new URL(bookmark.url).hostname
    } catch {
      return bookmark.url
    }
  })()

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all duration-200 group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1"
          >
            {bookmark.title}
          </a>
          <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
            <span className="truncate">{hostname}</span>
          </p>
          <p className="text-xs text-slate-400 mt-2">
            添加于{' '}
            {new Date(bookmark.created_at).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(bookmark)}
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="编辑"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(bookmark.id)}
            disabled={isDeleting}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            title="删除"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <div className="text-center py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-6">
        <svg
          className="w-10 h-10 text-indigo-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      </div>
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        还没有书签
      </h3>
      <p className="text-slate-500 mb-6">
        点击下方按钮添加你的第一个书签
      </p>
      <button
        onClick={onAddClick}
        className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium 
                   hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
      >
        添加书签
      </button>
    </div>
  )
}

// Form Modal Component
function BookmarkFormModal({
  bookmark,
  onSubmit,
  onClose,
  isSubmitting,
}: {
  bookmark: Bookmark | null
  onSubmit: (data: CreateBookmarkRequest) => void
  onClose: () => void
  isSubmitting: boolean
}) {
  const [title, setTitle] = useState(bookmark?.title ?? '')
  const [url, setUrl] = useState(bookmark?.url ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim() && url.trim()) {
      onSubmit({ title: title.trim(), url: url.trim() })
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-semibold text-slate-800">
            {bookmark ? '编辑书签' : '添加书签'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                标题
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：GitHub"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-slate-400"
                required
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                网址
              </label>
              <input
                type="url"
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://github.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                           placeholder:text-slate-400"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-lg
                         font-medium hover:bg-slate-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !url.trim()}
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium
                         hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '保存中...' : bookmark ? '保存' : '添加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
