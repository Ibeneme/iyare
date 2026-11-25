import "./App.css";
import AboutPage from "./Landing/About/AboutPage";
import AccessPage from "./pages/app/admin/AccessPage";
import AccountPage from "./pages/app/account/AccountPage";
import AccountSetupPage from "./pages/auth/AccountSetupPage";
import AddStudentPage from "./pages/app/students/AddStudentPage";
import AdminSignInPage from "./pages/auth/AdminSignInPage";
import AnnouncementsAdminPage from "./pages/app/admin/AnnouncementsAdminPage";
import AppLayout from "./components/layout/AppLayout";
import AssignmentsPage from "./pages/app/assignments/AssignmentsPage";
import AwardFormPage from "./pages/app/awards/AwardFormPage";
import AwardsHubPage from "./pages/app/awards/AwardsHubPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CareersPage from "./Landing/Careers/CareersPage";
import ClassDetailsPage from "./pages/app/classes/ClassDetailsPage";
import ClassFormPage from "./pages/app/forms/ClassFormPage";
import ClassesPage from "./pages/app/classes/ClassesPage";
import EnrolledCoursesPage from "./pages/app/subjects/EnrolledCoursesPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import GradeFormPage from "./pages/app/forms/GradeFormPage";
import GradesPage from "./pages/app/grades/GradesPage";
import GuidePage from "./pages/app/guide/GuidePage";
import HomePage from "./Landing/Home/HomePage";
import LandingShell from "./Landing/Layout/LandingShell";
import LegacyRedirect from "./routes/LegacyRedirect";
import LessonFeesPage from "./pages/app/fees/LessonFeesPage";
import LiveClassPage from "./pages/app/live/LiveClassPage";
import ManageClassesPage from "./pages/app/classes/ManageClassesPage";
import NotFoundPage from "./Landing/NotFound/NotFoundPage";
import NotificationPreferencesPage from "./pages/app/notifications/NotificationPreferencesPage";
import NotificationsPage from "./pages/app/notifications/NotificationsPage";
import { PATHS, LEGACY_REDIRECTS } from "./routes/paths";
import PaymentStatusPage from "./pages/app/subscriptions/PaymentStatusPage";
import PaymentsPage from "./pages/app/payments/PaymentsPage";
import PlansPage from "./Landing/Pricing/PlansPage";
import PricingAdminPage from "./pages/app/admin/PricingPage";
import PricingPage from "./Landing/Pricing/PricingPage";
import PrivacyPolicyPage from "./Landing/Legal/PrivacyPolicyPage";
import ProfileEditPage from "./pages/app/profile/ProfileEditPage";
import ProfilePage from "./pages/app/profile/ProfilePage";
import ProtectedRoute from "./routes/ProtectedRoute";
import PublicFooter from "./Landing/Layout/PublicFooter";
import PublicNavbar from "./Landing/Layout/PublicNavbar";
import PublicRoute from "./routes/PublicRoute";
import RegisterPage from "./pages/auth/RegisterPage";
import ReportsPage from "./pages/app/reports/ReportsPage";
import RoleRoute from "./routes/RoleRoute";
import ScheduleClassPage from "./pages/app/subjects/ScheduleClassPage";
import ScrollToTop from "./components/common/ScrollToTop";
import SEO from "./components/common/SEO";
import SettingsPage from "./pages/app/settings/SettingsPage";
import SignInPage from "./pages/auth/SignInPage";
import SubjectDetailsPage from "./pages/app/subjects/SubjectDetailsPage";
import SubjectsListPage from "./pages/app/subjects/SubjectsListPage";
import SubjectsOverviewPage from "./Landing/Subjects/SubjectsOverviewPage";
import SubscriptionHistoryPage from "./pages/app/subscriptions/SubscriptionHistoryPage";
import SubscriptionsPage from "./pages/app/subscriptions/SubscriptionsPage";
import SuperAdminPage from "./pages/app/admin/SuperAdminPage";
import TaskTrackerPage from "./pages/app/tasks/TaskTrackerPage";
import TasksPage from "./pages/app/tasks/TasksPage";
import TermsPage from "./Landing/Legal/TermsPage";
import TimetablePage from "./pages/app/timetable/TimetablePage";
import UserDetailsPage from "./pages/app/users/UserDetailsPage";
import UserFormPage from "./pages/app/forms/UserFormPage";
import UsersPage from "./pages/app/users/UsersPage";
import VerifyPaymentPage from "./Landing/Pricing/VerifyPaymentPage";
import WardFormPage from "./pages/app/wards/WardFormPage";
import WardsPage from "./pages/app/wards/WardsPage";

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
          path={PATHS.about}
          element={
            <Public title="About Us" path={PATHS.about}>
              <AboutPage />
            </Public>
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
        <Route
          path={PATHS.careers}
          element={
            <Public title="Careers" path={PATHS.careers}>
              <CareersPage />
            </Public>
          }
        />
        <Route
          path={PATHS.home}
          element={
            <Public title="Home — Online Learning for Every Student" path="/">
              <HomePage />
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
          path={PATHS.pricing}
          element={
            <Public title="Pricing Plans" path={PATHS.pricing}>
              <PricingPage />
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
          path={PATHS.subjectsOverview}
          element={
            <Public title="Subjects" path={PATHS.subjectsOverview}>
              <SubjectsOverviewPage />
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
          path={PATHS.verifyPayment}
          element={
            <LandingShell>
              <VerifyPaymentPage />
            </LandingShell>
          }
        />

        {/* ── Sign in / register (signed-out only) ── */}
        <Route element={<PublicRoute />}>
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
        </Route>

        {/* ── Signed in: every account type ── */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/app/subjects/:id/classes/:classId/edit"
            element={
              <InApp>
                <ScheduleClassPage />
              </InApp>
            }
          />
          <Route
            path="/app/subjects/:id/classes/new"
            element={
              <InApp>
                <ScheduleClassPage />
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
            path={PATHS.assignments}
            element={
              <InApp>
                <AssignmentsPage />
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
          <Route path={PATHS.classDetails} element={<ClassDetailsPage />} />
          <Route
            path={PATHS.classes}
            element={
              <InApp>
                <ClassesPage />
              </InApp>
            }
          />
          <Route path={PATHS.liveClass} element={<LiveClassPage />} />
          <Route
            path={PATHS.notifications}
            element={
              <InApp>
                <NotificationsPage />
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
          <Route path={PATHS.subjectDetails} element={<SubjectDetailsPage />} />
          <Route
            path={PATHS.subjects}
            element={
              <InApp>
                <SubjectsListPage />
              </InApp>
            }
          />
          <Route
            path={PATHS.timetable}
            element={
              <InApp>
                <TimetablePage />
              </InApp>
            }
          />
          <Route path={PATHS.userDetails} element={<UserDetailsPage />} />

          {/* Students & parents */}
          <Route element={<RoleRoute allow={["student", "parent"]} />}>
            <Route
              path={PATHS.enrolledCourses}
              element={
                <InApp>
                  <EnrolledCoursesPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.fees}
              element={
                <InApp>
                  <LessonFeesPage />
                </InApp>
              }
            />
            <Route
              path={PATHS.guide}
              element={
                <InApp>
                  <GuidePage />
                </InApp>
              }
            />
            <Route path={PATHS.paymentStatus} element={<PaymentStatusPage />} />
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
          </Route>

          {/* Parents only */}
          <Route element={<RoleRoute allow={["parent"]} />}>
            <Route path={PATHS.addStudent} element={<AddStudentPage />} />
            <Route
              path={PATHS.notificationPrefs}
              element={
                <InApp>
                  <NotificationPreferencesPage />
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
              path={PATHS.wards}
              element={
                <InApp>
                  <WardsPage />
                </InApp>
              }
            />
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
              path={PATHS.awardEdit}
              element={
                <InApp>
                  <AwardFormPage />
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
              path={PATHS.classEdit}
              element={
                <InApp>
                  <ClassFormPage />
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
              path={PATHS.gradeEdit}
              element={
                <InApp>
                  <GradeFormPage />
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
              path={PATHS.manageClasses}
              element={
                <InApp>
                  <ManageClassesPage />
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
              path={PATHS.personNew}
              element={
                <InApp>
                  <UserFormPage />
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
              path={PATHS.reports}
              element={
                <InApp>
                  <ReportsPage />
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
              path={PATHS.taskTracker}
              element={
                <InApp>
                  <TaskTrackerPage />
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
