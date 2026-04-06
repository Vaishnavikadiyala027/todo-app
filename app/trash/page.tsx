"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

// 🔥 FIREBASE
import { db } from "../../firebase";

import {
  collection,
  deleteDoc,
  doc,
  addDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

export default function Trash() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);
  const [trash, setTrash] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false); // ✅ Fix: Prevents hydration errors on Vercel

  // ✅ COMBINED & FIXED LOCALSTORAGE ACCESS
  useEffect(() => {
    setMounted(true); // Signal that we are in the browser
    
    if (typeof window === "undefined") return;

    try {
      // Get User
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (!user?.email) {
        router.push("/");
        return;
      }
      setUserEmail(user.email);

      // Get Theme
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") setDarkMode(true);
    } catch (err) {
      console.error("Storage error:", err);
    }
  }, [router]);

  // ✅ REALTIME DATA
  useEffect(() => {
    if (!userEmail) return;

    const q = query(
      collection(db, "trash"),
      where("email", "==", userEmail)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data() });
      });
      setTrash(data);
    });

    return () => unsubscribe();
  }, [userEmail]);

  const deleteForever = async (id: string) => {
    try {
      await deleteDoc(doc(db, "trash", id));
    } catch (err) {
      console.error(err);
    }
  };

  const restoreTask = async (task: any) => {
    try {
      await addDoc(collection(db, "tasks"), {
        text: task.text,
        completed: task.completed || false,
        date: task.date || null,
        priority: task.priority || "medium",
        email: task.email,
        createdAt: new Date(),
      });

      await deleteDoc(doc(db, "trash", task.id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.push("/");
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newMode ? "dark" : "light");
    }
  };

  // ✅ Fix: Don't render UI until the browser is ready
  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen p-10 ${
        darkMode
          ? "bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#1e293b] text-white"
          : "bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black"
      }`}
    >
      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-red-500">
          🗑 Trash Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
          <button className="font-semibold underline decoration-red-500">Trash</button>

          <button onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <span
            onClick={handleLogout}
            className="text-red-500 cursor-pointer"
          >
            Logout
          </span>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/5">
          <p className="opacity-70">Deleted Tasks</p>
          <h2 className="text-2xl font-bold text-red-500">
            {trash.length}
          </h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/5">
          <p className="text-green-400">Recoverable</p>
          <h2 className="text-2xl font-bold">{trash.length}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/5">
          <p className="opacity-70">Permanent Deletes</p>
          <h2 className="text-2xl font-bold">Manual</h2>
        </div>
      </div>

      {/* LIST */}
      {trash.length === 0 ? (
        <p className="text-gray-400 italic">No deleted tasks 🗑</p>
      ) : (
        <div className="space-y-4">
          {trash.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white/10 backdrop-blur shadow border border-white/5 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{t.text}</p>

                {t.date && (
                  <p className="text-xs text-gray-400 mt-1">
                    ⏰ {new Date(t.date).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => restoreTask(t)}
                  className="text-green-400 hover:underline"
                >
                  Restore
                </button>

                <button
                  onClick={() => deleteForever(t.id)}
                  className="text-red-400 hover:underline"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}