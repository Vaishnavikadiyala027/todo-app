"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";

// 🔥 FIREBASE
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from "firebase/firestore";

export default function Todo() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [priority, setPriority] = useState("medium");
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false); // ✅ Added for hydration safety

  // ✅ SAFE INITIALIZATION
  useEffect(() => {
    setMounted(true); // Signal that we are now in the browser

    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
          router.push("/");
          return;
        }
        setUser(JSON.parse(savedUser));

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") setDarkMode(true);
      } catch (err) {
        console.error("Auth error:", err);
      }
    }
  }, [router]);

  const getName = () => {
    if (!user?.email) return "User";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  // ✅ FETCH TASKS
  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "tasks"),
      where("email", "==", user.email)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((d) => {
        data.push({ id: d.id, ...d.data() });
      });
      setTasks(data);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = async () => {
    if (!task.trim()) {
      alert("Enter task");
      return;
    }

    if (!user?.email) {
      alert("Login again");
      return;
    }

    try {
      await addDoc(collection(db, "tasks"), {
        text: task,
        completed: false,
        date: dateTime || null,
        priority: priority,
        email: user.email,
        createdAt: new Date(),
      });

      setTask("");
      setDateTime("");
      setPriority("medium");
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTask = async (id: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "tasks", id), {
        completed: !current,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string, t: any) => {
    try {
      const snapshot = await getDocs(collection(db, "trash"));
      let exists = false;

      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        if (d.text === t.text && d.email === t.email && d.date === t.date) {
          exists = true;
        }
      });

      if (!exists) {
        await addDoc(collection(db, "trash"), {
          text: t.text,
          completed: t.completed,
          date: t.date || null,
          priority: t.priority || "medium",
          email: t.email,
          deletedAt: new Date(),
        });
      }

      await deleteDoc(doc(db, "tasks", id));
    } catch (err) {
      console.error("Delete Error:", err);
    }
  };

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newMode ? "dark" : "light");
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.push("/");
  };

  // ✅ PREVENT RENDERING UNTIL BROWSER IS READY
  if (!mounted) return null;

  const completed = tasks.filter((t) => t.completed).length;
  const filteredTasks = tasks.filter((t) =>
    t.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen p-10 transition-colors ${
        darkMode
          ? "bg-slate-900 text-white"
          : "bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">
          {getName()} • Task Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")} className="font-bold underline decoration-orange-500">Home</button>
          <button onClick={() => router.push("/dashboard")}>Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>

          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200/20">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <span onClick={handleLogout} className="text-red-500 cursor-pointer font-medium hover:underline">
            Logout
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`p-6 rounded-xl shadow border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
          <p className="opacity-70">Total</p>
          <h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>
        <div className={`p-6 rounded-xl shadow border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
          <p className="text-green-500">Done</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>
        <div className={`p-6 rounded-xl shadow border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'}`}>
          <p className="text-orange-500">Pending</p>
          <h2 className="text-2xl font-bold">{tasks.length - completed}</h2>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`w-full p-3 rounded-lg mb-6 outline-none shadow-sm ${
          darkMode ? "bg-white/10 text-white border border-white/20" : "bg-white text-black border"
        }`}
      />

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-1 opacity-70">
          <span>Progress</span>
          <span>{tasks.length === 0 ? "0%" : Math.round((completed / tasks.length) * 100) + "%"}</span>
        </div>
        <div className="w-full h-2 bg-gray-300/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{ width: tasks.length === 0 ? "0%" : `${(completed / tasks.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 shadow-inner">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What needs to be done?"
          className={`flex-1 min-w-[200px] p-3 rounded-lg border outline-none ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"}`}
        />
        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className={`p-3 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className={`p-3 rounded-lg border text-sm ${darkMode ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-300"}`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button onClick={addTask} className="bg-orange-500 hover:bg-orange-600 text-white px-8 rounded-lg font-bold transition shadow-lg">
          + Add
        </button>
      </div>

      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-400 text-center py-10 italic">No tasks found</p>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl shadow-sm border flex justify-between items-center transition-all hover:scale-[1.01] ${
                darkMode ? "bg-white/5 border-white/10" : "bg-white border-gray-100"
              }`}
            >
              <div className="flex-1">
                <p className={`font-medium ${t.completed ? "line-through opacity-40" : ""}`}>
                  {t.text}
                </p>
                <div className="flex gap-4 mt-1">
                  {t.date && (
                    <span className="text-[10px] opacity-60">
                      ⏰ {new Date(t.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    t.priority === "high" ? "text-red-500" : t.priority === "medium" ? "text-orange-400" : "text-green-500"
                  }`}>
                    {t.priority}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => toggleTask(t.id, t.completed)}
                  className={`w-8 h-8 rounded-full border flex items-center justify-center transition ${
                    t.completed ? "bg-green-500 border-green-500 text-white" : "border-gray-400 text-gray-400 hover:border-green-500 hover:text-green-500"
                  }`}
                >
                  ✓
                </button>
                <button
                  onClick={() => deleteTask(t.id, t)}
                  className="w-8 h-8 rounded-full border border-gray-400 text-gray-400 hover:border-red-500 hover:text-red-500 flex items-center justify-center transition"
                >
                  🗑
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
