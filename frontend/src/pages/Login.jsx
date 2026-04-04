import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const { backendUrl, token, setToken } = useContext(AppContext);
  const navigate = useNavigate();

  const [state, setState] = useState("Sign Up");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    try {
      if (state === "Sign Up") {
        const { data } = await axios.post(backendUrl + "/api/user/register", {
          name,
          email,
          password,
        });
        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          toast.success(data.message);

          // Registration er por prothome Profile Setup page e jabe
          navigate("/profile-setup");
        } else {
          toast.error(data.message);
        }
      } else {
        const { data } = await axios.post(backendUrl + "/api/user/login", {
          email,
          password,
        });
        if (data.success) {
          localStorage.setItem("token", data.token);
          setToken(data.token);
          toast.success(data.message);

          // Logic: Jodi profile complete na thake tobe setup page-e jabe
          if (data.user && !data.user.isProfileComplete) {
            navigate("/profile-setup");
          } else {
            navigate("/");
          }
        } else {
          toast.error(data.message);
        }
      }
    } catch (error) {
      console.log(error);
      toast.error("Network Error: Please check if backend server is running");
    }
  };

  // Token thakle automatically redirect kora bondho korlam eikhane
  // Karon token thakleo amra profile setup e thakte pari
  useEffect(() => {
    // Eikhane logic ta AppContext theke handle kora best hobe
  }, [token]);

  return (
    <form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
      {/* ... (Apnar baki UI code eikhane thakbe) ... */}
      <div className="flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg">
        <p className="text-2xl font-semibold">
          {state === "Sign Up" ? "Create Account" : "Login"}
        </p>
        <p>
          Please {state === "Sign Up" ? "Sign Up" : "Login"} to book appointment
        </p>
        {state === "Sign Up" && (
          <div className="w-full">
            <p>Full Name</p>
            <input
              className="border border-zinc-300 rounded w-full p-2 mt-1"
              type="text"
              onChange={(e) => setName(e.target.value)}
              value={name}
              required
            />
          </div>
        )}

        <div className="w-full">
          <p>Email</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
          />
        </div>
        <div className="w-full">
          <p>Password</p>
          <input
            className="border border-zinc-300 rounded w-full p-2 mt-1"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-white w-full py-2 rounded-md text-base"
        >
          {state === "Sign Up" ? "Create Account" : "Login"}
        </button>
        {state === "Sign Up" ? (
          <p>
            Already have an account?
            <span
              onClick={() => setState("Login")}
              className="text-primary underline cursor-pointer"
            >
              {" "}
              Login here
            </span>
          </p>
        ) : (
          <p>
            Create a new account?
            <span
              onClick={() => setState("Sign Up")}
              className="text-primary underline cursor-pointer"
            >
              {" "}
              Click here
            </span>
          </p>
        )}
      </div>
    </form>
  );
};

export default Login;
