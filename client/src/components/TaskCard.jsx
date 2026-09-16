import { useState } from 'react';

function TaskCard({ task, onEdit, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description || '');

  function handleDragStart(e) {
    e.dataTransfer.setData('taskId', task._id);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!titleDraft.trim()) return;
    onEdit(task._id, { title: titleDraft, description: descDraft });
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
        <div className="task-card-actions">
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    );
  }

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
      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-desc">{task.description}</p>}
    </div>
  );
}

export default TaskCard;
