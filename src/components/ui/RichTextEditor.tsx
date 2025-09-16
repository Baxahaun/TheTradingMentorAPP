import React, { useEffect, useRef, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '../../lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing your journal entry...",
  className,
  readOnly = false
}) => {
  const quillRef = useRef<ReactQuill>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const modules = {
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['link'],
      ['clean']
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'blockquote', 'code-block',
    'link'
  ];

  if (!isMounted) {
    return (
      <div className={cn(
        "min-h-[300px] border rounded-md bg-background",
        className
      )}>
        <div className="flex items-center justify-center h-full text-muted-foreground">
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
        style={{
          minHeight: '300px',
        }}
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          min-height: 300px;
          font-size: 14px;
          font-family: inherit;
        }
        
        .rich-text-editor .ql-editor {
          min-height: 300px;
          padding: 16px;
        }
        
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid hsl(var(--border));
          border-left: 1px solid hsl(var(--border));
          border-right: 1px solid hsl(var(--border));
          border-bottom: none;
          border-radius: 6px 6px 0 0;
          background: hsl(var(--background));
        }
        
        .rich-text-editor .ql-container {
          border-left: 1px solid hsl(var(--border));
          border-right: 1px solid hsl(var(--border));
          border-bottom: 1px solid hsl(var(--border));
          border-top: none;
          border-radius: 0 0 6px 6px;
          background: hsl(var(--background));
        }
        
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        
        .rich-text-editor .ql-snow .ql-picker {
          color: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-snow .ql-picker-options {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
        }
        
        .rich-text-editor .ql-snow .ql-picker-item:hover {
          background: hsl(var(--accent));
        }
        
        .rich-text-editor .ql-snow .ql-tooltip {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
        }
        
        .rich-text-editor .ql-snow .ql-tooltip input {
          background: hsl(var(--background));
          border: 1px solid hsl(var(--border));
          color: hsl(var(--foreground));
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
