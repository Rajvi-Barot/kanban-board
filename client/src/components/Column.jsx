import { useState } from 'react';
import TaskCard from './TaskCard';
import { useAuth } from '../context/auth';
import { API_URL } from '../config';

function Column({
  column,
  onTaskCreated,
  onDropTask,
  onEditTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
}) {
  const { authFetch } = useAuth();
  const [title, setTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nameDraft, setNameDraft] = useState(column.name);

  async function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await authFetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, column: column._id }),
    });
    const newTask = await res.json();

    onTaskCreated(column._id, newTask);
    setTitle('');
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e) {
    const taskId = e.dataTransfer.getData('taskId');
    onDropTask(taskId, column._id);
    setIsDragOver(false);
  }

  function handleRenameSubmit(e) {
    e.preventDefault();
    if (!nameDraft.trim()) return;
    onRenameColumn(column._id, nameDraft);
    setIsRenaming(false);
  }

  function handleDeleteColumn() {
    if (column.tasks.length > 0) {
      const ok = window.confirm(
        `Delete "${column.name}" and its ${column.tasks.length} task(s)?`
      );
      if (!ok) return;
    }
    onDeleteColumn(column._id);
  }

  return (
    <div className="column">
      <div className="column-header">
        {isRenaming ? (
          <form onSubmit={handleRenameSubmit} className="rename-column-form">
            <input
              type="text"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onBlur={handleRenameSubmit}
            />
          </form>
        ) : (
          <h3
            onDoubleClick={() => setIsRenaming(true)}
            data-count={column.tasks.length}
          >
            {column.name}
          </h3>
        )}
        <button
          type="button"
          className="delete-column-btn"
          title="Delete column"
          onClick={handleDeleteColumn}
        >
          &times;
        </button>
      </div>
      <div
        className={`task-list${isDragOver ? ' drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {column.tasks.map((task) => (
          <TaskCard
            key={task._id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
          />
        ))}
      </div>
      <form onSubmit={handleAddTask} className="add-task-form">
        <input
          type="text"
          placeholder="New task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export default Column;
