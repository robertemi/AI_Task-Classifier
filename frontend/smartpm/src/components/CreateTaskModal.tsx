import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useTheme } from '@/hooks/useTheme';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projectId: string;
  status: "todo" | "inProgress" | "inReview" | "done" | "none";
}

const model_providers = {
    '1' : 'Grok (4.1)',
    '2' : 'NVIDIA: Nemotron Nano',
    '3' : 'Deepseek R1'
};

const statusMap = {
    todo: 'todo',
    inProgress: 'in_progress',
    inReview: 'in_review',
    done: 'done',
    none: 'todo',
};

export function CreateTaskModal({ isOpen, onClose, onTaskCreated, projectId, status }: CreateTaskModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [task_title, setTaskTitle] = useState('');
  const [user_description, setUserDescription] = useState('');
  const [model, setModel] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (isOpen) {
      titleRef.current?.focus();
    }
  }, [isOpen]);

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

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      descriptionRef.current?.focus();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("User not authenticated.");
      return;
    }

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
          userId: user.id,
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

  // Conditional classes based on theme
  const modalBgClass = theme === 'dark' ? 'bg-gray-900/80 border-white/20' : 'bg-white border-gray-300';
  const titleColorClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputClasses = theme === 'dark'
    ? 'bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20'
    : 'bg-gray-100 text-gray-900 border-gray-300 placeholder:text-gray-500 focus:ring-blue-500/50 focus:bg-gray-200';
  const labelColorClass = theme === 'dark' ? 'text-gray-300' : 'text-gray-700';
  const selectClasses = theme === 'dark'
    ? 'bg-white/10 text-white border-white/20'
    : 'bg-gray-100 text-gray-900 border-gray-300';
  const optionClasses = theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900';
  const chevronColorClass = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cancelButtonClasses = theme === 'dark' ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';


  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className={`rounded-2xl p-8 shadow-2xl w-full max-w-md m-4 ${modalBgClass}`}>
        <h2 className={`text-2xl font-bold mb-6 ${titleColorClass}`}>Create New Task</h2>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              ref={titleRef}
              type="text"
              placeholder="Task Title"
              value={task_title}
              onChange={(e) => setTaskTitle(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className={`w-full transition-all text-sm rounded-xl px-4 py-2 ${inputClasses}`}
              required
            />
            <textarea
              ref={descriptionRef}
              placeholder="Task Description"
              value={user_description}
              onChange={(e) => setUserDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              className={`w-full rounded-xl px-4 py-2 outline-none focus:ring-2 transition-all text-sm ${inputClasses}`}
              rows={4}
            />
            <div>
              <label htmlFor="model-provider" className={`block text-sm font-medium mb-2 ${labelColorClass}`}>AI Model Provider</label>
              <div className="relative">
                <select
                  id="model-provider"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className={`w-full rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 transition-all text-sm appearance-none pr-8 ${selectClasses}`}
                >
                  {Object.entries(model_providers).map(([id, name]) => (
                    <option key={id} value={id} className={optionClasses}>
                      {name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown className={`h-4 w-4 ${chevronColorClass}`} />
                </div>
              </div>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className={cancelButtonClasses}>
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
