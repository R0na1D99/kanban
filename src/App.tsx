import Board from './components/Board';
import './App.css';

export default function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Kanban Board</h1>
      </header>
      <main className="app__main">
        <Board />
      </main>
    </div>
  );
}
