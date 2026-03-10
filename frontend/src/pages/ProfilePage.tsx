import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { usersApi } from '@/api/users'
import { jobsApi, Job, Application } from '@/api/jobs'
import { portfolioApi, PortfolioItem } from '@/api/portfolio'
import { supabase } from '@/lib/supabase'
import { JobDetailModal } from '@/components/jobs/JobDetailModal'
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid'
import { PortfolioUploader } from '@/components/portfolio/PortfolioUploader'
import { User, Mail, Calendar, Edit2, Camera, Loader2, Check, X, Briefcase, Send, Eye, Bookmark, LayoutGrid, Plus, CheckCircle, Sparkles } from 'lucide-react'
import { aiApi } from '@/api/ai'

export default function ProfilePage() {
    const { user, profile, refreshProfile } = useAuthStore()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [showPortfolioUploader, setShowPortfolioUploader] = useState(false)
    const [username, setUsername] = useState(profile?.username || '')
    const [activeTab, setActiveTab] = useState<'gigs' | 'applications' | 'saved' | 'portfolio'>('gigs')
    const [selectedGig, setSelectedGig] = useState<Job | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isGeneratingBio, setIsGeneratingBio] = useState(false)

    // Fetch user's posted gigs
    const { data: myGigs = [] } = useQuery<Job[]>({
        queryKey: ['myGigs', user?.id],
        queryFn: () => jobsApi.getByCreator(user!.id),
        enabled: !!user,
    })

    // Fetch user's applications
    const { data: myApplications = [] } = useQuery<Application[]>({
        queryKey: ['myApplications', user?.id],
        queryFn: () => jobsApi.getUserApplications(user!.id),
        enabled: !!user,
    })

    // Fetch user's bookmarks with job details
    const { data: myBookmarks = [] } = useQuery({
        queryKey: ['bookmarks', user?.id],
        queryFn: () => jobsApi.getBookmarks(user!.id),
        enabled: !!user,
    })

    // Fetch user's portfolio
    const { data: myPortfolio = [] } = useQuery<PortfolioItem[]>({
        queryKey: ['portfolio', user?.id],
        queryFn: () => portfolioApi.getUserPortfolio(user!.id),
        enabled: !!user,
    })

    // Get all jobs to display bookmark details
    const { data: allJobs = [] } = useQuery<Job[]>({
        queryKey: ['jobs'],
        queryFn: () => jobsApi.getAll(),
        enabled: myBookmarks.length > 0,
    })

    const savedJobs = allJobs.filter(job => myBookmarks.some(b => b.job_id === job.id))

    const [bio, setBio] = useState(profile?.bio || '')
    const [skills, setSkills] = useState(profile?.skills?.join(', ') || '')

    // ... (rest of state items are unchanged, but we need to ensure useEffect updates state so keeping it below)

    const handleSave = async () => {
        if (!user) return
        setIsSaving(true)
        try {
            const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s)
            await usersApi.updateUser(user.id, {
                username,
                bio,
                skills: skillsArray
            })
            await refreshProfile()
            setIsEditing(false)
        } catch (error) {
            console.error('Failed to update profile:', error)
            alert('Failed to update profile')
        } finally {
            setIsSaving(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !user) return

        setIsUploading(true)
        try {
            const fileExt = file.name.split('.').pop()
            const filePath = `avatars/${user.id}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) throw uploadError

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            await usersApi.updateUser(user.id, { avatar_url: publicUrl })
            await refreshProfile()
        } catch (error) {
            console.error('Failed to upload avatar:', error)
            alert('Failed to upload avatar')
        } finally {
            setIsUploading(false)
        }
    }

    const displayName = profile?.username || user?.email?.split('@')[0] || 'User'
    const avatarUrl = profile?.avatar_url

    const completedGigs = myGigs.filter(g => g.status === 'COMPLETED').length

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Profile Card */}
            <div className="card p-6 animate-fade-in">
                <div className="flex items-start gap-5 mb-6">
                    <div className="relative group shrink-0">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-400 to-orange-600 rounded-full opacity-0 group-hover:opacity-75 transition-opacity duration-300 blur-sm" />
                            {avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="relative w-20 h-20 rounded-full object-cover ring-2 ring-white dark:ring-gray-800 shadow-lg transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg ring-2 ring-white dark:ring-gray-800 transition-transform duration-300 group-hover:scale-105">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                {isUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                            </button>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-1 w-full">
                                {isEditing ? (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Display Name</label>
                                            <input
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                className="input-clean text-xl font-semibold w-full"
                                                placeholder="Enter username"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Bio</label>
                                            <textarea
                                                value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="input-clean text-sm w-full resize-none"
                                                rows={5}
                                                placeholder="Tell us about yourself..."
                                            />
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s)
                                                    if (skillsArray.length === 0) {
                                                        alert('Please add some skills first so AI can generate a bio!')
                                                        return
                                                    }
                                                    setIsGeneratingBio(true)
                                                    try {
                                                        const result = await aiApi.generateBio(skillsArray, username)
                                                        setBio(result.bio)
                                                    } catch {
                                                        alert('AI bio generation failed. Please try again.')
                                                    } finally {
                                                        setIsGeneratingBio(false)
                                                    }
                                                }}
                                                disabled={isGeneratingBio}
                                                className="mt-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 transition-all disabled:opacity-50"
                                            >
                                                {isGeneratingBio ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                )}
                                                {isGeneratingBio ? 'Generating...' : 'Generate with AI'}
                                            </button>
                                        </div>
                                        <div>
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Skills (comma separated)</label>
                                            <input
                                                value={skills}
                                                onChange={(e) => setSkills(e.target.value)}
                                                className="input-clean text-sm w-full"
                                                placeholder="e.g. React, Python, Design"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h2>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">Student Developer</p>
                                        </div>
                                        {profile?.bio && (
                                            <p className="text-gray-700 dark:text-gray-300 text-sm max-w-2xl leading-relaxed">
                                                {profile.bio}
                                            </p>
                                        )}
                                        {profile?.skills && profile.skills.length > 0 && (
                                            <div className="flex flex-wrap gap-2 pt-1">
                                                {profile.skills.map((skill, index) => (
                                                    <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border border-orange-100 dark:border-orange-800/50">
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            <div className="ml-4 shrink-0">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button onClick={handleSave} disabled={isSaving} className="btn-primary flex items-center gap-2 shadow-sm">
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                            Save
                                        </button>
                                        <button onClick={() => { setIsEditing(false); setUsername(profile?.username || '') }} className="btn-secondary">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button onClick={() => {
                                        setBio(profile?.bio || '')
                                        setSkills(profile?.skills?.join(', ') || '')
                                        setIsEditing(true)
                                    }} className="btn-secondary flex items-center gap-2">
                                        <Edit2 className="w-4 h-4" />
                                        Edit Profile
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Username</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{profile?.username || 'Not set'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{user?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Joined</p>
                            <p className="text-gray-900 dark:text-gray-100 font-medium">{new Date(user?.created_at || '').toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in delay-100">
                <div className="card p-5 text-center group cursor-pointer hover:border-orange-200 dark:hover:border-orange-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Briefcase className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myGigs.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Gigs Posted</p>
                </div>
                <div className="card p-5 text-center group cursor-pointer hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{myApplications.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Applications</p>
                </div>
                <div className="card p-5 text-center group cursor-pointer hover:border-purple-200 dark:hover:border-purple-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Bookmark className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{savedJobs.length}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Saved</p>
                </div>
                <div className="card p-5 text-center group cursor-pointer hover:border-green-200 dark:hover:border-green-800 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                    <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedGigs}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="card overflow-hidden animate-fade-in delay-200">
                <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
                    <button
                        onClick={() => setActiveTab('gigs')}
                        className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 relative ${activeTab === 'gigs'
                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 border-b-[3px] border-orange-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/30'
                            }`}
                    >
                        <Briefcase className="w-4 h-4" />
                        <span>My Gigs</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'gigs' ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-gray-200 dark:bg-gray-600'}`}>{myGigs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('applications')}
                        className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 relative ${activeTab === 'applications'
                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 border-b-[3px] border-orange-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/30'
                            }`}
                    >
                        <Send className="w-4 h-4" />
                        <span>Applications</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'applications' ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-gray-200 dark:bg-gray-600'}`}>{myApplications.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 relative ${activeTab === 'saved'
                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 border-b-[3px] border-orange-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/30'
                            }`}
                    >
                        <Bookmark className="w-4 h-4" />
                        <span>Saved</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'saved' ? 'bg-orange-100 dark:bg-orange-900/50' : 'bg-gray-200 dark:bg-gray-600'}`}>{savedJobs.length}</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('portfolio')}
                        className={`flex-1 py-3.5 text-sm font-medium transition-all duration-200 inline-flex items-center justify-center gap-2 relative ${activeTab === 'portfolio'
                            ? 'text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-800 border-b-[3px] border-orange-500 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/30'
                            }`}
                    >
                        <LayoutGrid className="w-4 h-4" />
                        <span>Portfolio</span>
                    </button>
                </div>

                <div className="p-5">
                    {activeTab === 'gigs' && (
                        myGigs.length > 0 ? (
                            <div className="space-y-3">
                                {myGigs.map(gig => (
                                    <div key={gig.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center border border-transparent hover:border-orange-200 dark:hover:border-orange-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group hover:shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{gig.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{gig.category} • {new Date(gig.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`tag text-xs font-semibold ${gig.status === 'OPEN' ? 'tag-orange' : gig.status === 'COMPLETED' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {gig.status}
                                            </span>
                                            <button
                                                onClick={() => setSelectedGig(gig)}
                                                className="btn-secondary text-sm flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">No gigs posted yet</p>
                                <p className="text-sm mt-1">Create your first gig to get started!</p>
                            </div>
                        )
                    )}

                    {activeTab === 'applications' && (
                        myApplications.length > 0 ? (
                            <div className="space-y-3">
                                {myApplications.map(app => (
                                    <div key={app.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-transparent hover:border-blue-200 dark:hover:border-blue-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group hover:shadow-sm">
                                        <div className="flex justify-between items-start gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">{app.pitch}</p>
                                                <p className="text-xs text-gray-400 mt-2">{new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`tag text-xs font-semibold shrink-0 ${app.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                app.status === 'ACCEPTED' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>{app.status}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Send className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">No applications yet</p>
                                <p className="text-sm mt-1">Browse gigs and apply to get started!</p>
                            </div>
                        )
                    )}

                    {activeTab === 'saved' && (
                        savedJobs.length > 0 ? (
                            <div className="space-y-3">
                                {savedJobs.map(job => (
                                    <div key={job.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex justify-between items-center border border-transparent hover:border-purple-200 dark:hover:border-purple-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 group hover:shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <div>
                                                <h4 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{job.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{job.category} • {new Date(job.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`tag text-xs font-semibold ${job.status === 'OPEN' ? 'tag-orange' : job.status === 'COMPLETED' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                                                {job.status}
                                            </span>
                                            <button
                                                onClick={() => setSelectedGig(job)}
                                                className="btn-secondary text-sm flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Bookmark className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                </div>
                                <p className="font-medium text-gray-700 dark:text-gray-300">No saved gigs</p>
                                <p className="text-sm mt-1">Bookmark gigs you're interested in!</p>
                            </div>
                        )
                    )}

                    {activeTab === 'portfolio' && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <button
                                    onClick={() => setShowPortfolioUploader(true)}
                                    className="btn-primary text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add Item
                                </button>
                            </div>
                            <PortfolioGrid items={myPortfolio} isOwner={true} />
                        </div>
                    )}
                </div>
            </div>

            <JobDetailModal
                job={selectedGig}
                isOpen={!!selectedGig}
                onClose={() => setSelectedGig(null)}
            />

            {showPortfolioUploader && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPortfolioUploader(false)} />
                    <div className="relative w-full max-w-lg z-10 animate-in zoom-in-95 duration-200">
                        <PortfolioUploader onClose={() => setShowPortfolioUploader(false)} />
                    </div>
                </div>
            )}
        </div>
    )
}
