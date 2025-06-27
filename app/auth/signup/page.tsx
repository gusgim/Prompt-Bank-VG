import { EnhancedSignUpForm } from '@/components/auth/EnhancedSignUpForm'
import { Footer } from '@/components/layout/Footer'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-200 via-blue-200/80 to-indigo-300/90">
      <div className="absolute inset-0 opacity-20 bg-gray-200"></div>
      
      <main className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              📋 서비스 이용약관 동의 및 회원가입
            </h1>
            <div className="bg-white/80 backdrop-blur-md rounded-lg p-4 max-w-2xl mx-auto">
              <p className="text-sm text-gray-600">
                <strong>서비스 이용을 위해서는 이용약관에 대한 동의가 필수입니다</strong>
              </p>
            </div>
          </div>
          
          <EnhancedSignUpForm />
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 