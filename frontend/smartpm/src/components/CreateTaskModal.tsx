import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronDown } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projectId: string;
  status: "todo" | "inProgress" | "inReview" | "done" | "none";
}

const model_providers = {
    '1' : 'Deepseek (3.1)',
    '2' : 'OpenAI (gpt-oss-20b)',
    '3' : 'Meta-Llama (llama-3.3-8b-instruct)'

};

// Mapping from frontend status to backend status
const statusMap = {
    todo: 'todo',
    inProgress: 'in_progress',
    inReview: 'in_review',
    done: 'done',
    none: 'todo',
};

export function CreateTaskModal({ isOpen, onClose, onTaskCreated, projectId, status }: CreateTaskModalProps) {
  const [task_title, setTaskTitle] = useState('');
  const [user_description, setUserDescription] = useState('');
  const [model, setModel] = useState('1');
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
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const backendStatus = statusMap[status] || 'todo';

    try {
      const response = await fetch('https://ai-task-classifier.onrender.com/index/task/enrich_and_index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          task_title,
          user_description,
          selected_model: parseInt(model, 10),
          status: backendStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create task');
      }

      onTaskCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className="bg-gray-900/80 border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md m-4">
        <h2 className="text-white text-2xl font-bold mb-6">Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Task Title"
              value={task_title}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm rounded-xl px-4"
              required
            />
            <textarea
              placeholder="Task Description"
              value={user_description}
              onChange={(e) => setUserDescription(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm"
              rows={4}
            />
            <div>
              <label htmlFor="model-provider" className="block text-sm font-medium text-gray-300 mb-2">AI Model Provider</label>
              <div className="relative">
                <select
                  id="model-provider"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm appearance-none pr-8"
                >
                  {Object.entries(model_providers).map(([id, name]) => (
                    <option key={id} value={id} className="bg-gray-800 text-white">
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-300 hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
