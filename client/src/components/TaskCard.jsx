function TaskCard({ task }) {
  return (
    <div className="task-card">
      <p className="task-title">{task.title}</p>
      {task.description && <p className="task-desc">{task.description}</p>}
    </div>
  );
}

export default TaskCard;