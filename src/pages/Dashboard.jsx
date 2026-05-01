import { useEffect, useRef, useState } from "react";
import {
  fetchLiveData,
  fetchHistory,
  fetchActiveDelivery,
  toggleMonitoring
} from "../services/api";
import StatusCard from "../components/dashboard/StatusCard";
import AlertsPanel from "../components/dashboard/AlertsPanel";
import HistoryTable from "../components/dashboard/HistoryTable";

function Dashboard() {
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Loading...");
  const [error, setError] = useState("");
  const [buttonLoading, setButtonLoading] = useState(false);
  const previousDataRef = useRef(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [live, historyData, activeDeliveryData] = await Promise.all([
          fetchLiveData(),
          fetchHistory(),
          fetchActiveDelivery()
        ]);

        const newLiveString = JSON.stringify(live);
        const oldLiveString = JSON.stringify(previousDataRef.current);

        if (!previousDataRef.current || newLiveString !== oldLiveString) {
          setLiveData(live);
          setStatusMessage("Data updated");
          previousDataRef.current = live;
        } else {
          setStatusMessage("No change");
        }

        setHistory(historyData);
        setActiveDelivery(activeDeliveryData.active_delivery_id);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    };

    loadData();
    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleMonitoring = async () => {
    try {
      setButtonLoading(true);
      await toggleMonitoring();

      const [updatedLive, updatedActive] = await Promise.all([
        fetchLiveData(),
        fetchActiveDelivery()
      ]);

      setLiveData(updatedLive);
      setActiveDelivery(updatedActive.active_delivery_id);
      previousDataRef.current = updatedLive;
    } catch (err) {
      setError(err.message);
    } finally {
      setButtonLoading(false);
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

  return (
    <div style={styles.page}>
      <div style={styles.topBar}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Food delivery monitoring platform</p>
        </div>

        <div style={styles.topRight}>
          <p style={styles.status}>{statusMessage}</p>
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
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Current Delivery Status</h2>
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
  status: {
    margin: 0,
    color: "#555",
    fontWeight: "600"
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
  }
};

export default Dashboard;