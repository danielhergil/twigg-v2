import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import Explore from "./pages/dashboard/Explore";
import Profile from "./pages/dashboard/Profile";
import Create from "./pages/dashboard/Create";
import CourseDetail from "./pages/dashboard/CourseDetail";
import CourseExecution from "./pages/dashboard/CourseExecution";
import { AuthProvider } from "./components/AuthProvider";

const queryClient = new QueryClient();

const App = () => (
  <div className="h-full">
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />}>
                  <Route index element={<DashboardHome />} />
                  <Route path="explore" element={<Explore />} />
                  <Route path="course/:id" element={<CourseDetail />} />
                  <Route path="course/:id/learn" element={<CourseExecution />} />
                  <Route path="create" element={<Create />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<div>Settings Content</div>} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </div>
);

export default App;