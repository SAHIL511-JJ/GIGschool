import { useState } from 'react'
import { StarRating } from './StarRating'
import { Loader2, X, Star, Sparkles } from 'lucide-react'
import { reviewsApi } from '@/api/reviews'
import { aiApi } from '@/api/ai'

interface CreateReviewModalProps {
    jobId?: string
    revieweeId: string
    revieweeName: string
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateReviewModal({ jobId, revieweeId, revieweeName, isOpen, onClose, onSuccess }: CreateReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isGeneratingReview, setIsGeneratingReview] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (rating === 0) {
            setError('Please select a rating')
            return
        }

        setIsSubmitting(true)
        setError('')

        try {
            await reviewsApi.createReview({
                ...(jobId ? { job_id: jobId } : {}),
                reviewee_id: revieweeId,
                rating,
                comment: comment.trim() || ''
            })
            setRating(0)
            setComment('')
            setError('')
            onSuccess()
            onClose()
        } catch (err: any) {
            if (err.response?.data?.detail) {
                setError(err.response.data.detail)
            } else {
                setError('Failed to submit review')
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with animation */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop"
                onClick={onClose}
            />

            {/* Modal with animation */}
            <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl animate-modal-in overflow-hidden">
                {/* Header */}
                <div className="relative px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-yellow-50 dark:from-orange-900/40 dark:to-yellow-900/20 flex items-center justify-center">
                            <Star className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Review {revieweeName}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Share your experience
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Rating Section */}
                    <div className="flex flex-col items-center gap-3 py-4 px-6 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            How was your experience?
                        </label>
                        <StarRating
                            rating={rating}
                            maxRating={5}
                            size={36}
                            interactive={true}
                            onRatingChange={setRating}
                            showLabel={true}
                        />
                    </div>

                    {/* Comment Section */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Comment <span className="text-gray-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all duration-200 min-h-[120px] resize-none"
                            placeholder="Write a short review and AI can enhance it..."
                        />
                        {comment.trim().length >= 10 && (
                            <button
                                type="button"
                                onClick={async () => {
                                    if (rating === 0) {
                                        setError('Please select a rating first')
                                        return
                                    }
                                    setIsGeneratingReview(true)
                                    setError('')
                                    try {
                                        const result = await aiApi.generateReview(
                                            `Enhance and polish this review while keeping the original meaning: "${comment}"`,
                                            rating
                                        )
                                        setComment(result.comment)
                                    } catch {
                                        setError('AI enhancement failed. Please try again.')
                                    } finally {
                                        setIsGeneratingReview(false)
                                    }
                                }}
                                disabled={isGeneratingReview}
                                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-all disabled:opacity-50"
                            >
                                {isGeneratingReview ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                    <Sparkles className="w-3 h-3" />
                                )}
                                {isGeneratingReview ? 'Enhancing...' : '✨ Enhance with AI'}
                            </button>
                        )}
                    </div>

                    {/* Error State */}
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
                            <div className="w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold">!</span>
                            </div>
                            {error}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn-secondary flex-1 py-3"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex-1 py-3 flex justify-center items-center gap-2"
                            disabled={isSubmitting || rating === 0}
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'Submitting...' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
