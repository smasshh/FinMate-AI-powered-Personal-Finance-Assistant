import { Navigate } from "react-router-dom";

// Redirecting to the LandingPage component
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
