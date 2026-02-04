import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import AnimatedBackground from "./AnimatedBackground";
import LoadingScreen from "./LoadingScreen";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

export default function DashboardLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [userRole, setUserRole] = useState("guest");
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    useEffect(() => {
        const init = async () => {
            const user = auth.currentUser;
            if (user) {
                const cachedRole = localStorage.getItem("user_role");
                if (cachedRole) {
                    setUserRole(cachedRole);
                    setLoading(false);
                    return;
                }
                try {
                    const adminRef = doc(db, "admins", user.uid);
                    const adminSnap = await getDoc(adminRef);
                    if (adminSnap.exists()) {
                        const role = adminSnap.data().role || "guest";
                        setUserRole(role);
                        localStorage.setItem("user_role", role);
                    }
                } catch (e) {
                    console.error("Error role", e);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    return (
        <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden relative">
            <AnimatedBackground />

            {/* 1. LOADING SCREEN (Hanya muncul sekali saat refresh pertama) */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        key="global-loader"
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <LoadingScreen />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. SIDEBAR */}
            <div className={`z-40 transition-opacity duration-700 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                <Sidebar
                    userRole={userRole}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />
            </div>

            {/* 3. KONTEN UTAMA */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto relative scroll-smooth bg-slate-50/50">
                <button
                    className="md:hidden fixed top-4 right-4 z-50 bg-white/80 p-2 rounded-lg backdrop-blur shadow-sm border border-slate-200"
                    onClick={() => setMobileOpen(true)}
                >
                    Menu
                </button>

                <div className="md:px-10 md:py-8 px-4 py-20 max-w-[1600px] mx-auto min-h-full">
                    {!loading && (
                        /* RAHASIANYA DISINI:
                           1. key={location.pathname}: Memaksa React merender ulang div ini setiap ganti halaman.
                           2. className="animate-enter": Menjalankan animasi CSS yang kita buat di index.css.
                           3. Tidak ada animasi 'exit', jadi konten lama langsung diganti konten baru (snappy).
                        */
                        <div
                            key={location.pathname}
                            className="w-full h-full animate-enter"
                        >
                            <Outlet context={{ userRole }} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}