import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import ResidentDetail from './pages/ResidentDetail';
import Profile from './pages/Profile';
import Register from './pages/Register';
import SignUp   from './pages/SignUp';
import Info     from './pages/Info';
import Registrations from './pages/Registrations';
import Reports from './pages/Reports';
import Calendar from './pages/Calendar';
import Messages from './pages/Messages';
import { Sessions, Biometrics, Alerts, Formations, Staff, Settings } from './pages/OtherPages';
import './styles/global.css';

function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)', flexDirection:'column', gap:12 }}>
        <span className="live-dot" style={{ width:14, height:14 }} />
        <p style={{ fontSize:13, color:'var(--mint)' }}>Chargement…</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ display:'flex', minHeight:'100vh' }}>
      <Sidebar />
      <main style={{ flex:1, overflowY:'auto', background:'var(--cream)' }}>
        <Routes>
          <Route path="/"                element={<Dashboard />}      />
          <Route path="/residents"       element={<Residents />}      />
          <Route path="/residents/:id"   element={<ResidentDetail />} />
          <Route path="/sessions"        element={<Sessions />}       />
          <Route path="/biometrics"      element={<Biometrics />}     />
          <Route path="/formations"      element={<Formations />}     />
          <Route path="/staff"           element={<Staff />}          />
          <Route path="/alerts"          element={<Alerts />}         />
          <Route path="/registrations"   element={<Registrations />}  />
          <Route path="/reports"         element={<Reports />}        />
          <Route path="/calendar"        element={<Calendar />}       />
          <Route path="/messages"        element={<Messages />}       />
          <Route path="/settings"        element={<Settings />}       />
          <Route path="/profile"         element={<Profile />}        />
          <Route path="*"                element={<Navigate to="/" />}/>
        </Routes>
      </main>
    </div>
  );
}

function LoginGuard() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<LoginGuard />} />
            <Route path="/register" element={<Register />}   />
            <Route path="/signup"   element={<SignUp />}     />
            <Route path="/info"     element={<Info />}       />
            <Route path="/*"        element={<Layout />}     />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
