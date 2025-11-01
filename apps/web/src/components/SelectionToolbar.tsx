
import { Activity, Download, Share2, Trash2 } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  onDownload: () => void;
  onShare: () => void;
  onDelete: () => void;
}

export const SelectionToolbar = ({ selectedCount, onDownload, onShare, onDelete }: SelectionToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white animate-in slide-in-from-bottom-5 fixed bottom-8 left-1/2 z-30 flex -translate-x-1/2 transform items-center space-x-4 rounded-2xl px-6 py-4 shadow-2xl'>
      <div className="flex items-center gap-3">
        <div className="bg-white/20 rounded-full p-2">
          <Activity className="h-4 w-4" />
        </div>
        <span className='text-sm font-semibold'>
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </span>
      </div>
      <div className='flex items-center space-x-2'>
        <button onClick={onDownload} className='hover:bg-white/20 rounded-xl p-2.5'>
          <Download className='h-4 w-4' />
        </button>
        <button onClick={onShare} className='hover:bg-white/20 rounded-xl p-2.5'>
          <Share2 className='h-4 w-4' />
        </button>
        <button onClick={onDelete} className='hover:bg-red-500/20 rounded-xl p-2.5'>
          <Trash2 className='h-4 w-4' />
        </button>
      </div>
    </div>
  );
};