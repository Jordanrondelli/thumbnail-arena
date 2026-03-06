import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import BackOffice from './views/BackOffice';
import Participant from './views/Participant';
import Results from './views/Results';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const auth = useAuth();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1, paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Participant />} />
          <Route path="/admin" element={<BackOffice auth={auth} />} />
          <Route path="/results" element={<Results auth={auth} />} />
        </Routes>
      </main>
    </div>
  );
}
