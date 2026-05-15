import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchDeliveryReport } from "../services/api";
import FoodItems from "../components/FoodItems";

function formatMinutesToMinSec(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) {
    return "-";
  }

  const totalSeconds = Math.round(Number(minutes) * 60);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  if (mins > 0 && secs > 0) {
    return `${mins}m ${secs}s`;
  }

  if (mins > 0) {
    return `${mins}m`;
  }

  return `${secs}s`;
}

function formatDistance(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "-";
  }

  return `${Number(value).toFixed(2)} km`;
}

function getDistanceDescription(summary) {
  if (!summary.delivery_distance_km) {
    return "Distance could not be calculated because GPS data or school coordinates are missing.";
  }

  if (summary.delivery_distance_type === "driving") {
    const durationText = summary.estimated_driving_duration_minutes
      ? ` Approx. ${formatMinutesToMinSec(summary.estimated_driving_duration_minutes)} by road.`
      : "";

    return `Estimated road distance from driver start position to the school.${durationText}`;
  }

  if (summary.delivery_distance_type === "straight_line_fallback") {
    return "Driving route was not available, so straight-line distance was used.";
  }

  return summary.delivery_distance_note || "Estimated delivery distance.";
}

function DeliveryReport() {
  const navigate = useNavigate();
  const { deliveryId } = useParams();

  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        const data = await fetchDeliveryReport(deliveryId);
        setReport(data);
        setError("");
      } catch (err) {
        setError(err.message || "Failed to load delivery report.");
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [deliveryId]);

  if (loading) {
    return (
      <div style={styles.page}>
        <p>Loading delivery report...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <button style={styles.backButton} onClick={() => navigate("/admin/requests")}>
          ← Back to Admin Requests
        </button>
        <p style={styles.error}>Error: {error}</p>
      </div>
    );
  }

  const { delivery, summary, events } = report;

  return (
    <div style={styles.page}>
      <button style={styles.backButton} onClick={() => navigate("/admin/requests")}>
        ← Back to Admin Requests
      </button>

      <div style={styles.headerCard}>
        <div>
          <h1 style={styles.title}>Delivery Performance Report</h1>
          <p style={styles.subtitle}>
            Summary of important events and delivery conditions.
          </p>
        </div>

        <div style={styles.deliveryBadge}>Delivery #{delivery.id}</div>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Driver</span>
          <strong style={styles.infoValue}>
            {delivery.driver_name || `Driver ${delivery.driver_id}`}
          </strong>
        </div>

        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>School</span>
          <strong style={styles.infoValue}>
            {delivery.school_name || `School ${delivery.school_id}`}
          </strong>
        </div>

        <div style={{ ...styles.infoItem, ...styles.foodInfoItem }}>
          <span style={styles.infoLabel}>Food Items</span>
          <div style={styles.reportFoodBox}>
            <FoodItems foodText={delivery.food_type} />
          </div>
        </div>

        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>Status</span>
          <strong style={styles.statusValue}>{delivery.status}</strong>
        </div>
      </div>

      <div style={styles.grid}>
        <MetricCard
          title="Delivery Duration"
          value={summary.duration_label}
          description="Total time between delivery start and completion."
        />

        <MetricCard
          title="Estimated Driving Distance"
          value={formatDistance(summary.delivery_distance_km)}
          description={getDistanceDescription(summary)}
        />

        <MetricCard
          title="Temperature Risk Time"
          value={formatMinutesToMinSec(summary.temperature_risk_minutes)}
          description="Estimated time during which temperature was outside the safe range."
        />

        <MetricCard
          title="Humidity Risk Time"
          value={formatMinutesToMinSec(summary.humidity_risk_minutes)}
          description="Estimated time during which humidity was above the recommended threshold."
        />

        <MetricCard
          title="Tilt Risk Time"
          value={formatMinutesToMinSec(summary.tilt_risk_minutes)}
          description="Estimated time during which the box was tilted or unstable."
        />

        <MetricCard
          title="Total Events"
          value={summary.total_events}
          description="Number of meaningful monitoring records saved for this delivery."
        />

        <MetricCard
          title="Total Alerts"
          value={summary.alert_count}
          description="Total number of alerts detected during this delivery."
        />

        <MetricCard
          title="Temperature Range"
          value={`${summary.min_temperature ?? "-"}°C → ${summary.max_temperature ?? "-"}°C`}
          description="Minimum and maximum temperature recorded."
        />

        <MetricCard
          title="Humidity Range"
          value={`${summary.min_humidity ?? "-"}% → ${summary.max_humidity ?? "-"}%`}
          description="Minimum and maximum humidity recorded."
        />
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Monitoring Events</h2>

        <div style={styles.tableBox}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Time</th>
                <th style={styles.th}>Temperature</th>
                <th style={styles.th}>Humidity</th>
                <th style={styles.th}>Tilt</th>
                <th style={styles.th}>Alerts</th>
              </tr>
            </thead>

            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td style={styles.td} colSpan="5">
                    No monitoring events found for this delivery.
                  </td>
                </tr>
              ) : (
                events.map((event) => (
                  <tr key={event.id}>
                    <td style={styles.td}>{event.timestamp}</td>
                    <td style={styles.td}>{event.temperature ?? "-"}°C</td>
                    <td style={styles.td}>{event.humidity ?? "-"}%</td>
                    <td style={styles.td}>{event.tilt ? "Tilted" : "Normal"}</td>
                    <td style={styles.td}>
                      {event.alerts.length > 0 ? event.alerts.join(", ") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, description }) {
  return (
    <div style={styles.card} className="admin-stat-card">
      <span style={styles.label}>{title}</span>
      <strong style={styles.value}>{value}</strong>
      <p style={styles.description}>{description}</p>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "100vh"
  },

  backButton: {
    background: "#062B5F",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    marginBottom: "18px"
  },

  error: {
    background: "#fee2e2",
    color: "#991b1b",
    border: "1px solid #fecaca",
    padding: "12px",
    borderRadius: "10px"
  },

  headerCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "22px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
    marginBottom: "22px"
  },

  title: {
    margin: 0,
    color: "#111827",
    fontSize: "30px"
  },

  subtitle: {
    marginTop: "6px",
    marginBottom: 0,
    color: "#6b7280",
    fontSize: "14px"
  },

  deliveryBadge: {
    background: "#ecfdf5",
    color: "#166534",
    border: "1px solid #bbf7d0",
    padding: "10px 14px",
    borderRadius: "999px",
    fontWeight: "800"
  },

  infoCard: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "18px",
    padding: "16px",
    marginBottom: "20px",
    display: "grid",
    gridTemplateColumns: "1fr 1fr 2fr 1fr",
    gap: "14px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
  },

  infoItem: {
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "14px",
    padding: "14px",
    minHeight: "72px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center"
  },

  foodInfoItem: {
    background: "#f9fafb"
  },

  infoLabel: {
    display: "block",
    color: "#6b7280",
    fontSize: "12px",
    fontWeight: "800",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.03em"
  },

  infoValue: {
    color: "#111827",
    fontSize: "15px",
    lineHeight: "1.35"
  },

  statusValue: {
    color: "#166534",
    background: "#dcfce7",
    border: "1px solid #bbf7d0",
    borderRadius: "999px",
    padding: "5px 10px",
    fontSize: "14px",
    fontWeight: "800",
    width: "fit-content"
  },

  reportFoodBox: {
    marginTop: "2px"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: "16px"
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "18px",
    boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)"
  },

  label: {
    color: "#6b7280",
    fontSize: "14px",
    fontWeight: "700"
  },

  value: {
    display: "block",
    marginTop: "8px",
    color: "#062B5F",
    fontSize: "24px"
  },

  description: {
    color: "#6b7280",
    fontSize: "13px",
    lineHeight: "1.4",
    marginBottom: 0
  },

  section: {
    marginTop: "24px"
  },

  sectionTitle: {
    fontSize: "22px",
    color: "#111827"
  },

  tableBox: {
    background: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "16px",
    padding: "16px",
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
    fontSize: "14px",
    color: "#111827"
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #f0f0f0",
    fontSize: "14px",
    verticalAlign: "top"
  }
};

export default DeliveryReport;