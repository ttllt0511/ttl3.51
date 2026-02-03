
import React, { useState, useEffect, Suspense } from 'react';
import { Layout } from './components/Layout';
import { HomeView } from './components/HomeView';
import { ItineraryView } from './components/ItineraryView';
import { NotesView } from './components/NotesView';
import { LoginView } from './components/LoginView';
import { TravelProvider, useTravel } from './context/TravelContext';
import { Tab } from './types';
import { WifiOff, Loader2 } from 'lucide-react';

// Code Splitting: Lazy load components that use heavy libraries (recharts)
const ExpensesView = React.lazy(() => import('./components/ExpensesView').then(module => ({ default: module.ExpensesView })));

// Loading Component for Suspense
const Loading = () => (
  <div className="flex h-full w-full items-center justify-center p-10">
    <Loader2 size={32} className="animate-spin text-blue-500" />
  </div>
);

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Consume context - much cleaner!
  const { roomId, roomData, actions } = useTravel();

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!roomId || !roomData) {
    return <LoginView onJoin={actions.login} onCreate={actions.createRoom} />;
  }

  const handleLogout = () => {
    actions.logout();
    setActiveTab('home');
  };

  return (
    <>
      {isOffline && (
        <div className="fixed top-0 inset-x-0 bg-slate-800 text-white text-[10px] font-bold text-center py-2 z-[100] animate-in slide-in-from-top flex items-center justify-center gap-2 shadow-xl">
          <WifiOff size={12} />
          <span>離線模式 (Offline Mode) - 您的資料已安全儲存在本機</span>
        </div>
      )}
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      >
        {activeTab === 'home' && (
          <HomeView onTabChange={setActiveTab} />
        )}
        {activeTab === 'itinerary' && (
           <ItineraryView />
        )}
        {activeTab === 'notes' && (
           <NotesView />
        )}
        {activeTab === 'expenses' && (
           <Suspense fallback={<Loading />}>
              <ExpensesView />
           </Suspense>
        )}
      </Layout>
    </>
  );
};

const App: React.FC = () => {
  return (
    <TravelProvider>
      <AppContent />
    </TravelProvider>
  );
};

export default App;
