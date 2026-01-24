import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listener ini menunggu sampai Firebase selesai cek status login
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        // Tampilan Loading saat menunggu konfirmasi Firebase (PENTING untuk Refresh)
        return (
            <div className="h-screen flex items-center justify-center bg-slate-50">
                <div className="w-8 h-8 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    // Jika tidak ada user setelah loading selesai, tendang ke Login
    if (!user) {
        return <Navigate to="/" replace />;
    }

    // Jika aman, tampilkan halaman yang diminta (Dashboard)
    return children;
}