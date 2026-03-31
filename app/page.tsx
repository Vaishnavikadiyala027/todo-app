"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ✅ FIREBASE IMPORT (TOP ONLY)
import { db } from "../firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  // ✅ FIXED FUNCTION
  const handleAuth = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    try {
      // ================= LOGIN =================
      if (isLogin) {
        const snapshot = await getDocs(collection(db, "users"));

        let found = false;

        snapshot.forEach((doc) => {
          const user = doc.data();

          if (user.email === email && user.password === password) {
            localStorage.setItem("user", JSON.stringify(user));
            router.push("/todo");
            found = true;
          }
        });

        if (!found) {
          alert("Invalid credentials");
        }
      }

      // ================= SIGNUP =================
      else {
        const newUser = { email, password };

        // ✅ SAVE IN FIREBASE
        await addDoc(collection(db, "users"), newUser);

        // ✅ SAVE LOCALLY
        localStorage.setItem("user", JSON.stringify(newUser));

        alert("Account created!");
        setIsLogin(true);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[url('https://images.unsplash.com/photo-1519389950473-47ba0277781c')] bg-cover bg-center">
      <div className="bg-white/90 backdrop-blur-lg p-8 rounded-xl shadow-xl w-80">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
          {isLogin ? "Login" : "Sign Up"}
        </h1>

        {/* EMAIL */}
        <input
          placeholder="Email"
          value={email || ""}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />

        {/* PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          value={password || ""}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-3 border rounded"
        />

        {/* BUTTON */}
        <button
          onClick={handleAuth}
          className="w-full bg-orange-500 text-white py-2 rounded hover:bg-orange-600 transition"
        >
          {isLogin ? "Login" : "Sign Up"}
        </button>

        {/* TOGGLE */}
        <p
          className="text-sm mt-3 text-center cursor-pointer text-gray-500"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Create account" : "Already have account?"}
        </p>
      </div>
    </div>
  );
}