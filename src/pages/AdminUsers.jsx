import { useEffect, useState, useCallback } from "react";
import { createAccount, fetchAdminUsers, geocodeAddress } from "../services/api";

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [role, setRole] = useState("driver");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [locationCandidates, setLocationCandidates] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [geocodeLoading, setGeocodeLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadUsers = useCallback(async () => {
    const data = await fetchAdminUsers();
    setUsers(data);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setLocationCandidates([]);
    setSelectedLocation(null);
  };

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setAddress("");
    setLocationCandidates([]);
    setSelectedLocation(null);
    setMessage("");
  };

  const handleAddressChange = (value) => {
    setAddress(value);
    setSelectedLocation(null);
    setLocationCandidates([]);
  };

  const handleFindLocation = async () => {
    if (!address.trim()) {
      setMessage("Please enter a school address first.");
      return;
    }

    try {
      setGeocodeLoading(true);
      setMessage("");
      setSelectedLocation(null);

      const data = await geocodeAddress(address.trim());
      setLocationCandidates(data.candidates || []);

      if (!data.candidates || data.candidates.length === 0) {
        setMessage("No location found for this address. Try a more complete address.");
      }
    } catch (error) {
      setMessage(`Location search error: ${error.message}`);
    } finally {
      setGeocodeLoading(false);
    }
  };

  const handleSelectLocation = (candidate) => {
    setSelectedLocation(candidate);
    setAddress(candidate.display_name);
    setMessage("Location selected successfully.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password || !name || !role) {
      setMessage("Please fill username, password, role, and name.");
      return;
    }

    if (role === "school" && !address.trim()) {
      setMessage("Please enter the school address.");
      return;
    }

    if (role === "school" && !selectedLocation) {
      setMessage("Please find and select a confirmed school location before creating the account.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      await createAccount({
        username,
        password,
        role,
        name,
        email,
        phone,
        address,
        latitude: selectedLocation ? selectedLocation.latitude : null,
        longitude: selectedLocation ? selectedLocation.longitude : null
      });

      setMessage(`${role === "driver" ? "Driver" : "School"} account created successfully.`);
      resetForm();
      await loadUsers();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const driverUsers = users.filter((user) => user.role === "driver");
  const schoolUsers = users.filter((user) => user.role === "school");
  const adminUsers = users.filter((user) => user.role === "admin");

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>User Management</h1>
          <p style={styles.subtitle}>
            Create and manage school and driver accounts.
          </p>
        </div>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.layout}>
        <form onSubmit={handleSubmit} style={styles.formCard}>
          <h2 style={styles.cardTitle}>Create Account</h2>
          <p style={styles.cardSubtitle}>
            New users created here can immediately log in to the platform.
          </p>

          <label style={styles.label}>Account Type</label>
          <div style={styles.roleSwitch}>
            <button
              type="button"
              onClick={() => handleRoleChange("driver")}
              style={{
                ...styles.roleButton,
                ...(role === "driver" ? styles.roleButtonActive : {})
              }}
            >
              Driver
            </button>

            <button
              type="button"
              onClick={() => handleRoleChange("school")}
              style={{
                ...styles.roleButton,
                ...(role === "school" ? styles.roleButtonActive : {})
              }}
            >
              School
            </button>
          </div>

          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={role === "driver" ? "example: driver3" : "example: school2"}
            required
          />

          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            required
          />

          <label style={styles.label}>
            {role === "driver" ? "Driver Full Name" : "School Name"}
          </label>
          <input
            style={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={role === "driver" ? "Example: Ahmed Ben Ali" : "Example: Primary School Lecce"}
            required
          />

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
          />

          <label style={styles.label}>Phone</label>
          <input
            style={styles.input}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number"
          />

          {role === "school" && (
            <>
              <label style={styles.label}>School Address</label>

              <div style={styles.addressRow}>
                <input
                  style={{ ...styles.input, ...styles.addressInput }}
                  value={address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder="Example: Viale Giuseppe Grassi 25D, Lecce, Italy"
                  required
                />

                <button
                  type="button"
                  style={styles.findButton}
                  onClick={handleFindLocation}
                  disabled={geocodeLoading}
                >
                  {geocodeLoading ? "Searching..." : "Find"}
                </button>
              </div>

              {selectedLocation && (
                <div style={styles.selectedLocationBox}>
                  <strong>Selected location</strong>
                  <span>{selectedLocation.display_name}</span>
                  <small>
                    {Number(selectedLocation.latitude).toFixed(6)},{" "}
                    {Number(selectedLocation.longitude).toFixed(6)}
                  </small>
                </div>
              )}

              {locationCandidates.length > 0 && !selectedLocation && (
                <div style={styles.candidatesBox}>
                  <strong style={styles.candidatesTitle}>Choose the correct location</strong>

                  {locationCandidates.map((candidate, index) => (
                    <button
                      key={`${candidate.latitude}-${candidate.longitude}-${index}`}
                      type="button"
                      style={styles.candidateItem}
                      onClick={() => handleSelectLocation(candidate)}
                    >
                      <span style={styles.candidateIndex}>{index + 1}</span>

                      <span style={styles.candidateText}>
                        {candidate.display_name}
                        <small>
                          {Number(candidate.latitude).toFixed(6)},{" "}
                          {Number(candidate.longitude).toFixed(6)}
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <button style={styles.submitButton} disabled={loading || geocodeLoading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>

        <div style={styles.usersColumn}>
          <div style={styles.summaryGrid}>
            <SummaryCard label="Admins" value={adminUsers.length} />
            <SummaryCard label="Schools" value={schoolUsers.length} />
            <SummaryCard label="Drivers" value={driverUsers.length} />
          </div>

          <div style={styles.tableCard}>
            <h2 style={styles.cardTitle}>Existing Accounts</h2>

            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Username</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Phone</th>
                  <th style={styles.th}>Location</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td style={styles.td} colSpan="6">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td style={styles.td}>
                        <strong>{user.username}</strong>
                      </td>

                      <td style={styles.td}>
                        <span
                          style={{
                            ...styles.roleBadge,
                            ...getRoleStyle(user.role)
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td style={styles.td}>{user.display_name || "-"}</td>
                      <td style={styles.td}>{user.email || "-"}</td>
                      <td style={styles.td}>{user.phone || "-"}</td>

                      <td style={styles.td}>
                        {user.role === "school" ? (
                          user.latitude && user.longitude ? (
                            <span style={styles.locationBadge}>confirmed</span>
                          ) : (
                            <span style={styles.locationMissing}>missing</span>
                          )
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div style={styles.noteBox}>
            <strong>Prototype note:</strong> In this exam version, the admin creates
            operational accounts directly. For schools, the address is confirmed through
            geocoding and stored internally as GPS coordinates for later delivery distance
            calculations.
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div style={styles.summaryCard} className="admin-stat-card">
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
    </div>
  );
}

function getRoleStyle(role) {
  if (role === "admin") {
    return { background: "#e0f2fe", color: "#075985" };
  }

  if (role === "driver") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (role === "school") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  return { background: "#e5e7eb", color: "#374151" };
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "100vh"
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start"
  },

  pageTitle: {
    margin: 0,
    fontSize: "32px",
    color: "#111827",
    lineHeight: 1.1
  },

  subtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "6px",
    marginBottom: 0
  },

  message: {
    background: "#ffffff",
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    marginTop: "18px",
    color: "#374151"
  },

  layout: {
    display: "grid",
    gridTemplateColumns: "420px 1fr",
    gap: "20px",
    marginTop: "24px",
    alignItems: "start"
  },

  formCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "20px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },

  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px"
  },

  cardSubtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "4px",
    marginBottom: "8px",
    lineHeight: 1.4
  },

  label: {
    color: "#111827",
    fontWeight: "700",
    fontSize: "14px"
  },

  input: {
    height: "40px",
    border: "1px solid #d1d5db",
    borderRadius: "10px",
    padding: "0 12px",
    fontSize: "14px",
    outline: "none"
  },

  roleSwitch: {
    display: "flex",
    gap: "10px",
    marginBottom: "4px"
  },

  roleButton: {
    flex: 1,
    height: "40px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    borderRadius: "10px",
    fontWeight: "800",
    cursor: "pointer"
  },

  roleButtonActive: {
    background: "#062B5F",
    color: "#ffffff",
    border: "1px solid #062B5F"
  },

  addressRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },

  addressInput: {
    flex: 1
  },

  findButton: {
    height: "40px",
    border: "1px solid #062B5F",
    background: "#062B5F",
    color: "#ffffff",
    borderRadius: "10px",
    padding: "0 14px",
    fontWeight: "800",
    cursor: "pointer"
  },

  candidatesBox: {
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "10px",
    background: "#f9fafb",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  candidatesTitle: {
    fontSize: "13px",
    color: "#374151",
    marginBottom: "2px"
  },

  candidateItem: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    borderRadius: "12px",
    padding: "10px",
    textAlign: "left",
    cursor: "pointer",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start"
  },

  candidateIndex: {
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    background: "#e0f2fe",
    color: "#075985",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0
  },

  candidateText: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    color: "#111827",
    fontSize: "13px",
    lineHeight: 1.35
  },

  selectedLocationBox: {
    border: "1px solid #bbf7d0",
    background: "#ecfdf5",
    color: "#166534",
    borderRadius: "14px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    fontSize: "13px",
    lineHeight: 1.35
  },

  submitButton: {
    marginTop: "10px",
    height: "42px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: "800",
    cursor: "pointer",
    fontSize: "14px"
  },

  usersColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "16px"
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px"
  },

  summaryCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
  },

  summaryLabel: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "700"
  },

  summaryValue: {
    display: "block",
    marginTop: "8px",
    color: "#062B5F",
    fontSize: "30px",
    lineHeight: 1
  },

  tableCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    overflowX: "auto"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "14px"
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    fontSize: "14px",
    whiteSpace: "nowrap"
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #f0f0f0",
    color: "#111827",
    fontSize: "14px",
    verticalAlign: "middle"
  },

  roleBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px"
  },

  locationBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#dcfce7",
    color: "#166534",
    fontWeight: "800",
    fontSize: "13px"
  },

  locationMissing: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "800",
    fontSize: "13px"
  },

  noteBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    color: "#374151",
    fontSize: "14px",
    lineHeight: 1.5
  }
};

export default AdminUsers;