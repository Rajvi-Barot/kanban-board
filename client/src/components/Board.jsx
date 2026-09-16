import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import Column from './Column';
import { useAuth } from '../context/auth';
import { API_URL } from '../config';

const SOCKET_URL = 'http://localhost:5000';

function Board() {
  const { username, token, logout, authFetch } = useAuth();
  const [boardId, setBoardId] = useState(null);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [newColumnName, setNewColumnName] = useState('');
  const [isLive, setIsLive] = useState(false);
  const socketRef = useRef(null);

  // Merge a task into local state (used for both optimistic updates and
  // real-time events from other clients) — remove it from wherever it was,
  // then re-insert it into the column it belongs to now. Idempotent.
  function upsertTask(task) {
    if (!task || !task._id) return;
    setColumns((prevColumns) =>
      prevColumns.map((col) => {
        const withoutTask = col.tasks.filter((t) => t._id !== task._id);
        if (col._id === task.column) {
          return { ...col, tasks: [...withoutTask, task] };
        }
        return { ...col, tasks: withoutTask };
      })
    );
  }

  function removeTask(taskId) {
    setColumns((prevColumns) =>
      prevColumns.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t._id !== taskId),
      }))
    );
  }

  function upsertColumn(column) {
    if (!column || !column._id) return;
    setColumns((prevColumns) => {
      const exists = prevColumns.some((c) => c._id === column._id);
      if (exists) {
        return prevColumns.map((c) =>
          c._id === column._id ? { ...c, name: column.name } : c
        );
      }
      return [...prevColumns, { ...column, tasks: [] }];
    });
  }

  function removeColumn(columnId) {
    setColumns((prevColumns) => prevColumns.filter((c) => c._id !== columnId));
  }

  function handleTaskCreated(_columnId, newTask) {
    upsertTask(newTask);
  }

  async function handleDropTask(taskId, targetColumnId) {
    // Move it in local state immediately, so the UI feels instant
    let movedTask = null;
    columns.forEach((col) => {
      const found = col.tasks.find((t) => t._id === taskId);
      if (found) movedTask = found;
    });
    if (movedTask) {
      upsertTask({ ...movedTask, column: targetColumnId });
    }

    // Tell the backend the task's column actually changed, so it's saved
    // and broadcast to everyone else.
    await authFetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ column: targetColumnId }),
    });
  }

  async function handleEditTask(taskId, updates) {
    const res = await authFetch(`${API_URL}/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const updatedTask = await res.json();
    upsertTask(updatedTask);
  }

  async function handleDeleteTask(taskId) {
    removeTask(taskId);
    await authFetch(`${API_URL}/tasks/${taskId}`, { method: 'DELETE' });
  }

  async function handleAddColumn(e) {
    e.preventDefault();
    if (!newColumnName.trim() || !boardId) return;

    const res = await authFetch(`${API_URL}/columns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newColumnName, board: boardId }),
    });
    const newColumn = await res.json();
    upsertColumn(newColumn);
    setNewColumnName('');
  }

  async function handleRenameColumn(columnId, name) {
    const res = await authFetch(`${API_URL}/columns/${columnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const updatedColumn = await res.json();
    upsertColumn(updatedColumn);
  }

  async function handleDeleteColumn(columnId) {
    removeColumn(columnId);
    await authFetch(`${API_URL}/columns/${columnId}`, { method: 'DELETE' });
  }

  useEffect(() => {
    async function loadBoard() {
      try {
        let boardsRes = await authFetch(`${API_URL}/boards`);
        if (!boardsRes.ok) {
          throw new Error(`Server responded with ${boardsRes.status} when fetching boards`);
        }
        let boards = await boardsRes.json();

        // First run: no board exists yet, so create a default one.
        if (boards.length === 0) {
          const createRes = await authFetch(`${API_URL}/boards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'My Board' }),
          });
          if (!createRes.ok) {
            throw new Error(`Server responded with ${createRes.status} when creating the default board`);
          }
          const newBoard = await createRes.json();
          boards = [newBoard];

          // Seed a fresh board with the usual three columns instead of
          // leaving it empty.
          for (const name of ['To Do', 'In Progress', 'Done']) {
            await authFetch(`${API_URL}/columns`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name, board: newBoard._id }),
            });
          }
        }

        const currentBoardId = boards[0]._id;
        setBoardId(currentBoardId);

        const columnsRes = await authFetch(`${API_URL}/columns?board=${currentBoardId}`);
        if (!columnsRes.ok) {
          throw new Error(`Server responded with ${columnsRes.status} when fetching columns`);
        }
        const rawColumns = await columnsRes.json();

        const columnsWithTasks = await Promise.all(
          rawColumns.map(async (col) => {
            const tasksRes = await authFetch(`${API_URL}/tasks?column=${col._id}`);
            const tasks = await tasksRes.json();
            return { ...col, tasks };
          })
        );

        setColumns(columnsWithTasks);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load board:', err);
        setLoadError(
          err.message?.includes('fetch')
            ? "Can't reach the server at " + API_URL + ". Make sure the backend (npm run dev / node index.js in the server folder) is running."
            : err.message
        );
        setLoading(false);
      }
    }

    loadBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time sync: connect once, listen for changes from any client
  // (including this one — the handlers above are written to be idempotent).
  useEffect(() => {
    if (!token) return;

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on('connect', () => setIsLive(true));
    socket.on('disconnect', () => setIsLive(false));
    socket.on('connect_error', () => setIsLive(false));
    socket.on('task:created', upsertTask);
    socket.on('task:updated', upsertTask);
    socket.on('task:deleted', (payload) => removeTask(payload._id));
    socket.on('column:created', upsertColumn);
    socket.on('column:updated', upsertColumn);
    socket.on('column:deleted', (payload) => removeColumn(payload._id));

    return () => {
      socket.disconnect();
    };
  }, [token]);

  if (loading) return <p style={{ padding: 24 }}>Loading board...</p>;

  if (loadError) {
    return (
      <div style={{ padding: 24, maxWidth: 600 }}>
        <p style={{ color: '#f85149', fontWeight: 600, fontFamily: 'JetBrains Mono, monospace' }}>Couldn't load the board</p>
        <p style={{ color: '#8b949e' }}>{loadError}</p>
      </div>
    );
  }

  return (
    <>
      <header className="app-header">
        <span className="logo-dot"></span>
        <h1>Kanban Board</h1>
        <span className={`live-badge${isLive ? ' is-live' : ''}`}>
          <span className="live-dot"></span>
          {isLive ? 'Live' : 'Offline'}
        </span>
        <span className="current-user">{username}</span>
        <button type="button" className="logout-btn" onClick={logout}>
          Log out
        </button>
      </header>
      <div className="board">
        {columns.map((column) => (
          <Column
            key={column._id}
            column={column}
            onTaskCreated={handleTaskCreated}
            onDropTask={handleDropTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        ))}
        <form onSubmit={handleAddColumn} className="add-column-form">
          <input
            type="text"
            placeholder="New column name"
            value={newColumnName}
            onChange={(e) => setNewColumnName(e.target.value)}
          />
          <button type="submit">Add column</button>
        </form>
      </div>
    </>
  );
}

export default Board;
