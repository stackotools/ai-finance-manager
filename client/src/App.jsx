import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import Loader from './components/Loader';

// Lazy loading pages
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Transactions = lazy(() => import('./pages/Transactions'));
const AddTransaction = lazy(() => import('./pages/AddTransaction'));
const Categories = lazy(() => import('./pages/Categories'));
const Upload = lazy(() => import('./pages/Upload'));
const Insights = lazy(() => import('./pages/Insights'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Profile = lazy(() => import('./pages/Profile'));
const NotFound = lazy(() => import('./pages/NotFound'));

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader message="Loading page..." /></div>}>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transactions/new" element={<AddTransaction />} />
                <Route path="/transactions/:id/edit" element={<AddTransaction />} />
                <Route path="/transactions/edit/:id" element={<AddTransaction />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/insights" element={<Insights />} />
                <Route path="/budgets" element={<Budgets />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
