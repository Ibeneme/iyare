import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Landing Page Components (Public)
import Index from "./LandingPage/Index";
import Navbar from "./LandingPage/NewNav/NewNav";
import PrivacyPolicy from "./LandingPage/PrivacyPolicy/PrivacyPolicy";

import SubjectsPage from "./LandingPage/SubjectsPage/SubjectsPage";
import HomeFooter from "./LandingPage/HomeFooter/HomeFooter";

// Auth Components (Public but conditional)
import SignIn from "./Auth/SignIn";
import SignInAdmin from "./Auth/SignInAdmin";
import ForgotPassword from "./Auth/ForgotPassword";

// Authenticated User Components (Protected)
import Layout from "./Pages/Admin/Layout/Layout";
import DashBoard from "./Pages/Admin/Dashboard/DashBoard";
import ClassesGrid from "./Pages/Admin/Classes/ClassesGrid";
import UserDetails from "./Pages/Admin/Admin/UserDetails/UserDetails";
import ClassDetails from "./Pages/Admin/Classes/ClassDetails";
import WebRTCComponent from "./Pages/Admin/Admin/WebRTCComponent";
import Settings from "./Pages/Admin/Settings/Settings";
import Reports from "./Pages/Admin/Admin/Report/Report";

// Routing Components
import ScrollToTop from "./ScrollToTop";
import NotFound from "./LandingPage/NotFound/NotFound";
import ProtectedRoute from "./ProtectedRoute";
import TermsAndConditions from "./LandingPage/PrivacyPolicy/TermsAndConditions";
import PublicRoute from "./PublicRoute";
import AssignmentsManager from "./Pages/Admin/AssignmentsManager/AssignmentsManager";
import { ParentChildrenList } from "./Pages/Admin/Admin/Dashboard/ParentChildrenList";
import SubscriptionPage from "./Pages/Admin/SubscriptionPage/SubscriptionPage";
import PaymentStatusPage from "./Pages/Admin/SubscriptionPage/PaymentStatusPage";
import SubscriptionsHistoryPage from "./Pages/Admin/SubscriptionPage/SubscriptionsHistoryPage";
import AwardsList from "./Pages/Admin/Awards/AwardsList";
import EnrolledCourses from "./Pages/EnrolledCourses/EnrolledCourses";

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* --- Public Routes (Always accessible to all users) --- */}
        <Route
          path="/"
          element={
            <>
              <Navbar />
              <Index />
              <HomeFooter />
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

        {/* --- Auth Routes (Accessible ONLY if NOT logged in) --- */}
        <Route element={<PublicRoute />}>
          <Route path="/auth-sign-in" element={<SignIn />} />
          <Route path="/admin-sign-in" element={<SignInAdmin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* --- Protected Routes (Accessible ONLY if logged in) --- */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/settings"
            element={
              <Layout>
                <Settings />
              </Layout>
            }
          />

          <Route
            path="/enrolled-courses"
            element={
              <Layout>
                <EnrolledCourses />
              </Layout>
            }
          />

          <Route
            path="/awards"
            element={
              <Layout>
                <AwardsList />
              </Layout>
            }
          />

          <Route
            path="/reports"
            element={
              <Layout>
                <Reports />
              </Layout>
            }
          />
          <Route
            path="/:userType/dashboard/:filter?"
            element={
              <Layout>
                <DashBoard />
              </Layout>
            }
          />

          <Route
            path="/assignments"
            element={
              <Layout>
                <AssignmentsManager />
              </Layout>
            }
          />

          <Route
            path="/subscriptions-history"
            element={
              <Layout>
                <SubscriptionsHistoryPage />
              </Layout>
            }
          />

          <Route path="/payment-success" element={<PaymentStatusPage />} />
          <Route
            path="/subscriptions/:studentId?"
            element={
              <Layout>
                <SubscriptionPage />
              </Layout>
            }
          />
          <Route
            path="/parents-kins"
            element={
              <Layout>
                <ParentChildrenList />
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
          <Route path="/user-details/:userType/:id" element={<UserDetails />} />
          <Route path="/class-details/:id" element={<ClassDetails />} />
          <Route path="webrtc" element={<WebRTCComponent />} />
          <Route
            path="/join/:classId/:classTitle"
            element={<WebRTCComponent />}
          />
        </Route>

        {/* Catch-all for 404 Not Found - This should always be the last route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
