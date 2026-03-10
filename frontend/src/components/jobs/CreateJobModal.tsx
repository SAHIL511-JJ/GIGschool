import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, Plus, Briefcase, Sparkles, Send, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { jobsApi } from '@/api/jobs'
import { aiApi } from '@/api/ai'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface CreateJobModalProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
    const { user } = useAuthStore()
    const queryClient = useQueryClient()

    // Form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState('')
    const [category, setCategory] = useState('general')
    const [resumeRequired, setResumeRequired] = useState(false)

    // AI state
    const [aiMode, setAiMode] = useState(true)
    const [aiPrompt, setAiPrompt] = useState('')
    const [aiEditInstruction, setAiEditInstruction] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiGenerated, setAiGenerated] = useState(false)
    const [aiError, setAiError] = useState('')
    const descriptionRef = useRef<HTMLTextAreaElement>(null)
    const descriptionManualRef = useRef<HTMLTextAreaElement>(null)

    const autoResize = useCallback((ref: React.RefObject<HTMLTextAreaElement | null>) => {
        const el = ref.current
        if (el) {
            el.style.height = 'auto'
            el.style.height = Math.max(el.scrollHeight, 100) + 'px'
        }
    }, [])

    useEffect(() => {
        autoResize(descriptionRef)
    }, [description, autoResize])

    useEffect(() => {
        autoResize(descriptionManualRef)
    }, [description, autoResize])

    const createJobMutation = useMutation({
        mutationFn: jobsApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['jobs'] })
            handleClose()
        }
    })

    const handleClose = () => {
        onClose()
        setTitle('')
        setDescription('')
        setTags('')
        setCategory('general')
        setResumeRequired(false)
        setAiPrompt('')
        setAiEditInstruction('')
        setAiGenerated(false)
        setAiError('')
        setAiMode(true)
    }

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return
        setIsGenerating(true)
        setAiError('')
        try {
            const result = await aiApi.generateGig(aiPrompt)
            setTitle(result.title)
            setDescription(result.description)
            setTags(result.tags.join(', '))
            setCategory(result.category)
            setAiGenerated(true)
        } catch (err: any) {
            setAiError(err.response?.data?.detail || 'AI generation failed. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleAiEdit = async () => {
        if (!aiEditInstruction.trim()) return
        setIsGenerating(true)
        setAiError('')
        try {
            const result = await aiApi.editGig(
                title,
                description,
                tags.split(',').map(t => t.trim()).filter(Boolean),
                category,
                aiEditInstruction
            )
            setTitle(result.title)
            setDescription(result.description)
            setTags(result.tags.join(', '))
            setCategory(result.category)
            setAiEditInstruction('')
        } catch (err: any) {
            setAiError(err.response?.data?.detail || 'AI edit failed. Please try again.')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        createJobMutation.mutate({
            title,
            description,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
            category,
            resume_required: resumeRequired,
            group_id: 'general',
            creator_id: user.id
        })
    }

    if (!isOpen) return null

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-backdrop"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-6 animate-modal-in max-h-[90vh] overflow-y-auto modal-scrollbar">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 z-10"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${aiMode ? 'bg-gradient-to-br from-purple-500 to-indigo-600 shadow-purple-500/20' : 'bg-gradient-to-br from-orange-400 to-orange-600 shadow-orange-500/20'} transition-all duration-300`}>
                        {aiMode ? <Sparkles className="w-6 h-6 text-white" /> : <Briefcase className="w-6 h-6 text-white" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Post a New Gig</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {aiMode ? 'Let AI create your gig post' : 'Fill in the details manually'}
                        </p>
                    </div>
                </div>

                {/* AI / Manual Toggle */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-gray-700/50 p-1 mb-5">
                    <button
                        type="button"
                        onClick={() => setAiMode(true)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${aiMode
                            ? 'bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Sparkles className="w-4 h-4" />
                        Create with AI
                    </button>
                    <button
                        type="button"
                        onClick={() => setAiMode(false)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${!aiMode
                            ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        Manual
                    </button>
                </div>

                {/* AI Mode - Initial Prompt */}
                {aiMode && !aiGenerated && (
                    <div className="space-y-4">
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <p className="text-sm text-purple-700 dark:text-purple-300 mb-3 font-medium">
                                ✨ Describe your gig in a few words and AI will create the full post!
                            </p>
                            <textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-400 transition-all duration-200 resize-none"
                                placeholder='e.g. "I need someone to design a logo for my college fest"'
                            />
                        </div>

                        {aiError && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
                                {aiError}
                            </div>
                        )}

                        <button
                            onClick={handleAiGenerate}
                            disabled={!aiPrompt.trim() || isGenerating}
                            className="w-full py-3 rounded-xl font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    AI is creating your gig...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Gig Post
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* AI Mode - Generated Preview + Edit */}
                {aiMode && aiGenerated && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-1">
                            <button
                                onClick={() => setAiGenerated(false)}
                                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                Start over
                            </button>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ AI Generated</span>
                        </div>

                        {/* Editable Preview Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
                                <input
                                    required
                                    value={title}
                                    onChange={e => setTitle(e.target.value)}
                                    className="input-clean"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                                <textarea
                                    ref={descriptionRef}
                                    required
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    rows={4}
                                    className="input-clean resize-none overflow-hidden"
                                    style={{ minHeight: '100px' }}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tags</label>
                                    <input
                                        value={tags}
                                        onChange={e => setTags(e.target.value)}
                                        className="input-clean"
                                    />
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Comma separated</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="input-clean cursor-pointer"
                                    >
                                        <option value="general">General</option>
                                        <option value="tutoring">Tutoring</option>
                                        <option value="design">Design</option>
                                        <option value="coding">Coding</option>
                                        <option value="writing">Writing</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <input
                                    type="checkbox"
                                    id="resumeRequired"
                                    checked={resumeRequired}
                                    onChange={e => setResumeRequired(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                                />
                                <label htmlFor="resumeRequired" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                    Require resume/portfolio from applicants
                                </label>
                            </div>

                            {/* AI Edit Section */}
                            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-2">✨ Ask AI to edit</p>
                                <div className="flex gap-2">
                                    <input
                                        value={aiEditInstruction}
                                        onChange={e => setAiEditInstruction(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiEdit())}
                                        placeholder='"make it shorter", "add Python tag"...'
                                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAiEdit}
                                        disabled={!aiEditInstruction.trim() || isGenerating}
                                        className="p-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            {aiError && (
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 text-sm rounded-xl">
                                    {aiError}
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createJobMutation.isPending}
                                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {createJobMutation.isPending ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-4 h-4" />
                                            Post Gig
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Manual Mode - Original Form */}
                {!aiMode && (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
                            <input
                                required
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="input-clean"
                                placeholder="e.g. Need help with Calculus II"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea
                                ref={descriptionManualRef}
                                required
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={4}
                                className="input-clean resize-none overflow-hidden"
                                style={{ minHeight: '100px' }}
                                placeholder="Describe what you need help with..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags</label>
                                <input
                                    value={tags}
                                    onChange={e => setTags(e.target.value)}
                                    className="input-clean"
                                    placeholder="math, tutoring"
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">Comma separated</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    className="input-clean cursor-pointer"
                                >
                                    <option value="general">General</option>
                                    <option value="tutoring">Tutoring</option>
                                    <option value="design">Design</option>
                                    <option value="coding">Coding</option>
                                    <option value="writing">Writing</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 py-3 px-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <input
                                type="checkbox"
                                id="resumeRequiredManual"
                                checked={resumeRequired}
                                onChange={e => setResumeRequired(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-orange-600 focus:ring-orange-500 focus:ring-offset-0 cursor-pointer"
                            />
                            <label htmlFor="resumeRequiredManual" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
                                Require resume/portfolio from applicants
                            </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={createJobMutation.isPending}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {createJobMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4" />
                                        Post Gig
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    )
}
