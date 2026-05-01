function AlertsPanel({ alerts }) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div style={styles.panel}>
      <h3 style={styles.heading}>Alerts</h3>

      {hasAlerts ? (
        <ul style={styles.list}>
          {alerts.map((alert, index) => (
            <li key={index} style={styles.alertItem}>
              {alert}
            </li>
          ))}
        </ul>
      ) : (
        <p style={styles.normal}>No active alerts</p>
      )}
    </div>
  );
}

const styles = {
  panel: {
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  heading: {
    marginTop: 0
  },
  list: {
    paddingLeft: "20px",
    marginBottom: 0
  },
  alertItem: {
    color: "#b00020",
    fontWeight: "600"
  },
  normal: {
    color: "#1b5e20",
    fontWeight: "600"
  }
};

export default AlertsPanel;