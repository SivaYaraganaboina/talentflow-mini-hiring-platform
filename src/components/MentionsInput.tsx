import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserIcon } from '@heroicons/react/24/outline';

interface MentionsInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  suggestions?: string[];
}

const MentionsInput: React.FC<MentionsInputProps> = ({
  value,
  onChange,
  placeholder = "Type @ to mention someone...",
  className = "",
  rows = 3,
  suggestions = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Default HR team members for suggestions
  const defaultSuggestions = [
    'HR Manager',
    'John Smith',
    'Sarah Johnson',
    'Mike Wilson',
    'Emily Davis',
    'David Brown',
    'Lisa Anderson',
    'Tom Miller'
  ];

  const allSuggestions = suggestions.length > 0 ? suggestions : defaultSuggestions;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredSuggestions[selectedIndex]) {
            insertMention(filteredSuggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
      }
    };

    textarea.addEventListener('keydown', handleKeyDown);
    return () => textarea.removeEventListener('keydown', handleKeyDown);
  }, [showSuggestions, filteredSuggestions, selectedIndex]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);
    
    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1].toLowerCase();
      const filtered = allSuggestions.filter(name => 
        name.toLowerCase().includes(query)
      );
      
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setSelectedIndex(0);
      setMentionStart(textBeforeCursor.length - mentionMatch[0].length);
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (name: string) => {
    if (!textareaRef.current || mentionStart === -1) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBefore = value.substring(0, mentionStart);
    const textAfter = value.substring(cursorPosition);
    
    const newValue = `${textBefore}@${name} ${textAfter}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionStart(-1);
    
    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = mentionStart + name.length + 2;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.focus();
    }, 0);
  };

  const handleSuggestionClick = (name: string) => {
    insertMention(name);
  };

  const renderText = (text: string) => {
    // Render @mentions with highlighting
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-blue-600 dark:text-blue-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${className}`}
      />
      
      {/* Preview of rendered text with mentions highlighted */}
      {value && (
        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Preview:</span>
          {renderText(value)}
        </div>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
          >
            {filteredSuggestions.map((name, index) => (
              <button
                key={name}
                onClick={() => handleSuggestionClick(name)}
                className={`w-full px-3 py-2 text-left flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <UserIcon className="w-4 h-4" />
                <span>{name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentionsInput;