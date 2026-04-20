// dashboard/src/App.jsx
import Header from './components/Header';
import Overview from './pages/Overview';

function App() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a' }}>
      <Header />
      <main>
        <Overview />
      </main>
    </div>
  );
}

export default App;