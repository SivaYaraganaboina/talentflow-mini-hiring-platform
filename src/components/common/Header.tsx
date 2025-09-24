import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bars3Icon,
  XMarkIcon,
  BriefcaseIcon,
  UsersIcon,
  DocumentTextIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import ThemeToggle from './ThemeToggle';
import KeyboardShortcuts from '../KeyboardShortcuts';
import { useAuth } from '../../store';

interface HeaderProps {
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { user } = useAuth();
  const role = user.role;
  const username = user.name;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Single key shortcuts (only when not in input)
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (e.key === '?') {
          e.preventDefault();
          setShortcutsOpen(true);
        } else if (role === 'HR') {
          if (e.key === 'n') {
            e.preventDefault();
            if (location.pathname.startsWith('/jobs')) {
              // Trigger new job modal - we'll need to emit an event
              window.dispatchEvent(new CustomEvent('openJobModal'));
            }
          } else if (e.key === 'j') {
            e.preventDefault();
            navigate('/jobs');
          } else if (e.key === 'c') {
            e.preventDefault();
            navigate('/candidates');
          } else if (e.key === 'a') {
            e.preventDefault();
            navigate('/assessments');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [location.pathname, navigate, role]);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems = role === 'HR' ? [
    { path: '/jobs', label: 'Jobs', icon: BriefcaseIcon },
    { path: '/candidates', label: 'Candidates', icon: UsersIcon },
    { path: '/assessments', label: 'Assessments', icon: DocumentTextIcon },
  ] : [
    { path: '/jobs', label: 'Browse Jobs', icon: BriefcaseIcon },
    { path: '/my-applications', label: 'My Applications', icon: DocumentTextIcon },
  ];

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="bg-white dark:bg-gray-900 shadow-soft border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Dashboard */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md"
              >
                <span className="text-white font-bold text-lg">TF</span>
              </motion.div>
              <span className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                TalentFlow
              </span>
            </Link>
            <Link
              to="/"
              className="hidden sm:flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                    active
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-primary-100 dark:bg-primary-900/30 rounded-lg -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Desktop User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <ThemeToggle />
            
            {/* User Info */}
            <div className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              <UserCircleIcon className="w-6 h-6 text-gray-400" />
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{username}</p>
                <p className="text-gray-500 dark:text-gray-400">{role}</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="w-6 h-6" />
            ) : (
              <Bars3Icon className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
          >
            <div className="px-4 py-4 space-y-2">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span>Dashboard</span>
              </Link>
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                <div className="flex items-center space-x-3 px-3 py-2 mb-3">
                  <UserCircleIcon className="w-6 h-6 text-gray-400" />
                  <div className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-white">{username}</p>
                    <p className="text-gray-500 dark:text-gray-400">{role}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between px-3">
                  <ThemeToggle />
                  <Button
                    variant="error"
                    size="sm"
                    onClick={() => {
                      onLogout();
                      setMobileMenuOpen(false);
                    }}
                    icon={<ArrowRightOnRectangleIcon className="w-4 h-4" />}
                  >
                    Logout
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </motion.header>
  );
};

export default Header;
