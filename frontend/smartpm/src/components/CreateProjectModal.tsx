import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useTheme } from '@/hooks/useTheme'; // Import the useTheme hook

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: () => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const { user } = useAuth();
  const { theme } = useTheme(); // Use the theme hook
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      setError('You must be logged in to create a project.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/index/project', {
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

  // Conditional classes based on theme
  const modalBgClass = theme === 'dark' ? 'bg-gray-900/80 border-white/20' : 'bg-white border-gray-300';
  const titleColorClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const inputClasses = theme === 'dark'
    ? 'bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20'
    : 'bg-gray-100 text-gray-900 border-gray-300 placeholder:text-gray-500 focus:ring-blue-500/50 focus:bg-gray-200';
  const cancelButtonClasses = theme === 'dark' ? 'text-gray-300 hover:bg-white/10 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900';

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className={`rounded-2xl p-8 shadow-2xl w-full max-w-md m-4 ${modalBgClass}`}>
        <h2 className={`text-2xl font-bold mb-6 ${titleColorClass}`}>Create New Project</h2>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              ref={titleRef}
              type="text"
              placeholder="Project Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleTitleKeyDown}
              className={`w-full transition-all text-sm rounded-xl px-4 py-2 ${inputClasses}`}
              required
            />
            <textarea
              ref={descriptionRef}
              placeholder="Project Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              className={`w-full rounded-xl px-4 py-2 outline-none focus:ring-2 transition-all text-sm ${inputClasses}`}
              rows={4}
            />
          </div>
          {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
          <div className="flex justify-end gap-4 mt-6">
            <Button type="button" variant="ghost" onClick={onClose} className={cancelButtonClasses}>
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
