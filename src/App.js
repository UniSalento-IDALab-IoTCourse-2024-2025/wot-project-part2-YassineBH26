import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Dashboard from "./pages/Dashboard";
import Driver from "./pages/Driver";
import History from "./pages/History";
import AdminRequests from "./pages/AdminRequests";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/driver" element={<Driver />} />
        <Route path="/history" element={<History />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;