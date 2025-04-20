import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UserManagement from "./admin/UserManagment";
import VideoManagement from "./admin/VideoManagment";
import Approvers from "./admin/ApproverManagement";
import Ahome from "./Approvers Portal/Home";
import User from "./Approvers Portal/user";
import Video from "./Approvers Portal/video";
import Landing from "./Landing";
import "./App.css";
// import { LoginExample } from "./components/examples";
// import SignupPage from "./components/examples/signup";
// import HomePage from "./user_portal/pages/HomePage";
// import Layout from "./user_portal/components/layout";
// import UploadPage from "./user_portal/pages/UploadPage";
// import ExplorePage from "./user_portal/pages/ExplorePage";
// import ProfilePage from "./user_portal/pages/ProfilePage";
// import SearchPage from "./user_portal/pages/SearchPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminHome from "./admin/Home";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin/home" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHome />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <UserManagement />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/admin/videos" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <VideoManagement />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/admin/approvers" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Approvers />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/admin/overview" 
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHome />
            </ProtectedRoute>
          } 
        />
        
        {/* Approver Routes */}
        <Route 
          path="/approver/home" 
          element={
            <ProtectedRoute allowedRoles={["approver"]}>
              <Ahome />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/approver/pending-approvals" 
          element={
            <ProtectedRoute allowedRoles={["approver"]}>
              <Ahome /> 
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/approver/video-library" 
          element={
            <ProtectedRoute allowedRoles={["approver"]}>
              <Video />
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/approver/approval-history"
          element={
            <ProtectedRoute allowedRoles={["approver"]}>
              <User /> 
            </ProtectedRoute>
          } 
        />
         <Route 
          path="/approver/overview" 
          element={
            <ProtectedRoute allowedRoles={["approver"]}>
              <Ahome /> 
            </ProtectedRoute>
          } 
        />
        
        {/* User Routes */}
        {/* <Route 
          path="/user-portal" 
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserPortal />
            </ProtectedRoute>
          } 
        /> */}
        
        {/* Catch-all route for unauthorized access */}
        <Route path="*" element={<Landing />} />
      </Routes>
    </Router>
  );
}

export default App;
