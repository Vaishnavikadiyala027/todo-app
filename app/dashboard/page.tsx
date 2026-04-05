"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ✅ Prevent SSR for charts
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
      if (localStorage.getItem("theme") === "dark") setDarkMode(true);
    }
  }, []);

  const fetchTasks = async (currentUser: any) => {
    if (!currentUser) return;
    try {
      const snapshot = await getDocs(collection(db, "tasks"));
      const data: any[] = [];
      snapshot.forEach((doc) => {
        if (doc.data().email === currentUser.email) data.push({ id: doc.id, ...doc.data() });
      });
      setTasks(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (user) fetchTasks(user); }, [user]);

  if (!mounted) return null;

  const completed = tasks.filter(t => t.completed).length;
  const pending = tasks.length - completed;

  // ✅ Hardcoded data for the Pie Chart
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending }
  ];

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weeklyData = days.map((day, idx) => ({
    day,
    tasks: tasks.filter(t => t.date && new Date(t.date).getDay() === idx).length
  }));

  return (
    <div className={`min-h-screen p-10 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-br from-purple-100 via-white to-orange-100'}`}>
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">📊 Dashboard</h1>
        <div className="flex gap-4">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button className="underline font-bold">Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/20 backdrop-blur shadow">
          <p>Total</p><h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/20 backdrop-blur shadow">
          <p className="text-green-600">Completed</p><h2 className="text-2xl font-bold">{completed}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/20 backdrop-blur shadow">
          <p className="text-red-600">Pending</p><h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="p-6 rounded-xl bg-white/20 backdrop-blur shadow" style={{ minHeight: '350px' }}>
          <h3 className="mb-4 font-semibold">Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                key={`pie-${completed}-${pending}`} // ✅ Forces refresh
                data={pieData}
                dataKey="value"
                cx="50%" cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {/* ✅ DIRECT COLOR INJECTION */}
                <Cell fill="#22c55e" stroke="none" /> 
                <Cell fill="#ef4444" stroke="none" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl bg-white/20 backdrop-blur shadow" style={{ minHeight: '350px' }}>
          <h3 className="mb-4 font-semibold">Weekly</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
