// components/Toolbar/Toolbar.tsx
import React from 'react';
import {
    Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Link, Image, Undo, Redo, Printer, Palette,
    MessageCircle, MoreHorizontal
} from 'lucide-react';
import { FontFamily, TextAlignment } from '../types';

interface ToolbarProps {
    execCommand: (command: string, value?: string) => void;
    activeFormats: Set<string>;
    currentAlignment: TextAlignment;
    fontFamily: FontFamily;
    setFontFamily: (font: FontFamily) => void;
    fontSize: string;
    setFontSize: (size: string) => void;
    toggleList: (type: 'unordered' | 'ordered') => void;
    insertLink: () => void;
    insertImage: () => void;
    editorRef: React.RefObject<HTMLDivElement | null>;
    toggleComments?: () => void;
    showComments?: boolean;
}

interface ToolbarButtonProps {
    icon: React.ComponentType<{ size?: number }>;
    active?: boolean;
    onClick: () => void;
    title: string;
    'aria-label'?: string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    icon: Icon,
    active = false,
    onClick,
    title,
    'aria-label': ariaLabel
}) => (
    <button
        className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${active
            ? 'bg-blue-100 text-blue-700 shadow-sm'
            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-800'
            }`}
        onClick={onClick}
        title={title}
        aria-label={ariaLabel || title}
        aria-pressed={active}
    >
        <Icon size={18} />
    </button>
);

const Separator: React.FC = () => (
    <div className="w-px h-6 bg-gray-300 mx-1" role="separator" aria-orientation="vertical" />
);

export const Toolbar: React.FC<ToolbarProps> = ({
    execCommand,
    activeFormats,
    currentAlignment,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    toggleList,
    insertLink,
    insertImage,
    toggleComments,
    showComments,
    editorRef
}) => {
    const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

    const fontFamilies: FontFamily[] = [
        'Arial',
        'Helvetica',
        'Times New Roman',
        'Georgia',
        'Verdana'
    ];

    const handleFontFamilyChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const newFamily = event.target.value as FontFamily;
        setFontFamily(newFamily);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            execCommand('fontName', newFamily);
        } else if (editorRef.current) {
            editorRef.current.style.fontFamily = newFamily;
        }
    };

    const handleFontSizeChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
        const newSize = event.target.value;
        setFontSize(newSize);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            execCommand('fontSize', newSize);
        } else if (editorRef.current) {
            editorRef.current.style.fontSize = `${newSize}pt`;
        }
    };

    const handleUndo = (): void => execCommand('undo');
    const handleRedo = (): void => execCommand('redo');
    const handlePrint = (): void => window.print();
    const handleBold = (): void => execCommand('bold');
    const handleItalic = (): void => execCommand('italic');
    const handleUnderline = (): void => execCommand('underline');
    const handleAlignLeft = (): void => execCommand('justifyLeft');
    const handleAlignCenter = (): void => execCommand('justifyCenter');
    const handleAlignRight = (): void => execCommand('justifyRight');
    const handleAlignJustify = (): void => execCommand('justifyFull');
    const handleBulletList = (): void => toggleList('unordered');
    const handleNumberedList = (): void => toggleList('ordered');

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center space-x-1" role="toolbar" aria-label="Formatting toolbar">
                {/* History Controls */}
                <div className="flex items-center space-x-1">
                    <ToolbarButton
                        icon={Undo}
                        onClick={handleUndo}
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo last action"
                    />
                    <ToolbarButton
                        icon={Redo}
                        onClick={handleRedo}
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo last action"
                    />
                    <ToolbarButton
                        icon={Printer}
                        onClick={handlePrint}
                        title="Print (Ctrl+P)"
                        aria-label="Print document"
                    />
                </div>

                <Separator />

                {/* Font Controls */}
                <div className="flex items-center space-x-1">
                    <select
                        value={fontFamily}
                        onChange={handleFontFamilyChange}
                        className="px-3 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        aria-label="Font family"
                    >
                        {fontFamilies.map(font => (
                            <option key={font} value={font}>{font}</option>
                        ))}
                    </select>

                    <select
                        value={fontSize}
                        onChange={handleFontSizeChange}
                        className="px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-16"
                        aria-label="Font size"
                    >
                        {fontSizes.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                <Separator />

                {/* Text Formatting */}
                <div className="flex items-center space-x-1">
                    <ToolbarButton
                        icon={Bold}
                        active={activeFormats.has('bold')}
                        onClick={handleBold}
                        title="Bold (Ctrl+B)"
                        aria-label="Bold text"
                    />
                    <ToolbarButton
                        icon={Italic}
                        active={activeFormats.has('italic')}
                        onClick={handleItalic}
                        title="Italic (Ctrl+I)"
                        aria-label="Italic text"
                    />
                    <ToolbarButton
                        icon={Underline}
                        active={activeFormats.has('underline')}
                        onClick={handleUnderline}
                        title="Underline (Ctrl+U)"
                        aria-label="Underline text"
                    />
                </div>

                <Separator />

                {/* Alignment */}
                <div className="flex items-center space-x-1" role="group" aria-label="Text alignment">
                    <ToolbarButton
                        icon={AlignLeft}
                        active={currentAlignment === 'left'}
                        onClick={handleAlignLeft}
                        title="Align left"
                        aria-label="Align text left"
                    />
                    <ToolbarButton
                        icon={AlignCenter}
                        active={currentAlignment === 'center'}
                        onClick={handleAlignCenter}
                        title="Align center"
                        aria-label="Align text center"
                    />
                    <ToolbarButton
                        icon={AlignRight}
                        active={currentAlignment === 'right'}
                        onClick={handleAlignRight}
                        title="Align right"
                        aria-label="Align text right"
                    />
                    <ToolbarButton
                        icon={AlignJustify}
                        active={currentAlignment === 'justify'}
                        onClick={handleAlignJustify}
                        title="Justify"
                        aria-label="Justify text"
                    />
                </div>

                <Separator />

                {/* Lists */}
                <div className="flex items-center space-x-1" role="group" aria-label="Lists">
                    <ToolbarButton
                        icon={List}
                        onClick={handleBulletList}
                        active={activeFormats.has('unorderedList')}
                        title="Bullet list"
                        aria-label="Insert bullet list"
                    />
                    <ToolbarButton
                        icon={ListOrdered}
                        onClick={handleNumberedList}
                        active={activeFormats.has('orderedList')}
                        title="Numbered list"
                        aria-label="Insert numbered list"
                    />
                </div>

                <Separator />

                {/* Insert */}
                <div className="flex items-center space-x-1" role="group" aria-label="Insert content">
                    <ToolbarButton
                        icon={Link}
                        onClick={insertLink}
                        title="Insert link"
                        aria-label="Insert hyperlink"
                    />
                    <ToolbarButton
                        icon={Image}
                        onClick={insertImage}
                        title="Insert image"
                        aria-label="Insert image"
                    />
                    <ToolbarButton
                        icon={Palette}
                        onClick={() => { }}
                        title="Text color"
                        aria-label="Change text color"
                    />
                </div>

                <Separator />

                {/* More Tools */}
                <div className="flex items-center space-x-1">
                    <ToolbarButton
                        icon={MessageCircle}
                        onClick={toggleComments || (() => {})}
                        active={showComments}
                        title={showComments ? "Hide comments" : "Show comments"}
                        aria-label={showComments ? "Hide comments" : "Show comments"}
                    />
                    <ToolbarButton
                        icon={MoreHorizontal}
                        onClick={() => { }}
                        title="More options"
                        aria-label="More formatting options"
                    />
                </div>
            </div>
        </div>
    );
};