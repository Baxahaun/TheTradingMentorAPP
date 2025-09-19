// This file has been removed as part of the journal feature cleanup
// The regular journal functionality has been replaced by the Daily Journal feature

interface JournalEditorProps {
  section?: any;
  templateSection?: any;
  onUpdate?: (content: any) => void;
  onSave?: () => Promise<void>;
  autoSaveInterval?: number;
  className?: string;
  placeholder?: string;
  showGuidedPrompts?: boolean;
}

export default function JournalEditor(props: JournalEditorProps) {
  return null;
}


  templateSection,
  onUpdate,
  onSave,
  autoSaveInterval = 30000, // 30 seconds default
  className = '',
  placeholder,
  showGuidedPrompts = true
}: JournalEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [content, setContent] = useState<string>(section.content || '');
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false
  });
  const [currentFormat, setCurrentFormat] = useState<RichTextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [guidedPrompts, setGuidedPrompts] = useState<GuidedPrompt[]>([]);
  const [wordCount, setWordCount] = useState(0);
  const [showPrompts, setShowPrompts] = useState(showGuidedPrompts);

  // Calculate word count
  const calculateWordCount = useCallback((text: string) => {
    const plainText = text.replace(/<[^>]*>/g, '').trim();
    return plainText ? plainText.split(/\s+/).length : 0;
  }, []);

  // Update content and trigger auto-save
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    setWordCount(calculateWordCount(newContent));
    setAutoSaveStatus(prev => ({ ...prev, hasUnsavedChanges: true, error: undefined }));
    onUpdate(newContent);
  }, [onUpdate, calculateWordCount]);

  // Enhanced debounced auto-save function with retry logic
  const debouncedAutoSave = useCallback(
    debounce(async () => {
      if (!autoSaveStatus.hasUnsavedChanges || autoSaveStatus.isSaving) return;
      
      const maxRetries = 3;
      let retryCount = 0;
      
      const attemptSave = async (): Promise<void> => {
        try {
          setAutoSaveStatus(prev => ({ ...prev, isSaving: true, error: undefined }));
          
          if (onSave) {
            await onSave();
          }
          
          setAutoSaveStatus({
            isSaving: false,
            lastSaved: new Date(),
            hasUnsavedChanges: false
          });
        } catch (error) {
          console.error(`Auto-save attempt ${retryCount + 1} failed:`, error);
          
          if (retryCount < maxRetries - 1) {
            retryCount++;
            // Exponential backoff: wait 1s, then 2s, then 4s
            const delay = Math.pow(2, retryCount) * 1000;
            setTimeout(attemptSave, delay);
          } else {
            setAutoSaveStatus(prev => ({
              ...prev,
              isSaving: false,
              error: 'Auto-save failed after multiple attempts. Your changes are preserved locally.'
            }));
            
            // Store content in localStorage as backup
            try {
              localStorage.setItem(`journal_backup_${section.id}`, JSON.stringify({
                content,
                timestamp: Date.now(),
                sectionId: section.id
              }));
            } catch (storageError) {
              console.error('Failed to backup to localStorage:', storageError);
            }
          }
        }
      };
      
      await attemptSave();
    }, autoSaveInterval),
    [autoSaveStatus.hasUnsavedChanges, autoSaveStatus.isSaving, onSave, autoSaveInterval, content, section.id]
  );

  // Trigger auto-save when content changes
  useEffect(() => {
    if (autoSaveStatus.hasUnsavedChanges) {
      debouncedAutoSave();
    }
  }, [autoSaveStatus.hasUnsavedChanges, debouncedAutoSave]);

  // Initialize content and word count with backup recovery
  useEffect(() => {
    const initializeContent = () => {
      let initialContent = section.content || '';
      
      // Check for localStorage backup
      try {
        const backupKey = `journal_backup_${section.id}`;
        const backup = localStorage.getItem(backupKey);
        
        if (backup) {
          const backupData = JSON.parse(backup);
          const backupAge = Date.now() - backupData.timestamp;
          
          // If backup is less than 1 hour old and different from current content
          if (backupAge < 3600000 && backupData.content !== initialContent && backupData.content.trim()) {
            // Show recovery option (for now, just use the backup)
            initialContent = backupData.content;
            console.log('Recovered content from localStorage backup');
            
            // Clean up the backup after recovery
            localStorage.removeItem(backupKey);
          }
        }
      } catch (error) {
        console.error('Error checking localStorage backup:', error);
      }
      
      setContent(initialContent);
      setWordCount(calculateWordCount(initialContent));
    };
    
    initializeContent();
  }, [section.content, section.id, calculateWordCount]);

  // Rich text formatting functions
  const applyFormat = (command: string, value?: string) => {
    // Check if document.execCommand is available (not available in test environments)
    if (typeof document.execCommand !== 'function') {
      console.warn('document.execCommand not available');
      return;
    }
    
    try {
      document.execCommand(command, false, value);
      updateFormatState();
      
      // Get updated content after formatting
      if (editorRef.current) {
        const newContent = editorRef.current.innerHTML;
        handleContentChange(newContent);
      }
    } catch (error) {
      console.warn('Failed to apply format:', command, error);
    }
  };

  const updateFormatState = () => {
    // Check if document.queryCommandState is available (not available in test environments)
    if (typeof document.queryCommandState !== 'function') {
      return;
    }
    
    try {
      setCurrentFormat({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strikethrough: document.queryCommandState('strikeThrough'),
        code: document.queryCommandState('formatBlock') === 'code',
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight')
      });
    } catch (error) {
      console.warn('Failed to update format state:', error);
    }
  };

  // Handle input in contentEditable div
  const handleInput = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      handleContentChange(newContent);
    }
    updateFormatState();
  };

  // Handle key events for shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for manual save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (onSave) {
        onSave();
      }
      return;
    }
    
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold');
      return;
    }
    
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyFormat('italic');
      return;
    }
    
    // Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      applyFormat('underline');
      return;
    }
    
    // Ctrl/Cmd + Z for undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      applyFormat('undo');
      return;
    }
    
    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      applyFormat('redo');
      return;
    }
    
    // Escape to exit fullscreen
    if (e.key === 'Escape' && isFullscreen) {
      e.preventDefault();
      setIsFullscreen(false);
      return;
    }
    
    // F11 to toggle fullscreen
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
      return;
    }
    
    // Update format state on selection change
    setTimeout(updateFormatState, 0);
  };

  // Manual save function
  const handleManualSave = async () => {
    if (!onSave) return;
    
    try {
      setAutoSaveStatus(prev => ({ ...prev, isSaving: true, error: undefined }));
      await onSave();
      setAutoSaveStatus({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      setAutoSaveStatus(prev => ({
        ...prev,
        isSaving: false,
        error: 'Save failed. Please try again.'
      }));
    }
  };

  // Get placeholder text
  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (templateSection?.placeholder) return templateSection.placeholder;
    if (templateSection?.prompt) return `${templateSection.prompt}...`;
    return 'Start writing your thoughts here...';
  };

  // Generate guided prompts based on section type and content
  const generateGuidedPrompts = useCallback(() => {
    const prompts: GuidedPrompt[] = [];
    
    // Add template-specific prompt
    if (templateSection?.prompt) {
      prompts.push({
        id: 'template-prompt',
        text: templateSection.prompt,
        category: 'question',
        priority: 1
      });
    }
    
    // Add section-specific prompts based on type
    switch (section.type) {
      case 'text':
        if (section.title.toLowerCase().includes('reflection')) {
          prompts.push(
            { id: 'reflection-1', text: "What went well today?", category: 'question', priority: 2 },
            { id: 'reflection-2', text: "What could have been improved?", category: 'question', priority: 2 },
            { id: 'reflection-3', text: "What did you learn from today's experience?", category: 'question', priority: 2 },
            { id: 'reflection-tip', text: "Focus on specific examples rather than general statements", category: 'tip', priority: 3 }
          );
        } else if (section.title.toLowerCase().includes('plan')) {
          prompts.push(
            { id: 'plan-1', text: "What are your key objectives for tomorrow?", category: 'question', priority: 2 },
            { id: 'plan-2', text: "What potential challenges do you anticipate?", category: 'question', priority: 2 },
            { id: 'plan-3', text: "How will you measure success?", category: 'question', priority: 2 },
            { id: 'plan-tip', text: "Be specific and actionable in your planning", category: 'tip', priority: 3 }
          );
        } else if (section.title.toLowerCase().includes('notes')) {
          prompts.push(
            { id: 'notes-1', text: "What were the key market events today?", category: 'question', priority: 2 },
            { id: 'notes-2', text: "How did you feel during different parts of the session?", category: 'question', priority: 2 },
            { id: 'notes-tip', text: "Include both factual observations and emotional responses", category: 'tip', priority: 3 }
          );
        }
        break;
        
      case 'lesson_learned':
        prompts.push(
          { id: 'lesson-1', text: "What specific mistake did you make?", category: 'question', priority: 2 },
          { id: 'lesson-2', text: "Why did this mistake happen?", category: 'question', priority: 2 },
          { id: 'lesson-3', text: "How will you prevent this in the future?", category: 'question', priority: 2 },
          { id: 'lesson-4', text: "What positive outcome can come from this lesson?", category: 'question', priority: 2 },
          { id: 'lesson-tip', text: "Be honest and specific - mistakes are learning opportunities", category: 'tip', priority: 3 }
        );
        break;
        
      case 'market_analysis':
        prompts.push(
          { id: 'market-1', text: "What is the overall market sentiment?", category: 'question', priority: 2 },
          { id: 'market-2', text: "What key levels are you watching?", category: 'question', priority: 2 },
          { id: 'market-3', text: "What news or events might impact the market?", category: 'question', priority: 2 },
          { id: 'market-4', text: "What is your directional bias and why?", category: 'question', priority: 2 },
          { id: 'market-tip', text: "Support your analysis with specific technical or fundamental reasons", category: 'tip', priority: 3 }
        );
        break;
        
      case 'goal_setting':
        prompts.push(
          { id: 'goal-1', text: "What specific goals do you want to achieve?", category: 'question', priority: 2 },
          { id: 'goal-2', text: "How will you measure progress toward these goals?", category: 'question', priority: 2 },
          { id: 'goal-3', text: "What obstacles might prevent you from achieving these goals?", category: 'question', priority: 2 },
          { id: 'goal-tip', text: "Make your goals SMART: Specific, Measurable, Achievable, Relevant, Time-bound", category: 'tip', priority: 3 }
        );
        break;
    }
    
    // Add content-based suggestions
    if (content.length === 0) {
      prompts.push({
        id: 'start-writing',
        text: "Start by writing one sentence about your main thought or feeling",
        category: 'suggestion',
        priority: 1
      });
    } else if (wordCount < 10) {
      prompts.push({
        id: 'expand-thoughts',
        text: "Try to expand on your initial thoughts with more detail",
        category: 'suggestion',
        priority: 2
      });
    } else if (wordCount > 100 && !content.includes('?')) {
      prompts.push({
        id: 'ask-questions',
        text: "Consider asking yourself questions to deepen your reflection",
        category: 'suggestion',
        priority: 3
      });
    }
    
    // Sort by priority and return
    return prompts.sort((a, b) => a.priority - b.priority);
  }, [section, templateSection, content, wordCount]);

  // Update guided prompts when content changes
  useEffect(() => {
    setGuidedPrompts(generateGuidedPrompts());
  }, [generateGuidedPrompts]);

  // Insert prompt text into editor
  const insertPromptText = (promptText: string) => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const textNode = document.createTextNode(promptText + ' ');
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      } else {
        // If no selection, append to end
        const currentContent = editorRef.current.innerHTML;
        const newContent = currentContent + (currentContent ? '<br>' : '') + promptText + ' ';
        editorRef.current.innerHTML = newContent;
        editorRef.current.focus();
      }
      handleInput();
    }
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  return (
    <div className={`journal-editor ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900 p-4 flex flex-col' : ''}`}>
      {/* Header with title and status */}
      <div className={`flex items-center justify-between ${isFullscreen ? 'mb-4' : 'mb-4'}`}>
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {section.title}
          </h3>
          {section.isRequired && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded">
              Required
            </span>
          )}
        </div>
        
        {/* Auto-save status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{wordCount} words</span>
            {templateSection?.config?.minWords && (
              <span className={wordCount >= templateSection.config.minWords ? 'text-green-500' : 'text-yellow-500'}>
                (min: {templateSection.config.minWords})
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            {autoSaveStatus.isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-blue-500">Saving...</span>
              </>
            ) : autoSaveStatus.error ? (
              <>
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-500">Save failed</span>
              </>
            ) : autoSaveStatus.lastSaved ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-green-500">
                  Saved {autoSaveStatus.lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : autoSaveStatus.hasUnsavedChanges ? (
              <>
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-500">Unsaved changes</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Enhanced guided prompts */}
      {showPrompts && guidedPrompts.length > 0 && (
        <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Writing Guidance
                </h4>
                <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded">
                  {guidedPrompts.length} suggestions
                </span>
              </div>
              
              <div className="space-y-3">
                {guidedPrompts.map((prompt) => (
                  <div key={prompt.id} className="group">
                    <div className="flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        prompt.category === 'question' ? 'bg-blue-500' :
                        prompt.category === 'suggestion' ? 'bg-green-500' :
                        'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                          {prompt.text}
                        </p>
                        {prompt.category === 'question' && (
                          <button
                            onClick={() => insertPromptText(prompt.text)}
                            className="mt-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Click to insert as writing prompt
                          </button>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        prompt.category === 'question' ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300' :
                        prompt.category === 'suggestion' ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300' :
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300'
                      }`}>
                        {prompt.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setShowPrompts(false)}
              className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
              title="Hide prompts"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Rich text toolbar */}
      {templateSection?.config?.allowRichText !== false && (
        <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-t-lg border border-gray-200 dark:border-gray-600 flex-wrap">
          {/* Text formatting */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat('bold')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.bold ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Bold (Ctrl+B)"
            >
              <Bold className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('italic')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.italic ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Italic (Ctrl+I)"
            >
              <Italic className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('underline')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.underline ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Underline (Ctrl+U)"
            >
              <Underline className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('strikeThrough')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.strikethrough ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Strikethrough"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
          
          {/* Lists and formatting */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat('insertUnorderedList')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Bullet List"
            >
              <List className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('insertOrderedList')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Numbered List"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('formatBlock', 'blockquote')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Quote"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
          
          {/* Alignment */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat('justifyLeft')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.alignLeft ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('justifyCenter')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.alignCenter ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('justifyRight')}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                currentFormat.alignRight ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Align Right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-500 mx-1" />
          
          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => applyFormat('undo')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <Undo className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => applyFormat('redo')}
              className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <Redo className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1" />
          
          {/* View options */}
          <div className="flex items-center gap-1">
            <button
              onClick={togglePreview}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                showPreview ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Toggle Preview"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            
            <button
              onClick={toggleFullscreen}
              className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
                isFullscreen ? 'bg-gray-200 dark:bg-gray-600' : ''
              }`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
          
        </div>
      )}

      {/* Editor content area */}
      <div className={`relative ${isFullscreen ? 'flex-1 flex flex-col' : ''}`}>
        {isFullscreen && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {section.title} - Fullscreen Mode
            </h2>
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          </div>
        )}
        
        <div className={`flex gap-4 ${isFullscreen ? 'h-full' : ''}`}>
          {/* Editor */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} ${isFullscreen ? 'h-full' : ''}`}>
            <div
              ref={editorRef}
              contentEditable={!showPreview}
              role="textbox"
              aria-label={`${section.title} editor`}
              aria-multiline="true"
              onInput={handleInput}
              onKeyDown={handleKeyDown}
              onMouseUp={updateFormatState}
              onKeyUp={updateFormatState}
              className={`
                w-full p-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                border border-gray-200 dark:border-gray-600 
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                prose prose-sm dark:prose-invert max-w-none
                ${templateSection?.config?.allowRichText === false ? 'rounded-lg' : 'rounded-b-lg'}
                ${isFullscreen ? 'h-full overflow-y-auto' : 'min-h-[200px]'}
                ${showPreview ? 'border-r-0 rounded-r-none' : ''}
              `}
              dangerouslySetInnerHTML={{ __html: content }}
              style={{
                minHeight: isFullscreen ? '100%' : (templateSection?.config?.minWords ? `${Math.max(200, templateSection.config.minWords * 2)}px` : '200px')
              }}
            />
            
            {/* Placeholder overlay */}
            {!content && !showPreview && (
              <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none">
                {getPlaceholder()}
              </div>
            )}
          </div>
          
          {/* Preview */}
          {showPreview && (
            <div className={`w-1/2 ${isFullscreen ? 'h-full' : ''}`}>
              <div className={`
                w-full p-4 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100
                border border-gray-200 dark:border-gray-600 border-l-0 rounded-r-lg
                prose prose-sm dark:prose-invert max-w-none
                ${isFullscreen ? 'h-full overflow-y-auto' : 'min-h-[200px]'}
              `}>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-gray-300 dark:border-gray-600">
                  Preview Mode
                </div>
                <div dangerouslySetInnerHTML={{ __html: content || '<p class="text-gray-400 italic">Start writing to see preview...</p>' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced footer with validation and hints */}
      {!isFullscreen && (
        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {/* Word count and validation */}
              <div className="flex items-center gap-2">
                <span className="text-gray-600 dark:text-gray-300">
                  {wordCount} words
                </span>
                {templateSection?.config?.minWords && (
                  <span className={`px-2 py-1 rounded text-xs ${
                    wordCount >= templateSection.config.minWords
                      ? 'bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800 dark:text-yellow-300'
                  }`}>
                    {wordCount >= templateSection.config.minWords 
                      ? `✓ Min ${templateSection.config.minWords}` 
                      : `${templateSection.config.minWords - wordCount} more needed`
                    }
                  </span>
                )}
                {templateSection?.config?.maxWords && wordCount > templateSection.config.maxWords && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-300 rounded text-xs">
                    {wordCount - templateSection.config.maxWords} over limit
                  </span>
                )}
              </div>
              
              {/* Error messages */}
              {autoSaveStatus.error && (
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{autoSaveStatus.error}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* Auto-save info */}
              <span className="text-gray-500 dark:text-gray-400">
                Auto-save: {autoSaveInterval / 1000}s
              </span>
              
              {/* Prompt toggle */}
              {guidedPrompts.length > 0 && (
                <button
                  onClick={() => setShowPrompts(!showPrompts)}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                    showPrompts 
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300' 
                      : 'text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                  }`}
                >
                  <Lightbulb className="w-3 h-3" />
                  {showPrompts ? 'Hide' : 'Show'} prompts ({guidedPrompts.length})
                </button>
              )}
              
              {/* Keyboard shortcuts hint */}
              <div className="text-xs text-gray-400 dark:text-gray-500">
                Ctrl+S to save
              </div>
            </div>
          </div>
          
          {/* Progress indicator for required sections */}
          {section.isRequired && (
            <div className="mt-2">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Completion:</span>
                <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      wordCount >= (templateSection?.config?.minWords || 10) 
                        ? 'bg-green-500' 
                        : 'bg-yellow-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (wordCount / (templateSection?.config?.minWords || 10)) * 100)}%` 
                    }}
                  />
                </div>
                <span className={`text-xs ${
                  wordCount >= (templateSection?.config?.minWords || 10) 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {Math.min(100, Math.round((wordCount / (templateSection?.config?.minWords || 10)) * 100))}%
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}