import { useEffect, useRef, useState } from "react";
import {
  fetchLiveData,
  fetchHistory,
  fetchActiveDelivery,
  fetchDriverDeliveries,
  toggleMonitoring,
  startDelivery,
  stopDelivery
} from "../services/api";
import StatusCard from "../components/dashboard/StatusCard";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import HistoryTable from "../components/dashboard/HistoryTable";

function Driver() {
  const DRIVER_ID = 1;

  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [driverDeliveries, setDriverDeliveries] = useState([]);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");
  const [buttonLoading, setButtonLoading] = useState(false);
  const [viewMode, setViewMode] = useState("assigned");
  const previousDataRef = useRef(null);

  const loadData = async () => {
    try {
      const [live, historyData, activeDeliveryData, deliveriesData] = await Promise.all([
        fetchLiveData(),
        fetchHistory(),
        fetchActiveDelivery(),
        fetchDriverDeliveries(DRIVER_ID)
      ]);

      const newLiveString = JSON.stringify(live);
      const oldLiveString = JSON.stringify(previousDataRef.current);

      if (!previousDataRef.current || newLiveString !== oldLiveString) {
        setLiveData(live);
        previousDataRef.current = live;
      } else {
      }

      const activeId = activeDeliveryData.active_delivery_id;
      const filteredHistory = activeId
        ? historyData.filter((row) => row.delivery_id === activeId)
        : [];

      setHistory(filteredHistory);
      setActiveDelivery(activeId);
      setDriverDeliveries(deliveriesData);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMonitoring = async () => {
    try {
      setButtonLoading(true);
      await toggleMonitoring();
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setButtonLoading(false);
    }
  };

  const handleStartDelivery = async (deliveryId) => {
    try {
      setActionMessage("");
      await startDelivery(deliveryId);
      setActionMessage(`Delivery ${deliveryId} started.`);
      await loadData();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleStopDelivery = async (deliveryId) => {
    try {
      setActionMessage("");
      await stopDelivery(deliveryId);
      setActionMessage(`Delivery ${deliveryId} completed.`);
      await loadData();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div style={styles.page}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!liveData) {
    return (
      <div style={styles.page}>
        <p>Loading...</p>
      </div>
    );
  }

  const assignedDeliveries = driverDeliveries.filter(
    (delivery) => delivery.status === "pending"
  );

  const accomplishedDeliveries = driverDeliveries.filter(
    (delivery) => delivery.status === "completed"
  );

  const currentDeliveryDetails = driverDeliveries.find(
    (delivery) => delivery.id === activeDelivery
  );

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Driver Panel</h1>
          <p style={styles.subtitle}>Manage assigned and completed deliveries</p>
        </div>

        <div style={styles.topRight}>
          {activeDelivery && (
            <button
              onClick={handleToggleMonitoring}
              disabled={buttonLoading}
              style={{
                ...styles.button,
                backgroundColor: liveData.monitoring_active ? "#c62828" : "#2e7d32"
              }}
            >
              {buttonLoading
                ? "Updating..."
                : liveData.monitoring_active
                ? "Stop Monitoring"
                : "Start Monitoring"}
            </button>
          )}
        </div>
      </div>

      {actionMessage && <p style={styles.message}>{actionMessage}</p>}

      <div style={styles.switchRow}>
        <button
          onClick={() => setViewMode("assigned")}
          style={{
            ...styles.switchButton,
            ...(viewMode === "assigned" ? styles.switchButtonActive : {})
          }}
        >
          Assigned Deliveries
        </button>

        <button
          onClick={() => setViewMode("accomplished")}
          style={{
            ...styles.switchButton,
            ...(viewMode === "accomplished" ? styles.switchButtonActive : {})
          }}
        >
          Accomplished Deliveries
        </button>
      </div>

      {viewMode === "assigned" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Assigned Deliveries</h2>

          {assignedDeliveries.length === 0 ? (
            <div style={styles.panel}>
              <p>No pending deliveries assigned to this driver.</p>
            </div>
          ) : (
            <div style={styles.assignmentsList}>
              {assignedDeliveries.map((delivery) => (
                <div key={delivery.id} style={styles.assignmentCard}>
                  <p><strong>Delivery ID:</strong> {delivery.id}</p>
                  <p><strong>School ID:</strong> {delivery.school_id}</p>
                  <p><strong>Food:</strong> {delivery.food_type}</p>
                  <p><strong>Quantity:</strong> {delivery.quantity}</p>
                  <p><strong>Status:</strong> {delivery.status}</p>
                  <p><strong>Notes:</strong> {delivery.notes || "-"}</p>
                  <button
                    style={styles.startButton}
                    onClick={() => handleStartDelivery(delivery.id)}
                  >
                    Start Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "accomplished" && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Accomplished Deliveries</h2>

          {accomplishedDeliveries.length === 0 ? (
            <div style={styles.panel}>
              <p>No completed deliveries yet.</p>
            </div>
          ) : (
            <div style={styles.assignmentsList}>
              {accomplishedDeliveries.map((delivery) => (
                <div key={delivery.id} style={styles.assignmentCard}>
                  <p><strong>Delivery ID:</strong> {delivery.id}</p>
                  <p><strong>School ID:</strong> {delivery.school_id}</p>
                  <p><strong>Food:</strong> {delivery.food_type}</p>
                  <p><strong>Quantity:</strong> {delivery.quantity}</p>
                  <p><strong>Status:</strong> {delivery.status}</p>
                  <p><strong>Start Time:</strong> {delivery.start_time || "-"}</p>
                  <p><strong>End Time:</strong> {delivery.end_time || "-"}</p>
                  <p><strong>Notes:</strong> {delivery.notes || "-"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeDelivery && (
        <>
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Current Delivery</h2>
            <div style={styles.grid}>
              <StatusCard
                title="Monitoring"
                value={liveData.monitoring_active ? "Active" : "Stopped"}
              />
              <StatusCard
                title="Active Delivery"
                value={activeDelivery ?? "None"}
              />
              <StatusCard
                title="GPS Time"
                value={liveData.gps_time ?? "-"}
              />
              <StatusCard
                title="Sensor Time"
                value={liveData.sensor_time ?? "-"}
              />
            </div>

            {currentDeliveryDetails && (
              <div style={styles.currentDeliveryCard}>
                <p><strong>School ID:</strong> {currentDeliveryDetails.school_id}</p>
                <p><strong>Food:</strong> {currentDeliveryDetails.food_type}</p>
                <p><strong>Quantity:</strong> {currentDeliveryDetails.quantity}</p>
                <p><strong>Status:</strong> {currentDeliveryDetails.status}</p>
                <p><strong>Notes:</strong> {currentDeliveryDetails.notes || "-"}</p>
              </div>
            )}

            <div style={styles.actionRow}>
              <button
                style={styles.stopButton}
                onClick={() => handleStopDelivery(activeDelivery)}
              >
                Complete Active Delivery
              </button>
            </div>
          </div>

          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>Live Conditions</h2>
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
                value={liveData.lat ?? "-"}
              />
              <StatusCard
                title="Longitude"
                value={liveData.lon ?? "-"}
              />
            </div>
          </div>

          <div style={styles.section}>
            <AlertsPanel alerts={liveData.alerts} />
          </div>

          <div style={styles.section}>
            <HistoryTable rows={history} />
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "100vh"
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px"
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },
  title: {
    margin: 0
  },
  subtitle: {
    marginTop: "6px",
    color: "#666"
  },

  button: {
    border: "none",
    color: "white",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },
  section: {
    marginTop: "24px"
  },
  sectionTitle: {
    marginBottom: "16px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },
  message: {
    padding: "12px 14px",
    background: "#ffffff",
    border: "1px solid #ddd",
    borderRadius: "10px",
    marginBottom: "16px"
  },
  actionRow: {
    marginTop: "16px"
  },
  stopButton: {
    border: "none",
    background: "#c62828",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },
  startButton: {
    border: "none",
    background: "#2e7d32",
    color: "#fff",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    marginTop: "8px"
  },
  panel: {
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  assignmentsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px"
  },
  assignmentCard: {
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  switchRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "8px"
  },
  switchButton: {
    border: "1px solid #ccc",
    background: "#fff",
    color: "#222",
    padding: "10px 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600"
  },
  switchButtonActive: {
    background: "#1e88e5",
    color: "#fff",
    border: "1px solid #1e88e5"
  },
  currentDeliveryCard: {
    marginTop: "16px",
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  }
};

export default Driver;