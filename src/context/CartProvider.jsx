import { useEffect, useReducer, useRef } from 'react'
import CartContext from './CartContext.js'
import useArturaData from '../hooks/useArturaData.js'
import { cartReducer, isBuyable, sanitizeCartIds } from '../utils/cart.js'
import { loadCart, saveCart } from '../utils/cartStorage.js'

export default function CartProvider({ children }) {
  const { artworks, reportStorageError, resetVersion } = useArturaData()
  const lastReset = useRef(resetVersion)
  const [cartIds, dispatch] = useReducer(cartReducer, [], () => loadCart(artworks))

  useEffect(() => { if (lastReset.current !== resetVersion) { dispatch({ type:'clear' }); lastReset.current=resetVersion } }, [resetVersion])

  useEffect(() => {
    const cleanIds = sanitizeCartIds(cartIds, artworks)
    if (cleanIds.length !== cartIds.length) dispatch({ type: 'replace', ids: cleanIds })
  }, [artworks, cartIds])

  useEffect(() => {
    if (!saveCart(cartIds)) {
      reportStorageError('The cart is still available for this session, but the browser could not save it. If the page is refreshed, the cart may be lost.')
    }
  }, [cartIds, reportStorageError])

  const cartItems = cartIds
    .map((id) => artworks.find((artwork) => artwork.id === id))
    .filter(isBuyable)
  const totalQty = cartItems.length
  const totalPrice = cartItems.reduce((total, artwork) => total + Number(artwork.price), 0)

  function addToCart(id) {
    const artwork = artworks.find((item) => item.id === id)
    if (!isBuyable(artwork)) return
    dispatch({ type: 'add', id })
  }

  function removeFromCart(id) { dispatch({ type: 'remove', id }) }
  function clearCart() { dispatch({ type: 'clear' }) }
  function isInCart(id) { return cartItems.some((artwork) => artwork.id === id) }

  return (
    <CartContext.Provider value={{ cartItems, totalQty, totalPrice, addToCart, removeFromCart, clearCart, isInCart }}>
      {children}
    </CartContext.Provider>
  )
}
