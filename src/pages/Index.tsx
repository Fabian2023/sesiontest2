
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import GuestDashboard from "@/components/GuestDashboard";
import SignIn from "@/components/SignIn";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, profile, isAdmin, isLoading } = useAuth();
  const [showSignIn, setShowSignIn] = useState(false);

  // If still loading auth state, show loading indicator
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show appropriate dashboard based on role
  if (user && profile) {
    return isAdmin ? <AdminDashboard /> : <GuestDashboard />;
  }

  // If not authenticated, show welcome screen with option to sign in
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      {showSignIn ? (
        <SignIn />
      ) : (
        <div className="text-center max-w-md px-6 py-10 bg-white rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-4">Bienvenido a la Aplicación</h1>
          <p className="text-xl text-gray-600 mb-8">Sistema de gestión de usuarios e invitaciones</p>
          
          <div className="space-y-4">
            <Button onClick={() => setShowSignIn(true)} className="w-full py-6 text-lg">
              Iniciar Sesión
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
