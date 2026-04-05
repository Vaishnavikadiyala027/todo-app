"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ✅ Logic Fix: Keep charts client-side only
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });
const BarChart = dynamic(() => import("recharts").then(m => m.BarChart), { ssr: false });
const Bar = dynamic(() => import("recharts").then(m => m.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then(m => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then(m => m.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then(m => m.CartesianGrid), { ssr: false });

// FIREBASE
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";

export default function Dashboard() {
  const router = useRouter();

  const [darkMode, setDarkMode] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false); // ✅ Logic Fix: Prevents Vercel error

  // ✅ Logic Fix: Safe LocalStorage Access
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));

      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") setDarkMode(true);
    }
  }, []);

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
      console.error(err);
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

  // ✅ Logic Fix: Don't render until browser is ready
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
    <div className={`min-h-screen p-10 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black'}`}>
      
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">📊 Dashboard</h1>
        <div className="flex gap-6 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button className="font-bold underline">Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>
          <button onClick={toggleTheme}>{darkMode ? "☀️" : "🌙"}</button>
          <button 
            onClick={() => {
                if(typeof window !== "undefined") localStorage.removeItem("user");
                router.push("/");
            }} 
            className="text-red-500"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p>Total Tasks</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-green-500">Completed</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
          <p className="text-orange-500">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      {total !== 0 ? (
        <div className="grid grid-cols-2 gap-10">
          <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
            <h3 className="mb-4">Status</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} dataKey="value" outerRadius={80} label>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? "#22c55e" : "#f97316"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow">
            <h3 className="mb-4">Weekly</h3>
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
        <div className="text-center mt-20 text-gray-500">No tasks yet</div>
      )}
    </div>
  );
}
