import { useEffect, useState, useCallback } from "react";
import {
  createRequest,
  fetchSchoolRequests,
  fetchLiveData,
  fetchHistory,
  fetchActiveDelivery
} from "../services/api";
import { foods, getFoodEmoji } from "../data/foods";

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

const getClearedSchoolRequests = () => {
  return JSON.parse(localStorage.getItem("cleared_school_requests") || "[]");
};

function School() {
  const [foodSearch, setFoodSearch] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [requestedTime, setRequestedTime] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [viewMode, setViewMode] = useState("create");

  const [liveData, setLiveData] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [activeSchoolRequest, setActiveSchoolRequest] = useState(null);

  const loadMyRequests = useCallback(async () => {
    const data = await fetchSchoolRequests();
    const clearedRequests = getClearedSchoolRequests();

    const filtered = data.filter((req) => !clearedRequests.includes(req.id));

    setMyRequests(filtered);

    const activeReq = filtered.find((req) => req.status === "in_progress");
    setActiveSchoolRequest(activeReq || null);

    return filtered;
  }, []);

  const loadMonitoringData = useCallback(async () => {
    const [live, historyData, activeDeliveryData] = await Promise.all([
      fetchLiveData(),
      fetchHistory(),
      fetchActiveDelivery()
    ]);

    const activeId = activeDeliveryData.active_delivery_id;

    const filteredHistory = activeId
      ? historyData.filter((row) => row.delivery_id === activeId)
      : [];

    setLiveData(live);
    setActiveDelivery(activeId);
    setHistory(filteredHistory);
  }, []);

  useEffect(() => {
    loadMyRequests();
    loadMonitoringData();

    const interval = setInterval(() => {
      loadMyRequests();
      loadMonitoringData();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadMyRequests, loadMonitoringData]);

  const suggestions = foods
    .filter(
      (food) =>
        food.toLowerCase().includes(foodSearch.toLowerCase()) &&
        !selectedFoods.some((item) => item.name === food)
    )
    .slice(0, 6);

  const addFood = (food) => {
    setSelectedFoods([
      ...selectedFoods,
      { name: food, quantity: "", unit: "portions" }
    ]);
    setFoodSearch("");
  };

  const removeFood = (foodName) => {
    setSelectedFoods(selectedFoods.filter((item) => item.name !== foodName));
  };

  const updateFood = (foodName, field, value) => {
    setSelectedFoods(
      selectedFoods.map((item) =>
        item.name === foodName ? { ...item, [field]: value } : item
      )
    );
  };

  const handleClear = (requestId) => {
    const clearedRequests = getClearedSchoolRequests();

    if (!clearedRequests.includes(requestId)) {
      localStorage.setItem(
        "cleared_school_requests",
        JSON.stringify([...clearedRequests, requestId])
      );
    }

    setMyRequests((currentRequests) =>
      currentRequests.filter((req) => req.id !== requestId)
    );

    setMessage("Completed request cleared from this interface.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFoods.length === 0) {
      setMessage("Please select at least one food.");
      return;
    }

    const missingQuantity = selectedFoods.some(
      (item) => !item.quantity || Number(item.quantity) <= 0
    );

    if (missingQuantity) {
      setMessage("Please enter a valid quantity for each selected food.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const foodDescription = selectedFoods
        .map((item) => `${item.name} (${item.quantity} ${item.unit})`)
        .join(", ");

      await createRequest({
        food_type: foodDescription,
        quantity: selectedFoods.length,
        requested_delivery_time: requestedTime.replace("T", " ") + ":00",
        special_notes: notes
      });

      setMessage("Delivery request created successfully.");
      setSelectedFoods([]);
      setFoodSearch("");
      setRequestedTime("");
      setNotes("");
      setViewMode("requests");
      await loadMyRequests();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const requestedCount = myRequests.filter(
    (req) => req.status === "requested"
  ).length;

  const assignedCount = myRequests.filter(
    (req) => req.status === "assigned"
  ).length;

  const inProgressCount = myRequests.filter(
    (req) => req.status === "in_progress"
  ).length;

  const completedCount = myRequests.filter(
    (req) => req.status === "completed"
  ).length;

  const canSchoolMonitor = Boolean(
    activeDelivery && liveData && activeSchoolRequest
  );

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.pageTitle}>School Panel</h1>
          <p style={styles.subtitle}>
            Create, track, and monitor food delivery requests.
          </p>
        </div>
      </div>

      {message && <p style={styles.message}>{message}</p>}

      <div style={styles.statsGrid}>
        <SummaryCard label="Total Requests" value={myRequests.length} />
        <SummaryCard label="Requested" value={requestedCount} />
        <SummaryCard label="Assigned" value={assignedCount} />
        <SummaryCard label="In Progress" value={inProgressCount} />
        <SummaryCard label="Completed" value={completedCount} />
      </div>

      <div style={styles.switchRow}>
        <button
          type="button"
          style={{
            ...styles.switchButton,
            ...(viewMode === "create" ? styles.switchButtonActive : {})
          }}
          onClick={() => setViewMode("create")}
        >
          Create Request
        </button>

        <button
          type="button"
          style={{
            ...styles.switchButton,
            ...(viewMode === "requests" ? styles.switchButtonActive : {})
          }}
          onClick={() => setViewMode("requests")}
        >
          My Requests
        </button>

        <button
          type="button"
          style={{
            ...styles.switchButton,
            ...(viewMode === "monitoring" ? styles.switchButtonActive : {})
          }}
          onClick={() => setViewMode("monitoring")}
        >
          Active Monitoring
        </button>
      </div>

      {viewMode === "create" && (
        <div style={styles.createLayoutSingle}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.cardHeader}>
              <div>
                <h2 style={styles.cardTitle}>Create Delivery Request</h2>
                <p style={styles.cardSubtitle}>
                  Select food items, quantities, and the requested delivery time.
                </p>
              </div>
            </div>

            <label style={styles.label}>Food Items</label>

            <input
              style={styles.input}
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="Search food..."
            />

            {foodSearch && suggestions.length > 0 && (
              <div style={styles.suggestions}>
                {suggestions.map((food) => (
                  <button
                    key={food}
                    type="button"
                    style={styles.suggestionItem}
                    onClick={() => addFood(food)}
                  >
                    <span style={styles.suggestionLeft}>
                      <span style={styles.foodEmoji}>{getFoodEmoji(food)}</span>
                      <strong>{food}</strong>
                    </span>

                    <span style={styles.addBadge}>Add</span>
                  </button>
                ))}
              </div>
            )}

            <div style={styles.selectedBox}>
              {selectedFoods.length === 0 ? (
                <div style={styles.emptyMiniState}>
                  <div style={styles.emptyIcon}>＋</div>
                  <strong>No food selected yet</strong>
                  <span>Search above and add at least one food item.</span>
                </div>
              ) : (
                selectedFoods.map((item) => (
                  <div key={item.name} style={styles.foodCard}>
                    <div style={styles.foodHeader}>
                      <strong style={styles.selectedFoodName}>
                        <span style={styles.foodEmoji}>
                          {getFoodEmoji(item.name)}
                        </span>
                        {item.name}
                      </strong>

                      <button
                        type="button"
                        style={styles.removeButton}
                        onClick={() => removeFood(item.name)}
                      >
                        ×
                      </button>
                    </div>

                    <div style={styles.foodControls}>
                      <input
                        style={styles.quantityInput}
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateFood(item.name, "quantity", e.target.value)
                        }
                        placeholder="Quantity"
                        required
                      />

                      <select
                        style={styles.unitSelect}
                        value={item.unit}
                        onChange={(e) =>
                          updateFood(item.name, "unit", e.target.value)
                        }
                      >
                        <option value="portions">portions</option>
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="liters">liters</option>
                        <option value="units">units</option>
                        <option value="boxes">boxes</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>

            <label style={styles.label}>Requested Delivery Time</label>
            <input
              style={styles.input}
              type="datetime-local"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
              required
            />

            <label style={styles.label}>Special Notes</label>
            <textarea
              style={styles.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Example: No cheese, handle carefully..."
            />

            <button style={styles.button} disabled={loading}>
              {loading ? "Creating..." : "Create Request"}
            </button>
          </form>
        </div>
      )}

      {viewMode === "requests" && (
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.requestsTitle}>My Delivery Requests</h2>
              <p style={styles.sectionSubtitle}>
                Track all requests created by this school.
              </p>
            </div>
          </div>

          {myRequests.length === 0 ? (
            <EmptyState
              title="No requests created yet"
              text="Create your first delivery request from the Create Request tab."
            />
          ) : (
            <div style={styles.requestsGrid}>
              {myRequests.map((req) => (
                <div key={req.id} style={styles.requestCard}>
                  <div style={styles.requestCardTop}>
                    <div>
                      <span style={styles.smallLabel}>Request</span>
                      <strong style={styles.requestId}>#{req.id}</strong>
                    </div>

                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(req.status)
                      }}
                    >
                      {formatStatus(req.status)}
                    </span>
                  </div>

                  <div style={styles.requestBlock}>
                    <span style={styles.smallLabel}>Food items</span>
                    <div style={styles.foodItemsSpacing}>
                      <FoodItems foodText={req.food_type} />
                    </div>
                  </div>

                  <div style={styles.requestMetaGrid}>
                    <div>
                      <span style={styles.smallLabel}>Requested time</span>
                      <strong style={styles.metaValue}>
                        {req.requested_delivery_time}
                      </strong>
                    </div>

                    <div>
                      <span style={styles.smallLabel}>Notes</span>
                      <strong style={styles.metaValue}>
                        {req.special_notes || "-"}
                      </strong>
                    </div>
                  </div>

                  {req.status === "completed" && (
                    <button
                      type="button"
                      style={styles.clearButton}
                      onClick={() => handleClear(req.id)}
                    >
                      Clear
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {viewMode === "monitoring" && (
        <div style={styles.sectionBox}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.requestsTitle}>Active Delivery Monitoring</h2>
              <p style={styles.sectionSubtitle}>
                Follow the active delivery conditions in real time.
              </p>
            </div>
          </div>

          {!canSchoolMonitor ? (
            <EmptyState
              title="No active delivery"
              text="There is no delivery currently in progress for this school."
            />
          ) : (
            <>
              <div style={styles.grid}>
                <StatusCard title="Active Delivery" value={activeDelivery} />
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
                <div style={styles.activeRequestHeader}>
                  <div>
                    <span style={styles.smallLabel}>Active request</span>
                    <strong style={styles.requestId}>
                      #{activeSchoolRequest.id}
                    </strong>
                  </div>

                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(activeSchoolRequest.status)
                    }}
                  >
                    {formatStatus(activeSchoolRequest.status)}
                  </span>
                </div>

                <div style={styles.requestBlock}>
                  <span style={styles.smallLabel}>Food items</span>
                  <div style={styles.foodItemsSpacing}>
                    <FoodItems foodText={activeSchoolRequest.food_type} />
                  </div>
                </div>

                <div style={styles.requestMetaGrid}>
                  <div>
                    <span style={styles.smallLabel}>Notes</span>
                    <strong style={styles.metaValue}>
                      {activeSchoolRequest.special_notes || "-"}
                    </strong>
                  </div>
                </div>
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

function SummaryCard({ label, value }) {
  return (
    <div style={styles.summaryCard} className="admin-stat-card">
      <span style={styles.summaryLabel}>{label}</span>
      <strong style={styles.summaryValue}>{value}</strong>
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

  if (status === "requested") {
    return { background: "#e0f2fe", color: "#075985" };
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

  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(5, 1fr)",
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

  createLayoutSingle: {
    maxWidth: "760px"
  },

  form: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    width: "100%"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "4px"
  },

  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "22px"
  },

  cardSubtitle: {
    color: "#6b7280",
    fontSize: "14px",
    marginTop: "6px",
    marginBottom: 0,
    lineHeight: 1.4
  },

  label: {
    color: "#111827",
    fontWeight: "800",
    fontSize: "14px"
  },

  input: {
    height: "42px",
    padding: "0 12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
    background: "#ffffff"
  },

  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    minHeight: "100px",
    outline: "none",
    resize: "vertical"
  },

  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "8px",
    background: "#f9fafb"
  },

  suggestionItem: {
    border: "1px solid #e5e7eb",
    background: "#ffffff",
    color: "#111827",
    textAlign: "left",
    padding: "10px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "10px"
  },

  suggestionLeft: {
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  addBadge: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "3px 8px",
    fontSize: "12px",
    fontWeight: "900"
  },

  selectedBox: {
    minHeight: "82px",
    border: "1px dashed #cbd5e1",
    borderRadius: "14px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    background: "#f8fafc"
  },

  emptyMiniState: {
    minHeight: "58px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
    color: "#6b7280",
    fontSize: "13px",
    textAlign: "center"
  },

  emptyIcon: {
    width: "28px",
    height: "28px",
    borderRadius: "50%",
    background: "#ecfdf5",
    color: "#16a34a",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "900"
  },

  foodCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "12px",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.03)"
  },

  foodHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },

  selectedFoodName: {
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: "6px"
  },

  foodControls: {
    display: "flex",
    gap: "10px"
  },

  quantityInput: {
    flex: 1,
    height: "38px",
    padding: "0 10px",
    borderRadius: "9px",
    border: "1px solid #d1d5db",
    fontSize: "14px"
  },

  unitSelect: {
    width: "150px",
    height: "38px",
    padding: "0 10px",
    borderRadius: "9px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    fontSize: "14px"
  },

  removeButton: {
    width: "30px",
    height: "30px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#dc2626",
    borderRadius: "999px",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "18px",
    lineHeight: 1
  },

  button: {
    marginTop: "8px",
    height: "44px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#ffffff",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "14px"
  },

  sectionBox: {
    background: "#ffffff",
    padding: "22px",
    borderRadius: "18px",
    border: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
  },

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "18px"
  },

  requestsTitle: {
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

  requestsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px"
  },

  requestCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    background: "#f9fbff",
    boxShadow: "0 3px 10px rgba(15, 23, 42, 0.03)"
  },

  requestCardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "14px"
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

  requestId: {
    color: "#062B5F",
    fontSize: "20px",
    lineHeight: 1
  },

  requestBlock: {
    marginTop: "12px",
    marginBottom: "12px"
  },

  foodItemsSpacing: {
    marginTop: "8px",
    marginBottom: "8px"
  },

  requestMetaGrid: {
    display: "grid",
    gridTemplateColumns: "1fr",
    gap: "10px",
    marginTop: "12px"
  },

  metaValue: {
    color: "#111827",
    fontSize: "14px",
    lineHeight: 1.35
  },

  clearButton: {
    marginTop: "14px",
    background: "#fef2f2",
    color: "#dc2626",
    border: "1px solid #fecaca",
    padding: "8px 14px",
    borderRadius: "9px",
    fontWeight: "800",
    cursor: "pointer"
  },

  statusBadge: {
    padding: "5px 10px",
    borderRadius: "999px",
    fontWeight: "800",
    fontSize: "13px",
    whiteSpace: "nowrap"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },

  activeRequestCard: {
    marginTop: "18px",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
    background: "#f9fbff"
  },

  activeRequestHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    marginBottom: "12px"
  },

  subSectionTitle: {
    marginTop: "22px",
    marginBottom: "12px",
    color: "#111827"
  },

  sectionSpacing: {
    marginTop: "18px"
  },

  foodEmoji: {
    marginRight: "6px"
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

export default School;