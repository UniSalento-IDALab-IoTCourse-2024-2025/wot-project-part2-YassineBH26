import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav style={styles.nav}>
      <h2 style={styles.title}>IoT Food Delivery Dashboard</h2>
      <div style={styles.links}>
        <Link to="/driver" style={styles.link}>Driver</Link>
        <Link to="/admin/requests" style={styles.link}>Admin Requests</Link>
        <Link to="/school"style={styles.link}>School</Link>
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: "1px solid #ddd",
    background: "#ffffff",
    position: "sticky",
    top: 0,
    zIndex: 10
  },
  title: {
    margin: 0,
    fontSize: "20px",
    color: "#222"
  },
  links: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap"
  },
  link: {
    textDecoration: "none",
    color: "#222",
    fontWeight: "600"
  }
};

export default Navbar;