import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Pages/Loginpage";
import Register from "./Pages/Registerpage";
import Dashboard from "./Pages/Dashboardpage";
import Gamepage from "./Pages/Gamepage";
import Settingpage from "./Pages/Settingpage";
import GamePlay from "./Pages/Gameplay";
import Resultpage from "./Pages/Resultpage";
import Playerpage from "./Pages/Playerpage";
import PlayerResult from "./Pages/PlayerResult";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/game/:game_id" element={<Gamepage />} />
      <Route
        path="/game/:game_id/question/:question_id"
        element={<Settingpage />}
      />
      <Route path="/join/:sessionId" element={<Playerpage />} />
      <Route path="/play/:sessionId" element={<GamePlay />} />
      <Route path="/session/:sessionId/result" element={<Resultpage />} />
      <Route path="/play/:playerid/result" element={<PlayerResult />} />
    </Routes>
  );
}

export default App;
