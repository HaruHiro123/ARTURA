import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ArturaDataProvider from './context/ArturaDataProvider.jsx'
import CartProvider from './context/CartProvider.jsx'
import { LanguageProvider } from './i18n/LanguageContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <LanguageProvider>
        <ArturaDataProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ArturaDataProvider>
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
