"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

// ✅ FIX 1: ADD FIREBASE IMPORT
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

  // ✅ LOAD USER
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!user?.email) {
      router.push("/"); // redirect if not logged in
      return;
    }

    setUserEmail(user.email);
  }, [router]);

  // ✅ REALTIME DATA
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);

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

  // ✅ DELETE FOREVER (SINGLE DELETE - FIXED)
  const deleteForever = async (id: string) => {
    try {
      await deleteDoc(doc(db, "trash", id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ RESTORE TASK (FIXED)
  const restoreTask = async (task: any) => {
    try {
      // add back to tasks
      await addDoc(collection(db, "tasks"), {
        text: task.text,
        completed: task.completed || false,
        date: task.date || null,
        priority: task.priority || "medium",
        email: task.email,
        createdAt: new Date(),
      });

      // delete from trash
      await deleteDoc(doc(db, "trash", task.id));
    } catch (err) {
      console.error(err);
    }
  };

  // ✅ LOGOUT (FIXED)
  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  // 🌙 THEME
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

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
          <button className="font-semibold">Trash</button>

          <button onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* ✅ FIXED LOGOUT */}
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
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Deleted Tasks</p>
          <h2 className="text-2xl font-bold text-red-500">
            {trash.length}
          </h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-green-400">Recoverable</p>
          <h2 className="text-2xl font-bold">{trash.length}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Permanent Deletes</p>
          <h2 className="text-2xl font-bold">Manual</h2>
        </div>
      </div>

      {/* LIST */}
      {trash.length === 0 ? (
        <p className="text-gray-400">No deleted tasks 🗑</p>
      ) : (
        <div className="space-y-4">
          {trash.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white/10 backdrop-blur shadow flex justify-between items-center"
            >
              <div>
                <p>{t.text}</p>

                {t.date && (
                  <p className="text-xs text-gray-400">
                    ⏰ {new Date(t.date).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => restoreTask(t)}
                  className="text-green-400"
                >
                  Restore
                </button>

                <button
                  onClick={() => deleteForever(t.id)}
                  className="text-red-400"
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