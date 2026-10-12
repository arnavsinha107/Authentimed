import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import DashboardSelect from "./pages/DashboardSelect";
import Manufacturer from "./pages/Manufacturer";
import Consumer from "./pages/Consumer";
import Pharmacist from "./pages/Pharmacist";
import "./styles.css";

export default function App() {
  return (
    <Router>
      <div className="app-shell">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/dashboard" element={<DashboardSelect />} />
            <Route path="/manufacturer" element={<Manufacturer />} />
            <Route path="/pharmacist" element={<Pharmacist />} />
            <Route path="/consumer" element={<Consumer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
