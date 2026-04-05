"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamicImport from "next/dynamic";
import { Moon, Sun } from "lucide-react";

// charts client-side only
const PieChart = dynamicImport(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamicImport(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamicImport(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip = dynamicImport(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamicImport(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamicImport(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamicImport(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamicImport(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamicImport(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamicImport(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });

// FIREBASE
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // SAFE LOCALSTORAGE - Runs only in the browser
  useEffect(() => {
    setMounted(true);

    if (typeof window !== "undefined") {
      try {
        const userData = localStorage.getItem("user");
        if (userData) setUser(JSON.parse(userData));

        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") setDarkMode(true);
      } catch (err) {
        console.error("Error reading from localStorage:", err);
      }
    }
  }, []);

  // FETCH TASKS
  const fetchTasks = async (currentUser: any) => {
    if (!currentUser) return;

    try {
      const snapshot = await getDocs(collection(db, "tasks"));
      const data: any[] = [];

      snapshot.forEach((doc) => {
        const d = doc.data();
        if (d.email === currentUser.email) {
          data.push({ id: doc.id, ...d });
        }
      });

      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    if (user) fetchTasks(user);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchTasks(user);
    }, 2000);

    return () => clearInterval(interval);
  }, [user]);

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) return null;

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", newMode ? "dark" : "light");
    }
  };

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pending = total - completed;

  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending },
  ];

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
    <div className={`min-h-screen p-10 transition-colors ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black'}`}>

      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-orange-500">
          📊 Dashboard Manager
        </h1>

        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button className="font-semibold underline decoration-orange-500">Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>

          <button onClick={toggleTheme} className="p-2 rounded-full bg-white/20">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button 
            onClick={() => {
              localStorage.removeItem("user");
              router.push("/");
            }} 
            className="text-red-500 cursor-pointer font-medium"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p>Total Tasks</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>

        <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p className="text-green-500">Completed</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>

        <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <p className="text-orange-500">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      {total !== 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="mb-4 font-semibold">Completion Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={100} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#22c55e" : "#f97316"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`p-6 rounded-xl shadow ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="mb-4 font-semibold">Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
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
      ) : (
        <div className="text-center mt-20 text-gray-500 italic">
          No tasks found to generate charts.
        </div>
      )}
    </div>
  );
}
