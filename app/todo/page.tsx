<<<<<<< HEAD
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
  const [mounted, setMounted] = useState(false); // ✅ Added for Vercel build safety

  // ✅ FIXED LOCALSTORAGE
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        router.push("/");
        return;
      }

      setUser(JSON.parse(savedUser));

      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") setDarkMode(true);
    } catch {}
  }, [router]);

  const getName = () => {
    if (!user?.email) return "User";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

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

        if (
          d.text === t.text &&
          d.email === t.email &&
          d.date === t.date
        ) {
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

  // ✅ FIXED THEME STORAGE
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

  // ✅ PREVENT RENDERING UNTIL MOUNTED
  if (!mounted) return null;

  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;

  const filteredTasks = tasks.filter((t) =>
    t.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen p-10 ${
        darkMode
          ? "bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#1e293b] text-white"
          : "bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">
          {getName()} • Task Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => router.push("/trash")}>Trash</button>

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

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Total</p>
          <h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-green-400">Done</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-orange-400">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`w-full p-3 rounded-lg mb-6 outline-none ${
          darkMode
            ? "bg-white/10 text-white border border-white/20"
            : "bg-white text-black border"
        }`}
      />

      <p className="mb-2">
        Progress:{" "}
        {tasks.length === 0
          ? "0%"
          : Math.round((completed / tasks.length) * 100) + "%"}
      </p>

      <div className="w-full h-2 bg-gray-300 rounded mb-6">
        <div
          className="h-2 bg-green-500 rounded"
          style={{
            width:
              tasks.length === 0
                ? "0%"
                : `${(completed / tasks.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex gap-3 mb-8">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task..."
          className={`flex-1 p-3 rounded-lg ${
            darkMode
              ? "bg-white/10 text-white border border-white/20"
              : "bg-white text-black border"
          }`}
        />

        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="p-3 rounded-lg text-black"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-3 rounded-lg text-black"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button
          onClick={addTask}
          className="bg-orange-500 text-white px-6 rounded-lg"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-400">No tasks</p>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white/10 backdrop-blur shadow flex justify-between items-center"
            >
              <div>
                <p
                  className={`${
                    t.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {t.text}
                </p>

                {t.date && (
                  <p className="text-xs text-gray-400">
                    ⏰ {new Date(t.date).toLocaleString()}
                  </p>
                )}

                <p
                  className={`text-xs font-semibold ${
                    t.priority === "high"
                      ? "text-red-400"
                      : t.priority === "medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  🔥 {t.priority?.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => toggleTask(t.id, t.completed)}
                  className="text-green-400"
                >
                  ✓
                </button>

                <button
                  onClick={() => deleteTask(t.id, t)}
                  className="text-red-400"
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
=======
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
  const [mounted, setMounted] = useState(false); // ✅ Added for Vercel build safety

  // ✅ FIXED LOCALSTORAGE
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    try {
      const savedUser = localStorage.getItem("user");

      if (!savedUser) {
        router.push("/");
        return;
      }

      setUser(JSON.parse(savedUser));

      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") setDarkMode(true);
    } catch {}
  }, [router]);

  const getName = () => {
    if (!user?.email) return "User";
    const name = user.email.split("@")[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

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

        if (
          d.text === t.text &&
          d.email === t.email &&
          d.date === t.date
        ) {
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

  // ✅ FIXED THEME STORAGE
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

  // ✅ PREVENT RENDERING UNTIL MOUNTED
  if (!mounted) return null;

  const completed = tasks.filter((t) => t.completed).length;
  const pending = tasks.length - completed;

  const filteredTasks = tasks.filter((t) =>
    t.text?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className={`min-h-screen p-10 ${
        darkMode
          ? "bg-gradient-to-br from-[#0b1220] via-[#0f172a] to-[#1e293b] text-white"
          : "bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black"
      }`}
    >
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">
          {getName()} • Task Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button onClick={() => router.push("/dashboard")}>
            Dashboard
          </button>
          <button onClick={() => router.push("/trash")}>Trash</button>

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

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Total</p>
          <h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-green-400">Done</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-orange-400">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      <input
        type="text"
        placeholder="🔍 Search tasks..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`w-full p-3 rounded-lg mb-6 outline-none ${
          darkMode
            ? "bg-white/10 text-white border border-white/20"
            : "bg-white text-black border"
        }`}
      />

      <p className="mb-2">
        Progress:{" "}
        {tasks.length === 0
          ? "0%"
          : Math.round((completed / tasks.length) * 100) + "%"}
      </p>

      <div className="w-full h-2 bg-gray-300 rounded mb-6">
        <div
          className="h-2 bg-green-500 rounded"
          style={{
            width:
              tasks.length === 0
                ? "0%"
                : `${(completed / tasks.length) * 100}%`,
          }}
        />
      </div>

      <div className="flex gap-3 mb-8">
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Enter task..."
          className={`flex-1 p-3 rounded-lg ${
            darkMode
              ? "bg-white/10 text-white border border-white/20"
              : "bg-white text-black border"
          }`}
        />

        <input
          type="datetime-local"
          value={dateTime}
          onChange={(e) => setDateTime(e.target.value)}
          className="p-3 rounded-lg text-black"
        />

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="p-3 rounded-lg text-black"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>

        <button
          onClick={addTask}
          className="bg-orange-500 text-white px-6 rounded-lg"
        >
          + Add
        </button>
      </div>

      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <p className="text-gray-400">No tasks</p>
        ) : (
          filteredTasks.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-white/10 backdrop-blur shadow flex justify-between items-center"
            >
              <div>
                <p
                  className={`${
                    t.completed ? "line-through text-gray-400" : ""
                  }`}
                >
                  {t.text}
                </p>

                {t.date && (
                  <p className="text-xs text-gray-400">
                    ⏰ {new Date(t.date).toLocaleString()}
                  </p>
                )}

                <p
                  className={`text-xs font-semibold ${
                    t.priority === "high"
                      ? "text-red-400"
                      : t.priority === "medium"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }`}
                >
                  🔥 {t.priority?.toUpperCase()}
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => toggleTask(t.id, t.completed)}
                  className="text-green-400"
                >
                  ✓
                </button>

                <button
                  onClick={() => deleteTask(t.id, t)}
                  className="text-red-400"
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
>>>>>>> 87784f5d5aeea57d797c7651359b4e6193211029
