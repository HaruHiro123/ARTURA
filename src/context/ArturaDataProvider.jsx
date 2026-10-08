import { useCallback, useEffect, useRef, useState } from 'react'
import ArturaDataContext from './ArturaDataContext.js'
import initialArtworks from '../data/artworks.js'
import { STORE_KEY, loadStore, normalizeStore, validPricing } from '../utils/store.js'
import { createOrderData, updateOrderData, soldIds, reservedIds, money, httpsUrl } from '../utils/transactionRules.js'
import { getAvailablePaymentMethods } from '../utils/paymentMethods.js'
const makeId = (prefix) => `${prefix}-${crypto.randomUUID().slice(0,12).toUpperCase()}`
export default function ArturaDataProvider({ children }) {
  const [data,setData]=useState(()=>loadStore(initialArtworks))
  const current=useRef(data)
  const [storageError,setStorageError]=useState('')
  const reportStorageError=useCallback((message)=>setStorageError(message||'Browser storage is full or unavailable. The latest changes were not saved. Remove some old data/images or try a normal browser session, then try again.'),[])
  useEffect(()=>{
    function sync(event){if(event.key!==STORE_KEY||!event.newValue)return;try{const next=normalizeStore(JSON.parse(event.newValue),initialArtworks);current.current=next;setData(next)}catch{/* Ignore malformed changes. */}}
    window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync)
  },[])
  function db(){try{const raw=localStorage.getItem(STORE_KEY);if(raw)current.current=normalizeStore(JSON.parse(raw),initialArtworks)}catch{/* Use current session state. */}return current.current}
  function commit(next){try{localStorage.setItem(STORE_KEY,JSON.stringify(next))}catch{reportStorageError();return false}current.current=next;setData(next);setStorageError('');return true}
  function fail(message){reportStorageError(message);return false}
  function update(field,transform){const source=db();return commit({...source,[field]:transform(source[field])})}
  function addArtwork(payload){const artwork={...payload,id:makeId('art'),createdAt:new Date().toISOString()};return update('artworks',items=>[artwork,...items])?artwork:null}
  function updateArtwork(id,changes){const source=db();if((soldIds(source.orders).has(id)||source.artworks.find(a=>a.id===id)?.status==='sold')&&changes.status!=='sold')return fail('A sold original artwork cannot be made available again.');return update('artworks',items=>items.map(item=>item.id===id?{...item,...changes}:item))}
  function deleteArtwork(id){if(reservedIds(db().orders).has(id))return fail('An artwork with an active order cannot be deleted.');return update('artworks',items=>items.filter(item=>item.id!==id))}
  function createOrder(payload){try{const source=db();const order=createOrderData(source,payload,makeId('ART'));return commit({...source,orders:[order,...source.orders]})?order:null}catch(error){return fail(error.message)}}
  function updateOrder(id,changes){try{return commit(updateOrderData(db(),id,changes))}catch(error){return fail(error.message)}}
  function createCommission(payload){if(!db().artist.commissionOpen)return fail('Commission is currently closed.');const request={...payload,id:makeId('COM'),createdAt:new Date().toISOString(),status:'new',paymentStatus:'waiting-approval',paymentMethod:'',paymentProof:null,finalPrice:Number(payload.estimatedPrice)};if(!money(request.finalPrice)||request.finalPrice<=0)return fail('Price must be a positive whole rupiah amount.');return update('commissions',items=>[request,...items])?request:null}
  function updateCommission(id,changes){
    const source=db();const item=source.commissions.find(entry=>entry.id===id)
    if(!item)return false
    if(['rejected','cancelled','completed'].includes(item.status))return fail('This request has already been closed.')
    if(changes.finalPrice!==undefined&&(!money(changes.finalPrice)||changes.finalPrice<=0))return fail('Price must be a positive whole rupiah amount.')
    if(changes.paymentStatus==='waiting-verification'&&(!['waiting-payment','rejected'].includes(item.paymentStatus)||!changes.paymentProof?.preview||!getAvailablePaymentMethods(source.paymentSettings).some(method=>method.value===changes.paymentMethod)))return fail('Choose an active payment method and a valid proof.')
    if(changes.paymentStatus==='paid'&&(item.paymentStatus!=='waiting-verification'||!item.paymentProof?.preview))return fail('Only a submitted payment proof can be verified.')
    if(item.paymentStatus==='paid'&&((changes.paymentStatus&&changes.paymentStatus!=='paid')||(changes.finalPrice!==undefined&&changes.finalPrice!==item.finalPrice)))return fail('A paid order cannot be cancelled from this flow. Complete the process or handle the refund manually.')
    const next={...item,...changes,delivery:{...item.delivery,...changes.delivery}}
    if(next.delivery.deliveryUrl&&!httpsUrl(next.delivery.deliveryUrl))return fail('The final file link must use HTTPS.')
    if(['in-progress','ready-to-deliver','ready-to-ship','shipped','delivered','completed'].includes(next.status)&&next.paymentStatus!=='paid')return fail('Payment must be verified before fulfillment.')
    if(item.mediaType==='traditional'&&['shipped','delivered','completed'].includes(next.status)&&!next.delivery.trackingNumber?.trim())return fail('Enter a tracking number before marking the commission as Shipped.')
    if(item.mediaType==='digital'&&['ready-to-deliver','completed'].includes(next.status)&&!httpsUrl(next.delivery.deliveryUrl))return fail('The final file link must use HTTPS.')
    return commit({...source,commissions:source.commissions.map(entry=>entry.id===id?next:entry)})
  }
  function addReview(payload){const review={...payload,id:makeId('review'),createdAt:new Date().toISOString()};return update('reviews',items=>[review,...items])?review:null}
  function resetArturaData(){if(!commit({...normalizeStore({},initialArtworks),resetVersion:Date.now()}))return false;try{localStorage.removeItem('artura.cart.v1')}catch{/* Cart state also resets through resetVersion. */}return true}
  const value={...data,storageError,reportStorageError,clearStorageError:()=>setStorageError(''),addArtwork,updateArtwork,deleteArtwork,createOrder,updateOrder,createCommission,updateCommission,addReview,deleteReview:id=>update('reviews',items=>items.filter(item=>item.id!==id)),
    updatePricing:next=>validPricing(next)?update('pricing',()=>next):fail('Price must be a positive whole rupiah amount.'),updateArtist:next=>update('artist',()=>next),updatePaymentSettings:next=>update('paymentSettings',()=>next),updateSiteSettings:next=>update('siteSettings',()=>next),resetArturaData, saveSettings:changes=>commit({...db(),...changes})}
  return <ArturaDataContext.Provider value={value}>{children}</ArturaDataContext.Provider>
}
