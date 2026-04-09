import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { Navbar } from '../components/layout/Navbar';
import { useState } from 'react';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, visible with drawer on md+ */}
      <div
        className={`fixed md:relative z-30 h-full transition-transform duration-300 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <Navbar onMenuClick={toggleSidebar} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// export const DashboardLayout = () => {
//   return (
//     <div>
//       {/* <Sidebar /> */}
//       {/* <Navbar /> */}

//       <Outlet />
//     </div>
//   );
// };
