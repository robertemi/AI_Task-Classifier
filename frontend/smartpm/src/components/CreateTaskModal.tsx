import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  projectId: string;
}

export function CreateTaskModal({ isOpen, onClose, onTaskCreated, projectId }: CreateTaskModalProps) {
  const [task_title, setTaskTitle] = useState('');
  const [user_description, setUserDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://1311f8253fec.ngrok-free.app/index/task/enrich_and_index', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId,
          task_title,
          user_description,
          status: "todo",
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900/80 border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md m-4">
        <h2 className="text-white text-2xl font-bold mb-6">Create New Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Task Title"
              value={task_title}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all"
              required
            />
            <textarea
              placeholder="Task Description"
              value={user_description}
              onChange={(e) => setUserDescription(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all"
              rows={4}
            />
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
