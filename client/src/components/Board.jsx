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
    <div className="board">
      {columns.map((column) => (
                <Column key={column._id} column={column} onTaskCreated={handleTaskCreated} />
      ))}
    </div>
  );
}

export default Board;