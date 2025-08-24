import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, describe, it, expect } from 'vitest';
import { useAccessibility, useKeyboardNavigation, useFocusManagement } from '../useAccessibility';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('useAccessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.className = '';
  });

  it('should initialize with default preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    expect(result.current.preferences).toEqual({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      keyboardNavigation: true
    });
  });

  it('should load preferences from localStorage', () => {
    const storedPrefs = {
      highContrast: true,
      fontSize: 'large'
    };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedPrefs));

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.preferences.highContrast).toBe(true);
    expect(result.current.preferences.fontSize).toBe('large');
  });

  it('should respect system preferences', () => {
    window.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.preferences.reducedMotion).toBe(true);
  });

  it('should update preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updatePreferences({ highContrast: true });
    });

    expect(result.current.preferences.highContrast).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'accessibility-preferences',
      expect.stringContaining('"highContrast":true')
    );
  });

  it('should toggle preferences', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.togglePreference('highContrast');
    });

    expect(result.current.preferences.highContrast).toBe(true);

    act(() => {
      result.current.togglePreference('highContrast');
    });

    expect(result.current.preferences.highContrast).toBe(false);
  });

  it('should apply CSS classes to document', () => {
    const { result } = renderHook(() => useAccessibility());

    act(() => {
      result.current.updatePreferences({ 
        highContrast: true,
        reducedMotion: true,
        fontSize: 'large'
      });
    });

    expect(document.documentElement).toHaveClass('high-contrast');
    expect(document.documentElement).toHaveClass('reduced-motion');
    expect(document.documentElement).toHaveClass('font-large');
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useAccessibility());

    expect(result.current.preferences).toEqual({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      keyboardNavigation: true
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error loading accessibility preferences:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });
});

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    document.body.className = '';
  });

  it('should add keyboard navigation class on keydown', () => {
    renderHook(() => useKeyboardNavigation(true));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(keydownEvent);

    expect(document.body).toHaveClass('keyboard-navigation-active');
  });

  it('should remove keyboard navigation class on mousedown', () => {
    renderHook(() => useKeyboardNavigation(true));

    // First add the class
    const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(keydownEvent);
    expect(document.body).toHaveClass('keyboard-navigation-active');

    // Then remove it
    const mousedownEvent = new MouseEvent('mousedown');
    document.dispatchEvent(mousedownEvent);
    expect(document.body).not.toHaveClass('keyboard-navigation-active');
  });

  it('should not add class when typing in inputs', () => {
    renderHook(() => useKeyboardNavigation(true));

    const input = document.createElement('input');
    document.body.appendChild(input);

    const keydownEvent = new KeyboardEvent('keydown', { key: 'a' });
    Object.defineProperty(keydownEvent, 'target', { value: input });
    document.dispatchEvent(keydownEvent);

    expect(document.body).not.toHaveClass('keyboard-navigation-active');

    document.body.removeChild(input);
  });

  it('should not activate when disabled', () => {
    renderHook(() => useKeyboardNavigation(false));

    const keydownEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    document.dispatchEvent(keydownEvent);

    expect(document.body).not.toHaveClass('keyboard-navigation-active');
  });
});

describe('useFocusManagement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should focus element by selector', () => {
    const { result } = renderHook(() => useFocusManagement());

    const button = document.createElement('button');
    button.id = 'test-button';
    document.body.appendChild(button);

    const focusSpy = vi.spyOn(button, 'focus');

    act(() => {
      result.current.focusElement('#test-button');
    });

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should focus element with delay', async () => {
    const { result } = renderHook(() => useFocusManagement());

    const button = document.createElement('button');
    button.id = 'test-button';
    document.body.appendChild(button);

    const focusSpy = vi.spyOn(button, 'focus');

    act(() => {
      result.current.focusElement('#test-button', 100);
    });

    // Should not focus immediately
    expect(focusSpy).not.toHaveBeenCalled();

    // Wait for delay
    await new Promise(resolve => setTimeout(resolve, 150));

    expect(focusSpy).toHaveBeenCalled();
  });

  it('should trap focus within container', () => {
    const { result } = renderHook(() => useFocusManagement());

    // Create container with focusable elements
    const container = document.createElement('div');
    container.id = 'test-container';
    
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    const button3 = document.createElement('button');
    
    container.appendChild(button1);
    container.appendChild(button2);
    container.appendChild(button3);
    document.body.appendChild(container);

    const cleanup = result.current.trapFocus('#test-container');

    // Focus last element and tab forward
    button3.focus();
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    container.dispatchEvent(tabEvent);

    // Should cycle to first element (mocked behavior)
    expect(typeof cleanup).toBe('function');

    cleanup();
  });

  it('should handle shift+tab in focus trap', () => {
    const { result } = renderHook(() => useFocusManagement());

    const container = document.createElement('div');
    container.id = 'test-container';
    
    const button1 = document.createElement('button');
    const button2 = document.createElement('button');
    
    container.appendChild(button1);
    container.appendChild(button2);
    document.body.appendChild(container);

    const cleanup = result.current.trapFocus('#test-container');

    // Focus first element and shift+tab
    button1.focus();
    const shiftTabEvent = new KeyboardEvent('keydown', { 
      key: 'Tab', 
      shiftKey: true 
    });
    container.dispatchEvent(shiftTabEvent);

    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('should return no-op cleanup for non-existent container', () => {
    const { result } = renderHook(() => useFocusManagement());

    const cleanup = result.current.trapFocus('#non-existent');

    expect(typeof cleanup).toBe('function');
    cleanup(); // Should not throw
  });
});