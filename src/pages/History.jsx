import { useEffect, useState } from "react";
import { fetchHistory } from "../services/api";
import HistoryTable from "../components/dashboard/HistoryTable";

function History() {
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchHistory();
        setHistory(data);
        setError("");
      } catch (err) {
        setError(err.message);
      }
    };

    loadHistory();
  }, []);

  if (error) {
    return (
      <div style={styles.page}>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Delivery History</h1>
      <HistoryTable rows={history} />
    </div>
  );
}

const styles = {
  page: {
    padding: "24px",
    background: "#f5f7fb",
    minHeight: "100vh"
  },
  title: {
    marginTop: 0
  }
};

export default History;