import { Navigate, Route, Routes } from "react-router-dom";
import FloatingShape from "./components/floatingShape";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import LoadingSpinner from "./components/LoadingSpinner";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./store/authStore";
import { useEffect } from "react";
import Home from "./pages/Home";
import "./App.css";
import Upload from "./pages/Upload";
import PreviewPage from "./pages/PreviewPage";
import About from "./pages/About";


import Sidebar from "./components/Sidebar"; 
import Gallery from "./pages/Gallery";
import RecognitionResults from "./pages/recognition";
import JoinGroupPage from "./pages/GroupPages/JoinGroup";
import CreateGroupPage from "./pages/GroupPages/CreateGroup";
import MyGroupsPage from "./pages/GroupPages/MyGroupsPage";
import GroupDetailsPage from "./pages/GroupPages/GroupDetailPage";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();


  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  if (!user.isVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  

  return <> <Sidebar/>{children}</>;
};


const RedirectAuthenticatedUser = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user.isVerified) {
    return <Navigate to='/upload' replace />;
  }

  return children;
};

function App() {
  const { isCheckingAuth, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) return <LoadingSpinner />;

  return (
<>
    <div className="app-container">
      <div className="main-container">


      <Routes>
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/recognition'
          element={
            <ProtectedRoute>
              <RecognitionResults />
            </ProtectedRoute>
          }
        />
        <Route
          path='/gallery'
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path='/home'
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path='/upload'
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route
          path='/about'
          element={
              <About />
          }
        />
        <Route
          path='/preview'
          element={
            <ProtectedRoute>
              <PreviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/group/create'
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/group/:id'
          element={
            <ProtectedRoute>
              <GroupDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path='/group/join/:code'
          element={
            <ProtectedRoute>
              <JoinGroupPage />
            </ProtectedRoute>
          }
        />

         <Route
          path='/about'
          element={
            <ProtectedRoute>
              <About />
            </ProtectedRoute>
          }
        />
         <Route
          path='/my-groups'
          element={
            <ProtectedRoute>
              <MyGroupsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path='/signup'
          element={
            <RedirectAuthenticatedUser>
              <SignUpPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path='/login'
          element={
            <RedirectAuthenticatedUser>
              <LoginPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route path='/verify-email' element={<EmailVerificationPage />} />
        <Route
          path='/forgot-password'
          element={
            <RedirectAuthenticatedUser>
              <ForgotPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route
          path='/reset-password/:token'
          element={
            <RedirectAuthenticatedUser>
              <ResetPasswordPage />
            </RedirectAuthenticatedUser>
          }
        />
        <Route path='*' element={<Navigate to='/upload' replace />} />
      </Routes>
      <Toaster />
      </div>
    </div>
    </>
  );
}

export default App;