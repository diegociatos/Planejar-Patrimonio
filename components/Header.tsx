

import React, { useState, useRef, useEffect } from 'react';
import { User, Notification } from '../types';
import Icon from './Icon';
import NotificationPanel from './NotificationPanel';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearAllNotifications: () => void;
  onNavigateToMyData: () => void;
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout, notifications, onNotificationClick, onClearAllNotifications, onNavigateToMyData, onToggleSidebar }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <header className="bg-brand-primary">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 -ml-2 mr-2 text-white rounded-md hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-label="Abrir menu"
            >
              <Icon name="menu" className="h-6 w-6" />
            </button>
             <svg viewBox="0 0 320 80" xmlns="http://www.w3.org/2000/svg" className="h-12 w-auto" role="img">
              <g>
                  <text x="10" y="45" fontFamily="Book Antiqua, serif" fontSize="24" fill="white" fontWeight="bold">PLANEJAR</text>
                  <text x="150" y="45" fontFamily="Book Antiqua, serif" fontSize="24" fill="#f2b401">PATRIMÔNIO</text>
              </g>
            </svg>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setIsNotificationPanelOpen(prev => !prev)}
                className="relative p-2 rounded-full text-white hover:bg-white/10"
                aria-label="Notificações"
              >
                <Icon name="bell" className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                      {unreadCount}
                  </span>
                )}
              </button>
              {isNotificationPanelOpen && (
                <NotificationPanel 
                  notifications={notifications}
                  onClose={() => setIsNotificationPanelOpen(false)}
                  onNotificationClick={onNotificationClick}
                  onClearAll={onClearAllNotifications}
                />
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(prev => !prev)}
                className="flex items-center p-2 rounded-md hover:bg-white/10"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <span className="text-sm font-medium text-white mr-3 hidden sm:inline">
                  Olá, <span className="font-bold">{user.name.split(' ')[0]}</span>
                </span>
                {user.avatarUrl ? (
                    <img className="h-9 w-9 rounded-full" src={user.avatarUrl} alt={user.name} />
                ) : (
                    <div className="h-9 w-9 rounded-full bg-brand-accent flex items-center justify-center text-brand-dark font-bold">
                        {user.name.charAt(0)}
                    </div>
                )}
              </button>
              
              {isDropdownOpen && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button onClick={() => { onNavigateToMyData(); setIsDropdownOpen(false); }} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                      <Icon name="user-circle" className="w-5 h-5 mr-3 text-gray-500" /> Meus Dados
                    </button>
                    <button onClick={() => { onLogout(); setIsDropdownOpen(false); }} className="text-gray-700 block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center">
                      <Icon name="logout" className="w-5 h-5 mr-3 text-gray-500" /> Sair
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;