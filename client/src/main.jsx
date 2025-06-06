import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import "./i18n/i18n";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Homepage from "./routes/homepage/Homepage";
import DashboardPage from "./routes/dashboardPage/DashboardPage";
import ChatPage from "./routes/chatPage/ChatPage";
import RootLayout from "./layouts/rootLayout/RootLayout";
import DashboardLayout from "./layouts/dashboardLayout/DashboardLayout";
import { SocketProvider } from "./context/SocketContext";
import SignInPage from "./routes/signInPage/signInPage";
import SignUpPage from "./routes/signUpPage/signUpPage";
import ExplorePage from "./components/ExplorePage/ExplorePage";
import AnalyzeTeaPage from "./components/AnalyzeTeaPage/AnalyzeTeaPage";
import ManageStatePage from "./components/ManageStatePage/ManageStatePage";
import HarvestPlanPage from "./components/HarvestPlanPage/HarvestPlanPage";
import ContactPage from "./routes/contactpage/ContactPage";
import FactoryDashboard from "./components/FactoryDashboard/FactoryDashboard";
import CollectionRequest from "./components/CollectionRequest/CollectionRequest";
import RoleSelection from "./components/RoleSelection/RoleSelection";
import AnnouncementPage from "./components/AnnouncementPage/AnnouncementPage";
import TeaPricesPage from "./components/TeaPricesPage/TeaPricesPage";
import TeaPricesList from "./components/TeaPricesList/TeaPricesList";
import FactoryRegistration from "./components/FactoryRegistration/FactoryRegistration";
import FarmerRegistration from "./components/FarmerRegistration/FarmerRegistration";
import AnnouncementsPage from "./components/AnnouncementsPage/AnnouncementsPage";
import RequestCollection from "./components/RequestCollection/RequestCollection";
import SetTeaPricePage from "./components/SetTeaPricePage/SetTeaPricePage";
import FarmerRequests from "./components/FarmerRequests/FarmerRequests";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard";
import DirectMessagesPage from "./routes/directMessagesPage/DirectMessagesPage";
import { ClerkProvider } from "@clerk/clerk-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: "/",
        element: <Homepage />,
      },
      {
        path: "/explore",
        element: <ExplorePage />,
      },
      {
        path: "/sign-in/*",
        element: <SignInPage />,
      },
      {
        path: "/sign-up/*",
        element: <SignUpPage />,
      },
      {
        path: "/contact",
        element: <ContactPage />,
      },
      {
        path: "/select-role",
        element: <RoleSelection />,
      },
      {
        path: "/register-factory",
        element: <FactoryRegistration />,
      },
      {
        path: "/register-farmer",
        element: <FarmerRegistration />,
      },
      {
        element: <DashboardLayout />,
        children: [
          {
            path: "/dashboard",
            element: <DashboardPage />,
          },
          {
            path: "/dashboard/admin",
            element: <AdminDashboard />,
          },
          {
            path: "/dashboard/manage-state",
            element: <ManageStatePage />,
          },
          {
            path: "/dashboard/manage-estate",
            element: <ManageStatePage />,
          },
          {
            path: "/dashboard/analyze-tea",
            element: <AnalyzeTeaPage />,
          },
          {
            path: "/dashboard/harvest-plan",
            element: <HarvestPlanPage />,
          },
          {
            path: "/dashboard/chats/:id",
            element: <ChatPage />,
          },
          {
            path: "/dashboard/factory",
            element: <FactoryDashboard />,
          },
          {
            path: "/dashboard/collection-requests",
            element: <CollectionRequest />,
          },
          {
            path: "/dashboard/post-announcement",
            element: <AnnouncementPage />,
          },
          {
            path: "/dashboard/set-tea-price",
            element: <SetTeaPricePage />,
          },
          {
            path: "/dashboard/set-tea-prices",
            element: <SetTeaPricePage />,
          },
          {
            path: "/dashboard/tea-prices",
            element: <TeaPricesList />,
          },
          {
            path: "/dashboard/announcements",
            element: <AnnouncementsPage />,
          },
          {
            path: "/dashboard/request-collection",
            element: <RequestCollection />,
          },
          {
            path: "/dashboard/my-collection-requests",
            element: <FarmerRequests />,
          },
          {
            path: "/dashboard/direct-messages",
            element: <DirectMessagesPage />,
          },
        ],
      },
    ],
  },
]);

// Clerk configuration
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key");
}

// Create a new QueryClient instance
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <QueryClientProvider client={queryClient}>
        <SocketProvider>
          <RouterProvider router={router} />
        </SocketProvider>
      </QueryClientProvider>
    </ClerkProvider>
  </React.StrictMode>
);