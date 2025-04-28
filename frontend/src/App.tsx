import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserList from './pages/AddUser/UserList';
import AddUser from './pages/AddUser/AddUser';
import EditProfile from './pages/EditProfile';
import LaporanRawatInap from './pages/pendapatan/rawatinap';

// Komponen ProtectedRoute untuk mengecek autentikasi
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = localStorage.getItem('user') !== null;
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rute Pengguna */}
        <Route 
          path="/pengguna/list" 
          element={
            <ProtectedRoute>
              <UserList />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/pengguna/tambah" 
          element={
            <ProtectedRoute>
              <AddUser />
            </ProtectedRoute>
          } 
        />
        
        {/* Rute Pendapatan */}
        <Route 
          path="/pendapatan/rawat-inap" 
          element={
            <ProtectedRoute>
              <LaporanRawatInap />
            </ProtectedRoute>
          } 
        />
        
        {/* Rute Profil */}
        <Route 
          path="/profile/edit" 
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          } 
        />
        
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App; 