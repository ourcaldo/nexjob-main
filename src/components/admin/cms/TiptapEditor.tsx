import React, { useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import CodeBlock from '@tiptap/extension-code-block';
import Blockquote from '@tiptap/extension-blockquote';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Paragraph from '@tiptap/extension-paragraph';
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon,
  Strikethrough,
  List, 
  ListOrdered, 
  Quote, 
  Code as CodeIcon, 
  Link as LinkIcon, 
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
  Type
} from 'lucide-react';

interface TiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  value,
  onChange,
  placeholder = "Enter your content...",
  className = ""
}) => {
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        strike: false,
        code: false,
        codeBlock: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        paragraph: false,
      }),
      Heading.configure({
        levels: [1, 2, 3, 4, 5, 6],
        HTMLAttributes: {
          class: 'tiptap-heading',
        },
      }),
      Paragraph.configure({
        HTMLAttributes: {
          class: 'tiptap-paragraph',
        },
      }),
      Bold.configure({
        HTMLAttributes: {
          class: 'tiptap-bold',
        },
      }),
      Italic.configure({
        HTMLAttributes: {
          class: 'tiptap-italic',
        },
      }),
      Underline.configure({
        HTMLAttributes: {
          class: 'tiptap-underline',
        },
      }),
      Strike.configure({
        HTMLAttributes: {
          class: 'tiptap-strike',
        },
      }),
      Code.configure({
        HTMLAttributes: {
          class: 'tiptap-code',
        },
      }),
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'tiptap-code-block',
        },
      }),
      Blockquote.configure({
        HTMLAttributes: {
          class: 'tiptap-blockquote',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'tiptap-bullet-list',
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'tiptap-ordered-list',
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: 'tiptap-list-item',
        },
      }),
      Link.configure({
        HTMLAttributes: {
          class: 'tiptap-link',
        },
        openOnClick: false,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'tiptap-image',
        },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor focus:outline-none',
        'data-placeholder': placeholder,
      },
    },
  });

  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const insertLink = useCallback(() => {
    if (!editor) return;

    const url = prompt('Enter URL:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;

    const url = prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const togglePreview = useCallback(() => {
    setIsPreviewMode(!isPreviewMode);
  }, [isPreviewMode]);

  const [isToolbarFixed, setIsToolbarFixed] = React.useState(false);
  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const editorContainerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleScroll = () => {
      if (toolbarRef.current && editorContainerRef.current) {
        const editorRect = editorContainerRef.current.getBoundingClientRect();
        const shouldFix = editorRect.top < 0 && editorRect.bottom > 60;
        setIsToolbarFixed(shouldFix);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!editor) {
    return null;
  }

  return (
    <div ref={editorContainerRef} className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div 
        ref={toolbarRef}
        className={`${
          isToolbarFixed 
            ? 'fixed top-0 left-0 right-0 z-50' 
            : 'sticky top-0 z-10'
        } bg-gray-50 border-b border-gray-300 p-3 flex flex-wrap gap-2 shadow-sm transition-all duration-200`}
        style={isToolbarFixed ? { 
          width: toolbarRef.current?.parentElement?.offsetWidth || 'auto',
          marginLeft: toolbarRef.current?.parentElement?.getBoundingClientRect().left || 0
        } : {}}
      >
        {/* Heading Dropdown */}
        <div className="relative">
          <select
            onChange={(e) => {
              const value = e.target.value;
              if (value === 'paragraph') {
                editor.chain().focus().setParagraph().run();
              } else {
                const level = parseInt(value) as 1 | 2 | 3 | 4 | 5 | 6;
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            className="px-3 py-1 border border-gray-300 rounded text-sm bg-white"
            disabled={isPreviewMode}
            value={
              editor.isActive('heading', { level: 1 }) ? '1' :
              editor.isActive('heading', { level: 2 }) ? '2' :
              editor.isActive('heading', { level: 3 }) ? '3' :
              editor.isActive('heading', { level: 4 }) ? '4' :
              editor.isActive('heading', { level: 5 }) ? '5' :
              editor.isActive('heading', { level: 6 }) ? '6' :
              'paragraph'
            }
          >
            <option value="paragraph">Paragraph</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="4">Heading 4</option>
            <option value="5">Heading 5</option>
            <option value="6">Heading 6</option>
          </select>
        </div>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Text Formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bold') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Bold"
          disabled={isPreviewMode}
        >
          <BoldIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('italic') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Italic"
          disabled={isPreviewMode}
        >
          <ItalicIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('underline') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Underline"
          disabled={isPreviewMode}
        >
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('strike') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Strikethrough"
          disabled={isPreviewMode}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Alignment */}
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Align Left"
          disabled={isPreviewMode}
        >
          <AlignLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Align Center"
          disabled={isPreviewMode}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Align Right"
          disabled={isPreviewMode}
        >
          <AlignRight className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Lists */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('bulletList') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Bullet List"
          disabled={isPreviewMode}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('orderedList') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Numbered List"
          disabled={isPreviewMode}
        >
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Special Elements */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('blockquote') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Quote"
          disabled={isPreviewMode}
        >
          <Quote className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('code') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Inline Code"
          disabled={isPreviewMode}
        >
          <CodeIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-2 rounded transition-colors ${
            editor.isActive('codeBlock') ? 'bg-primary-200 text-primary-800' : 'hover:bg-gray-200'
          }`}
          title="Code Block"
          disabled={isPreviewMode}
        >
          <CodeIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Link"
          disabled={isPreviewMode}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 hover:bg-gray-200 rounded transition-colors"
          title="Insert Image"
          disabled={isPreviewMode}
        >
          <ImageIcon className="h-4 w-4" />
        </button>

        <div className="w-px bg-gray-300 mx-1"></div>

        {/* Preview Toggle */}
        <button
          type="button"
          onClick={togglePreview}
          className={`p-2 rounded transition-colors ${
            isPreviewMode 
              ? 'bg-primary-100 text-primary-700 hover:bg-primary-200' 
              : 'hover:bg-gray-200'
          }`}
          title={isPreviewMode ? "Edit Mode" : "Preview Mode"}
        >
          {isPreviewMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {/* Editor Content */}
      <div className="relative">
        {isPreviewMode ? (
          /* Preview Mode */
          <div className="p-4 min-h-[400px] bg-white">
            <div 
              className="cms-content prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: value }}
            />
          </div>
        ) : (
          /* Visual Editor */
          <div className="p-4 min-h-[400px] bg-white tiptap-container">
            <EditorContent editor={editor} />
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-gray-50 border-t border-gray-300 px-4 py-2 text-xs text-gray-600">
        {isPreviewMode ? 'Preview Mode' : 'Visual Editor'} | 
        Characters: {value.replace(/<[^>]*>/g, '').length}
      </div>

      {/* Tiptap Styles */}
      <style jsx global>{`
        .tiptap-container .ProseMirror {
          outline: none;
          min-height: 350px;
        }

        .tiptap-container .ProseMirror[data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
          pointer-events: none;
          height: 0;
          float: left;
        }

        /* Tiptap Editor Styles */
        .tiptap-container .tiptap-heading {
          font-weight: bold !important;
          margin: 0.5em 0 !important;
          color: #1f2937 !important;
        }

        .tiptap-container h1.tiptap-heading {
          font-size: 2em !important;
          margin: 0.67em 0 !important;
        }

        .tiptap-container h2.tiptap-heading {
          font-size: 1.5em !important;
          margin: 0.75em 0 !important;
        }

        .tiptap-container h3.tiptap-heading {
          font-size: 1.17em !important;
          margin: 0.83em 0 !important;
        }

        .tiptap-container h4.tiptap-heading {
          font-size: 1em !important;
          margin: 1.12em 0 !important;
        }

        .tiptap-container h5.tiptap-heading {
          font-size: 0.83em !important;
          margin: 1.5em 0 !important;
        }

        .tiptap-container h6.tiptap-heading {
          font-size: 0.75em !important;
          margin: 1.67em 0 !important;
        }

        .tiptap-container .tiptap-paragraph {
          margin: 1em 0 !important;
          line-height: 1.6 !important;
        }

        .tiptap-container .tiptap-bold {
          font-weight: bold !important;
        }

        .tiptap-container .tiptap-italic {
          font-style: italic !important;
        }

        .tiptap-container .tiptap-underline {
          text-decoration: underline !important;
        }

        .tiptap-container .tiptap-strike {
          text-decoration: line-through !important;
        }

        .tiptap-container .tiptap-code {
          font-family: monospace !important;
          background: #f3f4f6 !important;
          padding: 0.125rem 0.25rem !important;
          border-radius: 0.25rem !important;
          font-size: 0.875em !important;
          color: #dc2626 !important;
        }

        .tiptap-container .tiptap-code-block {
          font-family: monospace !important;
          background: #f3f4f6 !important;
          padding: 1rem !important;
          border-radius: 0.375rem !important;
          margin: 1rem 0 !important;
          border: 1px solid #d1d5db !important;
          color: #374151 !important;
          white-space: pre !important;
          overflow-x: auto !important;
        }

        .tiptap-container .tiptap-blockquote {
          border-left: 4px solid #e5e7eb !important;
          padding-left: 1rem !important;
          margin: 1rem 0 !important;
          font-style: italic !important;
          color: #6b7280 !important;
          background-color: #f9fafb !important;
          padding: 1rem !important;
          border-radius: 0 0.375rem 0.375rem 0 !important;
        }

        .tiptap-container .tiptap-bullet-list,
        .tiptap-container .tiptap-ordered-list {
          margin: 1rem 0 !important;
          padding-left: 1.5rem !important;
        }

        .tiptap-container .tiptap-bullet-list {
          list-style-type: disc !important;
        }

        .tiptap-container .tiptap-ordered-list {
          list-style-type: decimal !important;
        }

        .tiptap-container .tiptap-list-item {
          margin: 0.25rem 0 !important;
          line-height: 1.6 !important;
        }

        .tiptap-container .tiptap-link {
          color: #2563eb !important;
          text-decoration: underline !important;
        }

        .tiptap-container .tiptap-link:hover {
          color: #1d4ed8 !important;
        }

        .tiptap-container .tiptap-image {
          max-width: 100% !important;
          height: auto !important;
          margin: 1rem 0 !important;
          border-radius: 0.375rem !important;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;