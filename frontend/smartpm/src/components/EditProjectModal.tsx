import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '@/context/AuthProvider';

interface Project {
    id: string;
    name: string;
    description: string;
    user_id: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectEdited: () => void;
  project: Project | null;
}

export function EditProjectModal({ isOpen, onClose, onProjectEdited, project }: EditProjectModalProps) {
  const { user } = useAuth();
  const [newName, setNewName] = useState(project?.name || '');
  const [newDescription, setNewDescription] = useState(project?.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project) {
      setNewName(project.name);
      setNewDescription(project.description);
    }
  }, [project]);

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

    if (!user || !user.id) {
      setError("User not authenticated.");
      return;
    }
    if (!project) {
      setError("No project selected for editing.");
      return;
    }

    const trimmedNewName = newName.trim();
    const trimmedNewDescription = newDescription.trim();

    const isNameChanged = trimmedNewName !== project.name;
    const isDescriptionChanged = trimmedNewDescription !== project.description;

    if (!isNameChanged && !isDescriptionChanged) {
      setError("No changes detected. Please modify the title or description.");
      return;
    }

    setLoading(true);
    setError(null);

    const updatePayload: { projectId: string; userId: string; name?: string; description?: string } = {
      projectId: project.id,
      userId: user.id,
    };

    if (isNameChanged) {
      updatePayload.name = trimmedNewName;
    }
    if (isDescriptionChanged) {
      updatePayload.description = trimmedNewDescription;
    }

    try {
      const response = await fetch('http://localhost:8000/index/edit/project', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to edit project');
      }

      onProjectEdited();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !project) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className="bg-gray-900/80 border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md m-4">
        <h2 className="text-white text-2xl font-bold mb-6">Edit Project</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="text"
              placeholder="Project Title"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm rounded-xl px-4"
              required
            />
            <textarea
              placeholder="Project Description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
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
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
