import { useState } from 'react';
import TaskCard from './TaskCard';

const API_URL = 'http://localhost:5000/api';

function Column({ column, onTaskCreated }) {
  const [title, setTitle] = useState('');

  async function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, column: column._id }),
    });
    const newTask = await res.json();

    onTaskCreated(column._id, newTask);
    setTitle('');
  }

  return (
    <div className="column">
      <h3>{column.name}</h3>
      <div className="task-list">
        {column.tasks.map((task) => (
          <TaskCard key={task._id} task={task} />
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