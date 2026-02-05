import React from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, ClipboardList,
    FileEdit, LogOut, X, ShieldCheck
} from "lucide-react";
import { auth } from "../firebase"; // Pastikan path ini benar sesuai struktur folder Anda
import { signOut } from "firebase/auth";

export default function Sidebar({ userRole = "guest", mobileOpen, setMobileOpen }) {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate("/");
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    // --- KONFIGURASI MENU ---
    const links = [
        {
            to: "/DaShbOaRd",
            label: "Dashboard",
            icon: <LayoutDashboard size={20} />,
            roles: ["all"]
        },
        {
            to: "/gLoBaL-aCcEpTeD",
            label: "Global List (Semua)",
            icon: <ShieldCheck size={20} />,
            roles: ["superadmin", "ketua", "bph"]
        },
        {
            to: "/fOrM-bUiLdEr",
            label: "Form Builder",
            icon: <FileEdit size={20} />,
            roles: ["superadmin", "acara", "pdd", "humas", "perkab"]
        },
        {
            to: "/mY-dIvIsIoN",
            label: "Divisi Saya",
            icon: <ClipboardList size={20} />,
            roles: ["acara", "humas", "pdd", "perkab"]
        }
    ];

    // Filter menu berdasarkan Role Login
    const filteredLinks = links.filter(link =>
        link.roles.includes("all") || link.roles.includes(userRole)
    );

    // --- SUB-COMPONENT: ISI SIDEBAR ---
    const SidebarContent = () => (
        <div className="h-full flex flex-col bg-white border-r border-slate-200">
            {/* 1. Header Logo */}
            <div className="h-16 flex items-center px-5 border-b border-slate-100 bg-white shrink-0">
                <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md shadow-sky-500/20 mr-3">
                    L
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-800">
                    Recruit<span className="text-sky-500">LAWOS</span>
                </span>
            </div>

            {/* 2. Menu Links (Scrollable) */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Menu ({userRole})
                </p>

                {filteredLinks.map((link) => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        // PENTING: Tutup sidebar saat menu diklik (khusus mobile)
                        onClick={() => setMobileOpen && setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative overflow-hidden ${isActive
                                ? "bg-sky-50 text-sky-700 font-semibold shadow-sm ring-1 ring-sky-100"
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                {/* Indikator Garis di Kiri */}
                                <span className={`absolute left-0 top-2 bottom-2 w-1 bg-sky-500 rounded-r-full transition-transform duration-300 ${isActive ? 'scale-y-100 translate-x-0' : 'scale-y-0 -translate-x-full'}`} />

                                <span className="relative z-10 flex items-center gap-3">
                                    {link.icon}
                                    {link.label}
                                </span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* 3. Footer / Logout */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 shrink-0">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-rose-100 group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* --- DESKTOP SIDEBAR --- */}
            {/* Fixed width 64 (16rem/256px) di Laptop */}
            <aside className="hidden md:block w-64 h-screen sticky top-0 z-30 shrink-0 bg-white">
                <SidebarContent />
            </aside>

            {/* --- MOBILE SIDEBAR (OVERLAY) --- */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop Gelap */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-40"
                        />

                        {/* Panel Sidebar Bergerak dari Kiri */}
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            // REVISI BAGIAN INI:
                            // w-[280px] -> Lebar ideal untuk menu mobile
                            // max-w-[85vw] -> Agar di HP super kecil (seperti iPhone SE/Galaxy Fold cover), dia menyesuaikan diri dan tidak menutupi 100% layar.
                            className="md:hidden fixed top-0 left-0 bottom-0 w-[280px] max-w-[85vw] z-50 bg-white shadow-2xl flex flex-col"
                        >
                            {/* Tombol Close (X) Absolute di pojok kanan atas sidebar */}
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-3 right-3 p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition z-50"
                            >
                                <X size={20} />
                            </button>

                            {/* Isi Sidebar */}
                            <SidebarContent />
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};