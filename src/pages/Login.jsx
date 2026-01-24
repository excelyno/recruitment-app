import { useState } from "react";
import { auth, db } from "../firebase"; // Pastikan path import ini benar
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Cek apakah user terdaftar sebagai admin di Firestore
            const adminDoc = await getDoc(doc(db, "admins", user.uid));

            if (adminDoc.exists()) {
                navigate("/dashboard");
            } else {
                setError("Akses Ditolak: Anda bukan admin sistem.");
                await auth.signOut();
            }
        } catch (err) {
            setError("Autentikasi Gagal: Cek email atau password.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-mono text-sm">

            {/* Background Grid Effect (Hiasan Latar Belakang) */}
            <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f3923_1px,transparent_1px),linear-gradient(to_bottom,#0f3923_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
            </div>

            {/* Main Terminal Card */}
            <div className="w-full max-w-md bg-[#0a0a0a] border border-green-900 rounded-lg shadow-[0_0_50px_rgba(16,185,129,0.1)] relative z-10">

                {/* Terminal Header Bar */}
                <div className="bg-[#111] px-4 py-2 rounded-t-lg border-b border-green-900 flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                    <span className="ml-2 text-green-700 text-xs">root@laos-server:~</span>
                </div>

                <div className="p-8">
                    {/* Header Text */}
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold text-green-500 tracking-tighter mb-2">
                            {`> SUDO LOGIN_`}
                            <span className="animate-pulse">|</span>
                        </h1>
                        <p className="text-gray-500">LAOS Open Source Recruitment</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 border border-red-900 bg-red-900/10 text-red-500 text-center rounded text-xs">
                            [ERROR] {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">

                        {/* Email Input */}
                        <div className="space-y-1">
                            <label className="text-green-700 text-xs uppercase tracking-wider font-bold block">User Identifier (Email)</label>
                            <input
                                type="email"
                                required
                                className="w-full bg-[#050505] border border-green-900 text-green-400 p-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-green-900/50 rounded-sm"
                                placeholder="admin@laos.org"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-1">
                            <label className="text-green-700 text-xs uppercase tracking-wider font-bold block">Access Key (Password)</label>
                            <input
                                type="password"
                                required
                                className="w-full bg-[#050505] border border-green-900 text-green-400 p-3 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all placeholder-green-900/50 rounded-sm"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 mt-4 bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest transition-all duration-200 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] disabled:opacity-50 disabled:cursor-not-allowed border border-green-400"
                        >
                            {loading ? "AUTHENTICATING..." : "ENTER SYSTEM"}
                        </button>
                    </form>

                    {/* Footer Text */}
                    <div className="mt-8 text-center text-xs text-gray-700">
                        <p>System version 1.0.0-stable</p>
                        <p>&copy; {new Date().getFullYear()} Linux & Open Source</p>
                    </div>
                </div>
            </div>
        </div>
    );
}