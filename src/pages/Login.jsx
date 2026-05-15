import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { checkUsername } from "../services/api";


export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState("username");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!username.trim()) {
      setError("Please enter your username.");
      setLoading(false);
      return;
    }

    try {
      await checkUsername(username.trim());
      setStep("password");
    } catch (err) {
      setError("We can’t find an account with that Username.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!password.trim()) {
      setError("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const user = await login(username, password);

      if (user.role === "admin") {
        navigate("/admin/requests");
      } else if (user.role === "driver") {
        navigate("/driver");
      } else if (user.role === "school") {
        navigate("/school");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  function handleChangeUsername() {
    setStep("username");
    setPassword("");
    setError("");
  }

  return (
    <div style={styles.page}>
      <div style={styles.brandArea}>
        <img
          src="/raqeb-logo-horizontal.png"
          alt="Raqeb Food logo"
          style={styles.logo}
        />
      </div>

      {error && (
        <div style={styles.alertBox}>
          <div style={styles.alertIcon}>!</div>
          <div>
            <h2 style={styles.alertTitle}>There was a problem</h2>
            <p style={styles.alertText}>{error}</p>
          </div>
        </div>
      )}
      <div style={styles.card}>
        <h1 style={styles.heading}>Sign in</h1>

        {step === "username" ? (
          <form onSubmit={handleContinue}>
            <label style={styles.label}>Username</label>

            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />



            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Checking..." : "Continue"}
            </button>

            <p style={styles.infoText}>
              Access is reserved for authorized school, driver, and admin users.
            </p>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div style={styles.usernameRow}>
              <span style={styles.usernameText}>{username}</span>
              <button
                type="button"
                style={styles.changeButton}
                onClick={handleChangeUsername}
              >
                Change
              </button>
            </div>

            <label style={styles.label}>Password</label>

            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />


            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        )}
      </div>

      <p style={styles.footerText}>
        Real-time delivery tracking and food condition monitoring.
      </p>
    </div>
  );
}

const styles = {

  alertBox: {
  width: "360px",
  background: "#fff",
  border: "2px solid #dc2626",
  borderRadius: "8px",
  padding: "14px 16px",
  boxSizing: "border-box",
  display: "flex",
  gap: "12px",
  alignItems: "flex-start",
  marginBottom: "12px",
},
alertIcon: {
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  background: "#dc2626",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "800",
  fontSize: "14px",
  flexShrink: 0,
  marginTop: "2px",
},
alertTitle: {
  margin: 0,
  fontSize: "18px",
  fontWeight: "700",
  color: "#111827",
},
alertText: {
  margin: "6px 0 0 0",
  color: "#111827",
  fontSize: "14px",
  lineHeight: "1.4",
},
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    paddingTop: "32px",
    boxSizing: "border-box",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
  },
  brandArea: {
    marginBottom: "20px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "420px",
    maxWidth: "90%",
    height: "auto",
    objectFit: "contain",
  },
  card: {
    width: "360px",
    background: "#ffffff",
    border: "1px solid #d5d9d9",
    borderRadius: "10px",
    padding: "26px",
    boxSizing: "border-box",
  },
  heading: {
    fontSize: "28px",
    fontWeight: "500",
    margin: "0 0 18px 0",
    color: "#111827",
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "6px",
    color: "#111827",
  },
  input: {
    width: "100%",
    height: "38px",
    border: "1px solid #a6a6a6",
    borderRadius: "7px",
    padding: "7px 10px",
    fontSize: "15px",
    boxSizing: "border-box",
    outlineColor: "#2563eb",
    marginBottom: "14px",
  },
  primaryButton: {
    width: "100%",
    height: "38px",
    border: "none",
    borderRadius: "999px",
    background: "#062B5F",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "15px",
    cursor: "pointer",
    marginTop: "4px",
  },
  infoText: {
    fontSize: "13px",
    color: "#374151",
    lineHeight: "1.45",
    marginTop: "18px",
  },
  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "9px",
    borderRadius: "7px",
    fontSize: "13px",
    marginBottom: "12px",
  },
  usernameRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "14px",
    fontSize: "14px",
  },
  usernameText: {
    color: "#111827",
  },
  changeButton: {
    border: "none",
    background: "transparent",
    color: "#2563eb",
    cursor: "pointer",
    padding: 0,
    fontSize: "14px",
  },
  footerText: {
    marginTop: "22px",
    color: "#6b7280",
    fontSize: "13px",
  },
};