import { createBrowserRouter } from "react-router";
import { WelcomeScreen } from "./components/WelcomeScreen";
import { UserAuth } from "./components/UserAuth";
import { CrewAuth } from "./components/CrewAuth";
import { AdminAuth } from "./components/AdminAuth";
import { UserHome } from "./components/UserHome";
import { CrewDashboard } from "./components/CrewDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { UserProfile } from "./components/UserProfile";
import { TripActive } from "./components/TripActive";
import { EmergencyAlert } from "./components/EmergencyAlert";

// Add Journey Planner route
import JourneySimulator from "./pages/JourneySimulator";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: WelcomeScreen,
  },
  {
    path: "/user-auth",
    Component: UserAuth,
  },
  {
    path: "/crew-auth",
    Component: CrewAuth,
  },
  {
    path: "/admin-auth",
    Component: AdminAuth,
  },
  {
    path: "/user-home",
    Component: UserHome,
  },
  {
    path: "/user-profile",
    Component: UserProfile,
  },
  {
    path: "/journey-planner",
    Component: JourneySimulator,
  },
  {
    path: "/trip-active",
    Component: TripActive,
  },
  {
    path: "/emergency",
    Component: EmergencyAlert,
  },
  {
    path: "/crew-dashboard",
    Component: CrewDashboard,
  },
  {
    path: "/admin-dashboard",
    Component: AdminDashboard,
  },
]);
