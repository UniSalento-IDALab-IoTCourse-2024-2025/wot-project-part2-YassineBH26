function AlertsPanel({ alerts }) {
  const hasAlerts = alerts && alerts.length > 0;

  return (
    <div style={styles.panel}>
      <h3 style={styles.title}>Alerts</h3>

      {!hasAlerts ? (
        <p style={styles.goodStatus}>Conditions are optimal</p>
      ) : (
        <div>
          <p style={styles.badStatus}>Conditions are not optimal</p>

          <ul style={styles.alertList}>
            {alerts.map((alert, index) => (
              <li key={index} style={styles.alertItem}>
                {alert}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: {
    background: "#fff",
    padding: "16px",
    borderRadius: "16px",
    border: "1px solid #ddd",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  title: {
    marginTop: 0
  },
  goodStatus: {
    color: "#2e7d32",
    fontWeight: "700"
  },
  badStatus: {
    color: "#c62828",
    fontWeight: "700",
    marginBottom: "8px"
  },
  alertList: {
    margin: 0,
    paddingLeft: "20px"
  },
  alertItem: {
    marginBottom: "6px"
  }
};

export default AlertsPanel;