import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Home from "./pages/Home";
import AdminDashboard from "./pages/AdminDashboard";
import FarmerDashboard from "./pages/FarmerDashboard";
import DistributorDashboard from "./pages/DistributorDashboard";
import RetailerDashboard from "./pages/RetailerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ConsumerView from "./pages/ConsumerView";




function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        } />

        <Route path="/farmer" element={
          <ProtectedRoute><FarmerDashboard /></ProtectedRoute>
        } />

        <Route path="/distributor" element={
          <ProtectedRoute><DistributorDashboard /></ProtectedRoute>
        } />

        <Route path="/retailer" element={
          <ProtectedRoute><RetailerDashboard /></ProtectedRoute>
        } />

        <Route path="/consumer" element={<ConsumerView />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;