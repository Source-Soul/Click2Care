import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const Login = () => {
	const { backendUrl, token, setToken } = useContext(AppContext);
	const navigate = useNavigate();

	const [state, setState] = useState("Sign Up"); // "Sign Up" | "Login"

	const [email, setEmail] = useState("");
	const [name, setName] = useState("");
	const [password, setPassword] = useState("");

	const [showOtp, setShowOtp] = useState(false);
	const [otp, setOtp] = useState("");

	const onSubmitHandler = async (event) => {
		event.preventDefault();

		try {
			if (state === "Sign Up") {
				const { data } = await axios.post(`${backendUrl}/api/user/register`, {
					name,
					email,
					password,
				});

				if (data.success) {
					// Backend sends success + message: ask user to verify
					toast.success(
						data.message ||
							"Registration successful. Check your email for OTP.",
					);
					setShowOtp(true); // show OTP input
				} else if (data.needsVerification) {
					// If you ever send this from backend
					toast.error(data.message || "Please verify your email.");
					setShowOtp(true);
				} else {
					toast.error(data.message || "Registration failed.");
				}
			} else {
				// LOGIN FLOW (you can enhance with needsVerification later)
				const { data } = await axios.post(`${backendUrl}/api/user/login`, {
					email,
					password,
				});

				if (data.success) {
					localStorage.setItem("token", data.token);
					setToken(data.token);
					toast.success(data.message || "Logged in successfully.");
				} else if (data.needsVerification) {
					toast.error(data.message || "Please verify your email.");
					setShowOtp(true);
				} else {
					toast.error(data.message || "Login failed.");
				}
			}
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.message || error.message);
		}
	};

	const handleVerifyOtp = async () => {
		if (!otp.trim()) {
			toast.error("Please enter the OTP.");
			return;
		}

		try {
			const { data } = await axios.post(`${backendUrl}/api/user/verify-email`, {
				email,
				code: otp,
			});

			if (data.success) {
				localStorage.setItem("token", data.token);
				setToken(data.token);
				toast.success(data.message || "Email verified successfully.");
				setShowOtp(false);
				setOtp("");
			} else {
				toast.error(data.message || "Verification failed.");
			}
		} catch (error) {
			console.error(error);
			toast.error(error.response?.data?.message || error.message);
		}
	};

	// TEMP: Google sign-in handler stub (replace with real GIS logic later)
	const handleGoogleSignIn = () => {
		toast.info("Google Sign-In not wired yet (backend + GIS to be added).");
		// Later:
		// 1. Use Google Identity Services to get id_token.
		// 2. POST { idToken } to `${backendUrl}/api/user/auth/google`.
		// 3. Save data.token, setToken, navigate.
	};

	// Redirect if already logged in
	useEffect(() => {
		if (token) {
			navigate("/");
		}
	}, [token, navigate]);

	const handleSwitchState = (nextState) => {
		setState(nextState);
		setShowOtp(false);
		setOtp("");
	};

	return (
		<form onSubmit={onSubmitHandler} className="min-h-[80vh] flex items-center">
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

				{/* OTP section, shown after registration or if login says needsVerification */}
				{showOtp && (
					<div className="w-full">
						<p>Enter OTP sent to your email</p>
						<input
							className="border border-zinc-300 rounded w-full p-2 mt-1"
							type="text"
							value={otp}
							onChange={(e) => setOtp(e.target.value)}
							maxLength={6}
						/>
						<button
							type="button"
							onClick={handleVerifyOtp}
							className="bg-primary text-white w-full py-2 rounded-md text-base mt-2">
							Verify Email
						</button>
					</div>
				)}

				<button
					type="submit"
					className="bg-primary text-white w-full py-2 rounded-md text-base mt-3">
					{state === "Sign Up" ? "Create Account" : "Login"}
				</button>

				{state === "Sign Up" ? (
					<p>
						Already have an account?
						<span
							onClick={() => handleSwitchState("Login")}
							className="text-primary underline cursor-pointer">
							{" "}
							Login here
						</span>
					</p>
				) : (
					<p>
						Create a new account?
						<span
							onClick={() => handleSwitchState("Sign Up")}
							className="text-primary underline cursor-pointer">
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
