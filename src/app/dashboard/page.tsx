'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
    Plus,
    Trash2,
    ExternalLink,
    Search,
    LogOut,
    Bookmark as BookmarkIcon,
    Link as LinkIcon,
    Copy,
    Check,
    Loader2,
    Inbox,
    LayoutGrid
} from 'lucide-react'

interface Bookmark {
    id: string
    title: string
    url: string
    created_at: string
    user_id: string
}

export default function Dashboard() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [title, setTitle] = useState('')
    const [url, setUrl] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) {
                router.push('/')
            } else {
                setUser(session.user)
                fetchBookmarks()
            }
            setLoading(false)
        }

        checkUser()

        const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push('/')
            }
        })

        return () => {
            authSubscription.unsubscribe()
        }
    }, [router])

    useEffect(() => {
        if (!user) return

        const channel = supabase
            .channel(`user_bookmarks_${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookmarks',
                    filter: `user_id=eq.${user.id}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newBookmark = payload.new as Bookmark
                        setBookmarks((current) => {
                            if (current.find(b => b.id === newBookmark.id)) return current
                            return [newBookmark, ...current]
                        })
                    }

                    if (payload.eventType === 'DELETE' && payload.old?.id) {
                        setBookmarks((current) =>
                            current.filter((b) => b.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user])

    const fetchBookmarks = async () => {
        const { data, error } = await supabase
            .from('bookmarks')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching bookmarks:', error)
        } else {
            setBookmarks(data || [])
        }
    }

    const addBookmark = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !url) return

        setSubmitting(true)

        const { data, error } = await supabase
            .from('bookmarks')
            .insert([{ title, url, user_id: user.id }])
            .select()

        if (error) {
            alert(error.message)
        } else if (data) {
            const newBookmark = data[0] as Bookmark
            setBookmarks(current => {
                if (current.find(b => b.id === newBookmark.id)) return current
                return [newBookmark, ...current]
            })
            setTitle('')
            setUrl('')
        }
        setSubmitting(false)
    }

    const deleteBookmark = async (id: string) => {
        const originalBookmarks = [...bookmarks]
        setBookmarks(current => current.filter(b => b.id !== id))

        const { error } = await supabase
            .from('bookmarks')
            .delete()
            .eq('id', id)

        if (error) {
            alert(error.message)
            setBookmarks(originalBookmarks)
        }
    }

    const handleCopy = (bookmark: Bookmark) => {
        navigator.clipboard.writeText(bookmark.url)
        setCopiedId(bookmark.id)
        setTimeout(() => setCopiedId(null), 2000)
    }

    const filteredBookmarks = useMemo(() => {
        return bookmarks.filter(b =>
            b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.url.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [bookmarks, searchQuery])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f5f7ff]">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        )
    }

    if (!user) return null

    return (
        <div className="min-h-screen bg-[#f5f7ff] text-slate-900">
            {/* Header */}
            <nav className="sticky top-0 z-20 border-b border-indigo-100/50 bg-white/70 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 sm:h-20 justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="bg-indigo-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-200">
                                <BookmarkIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900">SmartMark</h1>
                                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest hidden md:block">Dashboard</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-6">
                            <div className="hidden sm:flex items-center gap-2 bg-indigo-50/50 border border-indigo-100 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl sm:rounded-2xl">
                                <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-[10px] sm:text-xs font-bold text-indigo-700 max-w-[100px] sm:max-w-none truncate">
                                    {user.email}
                                </span>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-2 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 active:scale-95"
                            >
                                <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden xs:inline">Sign out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
                <div className="grid gap-6 md:gap-10 lg:grid-cols-[380px_1fr]">
                    {/* Add Bookmark Form */}
                    <aside className="order-1 lg:order-1">
                        <div className="rounded-[32px] sm:rounded-[40px] border border-white bg-white/60 p-6 sm:p-10 shadow-2xl shadow-indigo-100/40 backdrop-blur-sm">
                            <h2 className="text-xl sm:text-2xl font-black mb-6 sm:mb-8 flex items-center gap-3 text-slate-900">
                                <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                                Add New
                            </h2>
                            <form onSubmit={addBookmark} className="space-y-4 sm:space-y-6">
                                <div className="space-y-2">
                                    <label htmlFor="title" className="text-xs sm:text-sm font-bold text-slate-700 ml-1">
                                        Label Name
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. Design Inspiration"
                                        className="w-full text-slate-900 rounded-[18px] sm:rounded-[20px] border border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5 sm:py-4 text-sm focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-400 font-semibold"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="url" className="text-xs sm:text-sm font-bold text-slate-700 ml-1">
                                        Destination URL
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="url"
                                            id="url"
                                            value={url}
                                            onChange={(e) => setUrl(e.target.value)}
                                            placeholder="https://yourapp.link"
                                            className="w-full text-slate-900 rounded-[18px] sm:rounded-[20px] border border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-5 sm:py-4 text-sm pr-10 sm:pr-12 focus:bg-white focus:border-indigo-500 focus:ring-0 outline-none transition-all placeholder:text-slate-400 font-semibold"
                                            required
                                        />
                                        <LinkIcon className="absolute right-4 sm:right-5 top-3.5 sm:top-4.5 h-4 w-4 text-indigo-300" />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full flex items-center justify-center gap-2 sm:gap-3 rounded-[18px] sm:rounded-[20px] bg-indigo-600 px-4 py-3.5 sm:px-6 sm:py-4.5 text-sm sm:text-base font-black text-white hover:bg-indigo-700 disabled:bg-indigo-200 transition-all shadow-xl shadow-indigo-200/50 active:scale-[0.97]"
                                >
                                    {submitting ? (
                                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                                            Save Link
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </aside>

                    {/* Bookmarks List */}
                    <section className="space-y-6 sm:space-y-8 order-2 lg:order-2">
                        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-between items-stretch sm:items-center">
                            <div className="relative w-full lg:max-w-lg group">
                                <Search className="absolute left-5 sm:left-6 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search collection..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full rounded-[20px] sm:rounded-[24px] border border-white bg-white px-12 sm:px-14 py-3.5 sm:py-4.5 text-sm sm:text-base focus:border-indigo-500 focus:ring-0 outline-none transition-all shadow-xl shadow-indigo-100/30 font-bold placeholder:text-slate-300"
                                />
                            </div>
                            <div className="flex items-center justify-center gap-2 bg-white px-4 py-2 sm:px-5 sm:py-3 rounded-full border border-indigo-50 shadow-sm flex-shrink-0">
                                <span className="text-[10px] sm:text-xs font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">
                                    {filteredBookmarks.length} {filteredBookmarks.length === 1 ? "Bookmark" : "Bookmarks"}
                                </span>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:gap-5">
                            {filteredBookmarks.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-[32px] sm:rounded-[48px] border-2 border-dashed border-indigo-100 bg-white/50 p-12 sm:p-24 text-center">
                                    <div className="bg-indigo-50 p-4 sm:p-6 rounded-[24px] sm:rounded-[32px] mb-4 sm:mb-6">
                                        <Inbox className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-300" />
                                    </div>
                                    <h3 className="text-lg sm:text-xl font-black text-slate-900">Collection Empty</h3>
                                    <p className="text-xs sm:text-sm text-slate-500 max-w-[240px] mt-2 sm:mt-3 font-bold px-4">
                                        Start adding your favorite links to build your dashboard.
                                    </p>
                                </div>
                            ) : (
                                filteredBookmarks.map((bookmark) => (
                                    <div
                                        key={bookmark.id}
                                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between rounded-[24px] sm:rounded-[32px] border border-transparent bg-white p-4 sm:p-6 shadow-xl shadow-indigo-100/20 transition-all hover:shadow-2xl hover:shadow-indigo-200/30 hover:border-indigo-100 md:hover:-translate-y-1 gap-4"
                                    >
                                        <div className="min-w-0 flex items-center gap-4 sm:gap-6">
                                            <div className="h-10 w-10 sm:h-14 sm:w-14 flex-shrink-0 bg-indigo-50 rounded-[14px] sm:rounded-[20px] flex items-center justify-center group-hover:bg-indigo-600 transition-all shadow-sm">
                                                <LinkIcon className="h-4 w-4 sm:h-6 sm:w-6 text-indigo-600 group-hover:text-white transition-all" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="truncate text-base sm:text-lg font-black text-slate-900 mb-0.5 sm:mb-1 leading-tight">
                                                    {bookmark.title}
                                                </h3>
                                                <a
                                                    href={bookmark.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1.5 text-xs sm:text-sm text-indigo-400 font-bold hover:text-indigo-700 transition-colors"
                                                >
                                                    <span className="truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                                                        {bookmark.url}
                                                    </span>
                                                    <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                                                </a>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto border-t sm:border-t-0 border-indigo-50 pt-3 sm:pt-0 w-full sm:w-auto justify-end">
                                            <button
                                                onClick={() => handleCopy(bookmark)}
                                                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-all bg-slate-50 border border-slate-100 flex-shrink-0"
                                                title="Copy Link"
                                            >
                                                {copiedId === bookmark.id ? (
                                                    <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                                                ) : (
                                                    <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteBookmark(bookmark.id)}
                                                className="rounded-xl sm:rounded-2xl p-2.5 sm:p-3 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all bg-slate-50 border border-slate-100 flex-shrink-0"
                                                title="Delete Bookmark"
                                            >
                                                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    )
}
