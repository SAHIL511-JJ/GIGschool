import { api } from './client'

// --- Types ---
export interface GigGenerateResponse {
    title: string
    description: string
    tags: string[]
    category: string
}

export interface PitchGenerateResponse {
    pitch: string
}

export interface ReviewGenerateResponse {
    comment: string
}

export interface BioGenerateResponse {
    bio: string
}

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface HelperChatResponse {
    reply: string
    escalate: boolean
    email: string | null
}

// --- API Functions ---
export const aiApi = {
    generateGig: async (prompt: string): Promise<GigGenerateResponse> => {
        const response = await api.post<GigGenerateResponse>('/ai/generate-gig', { prompt })
        return response.data
    },

    editGig: async (title: string, description: string, tags: string[], category: string, instruction: string): Promise<GigGenerateResponse> => {
        const response = await api.post<GigGenerateResponse>('/ai/edit-gig', {
            title, description, tags, category, instruction
        })
        return response.data
    },

    generatePitch: async (jobTitle: string, jobDescription: string, userSkills: string[], userBio: string): Promise<PitchGenerateResponse> => {
        const response = await api.post<PitchGenerateResponse>('/ai/generate-pitch', {
            job_title: jobTitle,
            job_description: jobDescription,
            user_skills: userSkills,
            user_bio: userBio,
        })
        return response.data
    },

    generateReview: async (jobTitle: string, rating: number): Promise<ReviewGenerateResponse> => {
        const response = await api.post<ReviewGenerateResponse>('/ai/generate-review', {
            job_title: jobTitle,
            rating,
        })
        return response.data
    },

    generateBio: async (skills: string[], username: string = ''): Promise<BioGenerateResponse> => {
        const response = await api.post<BioGenerateResponse>('/ai/generate-bio', {
            skills,
            username,
        })
        return response.data
    },

    helperChat: async (messages: ChatMessage[]): Promise<HelperChatResponse> => {
        const response = await api.post<HelperChatResponse>('/ai/chat', { messages })
        return response.data
    },
}
