'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Bookmark, Loader2, Sparkles } from 'lucide-react'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const signIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f7ff] p-4 sm:p-6">
      <div className="w-full max-w-[440px] space-y-8 sm:space-y-10 rounded-[32px] sm:rounded-[40px] bg-white p-8 sm:p-12 shadow-2xl shadow-indigo-100/50 border border-indigo-50">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-[20px] sm:rounded-[24px] bg-indigo-600 text-white shadow-xl shadow-indigo-200/50">
            <Bookmark className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 mb-2 sm:mb-4">
            SmartMark
          </h1>
          <p className="text-sm sm:text-base text-gray-500 font-medium leading-relaxed">
            The intelligent way to organize your <br className="hidden xs:block" />
            web resources in real-time.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={signIn}
            className="group relative flex w-full items-center justify-center rounded-xl sm:rounded-2xl border border-gray-200 bg-white px-4 py-3.5 sm:px-6 sm:py-4 text-sm sm:text-[15px] font-bold text-gray-800 transition-all hover:bg-gray-50 hover:border-indigo-200 focus:outline-none focus:ring-4 focus:ring-indigo-50 active:scale-[0.98]"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google logo"
              className="mr-3 h-4 w-4 sm:h-5 sm:w-5"
            />
            Continue with Google
          </button>
        </div>

        <div className="text-center pt-1 sm:pt-2">
          <p className="text-[10px] sm:text-xs text-gray-400 font-medium px-2">
            By signing in, you agree to our <br className="xs:hidden" />
            <span className="text-indigo-600 cursor-pointer hover:underline">Terms of Service</span> and <span className="text-indigo-600 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>

      <p className="mt-8 sm:mt-10 text-[10px] sm:text-sm font-bold text-indigo-300 uppercase tracking-tighter">
        &copy; 2026 SmartMark Studio
      </p>
    </div>
  )
}
