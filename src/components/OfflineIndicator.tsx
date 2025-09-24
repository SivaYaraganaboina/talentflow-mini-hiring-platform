import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  WifiIcon, 
  ExclamationTriangleIcon,
  ClockIcon 
} from '@heroicons/react/24/outline';
import { offlineQueue } from '../services/offlineQueue';

const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue length periodically
    const interval = setInterval(() => {
      setQueueLength(offlineQueue.getQueueLength());
    }, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return (
    <AnimatePresence>
      {(!isOnline || queueLength > 0) && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-20 right-4 z-50"
        >
          <div className={`rounded-lg shadow-lg border px-4 py-2 flex items-center space-x-2 ${
            !isOnline 
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
              : 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
          }`}>
            {!isOnline ? (
              <>
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </>
            ) : queueLength > 0 ? (
              <>
                <ClockIcon className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {queueLength} pending sync{queueLength !== 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <>
                <WifiIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;