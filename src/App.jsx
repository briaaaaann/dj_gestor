import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Guest from './pages/Guest.jsx';
import DJ from './pages/DJ.jsx';
import Screen from './pages/Screen.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/party/:partyId" element={<Guest />} />
        <Route path="/dj" element={<DJ />} />
        <Route path="/screen/:partyId" element={<Screen />} />
        <Route path="*" element={<Navigate to="/dj" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
