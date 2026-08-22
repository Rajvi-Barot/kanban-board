function TaskCard({ task }) {
  function handleDragStart(e) {
    e.dataTransfer.setData('taskId', task._id);
  }

  return (
    <div className="task-card" draggable onDragStart={handleDragStart}>
      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-desc">{task.description}</p>}
    </div>
  );
}

export default TaskCard;