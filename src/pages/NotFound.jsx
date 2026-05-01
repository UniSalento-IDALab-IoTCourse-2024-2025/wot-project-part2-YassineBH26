function NotFound() {
  return (
    <div style={styles.page}>
      <h1>404</h1>
      <p>Page not found.</p>
    </div>
  );
}

const styles = {
  page: {
    padding: "24px"
  }
};

export default NotFound;