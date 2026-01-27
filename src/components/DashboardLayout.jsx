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
                // CEK CACHE DULU
                const cachedRole = localStorage.getItem("user_role");
                if (cachedRole) {
                    setUserRole(cachedRole);
                    setLoading(false); // Langsung tampil tanpa delay buatan!
                    return;
                }

                // Kalau cache kosong, baru fetch
                try {
                    const adminRef = doc(db, "admins", user.uid);
                    const adminSnap = await getDoc(adminRef);
                    if (adminSnap.exists()) {
                        const role = adminSnap.data().role || "guest";
                        setUserRole(role);
                        localStorage.setItem("user_role", role); // Simpan Cache
                    }
                } catch (e) {
                    console.error("Error role", e);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    // ANIMASI HALAMAN (Fade Out -> Blank -> Fade In)
    const pageVariants = {
        initial: {
            opacity: 0,
            y: 15, // Muncul dari bawah sedikit
            filter: "blur(5px)"
        },
        animate: {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } // Easing smooth Apple-style
        },
        exit: {
            opacity: 0,
            y: -15, // Hilang ke atas sedikit
            filter: "blur(5px)",
            transition: { duration: 0.4, ease: "easeInOut" }
        }
    };

    return (
        <div className="min-h-screen flex bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden relative">
            <AnimatedBackground />

            {/* 1. LOADING SCREEN (Overlay paling atas) */}
            <AnimatePresence>
                {loading && (
                    <motion.div
                        key="global-loader"
                        exit={{ opacity: 0, pointerEvents: "none" }} // Fade out halus
                        transition={{ duration: 0.8 }}
                        className="fixed inset-0 z-[9999]"
                    >
                        <LoadingScreen />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. SIDEBAR (Static, tidak gerak-gerak saat ganti menu) */}
            {/* Kita sembunyikan sidebar saat loading agar efek 'Reveal' lebih dramatis */}
            <motion.div
                animate={{ opacity: loading ? 0 : 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="z-40"
            >
                <Sidebar
                    userRole={userRole}
                    mobileOpen={mobileOpen}
                    setMobileOpen={setMobileOpen}
                />
            </motion.div>

            {/* 3. KONTEN UTAMA */}
            <main className="flex-1 min-w-0 h-screen overflow-y-auto relative scroll-smooth bg-slate-50/50">
                <button
                    className="md:hidden fixed top-4 right-4 z-50 bg-white/80 p-2 rounded-lg backdrop-blur shadow-sm border border-slate-200"
                    onClick={() => setMobileOpen(true)}
                >
                    Menu
                </button>

                <div className="md:px-10 md:py-8 px-4 py-20 max-w-[1600px] mx-auto min-h-full">

                    {/* AnimatePresence mode="wait" -> KUNCI AGAR TIDAK MUNCUL 2 KALI */}
                    {/* Halaman lama selesai exit dulu, baru halaman baru masuk */}
                    <AnimatePresence mode="wait">
                        {!loading && (
                            <motion.div
                                key={location.pathname} // Trigger ganti halaman
                                variants={pageVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className="w-full h-full"
                            >
                                <Outlet context={{ userRole }} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    );
}