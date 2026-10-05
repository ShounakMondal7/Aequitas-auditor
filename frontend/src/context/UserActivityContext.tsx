import React, { createContext, useContext, useEffect, useState } from 'react';

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details?: any;
}

interface ActivityContextType {
  logs: ActivityLog[];
  logAction: (action: string, details?: any) => void;
  clearLogs: () => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export const UserActivityProvider: React.FC<{ children: React.ReactNode; currentUser: string }> = ({
  children,
  currentUser,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    try {
      const saved = localStorage.getItem('aequitas_activity_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aequitas_activity_logs', JSON.stringify(logs));
    } catch (err) {
      console.warn('Unable to persist activity logs to localStorage:', err);
    }
  }, [logs]);

  const logAction = (action: string, details?: any) => {
    const newLog: ActivityLog = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      user: currentUser || 'Guest',
      action,
      details,
    };
    setLogs((prev) => [newLog, ...prev]);
    console.log(`[Aequitas Audit Trail]`, newLog);
  };

  const clearLogs = () => {
    setLogs([]);
    try {
      localStorage.removeItem('aequitas_activity_logs');
    } catch (err) {
      console.warn('Unable to clear activity logs from localStorage:', err);
    }
  };

  return (
    <ActivityContext.Provider value={{ logs, logAction, clearLogs }}>
      {children}
    </ActivityContext.Provider>
  );
};

export const useActivity = () => {
  const context = useContext(ActivityContext);
  if (!context) throw new Error('useActivity must be used within UserActivityProvider');
  return context;
};
