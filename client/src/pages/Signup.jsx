import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  BarChart3,
  Loader2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password validation states
  const [pwdLength, setPwdLength] = useState(false);
  const [pwdLetter, setPwdLetter] = useState(false);
  const [pwdNumber, setPwdNumber] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setPwdLength(password.length >= 8);
    setPwdLetter(/[a-zA-Z]/.test(password));
    setPwdNumber(/\d/.test(password));
  }, [password]);

  const getStrength = () => {
    let score = 0;
    if (pwdLength) score++;
    if (pwdLetter) score++;
    if (pwdNumber) score++;
    return score;
  };

  const getStrengthColor = () => {
    const score = getStrength();
    if (score === 0) return 'bg-gray-200';
    if (score === 1) return 'bg-red-500';
    if (score === 2) return 'bg-amber-500';
    return 'bg-green-500';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (getStrength() < 3) {
      return toast.error('Password must be at least 8 characters with a letter and a number');
    }

    try {
      setLoading(true);
      await signup(name, email, password);
      toast.success('Account created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left Side - Brand/Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-600 overflow-hidden flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 -translate-y-12 -translate-x-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 translate-y-1/3 translate-x-1/3 w-[500px] h-[500px] bg-indigo-400 rounded-full blur-3xl opacity-50"></div>
          {/* Glassmorphism decorative elements */}
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-white/10 backdrop-blur-lg rounded-full border border-white/20"></div>
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 rotate-45"></div>
        </div>
        
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white mb-12 inline-flex hover:opacity-80 transition-opacity">
            <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold">AI Finance</span>
          </Link>

          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Start your journey <br /> to financial freedom
          </h1>
          <p className="text-indigo-100 text-lg max-w-md">
            Join thousands of users who are taking control of their money with smart, automated insights.
          </p>
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="text-green-300" /> Quick setup, no credit card required
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="text-green-300" /> Bank-grade security and encryption
            </div>
            <div className="flex items-center gap-3 text-indigo-100">
              <CheckCircle2 className="text-green-300" /> Cancel anytime, no hidden fees
            </div>
          </div>
        </div>

        <div className="relative z-10 text-indigo-200 text-sm">
          &copy; {new Date().getFullYear()} AI Finance Manager. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto py-8">
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
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Create an account</h2>
            <p className="text-gray-600">Already have an account? <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-500 transition-colors">Log in</Link></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow shadow-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Password strength indicator */}
              {password && (
                <div className="mt-3">
                  <div className="flex gap-1 h-1.5 mb-2 w-full">
                    <div className={`flex-1 rounded-full ${getStrength() >= 1 ? getStrengthColor() : 'bg-gray-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${getStrength() >= 2 ? getStrengthColor() : 'bg-gray-200'} transition-colors duration-300`}></div>
                    <div className={`flex-1 rounded-full ${getStrength() >= 3 ? getStrengthColor() : 'bg-gray-200'} transition-colors duration-300`}></div>
                  </div>
                  <div className="text-xs space-y-1 mt-2">
                    <div className={`flex items-center gap-1.5 ${pwdLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {pwdLength ? <CheckCircle2 size={12} /> : <XCircle size={12} className="opacity-50" />}
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdLetter ? 'text-green-600' : 'text-gray-500'}`}>
                      {pwdLetter ? <CheckCircle2 size={12} /> : <XCircle size={12} className="opacity-50" />}
                      Contains a letter
                    </div>
                    <div className={`flex items-center gap-1.5 ${pwdNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {pwdNumber ? <CheckCircle2 size={12} /> : <XCircle size={12} className="opacity-50" />}
                      Contains a number
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent transition-shadow shadow-sm ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300 focus:ring-red-500' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || (password && password !== confirmPassword) || (password && getStrength() < 3)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-70 disabled:cursor-not-allowed transition-all hover:shadow-lg mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center lg:text-left text-sm text-gray-500">
            By signing up, you agree to our <a href="#" className="text-indigo-600 hover:underline">Terms of Service</a> and <a href="#" className="text-indigo-600 hover:underline">Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
