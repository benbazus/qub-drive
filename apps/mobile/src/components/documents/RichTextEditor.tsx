import React, { useRef, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor';
import { RichTextEditorState, DocumentToolbarAction } from '../../types/document';

interface RichTextEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  onSelectionChange?: (selection: { start: number; end: number }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  readOnly?: boolean;
  showToolbar?: boolean;
  customActions?: DocumentToolbarAction[];
  style?: any;
  editorStyle?: any;
  toolbarStyle?: any;
  minHeight?: number;
  maxHeight?: number;
}

export interface RichTextEditorRef {
  getContent: () => Promise<string>;
  setContent: (content: string) => void;
  insertText: (text: string) => void;
  insertHTML: (html: string) => void;
  focus: () => void;
  blur: () => void;
  undo: () => void;
  redo: () => void;
  getState: () => RichTextEditorState;
}

const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  initialContent = '',
  placeholder = 'Start typing...',
  onChange,
  onSelectionChange,
  onFocus,
  onBlur,
  readOnly = false,
  showToolbar = true,
  customActions = [],
  style,
  editorStyle,
  toolbarStyle,
  minHeight = 200,
  maxHeight
}, ref) => {
  const richTextRef = useRef<RichEditor>(null);
  // Removed unused width

  // Default toolbar actions
  const defaultActions = [
    actions.undo,
    actions.redo,
    actions.setBold,
    actions.setItalic,
    actions.setUnderline,
    actions.heading1,
    actions.heading2,
    actions.heading3,
    actions.setParagraph,
    actions.insertBulletsList,
    actions.insertOrderedList,
    actions.alignLeft,
    actions.alignCenter,
    actions.alignRight,
    actions.alignFull,
    actions.insertLink,
    actions.removeFormat,
    actions.keyboard
  ];

  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    getContent: async () => {
      if (richTextRef.current) {
        return await richTextRef.current.getContentHtml();
      }
      return '';
    },
    setContent: (content: string) => {
      if (richTextRef.current) {
        richTextRef.current.setContentHTML(content);
      }
    },
    insertText: (text: string) => {
      if (richTextRef.current) {
        richTextRef.current.insertText(text);
      }
    },
    insertHTML: (html: string) => {
      if (richTextRef.current) {
        richTextRef.current.insertHTML(html);
      }
    },
    focus: () => {
      if (richTextRef.current) {
        richTextRef.current.focusContentEditor();
      }
    },
    blur: () => {
      if (richTextRef.current) {
        richTextRef.current.blurContentEditor();
      }
    },
    undo: () => {
      if (richTextRef.current) {
        richTextRef.current.sendAction(actions.undo, 'result');
      }
    },
    redo: () => {
      if (richTextRef.current) {
        richTextRef.current.sendAction(actions.redo, 'result');
      }
    },
    getState: () => {
      // This would need to be implemented based on the current editor state
      return {
        content: '',
        formatting: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: 16,
          fontFamily: 'System',
          textAlign: 'left',
          textColor: '#000000',
          backgroundColor: '#ffffff'
        }
      };
    }
  }), []);

  const handleContentChange = useCallback((content: string) => {
    onChange?.(content);
  }, [onChange]);

  const handleSelectionChange = useCallback((data: unknown) => {
    if (onSelectionChange && data.selection) {
      onSelectionChange(data.selection);
    }
  }, [onSelectionChange]);

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    onBlur?.();
  }, [onBlur]);

  // Custom action handlers (currently unused but kept for future use)
  // const handleCustomAction = useCallback((action: DocumentToolbarAction) => {
  //   action.action();
  // }, []);

  // Editor styles
  const editorStyles = {
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '16px',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    lineHeight: '1.5',
    padding: '16px',
    minHeight: `${minHeight}px`,
    ...(maxHeight && { maxHeight: `${maxHeight}px` }),
    ...editorStyle
  };

  useEffect(() => {
    // Set initial content when component mounts
    if (initialContent && richTextRef.current) {
      richTextRef.current.setContentHTML(initialContent);
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      {showToolbar && !readOnly && (
        <RichToolbar
          editor={richTextRef}
          actions={defaultActions}
          iconTint="#000000"
          selectedIconTint="#2095F2"
          selectedButtonStyle={styles.selectedButton}
          style={[styles.toolbar, toolbarStyle]}
          flatContainerStyle={styles.toolbarContainer}
        />
      )}
      
      <RichEditor
        ref={richTextRef}
        style={[styles.editor, { minHeight }]}
        editorStyle={editorStyles}
        placeholder={placeholder}
        onChange={handleContentChange}
        onCursorPosition={handleSelectionChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={readOnly}
        useContainer={true}
        initialContentHTML={initialContent}
        pasteAsPlainText={false}
        editorInitializedCallback={() => {
          // Editor is ready
          if (initialContent && richTextRef.current) {
            richTextRef.current.setContentHTML(initialContent);
          }
        }}
      />

      {/* Custom actions toolbar */}
      {customActions.length > 0 && (
        <View style={styles.customActionsContainer}>
          {customActions.map((action) => (
            <View key={action.id} style={styles.customAction}>
              {/* Custom action implementation would go here */}
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  toolbar: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    minHeight: 50,
  },
  toolbarContainer: {
    paddingHorizontal: 12,
  },
  selectedButton: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  editor: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  customActionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  customAction: {
    marginRight: 12,
  },
});

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;