import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  BarChart3,
  Loader2
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Brand/Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-indigo-400 rounded-full blur-3xl opacity-50"></div>
          {/* Glassmorphism decorative elements */}
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 rotate-12"></div>
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-white/10 backdrop-blur-lg rounded-full border border-white/20 -rotate-12"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white mb-16 inline-flex hover:opacity-80 transition-opacity">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">AI Finance</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Welcome back to <br /> financial clarity
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            Log in to access your AI-powered insights, track your expenses, and monitor your progress towards your goals.
          </p>
        </div>

        <div className="relative z-10 text-indigo-200 text-sm">
          &copy; {new Date().getFullYear()} AI Finance Manager. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo only */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">AI Finance</span>
            </Link>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Log in</h2>
            <p className="text-gray-600">Don't have an account? <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors">Sign up</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow shadow-sm"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500 font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow shadow-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Signing in...
                </>
              ) : (
                <>
                  Log in <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center lg:text-left text-sm text-gray-500">
            By logging in, you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
