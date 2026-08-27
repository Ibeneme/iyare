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
import AssignmentsManager from "./Pages/Main/Classes/AssignmentsManager";
import SubscriptionPage from "./Pages/Admin/SubscriptionPage/SubscriptionPage";
import PaymentStatusPage from "./Pages/Admin/SubscriptionPage/PaymentStatusPage";
import SubscriptionsHistoryPage from "./Pages/Admin/SubscriptionPage/SubscriptionsHistoryPage";
import AwardsList from "./Pages/Admin/Awards/AwardsList";
import EnrolledCourses from "./Pages/EnrolledCourses/EnrolledCourses";
import GetStarted from "./Auth/GetStarted";
import AboutUsPage from "./LandingPage/AboutUs/AboutUs";
import PricingSection from "./LandingPage/PricingSection/PricingSection";
import CareersPage from "./LandingPage/CareersPage/CareersPage";
import UserSetup from "./Auth/UserSetup";
import PricingPage from "./LandingPage/PricingSection/PricingPage";
import VerifyPayment from "./LandingPage/PricingSection/VerifyPayments";
import SubjectsManager from "./Pages/Main/Subject/Subjects";
import SubjectDetails from "./Pages/Main/Subject/SubjectDetails";
import ClassesMain from "./Pages/Main/Classes/Classes";
import LessonFeesMain from "./Pages/Main/LessonFee/LessonFeeMain";
import UserProfile from "./Pages/Main/Profiles/UserProfile";
import UserSetupUpdates from "./Auth/UserSetupUpdates";
import AddStudent from "./Pages/Main/AddStudent/AddStudent";
import ClassesTimetable from "./Pages/Main/Classes/ClassesTimetable";
import ParentGuideModal from "./Pages/Main/Guides/ParentGuideModal";
import UserDetailsPage from "./Pages/Admin/Admin/UserDetails/UserDetails";
import Grades from "./Pages/Main/Grades/Grades";
import NotificationsManager from "./Pages/Main/Notifications/Notifications";

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
          path="/pricing"
          element={
            <>
              <Navbar />
              <PricingPage />
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
          path="/careers"
          element={
            <>
              <Navbar />
              <CareersPage />
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
        />{" "}
        <Route
          path="/about-us"
          element={
            <>
              <Navbar />
              <AboutUsPage />
              <HomeFooter />
            </>
          }
        />
        <Route
          path="/user-setup"
          element={
            <>
              <UserSetup />
            </>
          }
        />
        <Route
          path="/pricing-page"
          element={
            <>
              <PricingSection />
              <HomeFooter />
            </>
          }
        />
            
        <Route path="/verify-payments" element={<VerifyPayment />} />
        {/* --- Auth Routes (Accessible ONLY if NOT logged in) --- */}
        <Route element={<PublicRoute />}>
          <Route path="/register" element={<GetStarted />} />
          <Route path="/auth-sign-in" element={<SignIn />} />
          <Route path="/admin-sign-in" element={<SignInAdmin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        {/* --- Protected Routes (Accessible ONLY if logged in) --- */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/subject-manager"
            element={
              <Layout>
                <SubjectsManager />
              </Layout>
            }
          />
          <Route
            path="/classes-manager"
            element={
              <Layout>
                <ClassesMain />
              </Layout>
            }
          />{" "}
                  <Route
            path="/notifications"
            element={
              <Layout>
                <NotificationsManager />
              </Layout>
            }
          />{" "}
          <Route
            path="/lesson-manager"
            element={
              <Layout>
                <LessonFeesMain />
              </Layout>
            }
          />
          <Route
            path="/grade-manager"
            element={
              <Layout>
                <Grades />
              </Layout>
            }
          />
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
            path="/profiles"
            element={
              <Layout>
                <UserProfile />
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
          <Route path="/subjects/:id" element={<SubjectDetails />} />
          <Route path="/user-updates" element={<UserSetupUpdates />} />
          <Route path="/add-student" element={<AddStudent />} />
          <Route path="/payment-success" element={<PaymentStatusPage />} />
          <Route
            path="/timetable"
            element={
              <Layout>
                <ClassesTimetable />
              </Layout>
            }
          />
          <Route
            path="/guide-parents"
            element={
              <Layout>
                <ParentGuideModal />
              </Layout>
            }
          />
          \
          <Route
            path="/subscriptions/:studentId?"
            element={
              <Layout>
                <SubscriptionPage />
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
          <Route
            path="/user-details/:userType/:id"
            element={<UserDetailsPage />}
          />
          <Route path="/class-details/:id" element={<ClassDetails />} />
      
          <Route
            path="/webrtc/:classId/:classTitle/:subject"
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
