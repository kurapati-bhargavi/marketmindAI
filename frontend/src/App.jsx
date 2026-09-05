import { useEffect, useState } from "react";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MainApp from "./pages/MainApp";

function App() {
  const [page, setPage] = useState("landing");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      setIsLoggedIn(true);
      setPage("main");
    }
  }, []);

  // =========================
  // LOGGED IN → MAIN APP
  // =========================

  if (isLoggedIn) {
    return <MainApp />;
  }

  // =========================
  // LANDING PAGE
  // =========================

  if (page === "landing") {
    return (
      <LandingPage
        onRegister={() => setPage("register")}
        onLogin={() => setPage("login")}
      />
    );
  }

  // =========================
  // REGISTER
  // =========================

  if (page === "register") {
    return (
      <Register
        onRegisterSuccess={() => {
          setIsLoggedIn(true);
          setPage("main");
        }}
        onBackToLogin={() => setPage("login")}
      />
    );
  }


  // =========================
  // LOGIN
  // =========================

  if (page === "login") {
  return (
    <Login
      onLogin={() => {
        setIsLoggedIn(true);
        setPage("main");
      }}
      onBack={() => setPage("landing")}
    />
  );
}

  return null;
}

export default App;

