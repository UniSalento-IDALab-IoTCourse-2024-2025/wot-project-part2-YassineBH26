import { useEffect, useRef, useState, useCallback } from "react";
import {
  fetchLiveData,
  fetchHistory,
  fetchActiveDelivery,
  fetchDriverDeliveries,
  startDelivery,
  stopDelivery
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

const getClearedDriverDeliveries = () => {
  return JSON.parse(localStorage.getItem("cleared_driver_deliveries") || "[]");
};

function Driver() {
  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [driverDeliveries, setDriverDeliveries] = useState([]);
  const [actionMessage, setActionMessage] = useState("");
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("assigned");

  const previousDataRef = useRef(null);

  const loadData = useCallback(async () => {
    try {
      const [live, historyData, activeDeliveryData, deliveriesData] =
        await Promise.all([
          fetchLiveData(),
          fetchHistory(),
          fetchActiveDelivery(),
          fetchDriverDeliveries()
        ]);

      const newLiveString = JSON.stringify(live);
      const oldLiveString = JSON.stringify(previousDataRef.current);

      if (!previousDataRef.current || newLiveString !== oldLiveString) {
        setLiveData(live);
        previousDataRef.current = live;
      }

      const activeId = activeDeliveryData.active_delivery_id;

      const clearedDeliveries = getClearedDriverDeliveries();
      const visibleDeliveries = deliveriesData.filter(
        (delivery) => !clearedDeliveries.includes(delivery.id)
      );

      const activeDriverDelivery = visibleDeliveries.find(
        (delivery) =>
          delivery.id === activeId && delivery.status === "in_progress"
      );

      const activeDriverDeliveryId = activeDriverDelivery
        ? activeDriverDelivery.id
        : null;

      const filteredHistory = activeDriverDeliveryId
        ? historyData.filter((row) => row.delivery_id === activeDriverDeliveryId)
        : [];

      setHistory(filteredHistory);
      setActiveDelivery(activeDriverDeliveryId);
      setDriverDeliveries(visibleDeliveries);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    loadData();

    const interval = setInterval(loadData, 3000);

    return () => clearInterval(interval);
  }, [loadData]);

  const handleStartDelivery = async (deliveryId) => {
    try {
      setActionMessage("");
      await startDelivery(deliveryId);
      setActionMessage(`Delivery ${deliveryId} started.`);
      setViewMode("live");
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
      setViewMode("accomplished");
      await loadData();
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const handleClear = (deliveryId) => {
    const clearedDeliveries = getClearedDriverDeliveries();

    if (!clearedDeliveries.includes(deliveryId)) {
      localStorage.setItem(
        "cleared_driver_deliveries",
        JSON.stringify([...clearedDeliveries, deliveryId])
      );
    }

    setDriverDeliveries((currentDeliveries) =>
      currentDeliveries.filter((delivery) => delivery.id !== deliveryId)
    );

    setActionMessage("Completed delivery cleared from this interface.");
  };

  if (error) {
    return (
      <div style={styles.page}>
        <div style={styles.errorBox}>Error: {error}</div>
      </div>
    );
  }

  if (!liveData) {
    return (
      <div style={styles.page}>
        <div style={styles.loadingBox}>Loading driver workspace...</div>
      </div>
    );
  }

  const assignedDeliveries = driverDeliveries.filter(
    (delivery) => delivery.status === "assigned"
  );

  const accomplishedDeliveries = driverDeliveries.filter(
    (delivery) => delivery.status === "completed"
  );

  const inProgressDeliveries = driverDeliveries.filter(
    (delivery) => delivery.status === "in_progress"
  );

  const currentDeliveryDetails = driverDeliveries.find(
    (delivery) => delivery.id === activeDelivery
  );

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>Driver Panel</h1>
          <p style={styles.subtitle}>
            Manage assigned deliveries and monitor active transport conditions.
          </p>
        </div>
      </div>

      {actionMessage && <p style={styles.message}>{actionMessage}</p>}

      <div style={styles.statsGrid}>
        <SummaryCard label="Assigned" value={assignedDeliveries.length} />
        <SummaryCard label="In Progress" value={inProgressDeliveries.length} />
        <SummaryCard label="Completed" value={accomplishedDeliveries.length} />
        <SummaryCard
          label="Monitoring"
          value={liveData.monitoring_active ? "Active" : "Stopped"}
          compact
        />
      </div>

      <div style={styles.switchRow}>
        <button
          type="button"
          onClick={() => setViewMode("assigned")}
          style={{
            ...styles.switchButton,
            ...(viewMode === "assigned" ? styles.switchButtonActive : {})
          }}
        >
          Assigned Deliveries
        </button>

        <button
          type="button"
          onClick={() => setViewMode("accomplished")}
          style={{
            ...styles.switchButton,
            ...(viewMode === "accomplished" ? styles.switchButtonActive : {})
          }}
        >
          Completed Deliveries
        </button>

        <button
          type="button"
          onClick={() => setViewMode("live")}
          style={{
            ...styles.switchButton,
            ...(viewMode === "live" ? styles.switchButtonActive : {})
          }}
        >
          Live Delivery
        </button>
      </div>

      {viewMode === "assigned" && (
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Assigned Deliveries</h2>
              <p style={styles.sectionSubtitle}>
                Deliveries waiting to be started by the driver.
              </p>
            </div>
          </div>

          {assignedDeliveries.length === 0 ? (
            <EmptyState
              title="No assigned deliveries"
              text="There are no pending deliveries assigned to this driver."
            />
          ) : (
            <div style={styles.deliveryGrid}>
              {assignedDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  action={
                    <button
                      style={styles.startButton}
                      onClick={() => handleStartDelivery(delivery.id)}
                    >
                      Start Delivery
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "accomplished" && (
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Completed Deliveries</h2>
              <p style={styles.sectionSubtitle}>
                Deliveries already completed by this driver.
              </p>
            </div>
          </div>

          {accomplishedDeliveries.length === 0 ? (
            <EmptyState
              title="No completed deliveries yet"
              text="Completed deliveries will appear here after finishing a route."
            />
          ) : (
            <div style={styles.deliveryGrid}>
              {accomplishedDeliveries.map((delivery) => (
                <DeliveryCard
                  key={delivery.id}
                  delivery={delivery}
                  showTimes
                  action={
                    <button
                      type="button"
                      style={styles.clearButton}
                      onClick={() => handleClear(delivery.id)}
                    >
                      Clear
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "live" && (
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Live Delivery</h2>
              <p style={styles.sectionSubtitle}>
                Monitor the active delivery and complete it when it reaches the school.
              </p>
            </div>
          </div>

          {!activeDelivery || !currentDeliveryDetails ? (
            <EmptyState
              title="No active delivery"
              text="Start an assigned delivery first. Live monitoring will appear here."
            />
          ) : (
            <>
              <div style={styles.currentDeliveryCard}>
                <div style={styles.currentDeliveryTop}>
                  <div>
                    <span style={styles.smallLabel}>Delivery</span>
                    <strong style={styles.deliveryId}>
                      #{currentDeliveryDetails.id}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.smallLabel}>School</span>
                    <strong style={styles.metaValue}>
                      School {currentDeliveryDetails.school_id}
                    </strong>
                  </div>

                  <div>
                    <span style={styles.smallLabel}>Status</span>
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle("in_progress")
                      }}
                    >
                      in progress
                    </span>
                  </div>
                </div>

                <div style={styles.requestBlock}>
                  <span style={styles.smallLabel}>Food items</span>
                  <div style={styles.foodItemsSpacing}>
                    <FoodItems foodText={currentDeliveryDetails.food_type} />
                  </div>
                </div>

                <div style={styles.requestBlock}>
                  <span style={styles.smallLabel}>Notes</span>
                  <strong style={styles.metaValue}>
                    {currentDeliveryDetails.notes || "-"}
                  </strong>
                </div>

                <button
                  style={styles.stopButton}
                  onClick={() => handleStopDelivery(activeDelivery)}
                >
                  Complete Active Delivery
                </button>
              </div>

              <h3 style={styles.subSectionTitle}>Live Monitoring Status</h3>

              <div style={styles.grid}>
                <StatusCard
                  title="Monitoring"
                  value={liveData.monitoring_active ? "Active" : "Stopped"}
                />
                <StatusCard title="Active Delivery" value={activeDelivery ?? "None"} />
                <StatusCard title="GPS Time" value={liveData.gps_time ?? "-"} />
                <StatusCard title="Sensor Time" value={liveData.sensor_time ?? "-"} />
              </div>

              <h3 style={styles.subSectionTitle}>Live Conditions</h3>

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
      )}
    </div>
  );
}

function DeliveryCard({ delivery, action, showTimes = false }) {
  return (
    <div style={styles.deliveryCard}>
      <div style={styles.deliveryCardTop}>
        <div>
          <span style={styles.smallLabel}>Delivery</span>
          <strong style={styles.deliveryId}>#{delivery.id}</strong>
        </div>

        <span style={{ ...styles.statusBadge, ...getStatusStyle(delivery.status) }}>
          {formatStatus(delivery.status)}
        </span>
      </div>

      <div style={styles.metaGrid}>
        <div>
          <span style={styles.smallLabel}>School</span>
          <strong style={styles.metaValue}>School {delivery.school_id}</strong>
        </div>

        <div>
          <span style={styles.smallLabel}>Notes</span>
          <strong style={styles.metaValue}>{delivery.notes || "-"}</strong>
        </div>
      </div>

      <div style={styles.requestBlock}>
        <span style={styles.smallLabel}>Food items</span>
        <div style={styles.foodItemsSpacing}>
          <FoodItems foodText={delivery.food_type} />
        </div>
      </div>

      {showTimes && (
        <div style={styles.timeBox}>
          <div>
            <span style={styles.smallLabel}>Start time</span>
            <strong style={styles.metaValue}>{delivery.start_time || "-"}</strong>
          </div>

          <div>
            <span style={styles.smallLabel}>End time</span>
            <strong style={styles.metaValue}>{delivery.end_time || "-"}</strong>
          </div>
        </div>
      )}

      <div style={styles.cardAction}>{action}</div>
    </div>
  );
}

function SummaryCard({ label, value, compact = false }) {
  return (
    <div style={styles.summaryCard} className="admin-stat-card">
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={compact ? styles.summaryValueSmall : styles.summaryValue}>
        {value}
      </strong>
    </div>
  );
}

function EmptyState({ title, text }) {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIconLarge}>✓</div>
      <strong style={styles.emptyTitle}>{title}</strong>
      <span style={styles.emptyText}>{text}</span>
    </div>
  );
}

function formatStatus(status) {
  if (status === "in_progress") return "in progress";
  return status;
}

function getStatusStyle(status) {
  if (status === "completed") {
    return { background: "#dcfce7", color: "#166534" };
  }

  if (status === "assigned") {
    return { background: "#dbeafe", color: "#1e40af" };
  }

  if (status === "in_progress") {
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
    marginTop: "8px",
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

  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "14px",
    borderRadius: "12px"
  },

  loadingBox: {
    background: "#ffffff",
    color: "#374151",
    border: "1px solid #e5e7eb",
    padding: "14px",
    borderRadius: "12px"
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px",
    marginTop: "24px"
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

  summaryValueSmall: {
    display: "block",
    marginTop: "8px",
    color: "#062B5F",
    fontSize: "24px",
    lineHeight: 1
  },

  switchRow: {
    display: "flex",
    gap: "10px",
    marginTop: "20px",
    marginBottom: "18px",
    flexWrap: "wrap"
  },

  switchButton: {
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#374151",
    padding: "10px 16px",
    borderRadius: "999px",
    cursor: "pointer",
    fontWeight: "800"
  },

  switchButtonActive: {
    background: "#062B5F",
    color: "#ffffff",
    border: "1px solid #062B5F"
  },

  sectionBox: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    marginBottom: "18px"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px",
    gap: "14px"
  },

  sectionTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "24px"
  },

  sectionSubtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "6px",
    marginBottom: 0
  },

  deliveryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px"
  },

  deliveryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    background: "#f9fbff",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.03)"
  },

  deliveryCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px"
  },

  deliveryId: {
    color: "#062B5F",
    fontSize: "22px",
    lineHeight: 1
  },

  smallLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
    marginBottom: "4px"
  },

  statusBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    whiteSpace: "nowrap"
  },

  metaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "14px"
  },

  metaValue: {
    color: "#111827",
    fontSize: "14px",
    lineHeight: 1.35
  },

  requestBlock: {
    marginTop: "12px",
    marginBottom: "12px"
  },

  foodItemsSpacing: {
    marginTop: "8px",
    marginBottom: "8px"
  },

  timeBox: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    borderTop: "1px solid #e5e7eb",
    paddingTop: "12px",
    marginTop: "12px"
  },

  cardAction: {
    marginTop: "14px"
  },

  startButton: {
    height: "40px",
    border: "none",
    background: "#16a34a",
    color: "#ffffff",
    padding: "0 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px"
  },

  stopButton: {
    height: "42px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    padding: "0 16px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "900",
    fontSize: "14px"
  },

  clearButton: {
    height: "38px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    padding: "0 14px",
    borderRadius: "9px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px"
  },

  currentDeliveryCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    background: "#f9fbff",
    marginBottom: "20px"
  },

  currentDeliveryTop: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "14px",
    marginBottom: "14px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },

  subSectionTitle: {
    marginTop: "22px",
    marginBottom: "12px",
    color: "#111827"
  },

  sectionSpacing: {
    marginTop: "18px"
  },

  emptyState: {
    padding: "46px",
    minHeight: "160px",
    border: "1px dashed #cbd5e1",
    borderRadius: "16px",
    background: "#f8fafc",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    textAlign: "center"
  },

  emptyIconLarge: {
    width: "44px",
    height: "44px",
    borderRadius: "50%",
    background: "#ecfdf5",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900",
    fontSize: "20px"
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

export default Driver;