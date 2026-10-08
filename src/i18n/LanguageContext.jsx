import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './LanguageContext.js'
import { translate } from './translate.js'
const STORAGE_KEY = 'artura.language.v1'
export function LanguageProvider({ children }) {
  const [language,setLanguageState] = useState(() => { try { return localStorage.getItem(STORAGE_KEY) === 'id' ? 'id' : 'en' } catch { return 'en' } })
  const setLanguage = useCallback((next) => { const value=next==='id'?'id':'en';setLanguageState(value);try{localStorage.setItem(STORAGE_KEY,value)}catch{/* Keep language usable for this session. */} },[])
  useEffect(() => { document.documentElement.lang=language;document.title=language==='id'?'ARTURA — Galeri Seni & Komisi Kustom':'ARTURA — Art Gallery & Custom Commission' },[language])
  useEffect(() => { const sync=(event)=>{if(event.key===STORAGE_KEY)setLanguageState(event.newValue==='id'?'id':'en')};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync) },[])
  const t = useCallback((value) => translate(value,language),[language])
  const value = useMemo(() => ({language,setLanguage,t,locale:language==='id'?'id-ID':'en-GB'}),[language,setLanguage,t])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}
