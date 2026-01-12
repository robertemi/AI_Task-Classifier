import { useEffect, useState } from 'react';
import { X, Trash2, Pencil } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    ai_description?: string;
    story_points?: number;
    status: "todo" | "in_progress" | "in_review" | "done";
}

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskDeleted: () => void;
  onEdit: (task: Task) => void;
  task: Task | null;
}

export function TaskDetailsModal({ isOpen, onClose, onTaskDeleted, onEdit, task }: TaskDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setError(null);
      setLoading(false);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleDelete = async () => {
    if (!task) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ai-task-classifier.onrender.com/index/delete/task', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: task.id,
          projectId: task.project_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete task');
      }

      onTaskDeleted();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    if (task) {
      onEdit(task);
      onClose();
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className="group relative bg-black/30 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-lg w-full max-w-2xl m-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-purple-500/5 transition-all duration-300" />
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-10">
          <X size={24} />
        </button>
        <h2 className="relative z-10 text-white text-2xl font-bold mb-4">{task.title}</h2>

        <div className="relative z-10 space-y-6">
            <div>
                <h3 className="text-purple-300 font-semibold mb-2">User Description</h3>
                <p className="text-gray-300 bg-white/5 p-3 rounded-lg">{task.description || "No description provided."}</p>
            </div>

            {task.ai_description && (
                <div>
                    <h3 className="text-indigo-300 font-semibold mb-2">AI Generated Description</h3>
                    <div className="text-indigo-200 bg-white/5 p-4 rounded-lg max-h-60 overflow-y-auto">
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold mb-2 text-indigo-100" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold mb-2 text-indigo-100" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-md font-bold mb-1 text-indigo-200" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                                li: ({node, ...props}) => <li className="text-indigo-200/90" {...props} />,
                                p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-indigo-100" {...props} />,
                                em: ({node, ...props}) => <em className="italic text-indigo-300" {...props} />,
                                code: ({node, ...props}) => <code className="bg-black/30 px-1 py-0.5 rounded text-sm font-mono text-indigo-200" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500/50 pl-4 italic my-2 text-indigo-300/80" {...props} />,
                            }}
                        >
                            {task.ai_description}
                        </ReactMarkdown>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-end pt-4">
                <div className="flex gap-8 items-start">
                    <div>
                        <h3 className="text-gray-400 font-semibold mb-2">Status</h3>
                        <p className="text-white capitalize bg-white/10 px-3 py-1 rounded-full text-sm">{task.status}</p>
                    </div>
                    <div>
                        <h3 className="text-gray-400 font-semibold mb-2">Story Points</h3>
                        <p className="text-white text-2xl font-bold">{task.story_points || 'N/A'}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={handleEditClick} className="text-gray-400 hover:text-white transition-colors">
                        <Pencil size={20} />
                    </button>
                    <button onClick={handleDelete} disabled={loading} className="text-red-400 hover:text-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading ? 'Deleting...' : <Trash2 size={20} />}
                    </button>
                </div>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}
