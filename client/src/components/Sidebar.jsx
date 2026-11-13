import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  List, 
  PlusCircle, 
  Tag, 
  Upload, 
  Lightbulb, 
  Wallet,
  X,
  UserCircle
} from 'lucide-react';
import { classNames } from '../utils/formatters';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Transactions', href: '/transactions', icon: List },
  { name: 'Add Transaction', href: '/transactions/new', icon: PlusCircle },
  { name: 'Categories', href: '/categories', icon: Tag },
  { name: 'Upload Statement', href: '/upload', icon: Upload },
  { name: 'Insights', href: '/insights', icon: Lightbulb },
  { name: 'Budgets', href: '/budgets', icon: Wallet },
  { name: 'Profile', href: '/profile', icon: UserCircle },
];

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }) => {
  return (
    <>
      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="relative z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed inset-0 z-40 flex">
            <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white pt-5 pb-4">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="sr-only">Close sidebar</span>
                  <X className="h-6 w-6 text-white" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-shrink-0 items-center px-4 mb-5">
                <span className="text-xl font-bold text-indigo-600">FinanceAI</span>
              </div>
              <div className="mt-5 h-0 flex-1 overflow-y-auto">
                <nav className="space-y-1 px-2">
                  {navigation.map((item) => (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        classNames(
                          isActive
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          'group flex items-center px-2 py-2 text-base font-medium rounded-md'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon
                            className={classNames(
                              isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                              'mr-4 flex-shrink-0 h-6 w-6'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </>
                      )}
                    </NavLink>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:pt-16">
        <div className="flex min-h-0 flex-1 flex-col border-r border-gray-200 bg-white">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <nav className="mt-5 flex-1 space-y-1 bg-white px-2">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    classNames(
                      isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={classNames(
                          isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-500',
                          'mr-3 flex-shrink-0 h-5 w-5'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
