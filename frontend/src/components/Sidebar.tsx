import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MenuItem {
  name: string;
  path: string;
  icon: JSX.Element;
  subMenus?: {
    name: string;
    path: string;
  }[];
}

interface SidebarProps {
  darkMode: boolean;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ darkMode, isOpen }) => {
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Cek apakah layar mobile saat komponen mount
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Buka submenu jika path saat ini ada di dalamnya
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subMenus) {
        const submenuPaths = item.subMenus.map(sub => sub.path);
        if (submenuPaths.includes(location.pathname)) {
          setOpenSubmenu(item.name);
        }
      }
    });
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      name: 'Pendapatan',
      path: '/pendapatan',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      subMenus: [
        { name: 'Rawat Inap', path: '/pendapatan/rawat-inap' },
        { name: 'Rawat Jalan', path: '/pendapatan/rawat-jalan' },
        { name: 'Penjualan Bebas', path: '/pendapatan/penjualan-bebas' },
        { name: 'Piutang', path: '/pendapatan/piutang' }
      ]
    },
    {
      name: 'Pengeluaran',
      path: '/pengeluaran',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      subMenus: [
        { name: 'Medis', path: '/pengeluaran/medis' },
        { name: 'Non Medis', path: '/pengeluaran/non-medis' },
        { name: 'Gaji dan Honorarium', path: '/pengeluaran/gaji-honorarium' },
        { name: 'Operasional Lainnya', path: '/pengeluaran/operasional-lainnya' }
      ]
    },
    {
      name: 'Laporan',
      path: '/laporan',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      subMenus: [
        { name: 'Pendapatan Harian', path: '/laporan/pendapatan-harian' },
      ]
    },
    {
      name: 'Pengguna',
      path: '/pengguna',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      subMenus: [
        { name: 'Daftar Pengguna', path: '/pengguna/list' },
        { name: 'Tambah Pengguna', path: '/pengguna/tambah' }
      ]
    }
  ];

  const toggleSubmenu = (menuName: string) => {
    if (openSubmenu === menuName) {
      setOpenSubmenu(null);
    } else {
      setOpenSubmenu(menuName);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  // Jika sidebar ditutup pada mobile, tidak perlu merender apapun
  if (!isOpen && isMobile) {
    return null;
  }

  return (
    <div 
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] z-20
        transition-all duration-500 ease-in-out
        ${isOpen ? 'w-64' : 'w-0'}
        ${darkMode ? 'bg-gray-800' : 'bg-gray-900'}
        shadow-xl overflow-hidden
      `}
      aria-hidden={!isOpen}
    >
      {/* Inner content yang tidak akan terlipat */}
      <div className={`w-64 h-full overflow-y-auto text-gray-200 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}>
        <div className="px-6 py-4 border-b border-gray-700 transition-colors duration-500 ease-in-out h-16 flex items-center justify-center">
          <span className={`text-lg font-bold transition-colors duration-500 ease-in-out ${
            darkMode ? 'text-blue-400' : 'text-blue-400'
          } whitespace-nowrap`}>
            Menu SIAK-RSBW
          </span>
        </div>
        
        <nav className="mt-4">
          <ul className="px-4">
            {menuItems.map((item) => (
              <li key={item.name} className="mb-2">
                {item.subMenus ? (
                  <div>
                    <button
                      onClick={() => toggleSubmenu(item.name)}
                      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors duration-300 ${
                        openSubmenu === item.name 
                          ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                          : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-700')
                      } whitespace-nowrap`}
                    >
                      <div className="flex items-center">
                        {item.icon}
                        <span className="ml-3">{item.name}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform duration-300 ${openSubmenu === item.name ? 'transform rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    <div
                      className={`transition-all duration-300 overflow-hidden ${
                        openSubmenu === item.name ? 'max-h-60 opacity-100 visible' : 'max-h-0 opacity-0 invisible'
                      }`}
                    >
                      <ul className="pl-8 mt-2 space-y-1">
                        {item.subMenus.map((subItem) => (
                          <li key={subItem.name}>
                            <Link
                              to={subItem.path}
                              className={`block p-2 rounded-md transition-colors duration-300 ${
                                isActive(subItem.path)
                                  ? (darkMode ? 'bg-gray-700 text-blue-400' : 'bg-gray-700 text-blue-400')
                                  : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-700')
                              } whitespace-nowrap`}
                            >
                              {subItem.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <Link
                    to={item.path}
                    className={`flex items-center p-2 rounded-md transition-colors duration-300 ${
                      isActive(item.path)
                        ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                        : (darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-700')
                    } whitespace-nowrap`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar; 