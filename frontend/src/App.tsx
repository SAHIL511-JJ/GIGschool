import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import AuthPage from '@/pages/AuthPage'
import ProfilePage from '@/pages/ProfilePage'
import PublicProfilePage from '@/pages/PublicProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import ChatPage from '@/pages/ChatPage'
import NotificationsPage from '@/pages/NotificationsPage'
import ProtectedRoute from '@/components/ProtectedRoute'
import { AiHelperWidget } from '@/components/AiHelperWidget'
import { useAuthStore } from '@/stores/authStore'
import { JobBoard } from '@/components/jobs/JobBoard'
import { LogOut, Briefcase, Home, User, Settings, MessageCircle, Bell } from 'lucide-react'

const queryClient = new QueryClient()

function Sidebar() {
  const { user, signOut } = useAuthStore()
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/notifications', icon: Bell, label: 'Notifications', badge: true },
    { path: '/chat', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  return (
    <aside className="w-64 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 p-4 flex flex-col relative overflow-hidden">
      {/* Subtle gradient decoration */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-50/50 dark:from-orange-900/10 to-transparent pointer-events-none" />

      {/* Logo */}
      <div className="flex items-center gap-3 px-3 py-4 mb-6 relative z-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            GigSchool
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase">
            Student Gigs
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 relative z-10">
        {navItems.map(({ path, icon: Icon, label, badge }) => (
          <Link
            key={path}
            to={path}
            className={`
              relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200 group
              ${isActive(path)
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Icon className={`w-5 h-5 transition-transform duration-200 ${!isActive(path) && 'group-hover:scale-110'}`} />
            <span>{label}</span>
            {badge && !isActive(path) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            )}
            {isActive(path) && (
              <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white/80" />
            )}
          </Link>
        ))}
      </nav>

      {/* User Section */}
      <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4 relative z-10">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer group">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-white dark:ring-gray-800 shadow-lg">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.email}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500" />
              Online
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut()}
          className="w-full mt-3 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-200 group"
        >
          <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

function DashboardLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 via-gray-50 to-orange-50/30 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 mb-1">
                <span>Home</span>
                <span>/</span>
                <span className="text-gray-600 dark:text-gray-300">{title}</span>
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
        </header>
        <div className="p-8 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout title="Gig Board" subtitle="Find and post student gigs">
                <JobBoard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout title="Profile" subtitle="Manage your account">
                <ProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/profile/:userId" element={
            <ProtectedRoute>
              <DashboardLayout title="Public Profile" subtitle="View user profile">
                <PublicProfilePage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <DashboardLayout title="Settings" subtitle="Customize your experience">
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <DashboardLayout title="Messages" subtitle="Chat with other users">
                <ChatPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <DashboardLayout title="Notifications" subtitle="Track your applications and gigs">
                <NotificationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <AiHelperWidget />
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
