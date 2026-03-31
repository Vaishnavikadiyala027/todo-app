"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// 🔥 FIREBASE
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // 🔥 FETCH FROM FIREBASE
  const fetchTasks = async () => {
    const snapshot = await getDocs(collection(db, "tasks"));
    const data: any[] = [];

    snapshot.forEach((doc) => {
      const d = doc.data();
      if (d.email === user.email) {
        data.push({ id: doc.id, ...d });
      }
    });

    setTasks(data);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setDarkMode(true);

    fetchTasks();
  }, []);

  // 🔁 AUTO REFRESH (LIVE UPDATE)
  useEffect(() => {
    const interval = setInterval(fetchTasks, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("theme", newMode ? "dark" : "light");
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  // ✅ PIE DATA
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

  const COLORS = ["#22c55e", "#f97316"];

  // ✅ WEEKLY GRAPH (COMPLETED TASKS)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const weeklyData = days.map((day, index) => {
    const count = tasks.filter((t) => {
      if (!t.date || !t.completed) return false;
      const d = new Date(t.date);
      return d.getDay() === index;
    }).length;

    return { day, tasks: count };
  });

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
        <h1 className="text-3xl font-bold text-orange-500">
          📊 Dashboard Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button className="font-semibold">Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>

          <button onClick={toggleTheme}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <span className="text-red-500 cursor-pointer">Logout</span>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Total Tasks</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-green-400">Completed</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>

        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-orange-400">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      {/* CHARTS */}
      {total === 0 ? (
        <p className="text-gray-400">No data available 📊</p>
      ) : (
        <div className="grid grid-cols-2 gap-10">
          
          {/* PIE */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={100} label>
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

      {/* TASK LIST */}
      <div className="space-y-4 mt-10">
        {tasks.map((t) => (
          <div
            key={t.id}
            className="p-4 rounded-xl bg-white/10 backdrop-blur shadow"
          >
            <p className={t.completed ? "line-through text-gray-400" : ""}>
              {t.text}
            </p>

            {t.date && (
              <p className="text-xs text-gray-400">
                ⏰ {new Date(t.date).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}