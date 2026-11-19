import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import HomePage from "./Landing/Home/HomePage";
import AboutPage from "./Landing/About/AboutPage";
import CareersPage from "./Landing/Careers/CareersPage";
import SubjectsOverviewPage from "./Landing/Subjects/SubjectsOverviewPage";
import PricingPage from "./Landing/Pricing/PricingPage";
import PlansPage from "./Landing/Pricing/PlansPage";
import VerifyPaymentPage from "./Landing/Pricing/VerifyPaymentPage";
import PrivacyPolicyPage from "./Landing/Legal/PrivacyPolicyPage";
import TermsPage from "./Landing/Legal/TermsPage";
import NotFoundPage from "./Landing/NotFound/NotFoundPage";

// Auth pages
import SignInPage from "./pages/auth/SignInPage";
import AdminSignInPage from "./pages/auth/AdminSignInPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AccountSetupPage from "./pages/auth/AccountSetupPage";

// Signed-in pages
import SubjectsListPage from "./pages/app/subjects/SubjectsListPage";
import SubjectDetailsPage from "./pages/app/subjects/SubjectDetailsPage";
import ScheduleClassPage from "./pages/app/subjects/ScheduleClassPage";
import EnrolledCoursesPage from "./pages/app/subjects/EnrolledCoursesPage";
import ClassesPage from "./pages/app/classes/ClassesPage";
import ClassDetailsPage from "./pages/app/classes/ClassDetailsPage";
import ManageClassesPage from "./pages/app/classes/ManageClassesPage";
import LiveClassPage from "./pages/app/live/LiveClassPage";
import TimetablePage from "./pages/app/timetable/TimetablePage";
import AssignmentsPage from "./pages/app/assignments/AssignmentsPage";
import GradesPage from "./pages/app/grades/GradesPage";
import LessonFeesPage from "./pages/app/fees/LessonFeesPage";
import SubscriptionsPage from "./pages/app/subscriptions/SubscriptionsPage";
import SubscriptionHistoryPage from "./pages/app/subscriptions/SubscriptionHistoryPage";
import PaymentStatusPage from "./pages/app/subscriptions/PaymentStatusPage";
import NotificationsPage from "./pages/app/notifications/NotificationsPage";
import ReportsPage from "./pages/app/reports/ReportsPage";
import UsersPage from "./pages/app/users/UsersPage";
import UserDetailsPage from "./pages/app/users/UserDetailsPage";
import ProfilePage from "./pages/app/profile/ProfilePage";
import ProfileEditPage from "./pages/app/profile/ProfileEditPage";
import AddStudentPage from "./pages/app/students/AddStudentPage";
import GuidePage from "./pages/app/guide/GuidePage";
import SettingsPage from "./pages/app/settings/SettingsPage";
import AwardsHubPage from "./pages/app/awards/AwardsHubPage";
import AwardFormPage from "./pages/app/awards/AwardFormPage";
import AccountPage from "./pages/app/account/AccountPage";
import NotificationPreferencesPage from "./pages/app/notifications/NotificationPreferencesPage";
import WardFormPage from "./pages/app/wards/WardFormPage";
import UserFormPage from "./pages/app/forms/UserFormPage";
import GradeFormPage from "./pages/app/forms/GradeFormPage";
import ClassFormPage from "./pages/app/forms/ClassFormPage";
import TasksPage from "./pages/app/tasks/TasksPage";
import TaskTrackerPage from "./pages/app/tasks/TaskTrackerPage";
import WardsPage from "./pages/app/wards/WardsPage";
import PaymentsPage from "./pages/app/payments/PaymentsPage";
import PricingAdminPage from "./pages/app/admin/PricingPage";
import AccessPage from "./pages/app/admin/AccessPage";
import AnnouncementsAdminPage from "./pages/app/admin/AnnouncementsAdminPage";
import SuperAdminPage from "./pages/app/admin/SuperAdminPage";

// Shell, guards, helpers
import PublicNavbar from "./Landing/Layout/PublicNavbar";
import PublicFooter from "./Landing/Layout/PublicFooter";
import LandingShell from "./Landing/Layout/LandingShell";
import AppLayout from "./components/layout/AppLayout";
import ScrollToTop from "./components/common/ScrollToTop";
import SEO from "./components/common/SEO";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicRoute from "./routes/PublicRoute";
import RoleRoute from "./routes/RoleRoute";
import LegacyRedirect from "./routes/LegacyRedirect";
import { PATHS, LEGACY_REDIRECTS } from "./routes/paths";

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "Yare Height Learning Hub",
  url: "https://www.yareheight.com",
  logo: "https://www.yareheight.com/logo.png",
  image: "https://www.yareheight.com/logo.png",
  description:
    "Yare Height connects students and parents with qualified teachers for a world-class learning experience.",
};

/** Marketing page = navbar + content + footer. */
const Public = ({
  title,
  path,
  children,
}: {
  title: string;
  path: string;
  children: React.ReactNode;
}) => (
  <LandingShell>
    <PublicNavbar />
    <SEO title={title} canonical={path} />
    {children}
    <PublicFooter />
  </LandingShell>
);

/** Signed-in page inside the sidebar layout. */
const InApp = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

function App() {
  return (
    <Router>
      <ScrollToTop />
      <SEO structuredData={ORG_SCHEMA} />

      <Routes>
        {/* ── Public ── */}
        <Route
          path={PATHS.home}
          element={
            <Public title="Home — Online Learning for Every Student" path="/">
              <HomePage />
            </Public>
          }
        />
        <Route
          path={PATHS.about}
          element={
            <Public title="About Us" path={PATHS.about}>
              <AboutPage />
            </Public>
          }
        />
        <Route
          path={PATHS.pricing}
          element={
            <Public title="Pricing Plans" path={PATHS.pricing}>
              <PricingPage />
            </Public>
          }
        />
        <Route
          path={PATHS.subjectsOverview}
          element={
            <Public title="Subjects" path={PATHS.subjectsOverview}>
              <SubjectsOverviewPage />
            </Public>
          }
        />
        <Route
          path={PATHS.careers}
          element={
            <Public title="Careers" path={PATHS.careers}>
              <CareersPage />
            </Public>
          }
        />
        <Route
          path={PATHS.privacy}
          element={
            <Public title="Privacy Policy" path={PATHS.privacy}>
              <PrivacyPolicyPage />
            </Public>
          }
        />
        <Route
          path={PATHS.terms}
          element={
            <Public title="Terms & Conditions" path={PATHS.terms}>
              <TermsPage />
            </Public>
          }
        />
        <Route
          path={PATHS.plans}
          element={
            <LandingShell>
              <PlansPage />
              <PublicFooter />
            </LandingShell>
          }
        />
        <Route
          path={PATHS.verifyPayment}
          element={
            <LandingShell>
              <VerifyPaymentPage />
            </LandingShell>
          }
        />
        <Route
          path={PATHS.accountSetup}
          element={
            <>
              <SEO title="Account Setup" noIndex />
              <AccountSetupPage />
            </>
          }
        />

        {/* ── Sign in / register (signed-out only) ── */}
        <Route element={<PublicRoute />}>
          <Route
            path={PATHS.register}
            element={
              <>
                <SEO title="Create Account" noIndex />
                <RegisterPage />
              </>
            }
          />
          <Route
            path={PATHS.signIn}
            element={
              <>
                <SEO title="Sign In" noIndex />
                <SignInPage />
              </>
            }
          />
          <Route
            path={PATHS.adminSignIn}
            element={
              <>
                <SEO title="Admin Sign In" noIndex />
                <AdminSignInPage />
              </>
            }
          />
          <Route
            path={PATHS.forgotPassword}
            element={
              <>
                <SEO title="Forgot Password" noIndex />
                <ForgotPasswordPage />
              </>
            }
          />
        </Route>

        {/* ── Signed in: every account type ── */}
        <Route element={<ProtectedRoute />}>
          <Route
            path={PATHS.subjects}
            element={
              <InApp>
                <SubjectsListPage />
              </InApp>
            }
          />
          <Route path={PATHS.subjectDetails} element={<SubjectDetailsPage />} />
          <Route
            path="/app/subjects/:id/classes/new"
            element={
              <InApp>
                <ScheduleClassPage />
              </InApp>
            }
          />
          <Route
            path="/app/subjects/:id/classes/:classId/edit"
            element={
              <InApp>
                <ScheduleClassPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.classes}
            element={
              <InApp>
                <ClassesPage />
              </InApp>
            }
          />
          <Route path={PATHS.classDetails} element={<ClassDetailsPage />} />
          <Route path={PATHS.liveClass} element={<LiveClassPage />} />
          <Route
            path={PATHS.timetable}
            element={
              <InApp>
                <TimetablePage />
              </InApp>
            }
          />
          <Route
            path={PATHS.assignments}
            element={
              <InApp>
                <AssignmentsPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.notifications}
            element={
              <InApp>
                <NotificationsPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.awards}
            element={
              <InApp>
                <AwardsHubPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.account}
            element={
              <InApp>
                <AccountPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.settings}
            element={
              <InApp>
                <SettingsPage />
              </InApp>
            }
          />
          <Route path={PATHS.userDetails} element={<UserDetailsPage />} />

          {/* Students & parents */}
          <Route element={<RoleRoute allow={["student", "parent"]} />}>
            <Route
              path={PATHS.fees}
              element={
                <InApp>
                  <LessonFeesPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.subscriptionHistory}
              element={
                <InApp>
                  <SubscriptionHistoryPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.subscriptions}
              element={
                <InApp>
                  <SubscriptionsPage />
                </InApp>
              }
            />
            <Route path={PATHS.paymentStatus} element={<PaymentStatusPage />} />
            <Route
              path={PATHS.enrolledCourses}
              element={
                <InApp>
                  <EnrolledCoursesPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.profile}
              element={
                <InApp>
                  <ProfilePage />
                </InApp>
              }
            />
            <Route path={PATHS.profileEdit} element={<ProfileEditPage />} />
            <Route
              path={PATHS.guide}
              element={
                <InApp>
                  <GuidePage />
                </InApp>
              }
            />
          </Route>

          {/* Parents only */}
          <Route element={<RoleRoute allow={["parent"]} />}>
            <Route
              path={PATHS.wards}
              element={
                <InApp>
                  <WardsPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.wardNew}
              element={
                <InApp>
                  <WardFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.notificationPrefs}
              element={
                <InApp>
                  <NotificationPreferencesPage />
                </InApp>
              }
            />
            <Route path={PATHS.addStudent} element={<AddStudentPage />} />
          </Route>

          {/* Grades: admin, students, parents */}
          <Route element={<RoleRoute allow={["admin", "student", "parent"]} />}>
            <Route
              path={PATHS.grades}
              element={
                <InApp>
                  <GradesPage />
                </InApp>
              }
            />
          </Route>

          {/* Awards: admin & teachers */}
          <Route element={<RoleRoute allow={["admin", "teacher"]} />}>
            <Route
              path={PATHS.tasks}
              element={
                <InApp>
                  <TasksPage />
                </InApp>
              }
            />
          </Route>

          {/* Admin only */}
          <Route element={<RoleRoute allow={["admin", "parent"]} />}>
            <Route
              path={PATHS.transactions}
              element={
                <InApp>
                  <PaymentsPage />
                </InApp>
              }
            />
          </Route>

          <Route element={<RoleRoute allow={["admin"]} />}>
            <Route
              path={PATHS.personNew}
              element={
                <InApp>
                  <UserFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.personEdit}
              element={
                <InApp>
                  <UserFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.gradeNew}
              element={
                <InApp>
                  <GradeFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.gradeEdit}
              element={
                <InApp>
                  <GradeFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.classNew}
              element={
                <InApp>
                  <ClassFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.classEdit}
              element={
                <InApp>
                  <ClassFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.awardNew}
              element={
                <InApp>
                  <AwardFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.awardEdit}
              element={
                <InApp>
                  <AwardFormPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.taskTracker}
              element={
                <InApp>
                  <TaskTrackerPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.pricingAdmin}
              element={
                <InApp>
                  <PricingAdminPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.accessAdmin}
              element={
                <InApp>
                  <AccessPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.announcementsAdmin}
              element={
                <InApp>
                  <AnnouncementsAdminPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.superAdmin}
              element={
                <InApp>
                  <SuperAdminPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.users}
              element={
                <InApp>
                  <UsersPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.manageClasses}
              element={
                <InApp>
                  <ManageClassesPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.reports}
              element={
                <InApp>
                  <ReportsPage />
                </InApp>
              }
            />
          </Route>
        </Route>

        {/* ── Old URLs keep working ── */}
        {Object.entries(LEGACY_REDIRECTS).map(([from, to]) => (
          <Route key={from} path={from} element={<LegacyRedirect to={to} />} />
        ))}

        <Route
          path="*"
          element={
            <LandingShell>
              <NotFoundPage />
            </LandingShell>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
