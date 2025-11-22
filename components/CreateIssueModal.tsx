'use client';

import { useState, useEffect } from 'react';
import { useRedmine } from '@/lib/context';
import { X } from 'lucide-react';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateIssueModal({ isOpen, onClose }: CreateIssueModalProps) {
  const { 
    createIssue, 
    availableTrackers, 
    availableStatuses, 
    availablePriorities, 
    availableUsers,
    availableCategories 
  } = useRedmine();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [trackerId, setTrackerId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [priorityId, setPriorityId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter priorities to only show Normal and Urgent (Korean only)
  const filteredPriorities = availablePriorities.filter(p => {
      const n = p.name;
      return n === '보통' || n === '긴급';
  });

  // Set defaults when modal opens or data loads
  useEffect(() => {
      if (isOpen) {
          if (availableTrackers.length > 0 && !trackerId) {
              setTrackerId(String(availableTrackers[0].id));
          }
          if (availableStatuses.length > 0 && !statusId) {
              setStatusId(String(availableStatuses[0].id));
          }
          // Default priority to Normal
          if (filteredPriorities.length > 0 && !priorityId) {
              const normal = filteredPriorities.find(p => p.name.toLowerCase() === 'normal' || p.name === '보통');
              if (normal) {
                  setPriorityId(String(normal.id));
              } else {
                  setPriorityId(String(filteredPriorities[0].id));
              }
          }
      }
  }, [isOpen, availableTrackers, availableStatuses, availablePriorities]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !trackerId || !statusId || !priorityId) return;

    setIsSubmitting(true);
    try {
      await createIssue({
        subject,
        description,
        tracker_id: Number(trackerId),
        status_id: Number(statusId),
        priority_id: Number(priorityId),
        assigned_to_id: assigneeId ? Number(assigneeId) : undefined,
        category_id: categoryId ? Number(categoryId) : undefined,
      });
      onClose();
      // Reset form (optional, but good practice)
      setSubject('');
      setDescription('');
      // Don't reset these to empty, reset to defaults if needed, or leave as is for next time
      // setTrackerId(''); 
      // setStatusId('');
      // setPriorityId('');
      setAssigneeId('');
      setCategoryId('');
    } catch (error) {
      console.error("Failed to create issue:", error);
      alert("Failed to create issue. Please check your input.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">New Issue</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500 min-h-[100px]"
              rows={5}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Tracker */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Tracker *</label>
              <select
                value={trackerId}
                onChange={e => setTrackerId(e.target.value)}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
                required
              >
                {availableTrackers.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Status *</label>
              <select
                value={statusId}
                onChange={e => setStatusId(e.target.value)}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
                required
              >
                {availableStatuses.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Priority *</label>
              <select
                value={priorityId}
                onChange={e => setPriorityId(e.target.value)}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
                required
              >
                {filteredPriorities.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Assignee</label>
              <select
                value={assigneeId}
                onChange={e => setAssigneeId(e.target.value)}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">(Unassigned)</option>
                {availableUsers.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.firstname ? `${u.firstname} ${u.lastname}` : u.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={e => setCategoryId(e.target.value)}
                className="w-full bg-gray-900 text-white rounded px-3 py-2 border border-gray-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="">(None)</option>
                {availableCategories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
