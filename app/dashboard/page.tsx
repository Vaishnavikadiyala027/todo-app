"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ✅ Keep charts client-side only
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
  const [mounted, setMounted] = useState(false);

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

  // ✅ PIE DATA WITH SPECIFIC COLORS
  const pieData = [
    { name: "Completed", value: completed, color: "#22c55e" }, // Green
    { name: "Pending", value: pending, color: "#ef4444" },    // Red
  ];

  // ✅ WEEKLY LOGIC
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = days.map((day, index) => {
    const count = tasks.filter((t) => {
      if (!t.date) return false;
      const taskDate = new Date(t.date);
      return taskDate.getDay() === index;
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/20">
          <p>Total Tasks</p>
          <h2 className="text-2xl font-bold">{total}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/20">
          <p className="text-green-500 font-semibold">Completed</p>
          <h2 className="text-2xl font-bold">{completed}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/20">
          <p className="text-red-500 font-semibold">Pending</p>
          <h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      {total !== 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* STATUS PIE CHART */}
          <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/20">
            <h3 className="mb-4 font-semibold">Status</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    key={`pie-${completed}-${pending}`} // ✅ RE-RENDERS WHEN DATA UPDATES
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell 
                         key={`cell-${index}`} 
                         fill={entry.color} 
                         stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* WEEKLY BAR CHART */}
          <div className="p-6 rounded-xl bg-white/10 backdrop-blur shadow border border-white/20">
            <h3 className="mb-4 font-semibold">Weekly</h3>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? "#444" : "#ccc"} />
                  <XAxis dataKey="day" stroke={darkMode ? "#fff" : "#000"} />
                  <YAxis stroke={darkMode ? "#fff" : "#000"} allowDecimals={false} />
                  <Tooltip cursor={{fill: 'rgba(0,0,0,0.1)'}} />
                  <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center mt-20 text-gray-500 italic">No tasks yet to display charts.</div>
      )}
    </div>
  );
}
