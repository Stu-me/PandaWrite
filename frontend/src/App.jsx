import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import DashBoardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RegistrationSuccessPage from "./pages/RegistrationSuccessPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SubscribePage from "./pages/SubscribePage";
import AdminPaymentsPage from "./pages/AdminPaymentsPage";
import AboutPage from "./pages/AboutPage";
import PageEditor from "./pages/PageEditor";
import StarredPagesPage from "./pages/StarredPagesPage";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import AdminBlogsPage from "./pages/AdminBlogsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Navbar from "./components/navbar";
import PageTransition from "./components/PageTransition";

function Layout() {
  return (
    <>
      <Navbar />
      {/* PageTransition wraps only the page content so the Navbar stays
          fixed while only the content below it fades in on each navigation. */}
      <PageTransition>
        <Outlet />
      </PageTransition>
    </>
  );
}

function App() {
  return (
    <>
      {/* we are making routes in the frontend that connects the pages and components */}
      <BrowserRouter>
        <Routes>
          {/* we use navigat in the  / cause dashboard is protected and if we simply  <dashboard people will surpass the authentication > */}
            <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
            <Route path="/blog" element={<PageTransition><BlogPage /></PageTransition>} />
            <Route path="/blog/:id" element={<PageTransition><BlogPostPage /></PageTransition>} />
            <Route path="/login" element={<PageTransition><LoginPage /></PageTransition>} />
            <Route path="/register" element={<PageTransition><RegisterPage /></PageTransition>} />
            <Route path="/registration-success" element={<PageTransition><RegistrationSuccessPage /></PageTransition>} />
            <Route path="/forgot-password" element={<PageTransition><ForgotPasswordPage /></PageTransition>} />
            <Route path="/reset-password/:token" element={<PageTransition><ResetPasswordPage /></PageTransition>} />

          <Route element={<Layout /> }>
            <Route path="/" element={<Navigate to="/dashboard"></Navigate>} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashBoardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subscribe"
              element={
                <ProtectedRoute>
                  <SubscribePage />
                </ProtectedRoute>
              }
            />
            <Route path="/subscription" element={<Navigate to="/subscribe" replace />} />
            <Route
              path="/admin/payments"
              element={
                <AdminRoute>
                  <AdminPaymentsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/page/:id"
              element={
                <ProtectedRoute>
                  <PageEditor />
                </ProtectedRoute>
              }
            />
            <Route path="/admin/blogs" element={<AdminRoute><AdminBlogsPage /></AdminRoute>} />
            <Route
              path="/starred"
              element={<ProtectedRoute><StarredPagesPage /></ProtectedRoute>}
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
