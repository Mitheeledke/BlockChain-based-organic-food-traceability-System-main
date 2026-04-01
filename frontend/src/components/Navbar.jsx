import { Link, useNavigate } from "react-router-dom";
import "../styles/dashboards.css";


export default function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <nav className="main-nav">
      <span className="project-name">Organic Food Traceability</span>
      <div className="nav-links">
        <Link to="/">Home</Link>
        {!token ? (
          <Link to="/login">Login</Link>
        ) : (
          <button onClick={handleLogout}>Logout</button>
        )}
      </div>
    </nav>
  );
}
