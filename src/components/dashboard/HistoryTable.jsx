function HistoryTable({ rows }) {
  return (
    <div style={styles.wrapper}>
      <h3 style={styles.heading}>Recent History</h3>

      <div style={styles.scroll}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>ID</th>
              <th style={styles.th}>Delivery</th>
              <th style={styles.th}>Timestamp</th>
              <th style={styles.th}>Temp</th>
              <th style={styles.th}>Humidity</th>
              <th style={styles.th}>Tilt</th>
              <th style={styles.th}>Lat</th>
              <th style={styles.th}>Lon</th>
              <th style={styles.th}>Alerts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              let alertsValue = "None";

              if (Array.isArray(row.alerts)) {
                alertsValue = row.alerts.length > 0 ? row.alerts.join(", ") : "None";
              } else if (typeof row.alerts === "string") {
                const trimmed = row.alerts.trim();

                if (trimmed && trimmed !== "[]" && trimmed !== "") {
                  alertsValue = trimmed;
                }
              }

              return (
                <tr key={row.id}>
                  <td style={styles.td}>{row.id}</td>
                  <td style={styles.td}>{row.delivery_id}</td>
                  <td style={styles.td}>{row.timestamp}</td>
                  <td style={styles.td}>{row.temperature}</td>
                  <td style={styles.td}>{row.humidity}</td>
                  <td style={styles.td}>{row.tilt ? "Yes" : "No"}</td>
                  <td style={styles.td}>{row.lat ?? "-"}</td>
                  <td style={styles.td}>{row.lon ?? "-"}</td>
                  <td style={styles.td}>{alertsValue}</td>
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
  wrapper: {
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  heading: {
    marginTop: 0
  },
  scroll: {
    overflowX: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "1px solid #ddd",
    background: "#f8f9fb"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #eee"
  }
};

export default HistoryTable;