import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useNavigate } from 'react-router-dom'
import { Job, jobsApi, Application } from '@/api/jobs'
import { chatApi } from '@/api/chat'
import { aiApi } from '@/api/ai'
import { useAuthStore } from '@/stores/authStore'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X, User, Calendar, Tag, Trash2, CheckCircle, Loader2, Send, FileText, MessageCircle, Star, Sparkles } from 'lucide-react'
import { CreateReviewModal } from '@/components/reviews/CreateReviewModal'

interface JobDetailModalProps {
    job: Job | null
    isOpen: boolean
    onClose: () => void
}

export function JobDetailModal({ job, isOpen, onClose }: JobDetailModalProps) {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()
    const navigate = useNavigate()
    const [pitch, setPitch] = useState('')
    const [showApplyForm, setShowApplyForm] = useState(false)
    const [isStartingChat, setIsStartingChat] = useState(false)
    const [isGeneratingPitch, setIsGeneratingPitch] = useState(false)

    // Review State
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [revieweeInfo, setRevieweeInfo] = useState<{ id: string, name: string } | null>(null)

    const isCreator = user?.id === job?.creator_id

    // Fetch applications if creator
    const { data: applications } = useQuery({
        queryKey: ['applications', job?.id],
        queryFn: () => jobsApi.getApplications(job!.id),
        enabled: isCreator && !!job,
    })

    const handleOpenReview = (userId: string, userName: string) => {
        setRevieweeInfo({ id: userId, name: userName })
        setShowReviewModal(true)
    }

    // Check if current user already applied
    const { data: userApplications } = useQuery({
        queryKey: ['myApplications', user?.id],
        queryFn: () => jobsApi.getUserApplications(user!.id),
        enabled: !isCreator && !!user && !!job,
    })

    const hasAlreadyApplied = userApplications?.some(app => app.job_id === job?.id)

    const applyMutation = useMutation({
        mutationFn: () => jobsApi.apply(job!.id, user!.id, pitch),
        onSuccess: () => {
            setPitch('')
            setShowApplyForm(false)
            queryClient.invalidateQueries({ queryKey: ['applications', job?.id] })
            alert('Application submitted successfully!')
        },
        onError: (err: any) => {
            console.error('Apply error:', err)
            alert(err.response?.data?.detail || 'Failed to apply')
        }
    })

    const deleteMutation = useMutation({
        mutationFn: () => jobsApi.delete(job!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            onClose()
        }
    })

    const updateStatusMutation = useMutation({
        mutationFn: (status: string) => jobsApi.update(job!.id, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
        }
    })

    const updateApplicationStatusMutation = useMutation({
        mutationFn: ({ appId, status }: { appId: string, status: 'ACCEPTED' | 'REJECTED' }) =>
            jobsApi.updateApplicationStatus(appId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['applications', job?.id] })
        },
        onError: (err: any) => {
            alert(err.response?.data?.detail || 'Failed to update application status')
        }
    })

    const handleMessageCreator = async () => {
        if (!user || !job?.creator_id) return
        setIsStartingChat(true)
        try {
            await chatApi.getOrCreateConversation(user.id, job.creator_id)
            onClose()
            navigate('/chat')
        } catch (err) {
            console.error('Failed to start chat:', err)
            alert('Failed to start chat. Please try again.')
        } finally {
            setIsStartingChat(false)
        }
    }

    if (!isOpen || !job) return null

    const creatorName = job.creator?.username || job.creator?.email?.split('@')[0] || 'Anonymous'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-modal-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/80">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 pr-8">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{job.title}</h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Creator info */}
                                <div className="flex items-center gap-2">
                                    {job.creator?.avatar_url ? (
                                        <img src={job.creator.avatar_url} alt="" className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-gray-700" />
                                    ) : (
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                                            <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </div>
                                    )}
                                    <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">{creatorName}</span>
                                </div>

                                {/* Status badge */}
                                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${job.status === 'OPEN'
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : job.status === 'COMPLETED'
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                    }`}>
                                    {job.status}
                                </span>

                                {/* Category badge */}
                                <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {job.category}
                                </span>

                                {/* Resume required badge */}
                                {job.resume_required && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                        <FileText className="w-3 h-3" />
                                        Resume Required
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Close button */}
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[55vh] modal-scrollbar">
                    {/* Description */}
                    <div className="mb-6">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                            Description
                        </h3>
                        <div className="text-gray-600 dark:text-gray-300 prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:mt-4 prose-headings:mb-2">
                            <ReactMarkdown>{job.description}</ReactMarkdown>
                        </div>
                    </div>

                    {/* Tags */}
                    {job.tags.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                Tags
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {job.tags.map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-gray-600">
                                        <Tag className="w-3 h-3" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                        <Calendar className="w-4 h-4" />
                        Posted {new Date(job.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </div>

                    {/* Applications (for creator) with Review button */}
                    {isCreator && applications && applications.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                                <div className="w-1 h-4 bg-orange-500 rounded-full"></div>
                                Applications ({applications.length})
                            </h3>
                            <div className="space-y-3">
                                {applications.map((app: Application) => (
                                    <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-600 transition-all hover:border-gray-200 dark:hover:border-gray-500">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">{app.pitch}</p>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-1 rounded-md text-xs font-semibold ${app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                        app.status === 'ACCEPTED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                                        {new Date(app.created_at).toLocaleDateString()}
                                                    </span>
                                                    {/* Review Button for Creator */}
                                                    {app.status === 'ACCEPTED' && job.status === 'COMPLETED' && (
                                                        <button
                                                            onClick={() => handleOpenReview(app.applicant_id, 'Applicant')}
                                                            className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300 ml-2 transition-colors"
                                                        >
                                                            <Star className="w-3 h-3" />
                                                            Review Applicant
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {app.status === 'PENDING' && (
                                                <div className="flex gap-1.5">
                                                    <button
                                                        onClick={() => updateApplicationStatusMutation.mutate({ appId: app.id, status: 'ACCEPTED' })}
                                                        disabled={updateApplicationStatusMutation.isPending}
                                                        className="p-2 rounded-lg bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 text-green-600 dark:text-green-400 transition-all disabled:opacity-50"
                                                        title="Accept"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => updateApplicationStatusMutation.mutate({ appId: app.id, status: 'REJECTED' })}
                                                        disabled={updateApplicationStatusMutation.isPending}
                                                        className="p-2 rounded-lg bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition-all disabled:opacity-50"
                                                        title="Reject"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Apply Form (for non-creators) */}
                    {!isCreator && showApplyForm && (
                        <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-xl border border-orange-200 dark:border-orange-900/30">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Your Pitch</h3>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!job || !user) return
                                        setIsGeneratingPitch(true)
                                        try {
                                            const profile = useAuthStore.getState().profile
                                            const result = await aiApi.generatePitch(
                                                job.title,
                                                job.description,
                                                profile?.skills || [],
                                                profile?.bio || ''
                                            )
                                            setPitch(result.pitch)
                                        } catch {
                                            alert('AI pitch generation failed. Please try again.')
                                        } finally {
                                            setIsGeneratingPitch(false)
                                        }
                                    }}
                                    disabled={isGeneratingPitch}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-all disabled:opacity-50"
                                >
                                    {isGeneratingPitch ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    {isGeneratingPitch ? 'Writing...' : 'Write with AI'}
                                </button>
                            </div>
                            <textarea
                                value={pitch}
                                onChange={(e) => setPitch(e.target.value)}
                                placeholder="Write a short pitch or let AI write it for you..."
                                className="input-clean resize-none mb-2"
                                rows={8}
                                required
                            />
                            {pitch.trim().length >= 10 && (
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!job) return
                                        setIsGeneratingPitch(true)
                                        try {
                                            const result = await aiApi.generatePitch(
                                                job.title,
                                                job.description,
                                                [],
                                                `Enhance and polish this pitch while keeping the original meaning: "${pitch}"`
                                            )
                                            setPitch(result.pitch)
                                        } catch {
                                            alert('AI enhancement failed. Please try again.')
                                        } finally {
                                            setIsGeneratingPitch(false)
                                        }
                                    }}
                                    disabled={isGeneratingPitch}
                                    className="mb-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-all disabled:opacity-50"
                                >
                                    {isGeneratingPitch ? (
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-3.5 h-3.5" />
                                    )}
                                    {isGeneratingPitch ? 'Enhancing...' : '✨ Enhance with AI'}
                                </button>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => applyMutation.mutate()}
                                    disabled={!pitch.trim() || applyMutation.isPending}
                                    className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {applyMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                    Submit Application
                                </button>
                                <button
                                    onClick={() => setShowApplyForm(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center gap-4">
                    {isCreator ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => deleteMutation.mutate()}
                                disabled={deleteMutation.isPending}
                                className="px-4 py-2 rounded-xl font-medium text-sm text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 flex items-center gap-2 transition-all disabled:opacity-60"
                            >
                                {deleteMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Delete
                            </button>
                            {job.status === 'OPEN' && (
                                <button
                                    onClick={() => updateStatusMutation.mutate('COMPLETED')}
                                    disabled={updateStatusMutation.isPending}
                                    className="px-4 py-2 rounded-xl font-medium text-sm text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 flex items-center gap-2 transition-all disabled:opacity-60"
                                >
                                    {updateStatusMutation.isPending ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <CheckCircle className="w-4 h-4" />
                                    )}
                                    Mark Complete
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="flex gap-2 flex-wrap">
                            {/* Review Button for Applicant */}
                            {hasAlreadyApplied && job.status === 'COMPLETED' && (
                                <button
                                    onClick={() => handleOpenReview(job.creator_id, creatorName)}
                                    className="px-4 py-2 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20"
                                >
                                    <Star className="w-4 h-4" />
                                    Leave Review
                                </button>
                            )}

                            {hasAlreadyApplied ? (
                                <span className="inline-flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium py-2 px-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                    <CheckCircle className="w-4 h-4" />
                                    Already Applied
                                </span>
                            ) : (
                                !showApplyForm && job.status === 'OPEN' && (
                                    <button
                                        onClick={() => setShowApplyForm(true)}
                                        className="btn-primary"
                                    >
                                        Apply Now
                                    </button>
                                )
                            )}
                            <button
                                onClick={handleMessageCreator}
                                disabled={isStartingChat}
                                className="btn-secondary flex items-center gap-2"
                            >
                                {isStartingChat ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <MessageCircle className="w-4 h-4" />
                                )}
                                Message Creator
                            </button>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Review Modal */}
            {revieweeInfo && (
                <CreateReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        // Optionally refresh queries 
                    }}
                    jobId={job.id}
                    revieweeId={revieweeInfo.id}
                    revieweeName={revieweeInfo.name}
                />
            )}
        </div>
    )
}
