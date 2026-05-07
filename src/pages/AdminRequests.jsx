import { useEffect, useState, useCallback } from "react";
import {
  assignRequest,
  fetchRequests,
  fetchLiveData,
  fetchHistory
} from "../services/api";

import StatusCard from "../components/dashboard/StatusCard";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import HistoryTable from "../components/dashboard/HistoryTable";

const formatCoordinate = (value) => {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) {
    return "-";
  }

  return numberValue.toFixed(3);
};

const getClearedRequests = () => {
  return JSON.parse(localStorage.getItem("cleared_admin_requests") || "[]");
};

function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [message, setMessage] = useState("");

  const [selectedMonitoringRequest, setSelectedMonitoringRequest] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);

  const drivers = [{ id: 1, name: "Driver 1" }];

  const loadRequests = useCallback(async () => {
    const data = await fetchRequests();
    const clearedRequests = getClearedRequests();

    const visibleRequests = data.filter(
      (req) => !clearedRequests.includes(req.id)
    );

    setRequests(visibleRequests);
  }, []);

  const loadMonitoringData = useCallback(async () => {
    if (!selectedMonitoringRequest?.delivery_id) return;

    const [live, historyData] = await Promise.all([
      fetchLiveData(),
      fetchHistory()
    ]);

    const filteredHistory = historyData.filter(
      (row) => row.delivery_id === selectedMonitoringRequest.delivery_id
    );

    setLiveData(live);
    setHistory(filteredHistory);
  }, [selectedMonitoringRequest]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    loadMonitoringData();

    const interval = setInterval(() => {
      loadRequests();
      loadMonitoringData();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadRequests, loadMonitoringData]);

  const handleDriverChange = (requestId, driverId) => {
    setSelectedDrivers((currentDrivers) => ({
      ...currentDrivers,
      [requestId]: driverId
    }));
  };

  const handleAssign = async (requestId) => {
    const driverId = selectedDrivers[requestId];

    if (!driverId) {
      setMessage("Please choose a driver first.");
      return;
    }

    try {
      await assignRequest(requestId, Number(driverId));
      setMessage("Request assigned successfully.");
      await loadRequests();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    }
  };

  const handleClear = (requestId) => {
    const clearedRequests = getClearedRequests();

    if (!clearedRequests.includes(requestId)) {
      localStorage.setItem(
        "cleared_admin_requests",
        JSON.stringify([...clearedRequests, requestId])
      );
    }

    setRequests((currentRequests) =>
      currentRequests.filter((req) => req.id !== requestId)
    );

    setMessage("Completed request cleared from this interface.");
  };

  const handleMonitor = (request) => {
    setSelectedMonitoringRequest(request);
    setMessage("");
    setLiveData(null);
    setHistory([]);
  };

  const handleBackToRequests = () => {
    setSelectedMonitoringRequest(null);
    setLiveData(null);
    setHistory([]);
  };

  if (selectedMonitoringRequest) {
    return (
      <div style={styles.page}>
        <button style={styles.backButton} onClick={handleBackToRequests}>
          ← Back to Requests
        </button>

        <div style={styles.monitoringBox}>
          <h1 style={styles.monitoringTitle}>
            Delivery ID {selectedMonitoringRequest.delivery_id} for School{" "}
            {selectedMonitoringRequest.school_id}
          </h1>

          <p style={styles.subtitle}>
            Monitoring active delivery request #{selectedMonitoringRequest.id}
          </p>

          {!liveData ? (
            <p>Loading monitoring data...</p>
          ) : (
            <>
              <div style={styles.grid}>
                <StatusCard
                  title="Active Delivery"
                  value={selectedMonitoringRequest.delivery_id}
                />
                <StatusCard
                  title="Monitoring"
                  value={liveData.monitoring_active ? "Active" : "Stopped"}
                />
                <StatusCard title="GPS Time" value={liveData.gps_time ?? "-"} />
                <StatusCard
                  title="Sensor Time"
                  value={liveData.sensor_time ?? "-"}
                />
              </div>

              <div style={styles.activeRequestCard}>
                <p>
                  <strong>Request ID:</strong> {selectedMonitoringRequest.id}
                </p>
                <p>
                  <strong>School ID:</strong>{" "}
                  {selectedMonitoringRequest.school_id}
                </p>
                <p>
                  <strong>Food:</strong> {selectedMonitoringRequest.food_type}
                </p>
                <p>
                  <strong>Quantity:</strong>{" "}
                  {selectedMonitoringRequest.quantity}
                </p>
                <p>
                  <strong>Notes:</strong>{" "}
                  {selectedMonitoringRequest.special_notes || "-"}
                </p>
              </div>

              <h2 style={styles.subSectionTitle}>Live Conditions</h2>

              <div style={styles.grid}>
                <StatusCard
                  title="Temperature"
                  value={`${liveData.temperature ?? "-"} C`}
                />
                <StatusCard
                  title="Humidity"
                  value={`${liveData.humidity ?? "-"} %`}
                />
                <StatusCard
                  title="Tilt"
                  value={liveData.tilt ? "Tilted" : "Normal"}
                />
                <StatusCard title="Latitude" value={formatCoordinate(liveData.lat)}/>
                <StatusCard title="Longitude" value={formatCoordinate(liveData.lon)} />
              </div>

              <div style={styles.sectionSpacing}>
                <AlertsPanel alerts={liveData.alerts} />
              </div>

              <div style={styles.sectionSpacing}>
                <HistoryTable rows={history} />
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1>Admin Requests</h1>
          <p style={styles.subtitle}>
            Review and assign school delivery requests
          </p>
        </div>

        <button style={styles.refreshButton} onClick={loadRequests}>
          Refresh
        </button>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.tableBox}>
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
            {requests.length === 0 ? (
              <tr>
                <td style={styles.td} colSpan="9">
                  No requests found.
                </td>
              </tr>
            ) : (
              requests.map((req) => (
                <tr key={req.id}>
                  <td style={styles.td}>{req.id}</td>
                  <td style={styles.td}>{req.school_id}</td>
                  <td style={styles.td}>{req.food_type}</td>
                  <td style={styles.td}>{req.quantity}</td>
                  <td style={styles.td}>{req.requested_delivery_time}</td>
                  <td style={styles.td}>{req.special_notes || "-"}</td>

                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(req.status)
                      }}
                    >
                      {req.status}
                    </span>
                  </td>

                  <td style={styles.td}>
                    {req.status === "requested" ? (
                      <select
                        style={styles.select}
                        value={selectedDrivers[req.id] || ""}
                        onChange={(e) =>
                          handleDriverChange(req.id, e.target.value)
                        }
                      >
                        <option value="">Choose driver</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span style={styles.disabledText}>Not available</span>
                    )}
                  </td>

                  <td style={styles.td}>
                    {req.status === "requested" && (
                      <button
                        style={styles.assignButton}
                        onClick={() => handleAssign(req.id)}
                      >
                        Assign
                      </button>
                    )}

                    {req.status === "in_progress" && (
                      <button
                        style={styles.monitorButton}
                        onClick={() => handleMonitor(req)}
                      >
                        Monitor
                      </button>
                    )}

                    {req.status === "completed" && (
                      <button
                        style={styles.clearButton}
                        onClick={() => handleClear(req.id)}
                      >
                        Clear
                      </button>
                    )}

                    {req.status === "assigned" && (
                      <span style={styles.disabledText}>Waiting for driver</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getStatusStyle(status) {
  if (status === "completed") {
    return { background: "#d4edda", color: "#155724" };
  }

  if (status === "assigned") {
    return { background: "#cce5ff", color: "#004085" };
  }

  if (status === "in_progress") {
    return { background: "#fff3cd", color: "#856404" };
  }

  return { background: "#eee", color: "#333" };
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
  subtitle: {
    color: "#555"
  },
  refreshButton: {
    background: "#1e88e5",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer"
  },
  backButton: {
    background: "#555",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "600",
    cursor: "pointer",
    marginBottom: "16px"
  },
  message: {
    background: "#fff",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd"
  },
  monitoringBox: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    marginTop: "24px"
  },
  monitoringTitle: {
    marginTop: 0
  },
  subSectionTitle: {
    marginTop: "20px",
    marginBottom: "12px"
  },
  sectionSpacing: {
    marginTop: "18px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },
  activeRequestCard: {
    marginTop: "16px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "14px",
    background: "#f9fbff"
  },
  tableBox: {
    background: "#fff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    marginTop: "24px"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #ddd"
  },
  td: {
    padding: "12px",
    borderBottom: "1px solid #eee"
  },
  select: {
    padding: "8px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },
  assignButton: {
    background: "#2e7d32",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer"
  },
  monitorButton: {
    background: "#1e88e5",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer"
  },
  clearButton: {
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer"
  },
  disabledText: {
    color: "#777",
    fontSize: "14px"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    fontWeight: "600"
  }
};

export default AdminRequests;