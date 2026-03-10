import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { jobsApi, ApplicationWithDetails } from '@/api/jobs'
import { Bell, Briefcase, Send, CheckCircle, X, MessageCircle, Loader2, Clock, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { chatApi } from '@/api/chat'
import { useState } from 'react'

export default function NotificationsPage() {
    const { user } = useAuthStore()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const [startingChatWith, setStartingChatWith] = useState<string | null>(null)
    const [expandedPitches, setExpandedPitches] = useState<Set<string>>(new Set())

    const togglePitch = (appId: string) => {
        setExpandedPitches(prev => {
            const next = new Set(prev)
            if (next.has(appId)) next.delete(appId)
            else next.add(appId)
            return next
        })
    }

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['notifications', user?.id],
        queryFn: () => jobsApi.getNotifications(user!.id),
        enabled: !!user,
    })

    const updateStatusMutation = useMutation({
        mutationFn: ({ appId, status }: { appId: string, status: 'ACCEPTED' | 'REJECTED' }) =>
            jobsApi.updateApplicationStatus(appId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] })
        }
    })

    const handleStartChat = async (otherUserId: string) => {
        if (!user) return
        setStartingChatWith(otherUserId)
        try {
            await chatApi.getOrCreateConversation(user.id, otherUserId)
            navigate('/chat')
        } catch (err) {
            console.error('Failed to start chat:', err)
            alert('Failed to start chat')
        } finally {
            setStartingChatWith(null)
        }
    }

    // Format relative time for better UX
    const formatRelativeTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffHours < 24) return `${diffHours}h ago`
        if (diffDays < 7) return `${diffDays}d ago`
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold 
                        bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 
                        border border-amber-200/60 shadow-sm
                        dark:from-amber-900/30 dark:to-yellow-900/30 dark:text-amber-400 dark:border-amber-700/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                    </span>
                )
            case 'ACCEPTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold 
                        bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 
                        border border-emerald-200/60 shadow-sm
                        dark:from-emerald-900/30 dark:to-green-900/30 dark:text-emerald-400 dark:border-emerald-700/50">
                        <CheckCircle className="w-3 h-3" />
                        Accepted
                    </span>
                )
            case 'REJECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold 
                        bg-gradient-to-r from-red-50 to-rose-50 text-red-700 
                        border border-red-200/60 shadow-sm
                        dark:from-red-900/30 dark:to-rose-900/30 dark:text-red-400 dark:border-red-700/50">
                        <X className="w-3 h-3" />
                        Rejected
                    </span>
                )
            default:
                return (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium 
                        bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        {status}
                    </span>
                )
        }
    }

    const ApplicationCard = ({ app, isCreatorView, index }: { app: ApplicationWithDetails, isCreatorView: boolean, index: number }) => (
        <div
            className="group p-4 bg-gradient-to-br from-gray-50/80 to-white rounded-xl 
                border border-gray-100 hover:border-gray-200 
                shadow-sm hover:shadow-md
                transition-all duration-300 ease-out
                dark:from-gray-800/80 dark:to-gray-800 dark:border-gray-700 dark:hover:border-gray-600
                animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <div className="p-1.5 rounded-lg bg-orange-100 dark:bg-orange-900/40">
                            <Briefcase className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Gig</span>
                    </div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                        {app.job_title || 'Unknown Gig'}
                    </h4>
                    {isCreatorView && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                                {(app.applicant_username || app.applicant_email?.split('@')[0] || 'A')[0].toUpperCase()}
                            </span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                                {app.applicant_username || app.applicant_email?.split('@')[0] || 'Anonymous'}
                            </span>
                        </p>
                    )}
                </div>
                <div className="ml-3 flex-shrink-0">
                    {getStatusBadge(app.status)}
                </div>
            </div>

            {app.pitch && (
                <div
                    className="mb-3 p-3 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg border-l-2 border-orange-300 dark:border-orange-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 transition-colors"
                    onClick={() => togglePitch(app.id)}
                    title={expandedPitches.has(app.id) ? 'Click to collapse' : 'Click to read full pitch'}
                >
                    <p className={`text-sm text-gray-600 dark:text-gray-300 italic ${expandedPitches.has(app.id) ? '' : 'line-clamp-2'}`}>
                        "{app.pitch}"
                    </p>
                    {!expandedPitches.has(app.id) && app.pitch.length > 100 && (
                        <span className="text-xs text-orange-500 dark:text-orange-400 font-medium mt-1 inline-block">Click to read more</span>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelativeTime(app.created_at)}</span>
                </div>

                <div className="flex gap-1">
                    {isCreatorView && app.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'ACCEPTED' })}
                                disabled={updateStatusMutation.isPending}
                                className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 
                                    transition-all duration-200 hover:scale-105 active:scale-95
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 dark:text-emerald-400
                                    shadow-sm hover:shadow"
                                title="Accept Application"
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => updateStatusMutation.mutate({ appId: app.id, status: 'REJECTED' })}
                                disabled={updateStatusMutation.isPending}
                                className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 
                                    transition-all duration-200 hover:scale-105 active:scale-95
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400
                                    shadow-sm hover:shadow"
                                title="Reject Application"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}

                    {isCreatorView && app.applicant_id && (
                        <button
                            onClick={() => handleStartChat(app.applicant_id)}
                            disabled={startingChatWith === app.applicant_id}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 
                                transition-all duration-200 hover:scale-105 active:scale-95
                                disabled:opacity-50 disabled:cursor-not-allowed
                                dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400
                                shadow-sm hover:shadow"
                            title="Message Applicant"
                        >
                            {startingChatWith === app.applicant_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MessageCircle className="w-4 h-4" />
                            )}
                        </button>
                    )}

                    {!isCreatorView && app.job_creator_id && (
                        <button
                            onClick={() => handleStartChat(app.job_creator_id!)}
                            disabled={startingChatWith === app.job_creator_id}
                            className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 
                                transition-all duration-200 hover:scale-105 active:scale-95
                                disabled:opacity-50 disabled:cursor-not-allowed
                                dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400
                                shadow-sm hover:shadow"
                            title="Message Gig Creator"
                        >
                            {startingChatWith === app.job_creator_id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <MessageCircle className="w-4 h-4" />
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    )

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="max-w-6xl mx-auto animate-fade-in">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/30 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    </div>
                    <div className="h-8 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    {[0, 1].map((col) => (
                        <div key={col} className="card overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                    <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            </div>
                            <div className="p-4 space-y-3">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl animate-pulse">
                                        <div className="flex justify-between mb-3">
                                            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                                            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
                                        </div>
                                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3" />
                                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const applicationsOnGigs = notifications?.applications_on_your_gigs || []
    const yourApplications = notifications?.your_applications || []
    const totalNotifications = applicationsOnGigs.length + yourApplications.length

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-800/30 shadow-sm">
                        <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Notifications</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {totalNotifications > 0 ? `${totalNotifications} total updates` : 'Stay updated on your gigs'}
                        </p>
                    </div>
                </div>
                {totalNotifications > 0 && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200/50 dark:border-orange-700/50">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-orange-700 dark:text-orange-400">{totalNotifications} new</span>
                    </div>
                )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Applications on Your Gigs */}
                <div className="card overflow-hidden group">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-orange-50/50 to-transparent dark:from-orange-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/40 group-hover:scale-105 transition-transform">
                                <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Applications on Your Gigs</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Review and respond to applicants</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                                {applicationsOnGigs.length}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto modal-scrollbar">
                        {applicationsOnGigs.length > 0 ? (
                            applicationsOnGigs.map((app, index) => (
                                <ApplicationCard key={app.id} app={app} isCreatorView={true} index={index} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">No applications yet</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    When someone applies to your gigs, you'll see their applications here
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Your Applications */}
                <div className="card overflow-hidden group">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/20">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 group-hover:scale-105 transition-transform">
                                <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="flex-1">
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Your Applications</h2>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Track your application status</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                                {yourApplications.length}
                            </span>
                        </div>
                    </div>
                    <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto modal-scrollbar">
                        {yourApplications.length > 0 ? (
                            yourApplications.map((app, index) => (
                                <ApplicationCard key={app.id} app={app} isCreatorView={false} index={index} />
                            ))
                        ) : (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <Send className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">No applications sent</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                                    Start applying to gigs to build your portfolio
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
