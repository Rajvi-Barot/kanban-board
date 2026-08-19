import { BrowserRouter, Routes, Route } from 'react-router-dom';

function BoardPage() {
  return <h1>Kanban Board</h1>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;