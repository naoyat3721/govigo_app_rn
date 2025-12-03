import Constants from 'expo-constants';
import React, { createContext, useContext, useState } from 'react';

// Get URLs from environment variables
const WEB_URL = Constants.expoConfig?.extra?.webUrl || 'https://dev.govigolf.com/';
const WEB_URL_EN = Constants.expoConfig?.extra?.webUrlEn || 'https://en.dev.govigolf.com/';
const WEB_URL_VN = Constants.expoConfig?.extra?.webUrlVn || 'https://vn.dev.govigolf.com/';

// Language configuration
const LANGUAGES = {
  jp: { code: 'jp', label: '日本語', url: WEB_URL },
  en: { code: 'en', label: 'English', url: WEB_URL_EN },
  vn: { code: 'vn', label: 'Tiếng Việt', url: WEB_URL_VN },
};

const WebViewContext = createContext();

export const WebViewProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('jp'); // Default Japanese
  const [webViewUrl, setWebViewUrl] = useState(WEB_URL);

  const changeLanguage = (languageCode) => {
    const language = LANGUAGES[languageCode];
    if (language) {
      setCurrentLanguage(languageCode);
      setWebViewUrl(language.url);
      console.log(`Language changed to: ${languageCode}, URL: ${language.url}`);
    }
  };

  const getCurrentLanguage = () => LANGUAGES[currentLanguage];

  const value = {
    currentLanguage,
    webViewUrl,
    changeLanguage,
    getCurrentLanguage,
    languages: Object.values(LANGUAGES),
  };

  return (
    <WebViewContext.Provider value={value}>
      {children}
    </WebViewContext.Provider>
  );
};

export const useWebView = () => {
  const context = useContext(WebViewContext);
  if (!context) {
    throw new Error('useWebView must be used within a WebViewProvider');
  }
  return context;
};
