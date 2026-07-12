/**
 * Hook et contexte pour gérer le thème de l'application
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'gray';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  bgColor: string;
  bgImage: string | null;
  setBgColor: (color: string) => void;
  setBgImage: (image: string | null) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved && ['light', 'dark', 'gray'].includes(saved)) return saved as Theme;
    
    if (typeof window !== 'undefined' && window.matchMedia) {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return prefersDark ? 'dark' : 'light';
    }
    
    return 'light';
  });

  const [bgColor, setBgColor] = useState<string>(() => {
    return localStorage.getItem('app_bg_color') || '#FFFFFF';
  });

  const [bgImage, setBgImage] = useState<string | null>(() => {
    return localStorage.getItem('app_bg_image') || null;
  });

  // Appliquer le thème et le fond au document
  useEffect(() => {
    const root = document.documentElement;
    
    // Gérer le thème
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else if (theme === 'gray') {
      root.classList.remove('dark');
      root.classList.add('gray-theme');
      root.style.colorScheme = 'light';
    } else {
      root.classList.remove('dark', 'gray-theme');
      root.style.colorScheme = 'light';
    }
    
    // Appliquer le fond
    const body = document.body;
    if (bgImage) {
      body.style.backgroundImage = `url('${bgImage}')`;
      body.style.backgroundSize = 'cover';
      body.style.backgroundPosition = 'center';
      body.style.backgroundAttachment = 'fixed';
    } else {
      body.style.backgroundImage = 'none';
      body.style.backgroundColor = bgColor;
    }
    
    localStorage.setItem('app_theme', theme);
    localStorage.setItem('app_bg_color', bgColor);
    if (bgImage) {
      localStorage.setItem('app_bg_image', bgImage);
    }
  }, [theme, bgColor, bgImage]);

  // Ajouter les styles du thème gris
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      :root.gray-theme {
        --color-bg-primary: #f5f5f5;
        --color-bg-secondary: #e8e8e8;
        --color-text-primary: #333333;
        --color-text-secondary: #666666;
        --color-border: #d0d0d0;
      }
      
      .gray-theme {
        background-color: #f5f5f5;
        color: #333333;
      }
      
      .gray-theme .bg-white { background-color: #f5f5f5; }
      .gray-theme .bg-gray-50 { background-color: #ebebeb; }
      .gray-theme .bg-gray-100 { background-color: #dcdcdc; }
      .gray-theme .bg-gray-200 { background-color: #cacaca; }
      .gray-theme .text-black { color: #4a4a4a; }
      .gray-theme .text-gray-900 { color: #5a5a5a; }
      .gray-theme .text-gray-700 { color: #7a7a7a; }
      .gray-theme .border-gray-200 { border-color: #d5d5d5; }
      .gray-theme .border-gray-300 { border-color: #c0c0c0; }
      .gray-theme .shadow-lg { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'gray';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, bgColor, bgImage, setBgColor, setBgImage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme doit être utilisé dans ThemeProvider');
  }
  return context;
};
