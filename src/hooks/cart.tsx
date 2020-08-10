import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getProducts: any = await AsyncStorage.getItem('@GoCart');

      if (getProducts) {
        setProducts(JSON.parse(getProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const findProduct = products.filter(product => product.id !== id);

      if (!findProduct) {
        throw Alert.alert('Product', 'Product not found');
      }

      const newProductsArray = products.find(product => product.id === id);

      if (newProductsArray) {
        newProductsArray.quantity += 1;
        setProducts([...findProduct, newProductsArray]);
      }

      await AsyncStorage.setItem('@GoCart', JSON.stringify(newProductsArray));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const filteredProducts = products.filter(product => product.id !== id);
      const newProduct = products.find(product => product.id === id);

      if (newProduct) {
        if (newProduct.quantity <= 1) {
          setProducts(filteredProducts);
        } else {
          newProduct.quantity -= 1;
          setProducts([...filteredProducts, newProduct]);
        }
      }

      await AsyncStorage.setItem('@GoCart', JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productIndex = products.findIndex(p => p.id === product.id);

      if (productIndex < 0) {
        setProducts(oldState => [...oldState, { ...product, quantity: 1 }]);
        await AsyncStorage.setItem(
          '@GoCart',
          JSON.stringify([...products, { ...product, quantity: 1 }]),
        );
      } else {
        increment(product.id);
      }
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
