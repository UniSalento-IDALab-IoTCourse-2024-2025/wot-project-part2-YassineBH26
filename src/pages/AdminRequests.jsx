import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  assignRequest,
  fetchRequests,
  fetchDrivers,
  fetchLiveData,
  fetchHistory,
  recommendDriver
} from "../services/api";

import StatusCard from "../components/dashboard/StatusCard";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import HistoryTable from "../components/dashboard/HistoryTable";
import FoodItems from "../components/FoodItems";

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
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [selectedDrivers, setSelectedDrivers] = useState({});
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("requested");

  const [selectedMonitoringRequest, setSelectedMonitoringRequest] = useState(null);
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);

  const [aiLoadingRequestId, setAiLoadingRequestId] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState({});
  const [openAiDetails, setOpenAiDetails] = useState({});

  const loadDrivers = useCallback(async () => {
    const data = await fetchDrivers();
    setDrivers(data);
  }, []);

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
    loadDrivers();
  }, [loadRequests, loadDrivers]);

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

  const handleRecommendDriver = async (requestId) => {
    try {
      setMessage("");
      setAiLoadingRequestId(requestId);

      const data = await recommendDriver(requestId);

      setAiRecommendations((current) => ({
        ...current,
        [requestId]: data
      }));

      setOpenAiDetails((current) => ({
        ...current,
        [requestId]: true
      }));

      if (data.recommended_driver_id) {
        setSelectedDrivers((currentDrivers) => ({
          ...currentDrivers,
          [requestId]: String(data.recommended_driver_id)
        }));
      }

      setMessage(
        `AI recommendation ready: ${data.recommended_driver_name} (${data.predicted_risk} risk).`
      );
    } catch (error) {
      setMessage(`AI recommendation error: ${error.message}`);
    } finally {
      setAiLoadingRequestId(null);
    }
  };

  const toggleAiDetails = (requestId) => {
    setOpenAiDetails((current) => ({
      ...current,
      [requestId]: !current[requestId]
    }));
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

  const handleReport = (deliveryId) => {
    navigate(`/delivery-report/${deliveryId}`);
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

  const getDriverName = (driverId) => {
    const driver = drivers.find((item) => Number(item.id) === Number(driverId));
    return driver ? driver.full_name : `Driver ${driverId}`;
  };

  const totalRequests = requests.length;
  const requestedCount = requests.filter((req) => req.status === "requested").length;
  const assignedCount = requests.filter((req) => req.status === "assigned").length;
  const inProgressCount = requests.filter((req) => req.status === "in_progress").length;
  const completedCount = requests.filter((req) => req.status === "completed").length;

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((req) => req.status === statusFilter);

  if (selectedMonitoringRequest) {
    return (
      <div style={styles.page}>
        <button style={styles.backButton} onClick={handleBackToRequests}>
          ← Back to Requests
        </button>

        <div style={styles.monitoringBox}>
          <h1 style={styles.monitoringTitle}>
            Delivery ID {selectedMonitoringRequest.delivery_id} for School{" "}
            {selectedMonitoringRequest.school_name ||
              `School ${selectedMonitoringRequest.school_id}`}
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
                  <strong>School:</strong>{" "}
                  {selectedMonitoringRequest.school_name ||
                    `School ${selectedMonitoringRequest.school_id}`}
                </p>

                <div>
                  <strong>Food:</strong>
                  <div style={{ marginTop: "8px" }}>
                    <FoodItems foodText={selectedMonitoringRequest.food_type} />
                  </div>
                </div>

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
                <StatusCard
                  title="Latitude"
                  value={formatCoordinate(liveData.lat)}
                />
                <StatusCard
                  title="Longitude"
                  value={formatCoordinate(liveData.lon)}
                />
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
          <h1 style={styles.pageTitle}>Admin Control Center</h1>
          <p style={styles.subtitle}>
            Manage school requests, assign drivers, and monitor active deliveries.
          </p>
        </div>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.statsGrid}>
        <div style={styles.statCard} className="admin-stat-card">
          <span style={styles.statLabel}>Total Requests</span>
          <strong style={styles.statValue}>{totalRequests}</strong>
        </div>

        <div style={styles.statCard} className="admin-stat-card">
          <span style={styles.statLabel}>Requested</span>
          <strong style={styles.statValue}>{requestedCount}</strong>
        </div>

        <div style={styles.statCard} className="admin-stat-card">
          <span style={styles.statLabel}>Assigned</span>
          <strong style={styles.statValue}>{assignedCount}</strong>
        </div>

        <div style={styles.statCard} className="admin-stat-card">
          <span style={styles.statLabel}>In Progress</span>
          <strong style={styles.statValue}>{inProgressCount}</strong>
        </div>

        <div style={styles.statCard} className="admin-stat-card">
          <span style={styles.statLabel}>Completed</span>
          <strong style={styles.statValue}>{completedCount}</strong>
        </div>
      </div>

      <div style={styles.filterTabs}>
        <button
          style={{
            ...styles.filterTab,
            ...(statusFilter === "all" ? styles.filterTabActive : {})
          }}
          onClick={() => setStatusFilter("all")}
        >
          All
        </button>

        <button
          style={{
            ...styles.filterTab,
            ...(statusFilter === "requested" ? styles.filterTabActive : {})
          }}
          onClick={() => setStatusFilter("requested")}
        >
          Requested
        </button>

        <button
          style={{
            ...styles.filterTab,
            ...(statusFilter === "assigned" ? styles.filterTabActive : {})
          }}
          onClick={() => setStatusFilter("assigned")}
        >
          Assigned
        </button>

        <button
          style={{
            ...styles.filterTab,
            ...(statusFilter === "in_progress" ? styles.filterTabActive : {})
          }}
          onClick={() => setStatusFilter("in_progress")}
        >
          In Progress
        </button>

        <button
          style={{
            ...styles.filterTab,
            ...(statusFilter === "completed" ? styles.filterTabActive : {})
          }}
          onClick={() => setStatusFilter("completed")}
        >
          Completed
        </button>
      </div>

      <div style={styles.tableBox}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Request ID</th>
              <th style={styles.th}>School</th>
              <th style={styles.th}>Food Items</th>
              <th style={styles.th}>Requested Time</th>
              <th style={styles.th}>Notes</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Assign Driver</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRequests.length === 0 ? (
              <tr>
                <td style={styles.emptyCell} colSpan="8">
                  <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>✓</div>
                    <strong style={styles.emptyTitle}>No requests found</strong>
                    <span style={styles.emptyText}>
                      {statusFilter === "requested"
                        ? "There are no new school requests waiting for assignment."
                        : statusFilter === "assigned"
                          ? "There are no assigned deliveries waiting for drivers to start."
                          : statusFilter === "in_progress"
                            ? "There are no deliveries currently in progress."
                            : statusFilter === "completed"
                              ? "There are no completed deliveries to display."
                              : "There are no requests to display."}
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => {
                const aiResult = aiRecommendations[req.id];
                const isAiOpen = openAiDetails[req.id];

                return (
                  <tr key={req.id} className="admin-table-row">
                    <td style={styles.td}>{req.id}</td>

                    <td style={styles.td}>
                      <strong>{req.school_name || `School ${req.school_id}`}</strong>
                    </td>

                    <td style={styles.td}>
                      <FoodItems foodText={req.food_type} />
                    </td>

                    <td style={styles.td}>{req.requested_delivery_time}</td>
                    <td style={styles.td}>{req.special_notes || "-"}</td>

                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...getStatusStyle(req.status)
                        }}
                      >
                        {formatStatus(req.status)}
                      </span>
                    </td>

                    <td style={styles.td}>
                      {req.status === "requested" ? (
                        <div style={styles.assignCell}>
                          <div style={styles.driverSelectRow}>
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
                                  {driver.full_name}
                                </option>
                              ))}
                            </select>

                            <div style={styles.aiWrapper}>
                              <button
                                type="button"
                                style={{
                                  ...styles.aiButton,
                                  ...(aiLoadingRequestId === req.id
                                    ? styles.aiButtonLoading
                                    : {})
                                }}
                                onClick={() => handleRecommendDriver(req.id)}
                                disabled={aiLoadingRequestId === req.id}
                              >
                                {aiLoadingRequestId === req.id ? "…" : "🤖"}
                              </button>

                              <div style={styles.aiTooltip}>
                                AI agent: click to recommend the best driver for this
                                request using delivery history, food sensitivity, and
                                distance risk.
                              </div>
                            </div>
                          </div>

                          {aiResult && (
                            <div style={styles.aiRecommendationBox}>
                              <div style={styles.aiRecommendationHeader}>
                                <span style={styles.aiTitle}>AI Recommendation</span>

                                <button
                                  type="button"
                                  style={styles.aiToggleButton}
                                  onClick={() => toggleAiDetails(req.id)}
                                >
                                  {isAiOpen ? "Hide" : "Details"}
                                </button>
                              </div>

                              <div style={styles.aiMainLine}>
                                <strong>{aiResult.recommended_driver_name}</strong>
                                <span
                                  style={{
                                    ...styles.riskBadge,
                                    ...getRiskStyle(aiResult.predicted_risk)
                                  }}
                                >
                                  {aiResult.predicted_risk} risk
                                </span>
                                <span style={styles.scoreBadge}>
                                  score {aiResult.score}
                                </span>
                              </div>

                              {isAiOpen && (
                                <div style={styles.aiDetails}>
                                  <p style={styles.aiDetailsTitle}>
                                    Why this driver?
                                  </p>

                                  <ul style={styles.aiReasonsList}>
                                    {(aiResult.reasons || []).map((reason, index) => (
                                      <li key={index}>{reason}</li>
                                    ))}
                                  </ul>

                                  {aiResult.drivers && aiResult.drivers.length > 1 && (
                                    <>
                                      <p style={styles.aiDetailsTitle}>
                                        Other evaluated drivers
                                      </p>

                                      <div style={styles.aiDriverList}>
                                        {aiResult.drivers.slice(0, 3).map((driver) => (
                                          <div
                                            key={driver.driver_id}
                                            style={styles.aiDriverRow}
                                          >
                                            <span>{driver.driver_name}</span>
                                            <span
                                              style={{
                                                ...styles.riskBadgeSmall,
                                                ...getRiskStyle(driver.predicted_risk)
                                              }}
                                            >
                                              {driver.predicted_risk}
                                            </span>
                                            <span style={styles.scoreSmall}>
                                              {driver.score}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={styles.disabledText}>
                          {req.driver_id ? getDriverName(req.driver_id) : "Not available"}
                        </span>
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
                        <div style={styles.actionButtons}>
                          <button
                            style={styles.reportButton}
                            onClick={() => handleReport(req.delivery_id)}
                          >
                            Report
                          </button>

                          <button
                            style={styles.clearButton}
                            onClick={() => handleClear(req.id)}
                          >
                            Clear
                          </button>
                        </div>
                      )}

                      {req.status === "assigned" && (
                        <span style={styles.disabledText}>Waiting for driver</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatStatus(status) {
  if (status === "in_progress") return "in progress";
  return status;
}

function getStatusStyle(status) {
  if (status === "completed") {
    return { background: "#d4edda", color: "#155724" };
  }

  if (status === "assigned") {
    return { background: "#dbeafe", color: "#1e40af" };
  }

  if (status === "in_progress") {
    return { background: "#fef3c7", color: "#92400e" };
  }

  if (status === "requested") {
    return { background: "#e0f2fe", color: "#075985" };
  }

  return { background: "#eee", color: "#333" };
}

function getRiskStyle(risk) {
  if (risk === "low") {
    return { background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0" };
  }

  if (risk === "medium") {
    return { background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a" };
  }

  if (risk === "high") {
    return { background: "#fee2e2", color: "#991b1b", border: "1px solid #fecaca" };
  }

  return { background: "#e5e7eb", color: "#374151", border: "1px solid #d1d5db" };
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
    gap: "16px",
    marginTop: "24px"
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
    display: "flex",
    flexDirection: "column",
    gap: "8px"
  },

  statLabel: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "700"
  },

  statValue: {
    color: "#062B5F",
    fontSize: "30px",
    lineHeight: 1
  },

  filterTabs: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "18px",
    flexWrap: "wrap",
    alignItems: "center"
  },

  filterTab: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: "999px",
    fontWeight: "700",
    cursor: "pointer"
  },

  filterTabActive: {
    background: "#062B5F",
    color: "#ffffff",
    border: "1px solid #062B5F"
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

  backButton: {
    background: "#062B5F",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "16px"
  },

  tableBox: {
    background: "#ffffff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #e5e7eb",
    marginTop: "0",
    overflowX: "auto",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
  },

  table: {
    width: "100%",
    borderCollapse: "collapse"
  },

  th: {
    textAlign: "left",
    padding: "12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "800",
    verticalAlign: "middle",
    whiteSpace: "nowrap"
  },

  td: {
    padding: "14px 12px",
    borderBottom: "1px solid #f0f0f0",
    verticalAlign: "top",
    fontSize: "14px",
    color: "#111827"
  },

  assignCell: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "250px"
  },

  driverSelectRow: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },

  select: {
    height: "38px",
    padding: "0 10px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px",
    color: "#111827",
    minWidth: "170px"
  },

  aiWrapper: {
    position: "relative",
    display: "inline-flex"
  },

  aiButton: {
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    border: "1px solid #bae6fd",
    background: "#e0f2fe",
    color: "#075985",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "900",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },

  aiButtonLoading: {
    opacity: 0.7,
    cursor: "wait"
  },

  aiTooltip: {
    position: "absolute",
    bottom: "46px",
    right: 0,
    width: "260px",
    background: "#111827",
    color: "#ffffff",
    padding: "10px 12px",
    borderRadius: "12px",
    fontSize: "12px",
    lineHeight: 1.4,
    boxShadow: "0 10px 20px rgba(15, 23, 42, 0.25)",
    opacity: 0,
    visibility: "hidden",
    transform: "translateY(4px)",
    transition: "all 0.15s ease",
    zIndex: 20,
    pointerEvents: "none"
  },

  aiRecommendationBox: {
    border: "1px solid #bfdbfe",
    background: "#eff6ff",
    borderRadius: "14px",
    padding: "10px",
    maxWidth: "420px"
  },

  aiRecommendationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px"
  },

  aiTitle: {
    color: "#062B5F",
    fontWeight: "900",
    fontSize: "13px"
  },

  aiToggleButton: {
    border: "none",
    background: "#dbeafe",
    color: "#1e40af",
    borderRadius: "999px",
    padding: "4px 9px",
    fontWeight: "800",
    fontSize: "12px",
    cursor: "pointer"
  },

  aiMainLine: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "8px",
    color: "#111827"
  },

  aiDetails: {
    marginTop: "10px",
    borderTop: "1px solid #bfdbfe",
    paddingTop: "8px",
    color: "#1f2937",
    fontSize: "13px",
    lineHeight: 1.45
  },

  aiDetailsTitle: {
    margin: "6px 0",
    fontWeight: "900",
    color: "#062B5F"
  },

  aiReasonsList: {
    margin: "6px 0 10px 18px",
    padding: 0
  },

  aiDriverList: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    marginTop: "6px"
  },

  aiDriverRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "8px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
    borderRadius: "10px",
    padding: "7px 8px"
  },

  riskBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    fontSize: "12px",
    fontWeight: "900"
  },

  riskBadgeSmall: {
    padding: "3px 7px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "900"
  },

  scoreBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    background: "#ffffff",
    color: "#062B5F",
    border: "1px solid #bfdbfe",
    fontSize: "12px",
    fontWeight: "900"
  },

  scoreSmall: {
    color: "#062B5F",
    fontWeight: "900",
    fontSize: "12px"
  },

  assignButton: {
    height: "38px",
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "0 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },

  monitorButton: {
    height: "38px",
    background: "#062B5F",
    color: "#fff",
    border: "none",
    padding: "0 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },

  clearButton: {
    height: "38px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "0 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },

  reportButton: {
    height: "38px",
    background: "#062B5F",
    color: "#ffffff",
    border: "1px solid #062B5F",
    padding: "0 16px",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px"
  },

  actionButtons: {
    display: "flex",
    gap: "8px",
    alignItems: "center"
  },

  disabledText: {
    color: "#6b7280",
    fontSize: "14px"
  },

  statusBadge: {
    padding: "4px 9px",
    borderRadius: "999px",
    fontWeight: "700",
    fontSize: "13px"
  },

  emptyCell: {
    padding: "42px",
    textAlign: "center",
    borderBottom: "none"
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    color: "#6b7280",
    fontSize: "14px"
  },

  emptyIcon: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "#ecfdf5",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "20px",
    marginBottom: "4px"
  },

  emptyTitle: {
    color: "#111827",
    fontSize: "16px"
  },

  emptyText: {
    color: "#6b7280",
    fontSize: "14px"
  }
};

export default AdminRequests;