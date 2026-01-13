import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabaseClient';

interface Task {
    id: string;
    project_id: string;
    title: string;
    description: string;
    ai_description?: string;
    story_points?: number;
    status: "todo" | "in_progress" | "in_review" | "done";
}

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskEdited: () => void;
  task: Task | null;
}

export function EditTaskModal({ isOpen, onClose, onTaskEdited, task }: EditTaskModalProps) {
  const { user } = useAuth();
  const [newTitle, setNewTitle] = useState(task?.title || '');
  const [newUserDescription, setNewUserDescription] = useState(task?.description || '');
  const [newAiDescription, setNewAiDescription] = useState(task?.ai_description || '');
  const [newStoryPoints, setNewStoryPoints] = useState<number | undefined>(task?.story_points);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setNewTitle(task.title);
      setNewUserDescription(task.description);
      setNewAiDescription(task.ai_description || '');
      setNewStoryPoints(task.story_points);
    }
  }, [task]);

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


    if (!task) {
      setError("No task selected for editing.");
      return;
    }

    const trimmedNewTitle = newTitle.trim();
    const trimmedNewUserDescription = newUserDescription.trim();
    const trimmedNewAiDescription = newAiDescription.trim();

    const isTitleChanged = trimmedNewTitle !== task.title;
    const isUserDescriptionChanged = trimmedNewUserDescription !== task.description;
    const isAiDescriptionChanged = trimmedNewAiDescription !== (task.ai_description || '');
    const isStoryPointsChanged = newStoryPoints !== task.story_points;

    if (!isTitleChanged && !isUserDescriptionChanged && !isAiDescriptionChanged && !isStoryPointsChanged) {
      setError("No changes detected. Please modify the title, user description, AI description, or story points.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
        // Update story points directly via Supabase if changed
        if (isStoryPointsChanged) {
            const { error: spError } = await supabase
                .from('tasks')
                .update({ story_points: newStoryPoints ?? 0 })
                .eq('id', task.id);
            
            if (spError) throw spError;
        }

        // If other fields changed, call the backend
        if (isTitleChanged || isUserDescriptionChanged || isAiDescriptionChanged) {
            const updatePayload: { 
                taskId: string; 
                projectId: string; 
                task_title?: string; 
                user_description?: string; 
                ai_description?: string; 
                userId: string 
            } = {
              taskId: task.id,
              projectId: task.project_id,
              userId: user!.id,
            };

            if (isTitleChanged) {
              updatePayload.task_title = trimmedNewTitle;
            }
            if (isUserDescriptionChanged) {
              updatePayload.user_description = trimmedNewUserDescription;
            }
            if (isAiDescriptionChanged) {
              updatePayload.ai_description = trimmedNewAiDescription;
            }

            const response = await fetch('https://ai-task-classifier.onrender.com/index/edit/task', {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatePayload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (response.status !== 404 || !errorData.detail || !errorData.detail.includes("not found")) {
                    throw new Error(errorData.detail || 'Failed to edit task');
                }
            }
        }

      onTaskEdited();
      onClose();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div onClick={(e) => e.stopPropagation()} className="bg-gray-900/80 border border-white/20 rounded-2xl p-8 shadow-2xl w-full max-w-md m-4">
        <h2 className="text-white text-2xl font-bold mb-6">Edit Task</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm font-medium ml-1">Task Title</label>
                <Input
                  type="text"
                  placeholder="Task Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm rounded-xl px-4"
                  required
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm font-medium ml-1">User Description</label>
                <textarea
                  placeholder="User Description"
                  value={newUserDescription}
                  onChange={(e) => setNewUserDescription(e.target.value)}
                  className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm"
                  rows={4}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm font-medium ml-1">AI Description</label>
                <textarea
                  placeholder="AI Description"
                  value={newAiDescription}
                  onChange={(e) => setNewAiDescription(e.target.value)}
                  className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm"
                  rows={4}
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-gray-400 text-sm font-medium ml-1">Story Points</label>
                <Input
                    type="number"
                    placeholder="Story Points"
                    value={newStoryPoints || ''}
                    onChange={(e) => setNewStoryPoints(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full bg-white/10 text-white border-white/20 placeholder:text-gray-400 focus:ring-blue-400/50 focus:bg-white/20 transition-all text-sm rounded-xl px-4"
                    min="0"
                />
            </div>
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
