import { useEffect, useState } from "react";
import { fetchRequests, assignRequest } from "../services/api";

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await fetchRequests();
      setRequests(data);
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDriverChange = (requestId, driverId) => {
    setSelectedDrivers((prev) => ({
      ...prev,
      [requestId]: driverId
    }));
  };

  const handleAssign = async (requestId) => {
    const driverId = selectedDrivers[requestId];

    if (!driverId) {
      setActionMessage("Please choose a driver first.");
      return;
    }

    try {
      const result = await assignRequest(requestId, Number(driverId));
      setActionMessage(
        `Request ${requestId} assigned successfully. Delivery created: ${result.delivery_id}`
      );
      await loadRequests();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Admin Requests</h1>
        <p>Loading requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <h1 style={styles.title}>Admin Requests</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Requests</h1>
          <p style={styles.subtitle}>Review and assign school delivery requests</p>
        </div>
        <button style={styles.refreshButton} onClick={loadRequests}>
          Refresh
        </button>
      </div>

      {actionMessage && <p style={styles.message}>{actionMessage}</p>}

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Request ID</th>
              <th style={styles.th}>School</th>
              <th style={styles.th}>Food</th>
              <th style={styles.th}>Quantity</th>
              <th style={styles.th}>Requested Time</th>
              <th style={styles.th}>Notes</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Assign Driver</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => {
              const alreadyAssigned = req.status === "assigned";

              return (
                <tr key={req.id}>
                  <td style={styles.td}>{req.id}</td>
                  <td style={styles.td}>{req.school_id}</td>
                  <td style={styles.td}>{req.food_type}</td>
                  <td style={styles.td}>{req.quantity}</td>
                  <td style={styles.td}>{req.requested_delivery_time}</td>
                  <td style={styles.td}>{req.special_notes || "-"}</td>
                  <td style={styles.td}>{req.status}</td>
                  <td style={styles.td}>
                    <select
                      value={selectedDrivers[req.id] || ""}
                      onChange={(e) => handleDriverChange(req.id, e.target.value)}
                      disabled={alreadyAssigned}
                      style={styles.select}
                    >
                      <option value="">Choose driver</option>
                      <option value="1">Driver 1</option>
                      <option value="2">Driver 2</option>
                    </select>
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => handleAssign(req.id)}
                      disabled={alreadyAssigned}
                      style={{
                        ...styles.assignButton,
                        opacity: alreadyAssigned ? 0.5 : 1,
                        cursor: alreadyAssigned ? "not-allowed" : "pointer"
                      }}
                    >
                      {alreadyAssigned ? "Assigned" : "Assign"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "100vh"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px"
  },
  title: {
    margin: 0
  },
  subtitle: {
    marginTop: "6px",
    color: "#666"
  },
  message: {
    padding: "12px 14px",
    background: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    marginBottom: "16px"
  },
  refreshButton: {
    border: "none",
    background: "#1e88e5",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },
  tableWrapper: {
    background: "#fff",
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    overflowX: "auto",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #ddd",
    background: "#f8f9fb"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eee",
    verticalAlign: "top"
  },
  select: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },
  assignButton: {
    border: "none",
    background: "#2e7d32",
    color: "#fff",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600"
  }
};

export default AdminRequests;