import React from "react";
import ReactDOM from "react-dom/client";

import {
  BrowserRouter,
} from "react-router-dom";

import App from "./App";

import {
  JamProvider,
} from "./context/JamContext";

import {
  PlayerProvider,
} from "./context/PlayerContext";

import {
  AuthProvider,
} from "./context/AuthContext";

import "./styles/globals.css";


ReactDOM.createRoot(
  document.getElementById("root")
).render(

  <React.StrictMode>

    <BrowserRouter>

      <AuthProvider>

        <JamProvider>

          <PlayerProvider>

            <App />

          </PlayerProvider>

        </JamProvider>

      </AuthProvider>

    </BrowserRouter>

  </React.StrictMode>

);