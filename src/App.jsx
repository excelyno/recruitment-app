import { HashRouter as Router, Routes, Route } from "react-router-dom"; // Pakai HashRouter biar aman pas deploy
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply"; // <--- IMPORT HALAMANNYA
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Halaman Login Admin */}
        <Route path="/" element={<Login />} />

        {/* Halaman Pendaftaran (INI YANG KURANG TADI) */}
        <Route path="/daftar" element={<Apply />} />

        {/* Halaman Dashboard (Protected) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;