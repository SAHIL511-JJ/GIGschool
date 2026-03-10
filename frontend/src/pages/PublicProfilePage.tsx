import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import { reviewsApi } from '@/api/reviews'
import { portfolioApi } from '@/api/portfolio'
import { chatApi } from '@/api/chat'
import { useAuthStore } from '@/stores/authStore'
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid'
import { ReviewList } from '@/components/reviews/ReviewList'
import { CreateReviewModal } from '@/components/reviews/CreateReviewModal'
import { StarRating } from '@/components/reviews/StarRating'
import { Loader2, Calendar, AlertCircle, MessageCircle, Briefcase, Image, Star } from 'lucide-react'

export default function PublicProfilePage() {
    const { userId } = useParams<{ userId: string }>()
    const navigate = useNavigate()
    const queryClient = useQueryClient()
    const { user: currentUser } = useAuthStore()
    const [isStartingChat, setIsStartingChat] = useState(false)
    const [showReviewModal, setShowReviewModal] = useState(false)

    const handleMessage = async () => {
        if (!currentUser || !userId) return
        setIsStartingChat(true)
        try {
            await chatApi.getOrCreateConversation(currentUser.id, userId)
            navigate('/chat')
        } catch (error) {
            console.error('Failed to start chat:', error)
            alert('Failed to start chat')
        } finally {
            setIsStartingChat(false)
        }
    }

    const { data: userProfile, isLoading, error } = useQuery({
        queryKey: ['user', userId],
        queryFn: () => usersApi.getUser(userId!),
        enabled: !!userId,
    })

    const { data: stats } = useQuery({
        queryKey: ['userStats', userId],
        queryFn: () => reviewsApi.getUserStats(userId!),
        enabled: !!userId,
    })

    const { data: reviews = [] } = useQuery({
        queryKey: ['userReviews', userId],
        queryFn: () => reviewsApi.getUserReviews(userId!),
        enabled: !!userId,
    })

    const { data: portfolio = [] } = useQuery({
        queryKey: ['userPortfolio', userId],
        queryFn: () => portfolioApi.getUserPortfolio(userId!),
        enabled: !!userId,
    })

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        )
    }

    if (error || !userProfile) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="card p-8 text-center max-w-md">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">User not found</h2>
                    <p className="text-gray-500 dark:text-gray-400">The user you are looking for does not exist or has been removed.</p>
                </div>
            </div>
        )
    }

    const displayName = userProfile.username || userProfile.email.split('@')[0] || 'User'

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            {/* Header Card with Gradient Background */}
            <div className="card overflow-hidden">
                {/* Gradient Header Background */}
                <div className="h-24 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 relative">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
                </div>

                <div className="px-8 pb-8">
                    <div className="flex flex-col md:flex-row gap-6 md:items-start -mt-16 relative">
                        {/* Avatar with Ring */}
                        <div className="relative group">
                            {userProfile.avatar_url ? (
                                <img
                                    src={userProfile.avatar_url}
                                    alt={displayName}
                                    className="w-32 h-32 rounded-full object-cover shrink-0 ring-4 ring-white dark:ring-gray-800 shadow-lg transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg ring-4 ring-white dark:ring-gray-800 shrink-0 transition-transform duration-300 group-hover:scale-105">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-4 pt-8 md:pt-12">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h1>
                                <div className="flex items-center gap-3 mt-2">
                                    {stats && (
                                        <>
                                            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/30 px-3 py-1.5 rounded-full border border-yellow-200/50 dark:border-yellow-700/50 shadow-sm">
                                                <StarRating rating={Math.round(stats.average_rating)} size={14} className="mr-0.5" />
                                                <span className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{stats.average_rating ? stats.average_rating.toFixed(1) : 'New'}</span>
                                            </div>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">{stats.total_reviews} {stats.total_reviews === 1 ? 'review' : 'reviews'}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {userProfile.bio && (
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                                    {userProfile.bio}
                                </p>
                            )}

                            <div className="flex flex-wrap gap-4 pt-1 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 px-3 py-1.5 rounded-full">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <span>Joined {new Date(userProfile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            {currentUser?.id !== userProfile.id && (
                                <div className="pt-3 flex gap-3">
                                    <button
                                        onClick={handleMessage}
                                        disabled={isStartingChat}
                                        className="btn-primary flex items-center gap-2 group shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                        {isStartingChat ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <MessageCircle className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        )}
                                        Send Message
                                    </button>
                                    <button
                                        onClick={() => setShowReviewModal(true)}
                                        className="px-4 py-2 rounded-xl font-medium text-sm text-white bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 flex items-center gap-2 transition-all shadow-md hover:shadow-lg shadow-orange-500/20 group"
                                    >
                                        <Star className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
                                        Leave Review
                                    </button>
                                </div>
                            )}

                            {userProfile.skills && userProfile.skills.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-3">
                                    {userProfile.skills.map((skill, index) => (
                                        <span
                                            key={index}
                                            className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/50 dark:text-gray-300 border border-gray-200/50 dark:border-gray-600/50 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 cursor-default"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Portfolio Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Portfolio</h2>
                </div>
                {portfolio.length > 0 ? (
                    <PortfolioGrid items={portfolio} isOwner={false} />
                ) : (
                    <div className="card p-10 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                            <Image className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No portfolio items yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">This user hasn't added any work to showcase.</p>
                    </div>
                )}
            </div>

            {/* Reviews Section */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                    <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reviews</h2>
                    {stats && stats.total_reviews > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">({stats.total_reviews})</span>
                    )}
                </div>
                {reviews.length > 0 ? (
                    <ReviewList reviews={reviews} />
                ) : (
                    <div className="card p-10 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700/50 flex items-center justify-center">
                            <Briefcase className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No reviews yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Be the first to leave a review!</p>
                    </div>
                )}
            </div>

            {/* Review Modal */}
            {userId && (
                <CreateReviewModal
                    isOpen={showReviewModal}
                    onClose={() => setShowReviewModal(false)}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['userReviews', userId] })
                        queryClient.invalidateQueries({ queryKey: ['userStats', userId] })
                    }}
                    revieweeId={userId}
                    revieweeName={displayName}
                />
            )}
        </div>
    )
}
