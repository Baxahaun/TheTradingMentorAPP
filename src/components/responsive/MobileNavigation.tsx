import React, { useState } from 'react';
import { useResponsive } from '../../hooks/useResponsive';
import { useKeyboardNavigation, useFocusTrap } from '../../hooks/useAccessibility';
import { AccessibleButton, AccessibleIconButton } from '../accessibility/AccessibleButton';

interface NavigationItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onClick?: () => void;
  badge?: number;
  disabled?: boolean;
}

interface MobileNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemSelect: (item: NavigationItem) => void;
  className?: string;
}

/**
 * Mobile-optimized navigation component
 */
export function MobileNavigation({
  items,
  activeItem,
  onItemSelect,
  className = ''
}: MobileNavigationProps) {
  const { isMobile } = useResponsive();
  const [isOpen, setIsOpen] = useState(false);
  const { focusedIndex, containerRef } = useKeyboardNavigation(items, onItemSelect);
  const focusTrapRef = useFocusTrap(isOpen && isMobile);

  if (!isMobile) {
    // Desktop horizontal navigation
    return (
      <nav 
        className={`desktop-navigation ${className}`}
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="nav-list" role="menubar">
          {items.map((item, index) => (
            <li key={item.id} role="none">
              <AccessibleButton
                variant={activeItem === item.id ? 'primary' : 'ghost'}
                className={`nav-item ${focusedIndex === index ? 'nav-item-focused' : ''}`}
                onClick={() => onItemSelect(item)}
                disabled={item.disabled}
                role="menuitem"
                aria-current={activeItem === item.id ? 'page' : undefined}
              >
                {item.icon && (
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                )}
                <span className="nav-label">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span 
                    className="nav-badge"
                    aria-label={`${item.badge} notifications`}
                  >
                    {item.badge}
                  </span>
                )}
              </AccessibleButton>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  // Mobile navigation with hamburger menu
  return (
    <>
      {/* Mobile header with hamburger */}
      <header className={`mobile-nav-header ${className}`}>
        <AccessibleIconButton
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
              />
            </svg>
          }
          label={isOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-menu"
        />
        
        <h1 className="mobile-nav-title">Strategy Management</h1>
      </header>

      {/* Mobile slide-out menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="mobile-nav-backdrop"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Menu panel */}
          <nav
            ref={focusTrapRef}
            id="mobile-nav-menu"
            className="mobile-nav-menu"
            role="navigation"
            aria-label="Main navigation"
          >
            <div ref={containerRef} className="mobile-nav-content">
              <ul className="mobile-nav-list" role="menu">
                {items.map((item, index) => (
                  <li key={item.id} role="none">
                    <AccessibleButton
                      variant="ghost"
                      className={`mobile-nav-item ${
                        activeItem === item.id ? 'mobile-nav-item-active' : ''
                      } ${focusedIndex === index ? 'mobile-nav-item-focused' : ''}`}
                      onClick={() => {
                        onItemSelect(item);
                        setIsOpen(false);
                      }}
                      disabled={item.disabled}
                      role="menuitem"
                      aria-current={activeItem === item.id ? 'page' : undefined}
                    >
                      {item.icon && (
                        <span className="mobile-nav-icon" aria-hidden="true">
                          {item.icon}
                        </span>
                      )}
                      <span className="mobile-nav-label">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <span 
                          className="mobile-nav-badge"
                          aria-label={`${item.badge} notifications`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </AccessibleButton>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </>
      )}
    </>
  );
}

interface BottomTabNavigationProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemSelect: (item: NavigationItem) => void;
  className?: string;
}

/**
 * Bottom tab navigation for mobile
 */
export function BottomTabNavigation({
  items,
  activeItem,
  onItemSelect,
  className = ''
}: BottomTabNavigationProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <nav 
      className={`bottom-tab-navigation ${className}`}
      role="tablist"
      aria-label="Main navigation tabs"
    >
      {items.slice(0, 5).map((item) => (
        <AccessibleButton
          key={item.id}
          variant="ghost"
          className={`bottom-tab ${activeItem === item.id ? 'bottom-tab-active' : ''}`}
          onClick={() => onItemSelect(item)}
          disabled={item.disabled}
          role="tab"
          aria-selected={activeItem === item.id}
          aria-controls={`panel-${item.id}`}
        >
          {item.icon && (
            <span className="bottom-tab-icon" aria-hidden="true">
              {item.icon}
            </span>
          )}
          <span className="bottom-tab-label">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span 
              className="bottom-tab-badge"
              aria-label={`${item.badge} notifications`}
            >
              {item.badge}
            </span>
          )}
        </AccessibleButton>
      ))}
    </nav>
  );
}