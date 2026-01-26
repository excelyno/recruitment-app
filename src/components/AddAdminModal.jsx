import { useState } from "react";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { firebaseConfig, db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

export default function AddAdminModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        role: "acara"
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: "", msg: "" });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: "", msg: "" });

        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);

        try {
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, formData.password);
            const newUser = userCredential.user;

            await setDoc(doc(db, "admins", newUser.uid), {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                password: formData.password,
                createdAt: new Date().toISOString()
            });

            await signOut(secondaryAuth);
            setStatus({ type: "success", msg: `Admin ${formData.role} created!` });
            setFormData({ email: "", password: "", name: "", role: "acara" });
            setTimeout(() => {
                onClose();
                setStatus({ type: "", msg: "" });
            }, 2000);

        } catch (error) {
            let errorMessage = "Failed to create admin.";
            if (error.code === 'auth/email-already-in-use') errorMessage = "Email already in use.";
            setStatus({ type: "error", msg: errorMessage });
        } finally {
            deleteApp(secondaryApp);
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
                        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white/90 backdrop-blur-xl w-full max-w-md rounded-3xl shadow-2xl relative z-10 border border-white/50 overflow-hidden"
                    >
                        <div className="p-6 border-b border-slate-100/50 flex justify-between items-center bg-white/40">
                            <h2 className="text-lg font-bold text-slate-800">Add New Admin</h2>
                            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/50 hover:bg-white flex items-center justify-center transition border border-slate-200/50 text-slate-400">×</button>
                        </div>

                        <div className="p-6">
                            {status.msg && (
                                <div className={`mb-4 p-3 rounded-xl text-xs font-bold text-center ${status.type === 'success' ? 'bg-sage-100 text-sage-700' : 'bg-rose-50 text-rose-600'}`}>
                                    {status.msg}
                                </div>
                            )}

                            <form onSubmit={handleCreateAdmin} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Staff Name</label>
                                    <input required name="name" onChange={handleChange} value={formData.name} className="w-full bg-white/50 border border-slate-200/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 transition-all font-medium text-sm" placeholder="e.g. John Doe" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                                        <input required type="email" name="email" onChange={handleChange} value={formData.email} className="w-full bg-white/50 border border-slate-200/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 transition-all font-medium text-sm" placeholder="staff@laos.org" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                        <input required type="password" name="password" onChange={handleChange} value={formData.password} className="w-full bg-white/50 border border-slate-200/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 transition-all font-medium text-sm" placeholder="******" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Role / Division</label>
                                    <div className="relative">
                                        <select name="role" onChange={handleChange} value={formData.role} className="w-full bg-white/50 border border-slate-200/50 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-300 transition-all font-medium text-sm appearance-none cursor-pointer">
                                            <option value="acara">Event Division</option>
                                            <option value="humas">Public Relations</option>
                                            <option value="pdd">Documentation (PDD)</option>
                                            <option value="perkab">Equipment (Perkab)</option>
                                            <option value="superadmin">SUPER ADMIN</option>
                                        </select>
                                        <div className="absolute right-4 top-3.5 pointer-events-none text-slate-400 text-xs">▼</div>
                                    </div>
                                </div>

                                <button
                                    type="submit" disabled={loading}
                                    className="w-full py-4 mt-2 bg-sage-600 hover:bg-sage-700 text-white font-bold rounded-xl transition shadow-lg shadow-sage-200 disabled:opacity-50 text-sm tracking-wide"
                                >
                                    {loading ? "Creating..." : "Create Account"}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}