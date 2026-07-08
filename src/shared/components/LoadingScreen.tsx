import React, { createContext, useContext, useState } from "react";

// CSS styles inside component for complete modularity
const loadingStyles = `
@keyframes spin-gradient {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 15px rgba(220, 38, 38, 0.4); }
  50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 30px rgba(220, 38, 38, 0.8); }
}

@keyframes text-fade {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
  font-family: 'Inter', sans-serif;
  color: #ffffff;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(30, 41, 59, 0.7);
  padding: 40px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  text-align: center;
  min-width: 280px;
}

.loading-logo-wrapper {
  position: relative;
  width: 90px;
  height: 90px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-spinner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 4px solid rgba(220, 38, 38, 0.1);
  border-top: 4px solid #e11d48;
  border-radius: 50%;
  animation: spin-gradient 1.2s linear infinite;
}

.loading-brand {
  font-size: 16px;
  font-weight: 800;
  letter-spacing: 2px;
  color: #ffffff;
  background-color: #e11d48;
  width: 66px;
  height: 66px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pulse-glow 2s ease-in-out infinite;
  z-index: 10;
}

.loading-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
  background: linear-gradient(135deg, #ffffff, #cbd5e1);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.loading-subtitle {
  font-size: 13px;
  font-weight: 500;
  color: #94a3b8;
  animation: text-fade 1.5s ease-in-out infinite;
  margin: 0;
}
`;

export function LoadingScreen({ message = "Đang tải dữ liệu..." }: { message?: string }) {
  return (
    <div className="loading-overlay">
      <style>{loadingStyles}</style>
      <div className="loading-container">
        <div className="loading-logo-wrapper">
          <div className="loading-spinner"></div>
          <div className="loading-brand">SOS</div>
        </div>
        <h3 className="loading-title">SOSBIKE ADMIN</h3>
        <p className="loading-subtitle">{message}</p>
      </div>
    </div>
  );
}

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("Đang tải dữ liệu...");

  const showLoading = (msg = "Đang tải dữ liệu...") => {
    setMessage(msg);
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider value={{ showLoading, hideLoading, isLoading }}>
      {children}
      {isLoading && <LoadingScreen message={message} />}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
