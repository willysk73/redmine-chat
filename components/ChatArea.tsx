'use client';

import { useRedmine } from '@/lib/context';
import { useState, useEffect, useRef } from 'react';
import { Send, Edit2, Check, X, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeRaw from 'rehype-raw';

export default function ChatArea() {
  const {
    selectedIssue,
    user,
    client,
    availableStatuses,
    availablePriorities,
    availableUsers,
    availableTrackers,
    availableCategories,
    updateIssue,
    refreshIssueDetails,
  } = useRedmine();

  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<number | null>(null);
  const [editedText, setEditedText] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Staged changes
  const [stagedTrackerId, setStagedTrackerId] = useState<string>('');
  const [stagedStatusId, setStagedStatusId] = useState<string>('');
  const [stagedPriorityId, setStagedPriorityId] = useState<string>('');
  const [stagedAssigneeId, setStagedAssigneeId] = useState<string>('');
  const [stagedCategoryId, setStagedCategoryId] = useState<string>('');

  // Initialize staged values when selectedIssue changes
  useEffect(() => {
    if (selectedIssue) {
      setStagedTrackerId(String(selectedIssue.tracker.id));
      setStagedStatusId(String(selectedIssue.status.id));
      setStagedPriorityId(String(selectedIssue.priority.id));
      setStagedAssigneeId(selectedIssue.assigned_to ? String(selectedIssue.assigned_to.id) : '');
      setStagedCategoryId(selectedIssue.category ? String(selectedIssue.category.id) : '');
    }
  }, [selectedIssue]);

  // Polling for updates
  useEffect(() => {
      if (!selectedIssue) return;

      const intervalId = setInterval(() => {
          console.log("Polling for updates...");
          refreshIssueDetails(selectedIssue.id);
      }, 30000); // 30 seconds

      return () => clearInterval(intervalId);
  }, [selectedIssue, refreshIssueDetails]);

  const handleManualRefresh = async () => {
      if (!selectedIssue || isRefreshing) return;
      setIsRefreshing(true);
      
      // Ensure at least 1s of animation
      const minAnimationTime = new Promise(resolve => setTimeout(resolve, 1000));
      const refreshPromise = refreshIssueDetails(selectedIssue.id);
      
      await Promise.all([refreshPromise, minAnimationTime]);
      setIsRefreshing(false);
  };

  // Helper to get readable name from a list by id
  const getItemName = (list: any[], id: any, type: string) => {
    const numId = Number(id);
    if (!id || isNaN(numId)) return '(none)';
    const item = list.find(i => i.id === numId);
    if (!item) return `#${id}`;
    if (type === 'user') {
      if (item.firstname || item.lastname) {
        return `${item.firstname ?? ''} ${item.lastname ?? ''}`.trim();
      }
      return item.name ?? '';
    }
    return item.name ?? '';
  };

  // Format journal change details into readable text
  const formatJournalChanges = (journal: any) => {
    if (!journal.details || journal.details.length === 0) return null;
    const changes = journal.details.map((detail: any) => {
      const fieldName = detail.name;
      let oldValue = detail.old_value ?? '(none)';
      let newValue = detail.new_value ?? '(none)';

      if (fieldName === 'status_id') {
        oldValue = getItemName(availableStatuses, oldValue, 'status');
        newValue = getItemName(availableStatuses, newValue, 'status');
      } else if (fieldName === 'priority_id') {
        oldValue = getItemName(availablePriorities, oldValue, 'priority');
        newValue = getItemName(availablePriorities, newValue, 'priority');
      } else if (fieldName === 'assigned_to_id') {
        oldValue = getItemName(availableUsers, oldValue, 'user');
        newValue = getItemName(availableUsers, newValue, 'user');
      } else if (fieldName === 'tracker_id') {
        oldValue = getItemName(availableTrackers, oldValue, 'tracker');
        newValue = getItemName(availableTrackers, newValue, 'tracker');
      } else if (fieldName === 'category_id') {
        oldValue = getItemName(availableCategories, oldValue, 'category');
        newValue = getItemName(availableCategories, newValue, 'category');
      }

      const fieldLabels: Record<string, string> = {
        status_id: 'Status',
        assigned_to_id: 'Assignee',
        priority_id: 'Priority',
        tracker_id: 'Tracker',
        category_id: 'Category',
        subject: 'Subject',
        description: 'Description',
        done_ratio: 'Progress',
      };
      const label = fieldLabels[fieldName] || fieldName;
      return `${label}: ${oldValue} → ${newValue}`;
    });
    return changes.join(', ');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedIssue?.journals]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedIssue || !client || isSending) return;
    
    // Check if there are any changes or a new message
    const hasMessage = newMessage.trim().length > 0;
    const hasChanges = 
        String(selectedIssue.tracker.id) !== stagedTrackerId ||
        String(selectedIssue.status.id) !== stagedStatusId ||
        String(selectedIssue.priority.id) !== stagedPriorityId ||
        (selectedIssue.assigned_to ? String(selectedIssue.assigned_to.id) : '') !== stagedAssigneeId ||
        (selectedIssue.category ? String(selectedIssue.category.id) : '') !== stagedCategoryId;

    if (!hasMessage && !hasChanges) return;

    setIsSending(true);
    try {
      const updates: any = {};
      if (hasMessage) updates.notes = newMessage;
      
      if (String(selectedIssue.tracker.id) !== stagedTrackerId) updates.tracker_id = Number(stagedTrackerId);
      if (String(selectedIssue.status.id) !== stagedStatusId) updates.status_id = Number(stagedStatusId);
      if (String(selectedIssue.priority.id) !== stagedPriorityId) updates.priority_id = Number(stagedPriorityId);
      
      if ((selectedIssue.assigned_to ? String(selectedIssue.assigned_to.id) : '') !== stagedAssigneeId) {
          updates.assigned_to_id = stagedAssigneeId ? Number(stagedAssigneeId) : null;
      }
      
      if ((selectedIssue.category ? String(selectedIssue.category.id) : '') !== stagedCategoryId) {
          updates.category_id = stagedCategoryId ? Number(stagedCategoryId) : null;
      }

      await updateIssue(selectedIssue.id, updates);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message/update:', error);
    } finally {
      setIsSending(false);
    }
  };

  const startEditing = (journalId: number, currentText: string) => {
    setEditingJournalId(journalId);
    setEditedText(currentText);
  };

  const cancelEditing = () => {
    setEditingJournalId(null);
    setEditedText('');
  };

  const saveEdit = async (journalId: number) => {
    if (!client || !selectedIssue || !editedText.trim()) return;
    try {
      await client.updateJournal(journalId, editedText);
      await refreshIssueDetails(selectedIssue.id);
      setEditingJournalId(null);
      setEditedText('');
    } catch (error) {
      console.error('Failed to update message:', error);
      alert('Failed to update message. Your Redmine version might not support editing (requires 5.0+) or you lack permission.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Input resize logic
  const [inputHeight, setInputHeight] = useState(150);
  const isResizingInput = useRef(false);
  const resizeStartY = useRef(0);
  const resizeStartHeight = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingInput.current) return;
      const delta = resizeStartY.current - e.clientY;
      setInputHeight(Math.min(Math.max(resizeStartHeight.current + delta, 80), 600));
    };

    const handleMouseUp = () => {
      isResizingInput.current = false;
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResizing = (e: React.MouseEvent) => {
    isResizingInput.current = true;
    resizeStartY.current = e.clientY;
    resizeStartHeight.current = inputHeight;
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none'; // Prevent text selection while dragging
  };

  if (!selectedIssue) {
    return (
      <div className="flex-1 bg-gray-900 flex items-center justify-center text-gray-500">
        <p>Select an issue to start chatting</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-start bg-gray-900">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            #{selectedIssue.id}: {selectedIssue.subject}
          </h2>
          <div className="flex items-center space-x-4 text-sm text-gray-400 mb-2">
            <span className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                selectedIssue.status.is_closed ? "bg-gray-700 text-gray-300" : "bg-green-900 text-green-300"
            )}>
                {selectedIssue.status.name}
            </span>
            <span className="text-gray-500">
                {selectedIssue.tracker.name}
            </span>
            <span className={cn(
                "text-xs",
                selectedIssue.priority.id > 3 ? "text-red-400 font-bold" : "text-gray-500"
            )}>
                {selectedIssue.priority.name}
            </span>
          </div>
        </div>
        
        {/* Refresh Button */}
        <div className="flex items-center space-x-2">
            <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                title="Refresh"
            >
                <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin text-indigo-400")} />
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Issue description */}
        <div className="flex space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              {selectedIssue.author?.firstname?.[0] || selectedIssue.author?.name?.[0] || '?'}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-baseline space-x-2">
              <span className="font-bold text-gray-200">
                {selectedIssue.author?.firstname
                  ? `${selectedIssue.author.firstname} ${selectedIssue.author.lastname}`
                  : selectedIssue.author?.name || 'Unknown'}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(selectedIssue.created_on).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 text-gray-300 bg-gray-800/50 p-3 rounded-lg rounded-tl-none inline-block max-w-[80%] markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{selectedIssue.description}</ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Journals / Comments */}
        {selectedIssue.journals?.map(journal => (
          <div key={journal.id} className={cn('flex space-x-3', journal.user?.id === user?.id ? 'flex-row-reverse space-x-reverse' : '')}>
            <div className="flex-shrink-0">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold',
                  journal.user?.id === user?.id ? 'bg-emerald-600' : 'bg-blue-600'
                )}
              >
                {journal.user?.firstname?.[0] || journal.user?.name?.[0] || '?'}
              </div>
            </div>
            <div className={cn('flex-1 flex flex-col', journal.user?.id === user?.id ? 'items-end' : 'items-start')}>
              <div className={cn('flex items-baseline space-x-2', journal.user?.id === user?.id ? 'flex-row-reverse space-x-reverse' : '')}>
                <span className="font-bold text-gray-200">
                  {journal.user?.firstname
                    ? `${journal.user.firstname} ${journal.user.lastname}`
                    : journal.user?.name || 'Unknown'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(journal.created_on).toLocaleString()}
                </span>
              </div>
              {editingJournalId === journal.id ? (
                <div className="mt-1 w-full max-w-[80%]">
                  <textarea
                    value={editedText}
                    onChange={e => setEditedText(e.target.value)}
                    className="w-full bg-gray-800 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => saveEdit(journal.id)}
                      className="bg-emerald-600 text-white px-3 py-1 rounded text-sm hover:bg-emerald-700 flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-700 text-white px-3 py-1 rounded text-sm hover:bg-gray-600 flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'mt-1 text-gray-300 p-3 rounded-lg max-w-[80%] group relative',
                    journal.user?.id === user?.id ? 'bg-emerald-900/50 rounded-tr-none' : 'bg-gray-800 rounded-tl-none'
                  )}
                >
                  {/* Edit button */}
                  {journal.user?.id === user?.id && (
                    <button
                      onClick={() => startEditing(journal.id, journal.notes || '')}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                      title="Edit"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  )}
                  
                  {/* Journal Details (Status changes, etc.) */}
                  {journal.details && journal.details.length > 0 && (
                    <div className={cn(
                        "text-xs text-gray-400 italic",
                        journal.notes ? "mb-2 border-b border-gray-700 pb-1" : ""
                    )}>
                      {formatJournalChanges(journal)}
                    </div>
                  )}

                  {/* Journal Notes */}
                  {journal.notes && (
                    <div className="markdown-content">
                       <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{journal.notes}</ReactMarkdown>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 relative">
        {/* Resize Handle */}
        <div 
            onMouseDown={startResizing}
            className="absolute top-0 left-0 w-full h-3 -mt-1.5 cursor-row-resize hover:bg-gray-700/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10"
            title="Drag to resize"
        >
            <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Property Selectors */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
            {/* Tracker */}
            <select
                value={stagedTrackerId}
                onChange={e => setStagedTrackerId(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500"
            >
                {availableTrackers.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                ))}
            </select>

            {/* Status */}
            <select
                value={stagedStatusId}
                onChange={e => setStagedStatusId(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500"
            >
                {availableStatuses.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                ))}
            </select>

            {/* Priority */}
            <select
                value={stagedPriorityId}
                onChange={e => setStagedPriorityId(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500"
            >
                {availablePriorities
                    .filter(p => {
                        const n = p.name;
                        // Strictly allow only '보통' and '긴급' as requested
                        return n === '보통' || n === '긴급';
                    })
                    .map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                ))}
            </select>

            {/* Assignee */}
            <select
                value={stagedAssigneeId}
                onChange={e => setStagedAssigneeId(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500 max-w-[150px]"
            >
                {availableUsers.map(u => (
                    <option key={u.id} value={u.id}>
                        {u.firstname ? `${u.firstname} ${u.lastname}` : u.name}
                    </option>
                ))}
            </select>

            {/* Category */}
            <select
                value={stagedCategoryId}
                onChange={e => setStagedCategoryId(e.target.value)}
                className="bg-gray-700 text-white rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-indigo-500"
            >
                <option value="">(No Category)</option>
                {availableCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>

        <form onSubmit={handleSendMessage} className="flex items-end space-x-2 relative">
            <div className="flex-1 relative">
                {previewMode ? (
                    <div 
                        className="w-full bg-gray-900 text-gray-300 rounded-lg p-3 overflow-y-auto border border-gray-600 markdown-content"
                        style={{ height: inputHeight }}
                    >
                        {newMessage ? (
                             <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} rehypePlugins={[rehypeRaw]}>{newMessage}</ReactMarkdown>
                        ) : (
                            <span className="text-gray-500 italic">Nothing to preview</span>
                        )}
                    </div>
                ) : (
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message... (Markdown supported, Ctrl+Enter to send)"
                        className="w-full bg-gray-900 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        style={{ height: inputHeight }}
                    />
                )}
                <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={cn(
                        "absolute bottom-2 right-2 text-xs px-2 py-1 rounded transition-colors",
                        previewMode ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                    )}
                >
                    {previewMode ? 'Write' : 'Preview'}
                </button>
            </div>
          <button
            type="submit"
            disabled={(!newMessage.trim() && 
                String(selectedIssue.tracker.id) === stagedTrackerId &&
                String(selectedIssue.status.id) === stagedStatusId &&
                String(selectedIssue.priority.id) === stagedPriorityId &&
                (selectedIssue.assigned_to ? String(selectedIssue.assigned_to.id) : '') === stagedAssigneeId &&
                (selectedIssue.category ? String(selectedIssue.category.id) : '') === stagedCategoryId
            ) || isSending}
            className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
