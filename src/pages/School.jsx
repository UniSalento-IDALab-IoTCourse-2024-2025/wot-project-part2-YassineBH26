import { useEffect, useState, useCallback } from "react";
import {
  createRequest,
  fetchRequests,
  fetchLiveData,
  fetchHistory,
  fetchActiveDelivery
} from "../services/api";
import { foods } from "../data/foods";

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

const SCHOOL_ID = 1;

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
    const data = await fetchRequests();
    const clearedRequests = getClearedSchoolRequests();

    const filtered = data.filter(
      (req) =>
        req.school_id === SCHOOL_ID &&
        !clearedRequests.includes(req.id)
    );

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

  const getStatusStyle = (status) => {
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
        school_id: SCHOOL_ID,
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
      await loadMyRequests();
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const canSchoolMonitor = Boolean(
    activeDelivery && liveData && activeSchoolRequest
  );

  return (
    <div style={styles.page}>
      <h1>School Panel</h1>
      <p style={styles.subtitle}>Create, track, and monitor food delivery requests</p>

      {message && <p style={styles.message}>{message}</p>}

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
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Food Type</label>

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
                  + {food}
                </button>
              ))}
            </div>
          )}

          <div style={styles.selectedBox}>
            {selectedFoods.length === 0 ? (
              <p style={styles.emptyText}>No food selected yet.</p>
            ) : (
              selectedFoods.map((item) => (
                <div key={item.name} style={styles.foodCard}>
                  <div style={styles.foodHeader}>
                    <strong>{item.name}</strong>
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
      )}

      {viewMode === "requests" && (
        <div style={styles.requestsBox}>
          <h2 style={styles.requestsTitle}>My Delivery Requests</h2>

          {myRequests.length === 0 ? (
            <p>No requests created yet.</p>
          ) : (
            <div style={styles.requestsGrid}>
              {myRequests.map((req) => (
                <div key={req.id} style={styles.requestCard}>
                  <p>
                    <strong>Request ID:</strong> {req.id}
                  </p>
                  <p>
                    <strong>Food:</strong> {req.food_type}
                  </p>
                  <p>
                    <strong>Quantity:</strong> {req.quantity}
                  </p>
                  <p>
                    <strong>Requested Time:</strong>{" "}
                    {req.requested_delivery_time}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        ...styles.statusBadge,
                        ...getStatusStyle(req.status)
                      }}
                    >
                      {req.status}
                    </span>
                  </p>
                  <p>
                    <strong>Notes:</strong> {req.special_notes || "-"}
                  </p>

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
        <div style={styles.monitoringBox}>
          <h2 style={styles.requestsTitle}>Active Delivery Monitoring</h2>

          {!canSchoolMonitor ? (
            <p>No active delivery is currently in progress for this school.</p>
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
                <p>
                  <strong>Request ID:</strong> {activeSchoolRequest.id}
                </p>
                <p>
                  <strong>Food:</strong> {activeSchoolRequest.food_type}
                </p>
                <p>
                  <strong>Quantity:</strong> {activeSchoolRequest.quantity}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    style={{
                      ...styles.statusBadge,
                      ...getStatusStyle(activeSchoolRequest.status)
                    }}
                  >
                    {activeSchoolRequest.status}
                  </span>
                </p>
                <p>
                  <strong>Notes:</strong> {activeSchoolRequest.special_notes || "-"}
                </p>
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
  subtitle: {
    color: "#555",
    marginBottom: "24px"
  },
  switchRow: {
    display: "flex",
    gap: "12px",
    marginBottom: "20px",
    flexWrap: "wrap"
  },
  switchButton: {
    border: "1px solid #ccc",
    background: "#fff",
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
  form: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    maxWidth: "700px",
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },
  label: {
    fontWeight: "600"
  },
  input: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px"
  },
  textarea: {
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ccc",
    fontSize: "14px",
    minHeight: "100px"
  },
  suggestions: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    border: "1px solid #ddd",
    borderRadius: "10px",
    padding: "8px",
    background: "#fafafa"
  },
  suggestionItem: {
    border: "none",
    background: "#fff",
    textAlign: "left",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600"
  },
  selectedBox: {
    minHeight: "70px",
    border: "1px dashed #bbb",
    borderRadius: "10px",
    padding: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "10px"
  },
  emptyText: {
    color: "#777",
    margin: 0
  },
  foodCard: {
    background: "#e3f2fd",
    border: "1px solid #bbdefb",
    borderRadius: "12px",
    padding: "12px"
  },
  foodHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "10px"
  },
  foodControls: {
    display: "flex",
    gap: "10px"
  },
  quantityInput: {
    flex: 1,
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },
  unitSelect: {
    width: "140px",
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid #ccc"
  },
  removeButton: {
    border: "none",
    background: "transparent",
    color: "#0d47a1",
    fontWeight: "900",
    cursor: "pointer",
    fontSize: "20px"
  },
  button: {
    marginTop: "12px",
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#1e88e5",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer"
  },
  clearButton: {
    marginTop: "10px",
    background: "#c62828",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer"
  },
  message: {
    background: "#fff",
    padding: "12px",
    borderRadius: "10px",
    border: "1px solid #ddd",
    marginBottom: "16px",
    maxWidth: "700px"
  },
  requestsBox: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    maxWidth: "100%"
  },
  monitoringBox: {
    background: "#fff",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    maxWidth: "100%"
  },
  requestsTitle: {
    marginTop: 0
  },
  subSectionTitle: {
    marginTop: "20px",
    marginBottom: "12px"
  },
  sectionSpacing: {
    marginTop: "18px"
  },
  requestsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "16px"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px"
  },
  requestCard: {
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "16px",
    background: "#f9fbff"
  },
  activeRequestCard: {
    marginTop: "16px",
    border: "1px solid #ddd",
    borderRadius: "12px",
    padding: "14px",
    background: "#f9fbff"
  },
  statusBadge: {
    padding: "4px 8px",
    borderRadius: "999px",
    fontWeight: "600"
  }
};

export default School;