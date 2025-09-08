/**
 * Quick Add Button Component
 * 
 * A floating action button that provides quick access to the QuickAddModule
 * from anywhere in the application. Optimized for both desktop and mobile use.
 */

import React, { useState } from 'react';
import { Plus, MessageSquare } from 'lucide-react';
import QuickAddModule from './QuickAddModule';

interface QuickAddButtonProps {
  className?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onNoteAdded?: () => void;
}

const POSITION_CLASSES = {
  'bottom-right': 'bottom-4 right-4 md:bottom-6 md:right-6',
  'bottom-left': 'bottom-4 left-4 md:bottom-6 md:left-6',
  'top-right': 'top-4 right-4 md:top-6 md:right-6',
  'top-left': 'top-4 left-4 md:top-6 md:left-6'
};

const SIZE_CLASSES = {
  sm: 'w-12 h-12',
  md: 'w-14 h-14',
  lg: 'w-16 h-16'
};

const ICON_SIZE_CLASSES = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6',
  lg: 'w-7 h-7'
};

export const QuickAddButton: React.FC<QuickAddButtonProps> = ({
  className = '',
  position = 'bottom-right',
  size = 'md',
  showLabel = false,
  onNoteAdded
}) => {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleOpenQuickAdd = () => {
    setIsQuickAddOpen(true);
  };

  const handleCloseQuickAdd = () => {
    setIsQuickAddOpen(false);
  };

  const handleNoteAdded = () => {
    onNoteAdded?.();
    setIsQuickAddOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed z-40 ${POSITION_CLASSES[position]} ${className}`}>
        <div className="relative">
          {/* Label */}
          {showLabel && (
            <div
              className={`absolute ${
                position.includes('right') ? 'right-full mr-3' : 'left-full ml-3'
              } top-1/2 transform -translate-y-1/2 transition-all duration-200 ${
                isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
              }`}
            >
              <div className="bg-gray-900 text-white px-3 py-1 rounded-md text-sm font-medium whitespace-nowrap shadow-lg">
                Quick Add Note
                <div
                  className={`absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45 ${
                    position.includes('right') ? 'right-0 translate-x-1' : 'left-0 -translate-x-1'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Main Button */}
          <button
            onClick={handleOpenQuickAdd}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`
              ${SIZE_CLASSES[size]}
              bg-blue-500 hover:bg-blue-600 active:bg-blue-700
              text-white rounded-full shadow-lg hover:shadow-xl
              flex items-center justify-center
              transition-all duration-200 ease-in-out
              transform hover:scale-105 active:scale-95
              focus:outline-none focus:ring-4 focus:ring-blue-300
              group
            `}
            aria-label="Quick add note"
          >
            <Plus 
              className={`
                ${ICON_SIZE_CLASSES[size]}
                transition-transform duration-200
                group-hover:rotate-90
              `}
            />
          </button>

          {/* Pulse Animation for New Users */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20 pointer-events-none" />
        </div>
      </div>

      {/* Quick Add Modal */}
      <QuickAddModule
        isOpen={isQuickAddOpen}
        onClose={handleCloseQuickAdd}
        onSave={handleNoteAdded}
      />
    </>
  );
};

export default QuickAddButton;