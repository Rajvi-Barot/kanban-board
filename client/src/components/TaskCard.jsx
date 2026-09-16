import { useState } from 'react';

const LABELS = {
  none: null,
  bug: { text: 'Bug', className: 'label-bug' },
  feature: { text: 'Feature', className: 'label-feature' },
  idea: { text: 'Idea', className: 'label-idea' },
  urgent: { text: 'Urgent', className: 'label-urgent' },
};

function formatDueDate(dueDate) {
  if (!dueDate) return null;
  const date = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((date - today) / (1000 * 60 * 60 * 24));

  const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  let className = 'due-date';
  if (diffDays < 0) className += ' due-overdue';
  else if (diffDays === 0) className += ' due-today';

  return { label, className };
}

function TaskCard({ task, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description || '');
  const [labelDraft, setLabelDraft] = useState(task.label || 'none');
  const [dueDateDraft, setDueDateDraft] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : ''
  );

  function handleDragStart(e) {
    e.dataTransfer.setData('taskId', task._id);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!titleDraft.trim()) return;
    onEdit(task._id, {
      title: titleDraft,
      description: descDraft,
      label: labelDraft,
      dueDate: dueDateDraft || null,
    });
    setIsEditing(false);
  }

  function handleDelete(e) {
    e.stopPropagation();
    onDelete(task._id);
  }

  if (isEditing) {
    return (
      <form className="task-card task-card-editing" onSubmit={handleSave}>
        <input
          type="text"
          value={titleDraft}
          autoFocus
          onChange={(e) => setTitleDraft(e.target.value)}
        />
        <textarea
          placeholder="Description (optional)"
          value={descDraft}
          onChange={(e) => setDescDraft(e.target.value)}
        />
        <div className="task-card-row">
          <select value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)}>
            <option value="none">No label</option>
            <option value="bug">Bug</option>
            <option value="feature">Feature</option>
            <option value="idea">Idea</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            type="date"
            value={dueDateDraft}
            onChange={(e) => setDueDateDraft(e.target.value)}
          />
        </div>
        <div className="task-card-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

  const label = LABELS[task.label];
  const due = formatDueDate(task.dueDate);

  return (
    <div
      className="task-card"
      draggable
      onDragStart={handleDragStart}
      onDoubleClick={() => setIsEditing(true)}
    >
      <button
        type="button"
        className="delete-task-btn"
        title="Delete task"
        onClick={handleDelete}
      >
        &times;
      </button>
      {label && <span className={`task-label ${label.className}`}>{label.text}</span>}
      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-desc">{task.description}</p>}
      {due && <span className={due.className}>{due.label}</span>}
    </div>
  );
}

export default TaskCard;
