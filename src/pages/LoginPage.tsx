import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../store';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { registerUser, loginUser, getDemoCredentials } from '../services/userDatabase';
import toast from 'react-hot-toast';

const LoginPage: React.FC = () => {
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!password.trim()) {
      toast.error('Please enter your password.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    if (isLogin) {
      // Login validation
      if (!email.trim()) {
        toast.error('Please enter your email.');
        return;
      }
    } else {
      // Registration validation
      if (!role) {
        toast.error('Please select a role.');
        return;
      }

      if (!name.trim()) {
        toast.error('Please enter your name.');
        return;
      }

      if (!email.trim()) {
        toast.error('Please enter your email.');
        return;
      }
    }

    setLoading(true);
    const loadingToast = toast.loading(isLogin ? 'Signing in...' : 'Creating account...');

    try {
      if (isLogin) {
        // Login
        const result = await loginUser(email, password);
        setUser({
          role: result.user.role,
          name: result.user.name,
          email: result.user.email,
        });
        toast.success(`Welcome back, ${result.user.name}!`, { id: loadingToast });
      } else {
        // Register
        await registerUser({
          email,
          name,
          password,
          role: role as 'HR' | 'Candidate'
        });
        toast.success('Account created successfully! Please sign in.', { id: loadingToast });
        setIsLogin(true);
        // Clear form
        setRole('');
        setName('');
        setEmail('');
        setPassword('');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed', { id: loadingToast });
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo/Brand */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <span className="text-white font-bold text-2xl">TF</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            TalentFlow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLogin ? 'Welcome back! Sign in to continue' : 'Join us and start your journey'}
          </p>
        </motion.div>

        <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80">
          {/* Tab Switcher */}
          <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Role Selection - Only for Registration */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select your role
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole('HR')}
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      role === 'HR'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    HR Manager
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setRole('Candidate')}
                    className={`flex items-center justify-center px-4 py-3 border-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      role === 'Candidate'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    Candidate
                  </motion.button>
                </div>
              </div>
            )}

            {/* Name Field - Only for Registration */}
            {!isLogin && (
              <Input
                label="Full Name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                icon={<UserIcon />}
                required
                fullWidth
              />
            )}

            {/* Email Field */}
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={<EnvelopeIcon />}
              required
              fullWidth
            />

            {/* Password Field */}
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              helperText="Minimum 6 characters"
              icon={<LockClosedIcon />}
              required
              fullWidth
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full"
            >
              {isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        </Card>

        {/* Demo Credentials */}
        {isLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-3">
                  Demo Credentials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">HR Manager</div>
                    <div className="text-gray-600 dark:text-gray-400">hr@talentflow.com</div>
                    <div className="text-gray-600 dark:text-gray-400">password123</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-blue-200 dark:border-blue-700">
                    <div className="font-medium text-gray-900 dark:text-white mb-1">Candidate</div>
                    <div className="text-gray-600 dark:text-gray-400">candidate@talentflow.com</div>
                    <div className="text-gray-600 dark:text-gray-400">password123</div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginPage;