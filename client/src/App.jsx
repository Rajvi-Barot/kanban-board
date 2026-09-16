import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Board from './components/Board';
import Login from './components/Login';
import { useAuth } from './context/auth';

function App() {
  const { token } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={token ? <Board /> : <Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
