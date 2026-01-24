// GANTI IMPORT DI BAWAH INI
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply";

function App() {
  return (
    // Gunakan 'Router' yang sekarang adalah HashRouter
    <Router>
      <Routes>
        {/* Halaman Login */}
        <Route path="/" element={<Login />} />

        {/* Halaman Dashboard Admin */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Halaman Pendaftaran */}
        <Route path="/daftar" element={<Apply />} />
      </Routes>
    </Router>
  );
}

export default App;