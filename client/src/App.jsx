import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Board from './components/Board';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Board />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;