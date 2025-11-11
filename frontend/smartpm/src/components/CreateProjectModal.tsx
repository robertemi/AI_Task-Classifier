import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
    if (!user) {
      setError('You must be logged in to create a project.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://ai-task-classifier.onrender.com/index/project', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          name,
          description,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }

      onProjectCreated();
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
        <h2 className="text-white text-2xl font-bold mb-6">Create New Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm rounded-xl px-4"
              required
            />
            <textarea
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm"
              rows={4}
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className="text-gray-300 hover:bg-white/10 hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white">
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
