import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Landing Page Components
import Index from "./LandingPage/Index";
import Navbar from "./LandingPage/NewNav/NewNav";
import PrivacyPolicy from "./LandingPage/PrivacyPolicy/PrivacyPolicy";
import TermsAndConditions from "./LandingPage/PrivacyPolicy/TermsAndConditions";
import SubjectsPage from "./LandingPage/SubjectsPage/SubjectsPage";
import Footer from "./LandingPage/footer/Footer";

// Auth Components
import SignIn from "./Auth/SignIn";
import SignInAdmin from "./Auth/SignInAdmin";
import ForgotPassword from "./Auth/ForgotPassword";

// Authenticated User Components
import Layout from "./Home/Layout/Layout";
import DashBoard from "./Home/Dashboard/DashBoard";

import ScrollToTop from "./ScrollToTop";
import NotFound from "./LandingPage/NotFound/NotFound";
import Dashboard from "./Home/Dashboard/DashBoard";

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
              <Footer />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <Navbar />
              <TermsAndConditions />
              <Footer />
            </>
          }
        />
        <Route
          path="/subjects"
          element={
            <>
              <Navbar />
              <SubjectsPage />
              <Footer />
            </>
          }
        />

        {/* Auth Routes */}
        <Route path="/auth-sign-in" element={<SignIn />} />
        <Route path="/admin-sign-in" element={<SignInAdmin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="*" element={<NotFound />} />

        <Route
          path="/:userType/dashboard/:filter?"
          element={
            <Layout>
              <Dashboard />
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
