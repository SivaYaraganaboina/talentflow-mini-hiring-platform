import React from 'react';
import { motion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from './ui/Modal';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    {
      category: 'Global',
      items: [
        { key: '?', description: 'Show keyboard shortcuts' },
      ]
    },
    {
      category: 'Navigation (HR)',
      items: [
        { key: 'J', description: 'Go to Jobs' },
        { key: 'C', description: 'Go to Candidates' },
        { key: 'A', description: 'Go to Assessments' },
      ]
    },
    {
      category: 'Actions (HR)',
      items: [
        { key: 'N', description: 'Create new job (on Jobs page)' },
      ]
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts">
      <div className="space-y-6">
        {shortcuts.map((category) => (
          <div key={category.category}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              {category.category}
            </h3>
            <div className="space-y-2">
              {category.items.map((shortcut, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded">
                    {shortcut.key}
                  </kbd>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

export default KeyboardShortcuts;