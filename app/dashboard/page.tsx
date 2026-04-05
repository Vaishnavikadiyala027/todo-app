"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

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
  const [mounted, setMounted] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      const userData = localStorage.getItem("user");
      if (userData) setUser(JSON.parse(userData));
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

  const pieData = [
    { name: "Completed", value: completed, color: "#22c55e" }, 
    { name: "Pending", value: pending, color: "#ef4444" }
  ];

  const weeklyData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => ({
    day,
    tasks: tasks.filter(t => t.date && new Date(t.date).getDay() === idx).length
  }));

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">📊 Dashboard</h1>
        <div className="flex gap-4 items-center">
          <button onClick={() => router.push("/todo")}>Home</button>
          <button className="underline font-bold">Dashboard</button>
          <button onClick={() => router.push("/trash")}>Trash</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <p>Total Tasks</p><h2 className="text-2xl font-bold">{tasks.length}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <p className="text-green-600 font-semibold">Completed</p><h2 className="text-2xl font-bold">{completed}</h2>
        </div>
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <p className="text-red-600 font-semibold">Pending</p><h2 className="text-2xl font-bold">{pending}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <h3 className="mb-4 font-semibold">Status</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  key={`pie-${completed}-${pending}`} 
                  data={pieData}
                  dataKey="value"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  isAnimationActive={false}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <h3 className="mb-4 font-semibold">Weekly</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" /><YAxis allowDecimals={false} /><Tooltip />
                <Bar dataKey="tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
