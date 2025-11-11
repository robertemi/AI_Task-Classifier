import { Trash2, Pencil } from 'lucide-react'; // Import Pencil icon

interface ProjectContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}

export function ProjectContextMenu({ isOpen, position, onClose, onDelete, onEdit }: ProjectContextMenuProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed top-0 left-0 w-full h-full z-50"
      onClick={onClose}
      onContextMenu={(e) => {
        e.preventDefault();
        onClose();
      }}
    >
      <div
        className="absolute bg-gray-800 border border-white/20 rounded-lg shadow-lg p-2 z-50 animate-in fade-in-5 zoom-in-95"
        style={{ top: position.y, left: position.x }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => { onEdit(); onClose(); }}
          className="flex items-center w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/10 rounded-md transition-colors"
        >
          <Pencil className="w-4 h-4 mr-2" />
          Edit Project
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="flex items-center w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors mt-1"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Project
        </button>
      </div>
    </div>
  );
}
