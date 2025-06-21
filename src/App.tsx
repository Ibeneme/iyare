import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Landing Page Components
import Index from "./LandingPage/Index";
import Navbar from "./LandingPage/NewNav/NewNav";
import PrivacyPolicy from "./LandingPage/PrivacyPolicy/PrivacyPolicy";
import TermsAndConditions from "./LandingPage/PrivacyPolicy/TermsAndConditions";
import SubjectsPage from "./LandingPage/SubjectsPage/SubjectsPage";

// Auth Components
import SignIn from "./Auth/SignIn";
import SignInAdmin from "./Auth/SignInAdmin";
import ForgotPassword from "./Auth/ForgotPassword";

// Authenticated User Components
import Layout from "./Pages/Admin/Layout/Layout";
import DashBoard from "./Pages/Admin/Dashboard/DashBoard";

import ScrollToTop from "./ScrollToTop";
import NotFound from "./LandingPage/NotFound/NotFound";
import Dashboard from "./Pages/Admin/Dashboard/DashBoard";
import ClassesGrid from "./Pages/Admin/Classes/ClassesGrid";
import HomeFooter from "./LandingPage/HomeFooter/HomeFooter";
import UserDetails from "./Pages/Admin/Admin/Dashboard/UserDetails";
import ClassDetails from "./Pages/Admin/Classes/ClassDetails";
import WebRTCComponent from "./Pages/Admin/Admin/WebRTCComponent";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Landing Pages */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Index />
            </>
          }
        />
        <Route
          path="/policy"
          element={
            <>
              <Navbar />
              <PrivacyPolicy />
              <HomeFooter />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <Navbar />
              <TermsAndConditions />
              <HomeFooter />
            </>
          }
        />
        <Route
          path="/subjects"
          element={
            <>
              <Navbar />
              <SubjectsPage />
              <HomeFooter />
            </>
          }
        />
        {/* Auth Routes */}
        <Route path="/auth-sign-in" element={<SignIn />} />
        <Route path="/admin-sign-in" element={<SignInAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/user-details/:userType/:id" element={<UserDetails />} />
        <Route path="/class-details/:id" element={<ClassDetails />} />
        <Route path="webrtc" element={<WebRTCComponent />} />

        <Route
          path="/:userType/dashboard/:filter?"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/classes/dashboard/:filter?"
          element={
            <Layout>
              <ClassesGrid />
            </Layout>
          }
        />
        <Route
          path="/dashboard-a"
          element={
            <Layout>
              <DashBoard />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
