import { useEffect, useState } from 'react';
import Column from './Column';

const API_URL = 'http://localhost:5000/api';

function Board() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);

  function handleTaskCreated(columnId, newTask) {
    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col._id === columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
      )
    );
  }

  async function handleDropTask(taskId, targetColumnId) {
    // Day 11: move it in local state immediately, so the UI feels instant
    setColumns((prevColumns) => {
      let movedTask = null;
      const withoutTask = prevColumns.map((col) => {
        const stillHere = col.tasks.filter((t) => {
          if (t._id === taskId) {
            movedTask = t;
            return false;
          }
          return true;
        });
        return { ...col, tasks: stillHere };
      });

      if (!movedTask) return prevColumns;

      return withoutTask.map((col) =>
        col._id === targetColumnId
          ? { ...col, tasks: [...col.tasks, movedTask] }
          : col
      );
    });

    // Day 12: tell the backend the task's column actually changed, so it's saved
    await fetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: targetColumnId }),
    });
  }

  useEffect(() => {
    async function loadBoard() {
      const boardsRes = await fetch(`${API_URL}/boards`);
      const boards = await boardsRes.json();
      if (boards.length === 0) {
        setLoading(false);
        return;
      }
      const boardId = boards[0]._id;

      const columnsRes = await fetch(`${API_URL}/columns?board=${boardId}`);
      const rawColumns = await columnsRes.json();

      const columnsWithTasks = await Promise.all(
        rawColumns.map(async (col) => {
          const tasksRes = await fetch(`${API_URL}/tasks?column=${col._id}`);
          const tasks = await tasksRes.json();
          return { ...col, tasks };
        })
      );

      setColumns(columnsWithTasks);
      setLoading(false);
    }

    loadBoard();
  }, []);

  if (loading) return <p style={{ padding: 24 }}>Loading board...</p>;

    return (
    <>
      <header className="app-header">
        <span className="logo-dot"></span>
        <h1>Kanban Board</h1>
      </header>
      <div className="board">
        {columns.map((column) => (
          <Column
            key={column._id}
            column={column}
            onTaskCreated={handleTaskCreated}
            onDropTask={handleDropTask}
          />
        ))}
      </div>
    </>
  );
}

export default Board;