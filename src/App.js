import { Routes, Route } from "react-router-dom";
import Navbar from "./components/layout/Navbar";
import Driver from "./pages/Driver";
import AdminRequests from "./pages/AdminRequests";
import NotFound from "./pages/NotFound";
import School from "./pages/School";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/driver" element={<Driver />} />
        <Route path="/admin/requests" element={<AdminRequests />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/school" element={<School />} />
      </Routes>
    </>
  );
}

export default App;