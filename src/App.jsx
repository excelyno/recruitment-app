import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Apply from "./pages/Apply";
import ProtectedRoute from "./components/ProtectedRoute";
import DashboardLayout from "./components/DashboardLayout";
import GlobalAcceptedList from "./pages/GlobalAcceptedList";
import DivisionList from "./pages/DivisionList";
import FormBuilder from "./pages/FormBuilder";
import { ApplicantProvider } from "./context/ApplicantContext";

function App() {
  return (
    <Router>
      <Routes>
        {/* --- AREA PUBLIK (PESERTA) --- */}
        {/* Halaman utama langsung buka Form Pendaftaran */}
        <Route path="/" element={<Apply />} />
        {/* Opsional: Kalau peserta iseng ngetik /daftar, tetap arahkan ke form */}
        <Route path="/daftar" element={<Navigate to="/" replace />} />


        {/* --- AREA ADMIN (RAHASIA) --- */}
        {/* Pintu masuk admin dipindah ke /admin-login */}
        <Route path="/aDmIn-LoGiN" element={<Login />} />

        {/* Semua halaman Dashboard dilindungi */}
        <Route element={<ProtectedRoute><ApplicantProvider><DashboardLayout /></ApplicantProvider></ProtectedRoute>}>
          <Route path="/DaShbOaRd" element={<Dashboard />} />
          <Route path="/gLoBaL-aCcEpTeD" element={<GlobalAcceptedList />} />
          <Route path="/mY-dIvIsIoN" element={<DivisionList />} />
          <Route path="/fOrM-bUiLdEr" element={<FormBuilder />} />
        </Route>

        {/* Redirect: Kalau ada yang nyasar ke halaman ngawur, balikin ke Form */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;