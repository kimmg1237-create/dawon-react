import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Ebooks from './pages/Ebooks';
import AudioBooks from './pages/AudioBooks';
import Board from './pages/Board';
import SelfCommunication from './pages/SelfCommunication';
import Store from './pages/Store';
import Admin from './pages/Admin';
import './App.css';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/ebooks" element={<Ebooks />} />
            <Route path="/audiobooks" element={<AudioBooks />} />
            <Route path="/board" element={<Board />} />
            <Route path="/self-communication" element={<SelfCommunication />} />
            <Route path="/store" element={<Store />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}
