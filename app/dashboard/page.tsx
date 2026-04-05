"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// ✅ Prevent SSR errors
const PieChart = dynamic(() => import("recharts").then(m => m.PieChart), { ssr: false });
const Pie = dynamic(() => import("recharts").then(m => m.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then(m => m.Cell), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then(m => m.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import("recharts").then(m => m.ResponsiveContainer), { ssr: false });

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

  // ✅ Data for the chart
  const pieData = [
    { name: "Completed", value: completed },
    { name: "Pending", value: pending }
  ];

  return (
    <div className="min-h-screen p-10 bg-gradient-to-br from-purple-100 via-white to-orange-100 text-black">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-2xl font-bold text-orange-500">📊 Dashboard</h1>
        <button onClick={() => router.push("/todo")} className="underline">Home</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* PIE CHART CARD */}
        <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
          <h3 className="mb-4 font-semibold text-lg">Task Status</h3>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  key={`pie-${completed}-${pending}`} // ✅ FORCES COLOR UPDATE
                  data={pieData}
                  dataKey="value"
                  cx="50%" cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  <Cell fill="#22c55e" stroke="none" /> {/* Green */}
                  <Cell fill="#ef4444" stroke="none" /> {/* Red */}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATS CARD */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
            <p className="text-green-600 font-bold">Completed Tasks</p>
            <h2 className="text-3xl font-bold">{completed}</h2>
          </div>
          <div className="p-6 rounded-xl bg-white/40 backdrop-blur shadow border border-white/20">
            <p className="text-red-600 font-bold">Pending Tasks</p>
            <h2 className="text-3xl font-bold">{pending}</h2>
          </div>
        </div>
      </div>
    </div>
  );
}
