function StatusCard({ title, value }) {
  return (
    <div style={styles.card}>
      <p style={styles.title}>{title}</p>
      <h3 style={styles.value}>{value}</h3>
    </div>
  );
}

const styles = {
  card: {
    border: "1px solid #ddd",
    borderRadius: "16px",
    padding: "16px",
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
  },
  title: {
    margin: "0 0 8px",
    color: "#666",
    fontSize: "14px"
  },
  value: {
    margin: 0,
    color: "#111"
  }
};

export default StatusCard;