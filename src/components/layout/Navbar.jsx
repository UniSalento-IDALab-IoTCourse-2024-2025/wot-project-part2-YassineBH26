import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function DashboardIcon() {
  return (
    <svg style={styles.navSvgIcon} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16M4 12h16M4 19h10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg style={styles.navSvgIcon} viewBox="0 0 24 24" fill="none">
      <path
        d="M16 11a4 4 0 1 0-8 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M4 20c1.3-3 4-5 8-5s6.7 2 8 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18 8a3 3 0 0 1 2 5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg style={styles.navSvgIcon} viewBox="0 0 24 24" fill="none">
      <path d="M3 7h11v9H3V7Z" stroke="currentColor" strokeWidth="2" />
      <path
        d="M14 10h4l3 3v3h-7v-6Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M18 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

function SchoolIcon() {
  return (
    <svg style={styles.navSvgIcon} viewBox="0 0 24 24" fill="none">
      <path
        d="M4 10 12 5l8 5-8 5-8-5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M6 12v5c1.8 1.3 3.8 2 6 2s4.2-.7 6-2v-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  function getHomePath() {
    if (user?.role === "admin") return "/admin/requests";
    if (user?.role === "driver") return "/driver";
    if (user?.role === "school") return "/school";
    return "/login";
  }

  return (
    <nav style={styles.nav}>
      <Link to={getHomePath()} style={styles.logoLink}>
        <img
          src="/raqeb-writing-only.png"
          alt="Raqeb Food logo"
          style={styles.logo}
        />
      </Link>

      {user && (
        <div style={styles.rightSide}>
          <div style={styles.navLinks}>
            {user.role === "admin" && (
              <>
                <Link to="/admin/requests" style={styles.navLink}>
                  <DashboardIcon />
                  Admin Control Center
                </Link>

                <Link to="/admin/users" style={styles.navLink}>
                  <UsersIcon />
                  User Management
                </Link>
              </>
            )}

            {user.role === "driver" && (
              <Link to="/driver" style={styles.navLink}>
                <TruckIcon />
                Driver Workspace
              </Link>
            )}

            {user.role === "school" && (
              <Link to="/school" style={styles.navLink}>
                <SchoolIcon />
                School Portal
              </Link>
            )}
          </div>

          <div style={styles.userBox}>
            <div style={styles.avatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>

            <div style={styles.userText}>
              <span style={styles.username}>{user.username}</span>
            </div>
          </div>

          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 28px",
    borderBottom: "1px solid #e5e7eb",
    background: "#ffffff",
    position: "sticky",
    top: 0,
    zIndex: 10,
    boxShadow: "0 1px 5px rgba(15, 23, 42, 0.06)",
  },

  logoLink: {
    display: "flex",
    alignItems: "center",
    textDecoration: "none",
  },

  logo: {
    height: "54px",
    width: "auto",
    objectFit: "contain",
  },

  rightSide: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },

  navLink: {
    textDecoration: "none",
    color: "#062B5F",
    fontWeight: "800",
    fontSize: "15px",
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
  },

  navSvgIcon: {
    width: "17px",
    height: "17px",
    color: "#062B5F",
    flexShrink: 0,
  },

  userBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 10px",
    borderRadius: "12px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
  },

  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "#062B5F",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
    fontSize: "14px",
  },

  userText: {
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.1,
  },

  username: {
    fontSize: "14px",
    fontWeight: "700",
    color: "#111827",
  },

  logoutButton: {
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    padding: "10px 15px",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer",
  },
};

export default Navbar;