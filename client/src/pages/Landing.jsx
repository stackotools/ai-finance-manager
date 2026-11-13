import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Wallet, 
  PieChart, 
  ShieldCheck, 
  Smartphone, 
  Zap,
  CheckCircle,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                AI Finance
              </span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">
                Log in
              </Link>
              <Link 
                to="/signup" 
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                Get Started <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-3">
            <Link 
              to="/login" 
              className="block w-full text-center px-4 py-2 text-gray-600 font-medium hover:bg-gray-50 rounded-lg"
            >
              Log in
            </Link>
            <Link 
              to="/signup" 
              className="block w-full text-center bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700"
            >
              Get Started
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-white"></div>
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-purple-200/50 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
          <div className="absolute top-0 left-0 -translate-y-1/2 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-200/50 rounded-full blur-3xl opacity-50 mix-blend-multiply"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 font-medium text-sm mb-8 animate-fade-in-up">
            <Zap size={16} className="text-indigo-600" />
            <span>Introducing AI-Powered Categorization</span>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight">
            Take control of your <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              financial future
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Automatically track expenses, analyze spending patterns with AI, and achieve your financial goals faster than ever.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/signup" 
              className="bg-indigo-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Start for free <ArrowRight size={20} />
            </Link>
            <a 
              href="#features" 
              className="bg-white text-gray-700 border border-gray-200 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all flex items-center justify-center"
            >
              Learn more
            </a>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">99%</div>
              <div className="text-sm text-gray-500 font-medium">AI Accuracy</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">10+</div>
              <div className="text-sm text-gray-500 font-medium">Categories</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">CSV/XLS</div>
              <div className="text-sm text-gray-500 font-medium">Bank Import</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">50/30/20</div>
              <div className="text-sm text-gray-500 font-medium">Smart Budgeting</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage money</h2>
            <p className="text-lg text-gray-600">Powerful features designed to give you clarity and control over your personal finances.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="text-indigo-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Expense Tracking</h3>
              <p className="text-gray-600">Upload your bank statements and let our AI automatically categorize and tag every transaction.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <PieChart className="text-purple-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Smart Budgets</h3>
              <p className="text-gray-600">Set limits based on the 50/30/20 rule and get alerts when you're approaching your category budgets.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="text-green-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Cashflow Analysis</h3>
              <p className="text-gray-600">Visualize your income versus expenses over time to ensure you're always growing your wealth.</p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-blue-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-grade Security</h3>
              <p className="text-gray-600">Your data is encrypted and securely stored. We use industry-standard security protocols to keep you safe.</p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Zap className="text-rose-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Insights</h3>
              <p className="text-gray-600">Chat with your AI financial assistant to get quick answers about your spending habits and trends.</p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100 group">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="text-amber-600 h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Accessible Anywhere</h3>
              <p className="text-gray-600">A responsive design that works perfectly on your desktop, tablet, or mobile phone.</p>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How it works</h2>
            <p className="text-lg text-gray-600">Get up and running in minutes, not hours.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-between relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-gray-200 -translate-y-1/2 z-0"></div>

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center text-center flex-1 px-4 mb-12 md:mb-0">
              <div className="w-16 h-16 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 mb-6 shadow-sm">1</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Create an account</h3>
              <p className="text-gray-600">Sign up securely and set your basic profile information and income.</p>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center text-center flex-1 px-4 mb-12 md:mb-0">
              <div className="w-16 h-16 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 mb-6 shadow-sm">2</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Add transactions</h3>
              <p className="text-gray-600">Manually enter expenses or upload bank statements for AI parsing.</p>
            </div>

            {/* Step 3 */}
            <div className="relative z-10 flex flex-col items-center text-center flex-1 px-4">
              <div className="w-16 h-16 bg-white border-4 border-indigo-100 rounded-full flex items-center justify-center text-xl font-bold text-indigo-600 mb-6 shadow-sm">3</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Get insights</h3>
              <p className="text-gray-600">Watch your dashboard populate with actionable insights and charts.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[500px] h-[500px] bg-purple-500 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/3 w-[500px] h-[500px] bg-indigo-400 rounded-full blur-3xl opacity-50"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to master your money?
          </h2>
          <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of users who have transformed their financial habits with our AI-powered insights.
          </p>
          <Link 
            to="/signup" 
            className="inline-flex bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 items-center gap-2"
          >
            Create Your Free Account <ArrowRight size={20} />
          </Link>
          <div className="mt-8 flex items-center justify-center gap-6 text-indigo-100 text-sm">
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-300" /> No credit card required</div>
            <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-300" /> Cancel anytime</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-indigo-600 p-1.5 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  AI Finance
                </span>
              </div>
              <p className="text-sm text-gray-400">
                The smart way to track, manage, and grow your wealth with the power of artificial intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-sm text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} AI Finance Manager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
