import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import OAuthSuccess from "./pages/OAuthSuccess";
import OAuthFailure from "./pages/OAuthFailure";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="oauth/success" element={<OAuthSuccess/>} />
      <Route path="oauth/failure" element={<OAuthFailure />} />
    </Routes>
  );
}

export default App;
