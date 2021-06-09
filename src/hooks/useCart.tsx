import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const response = await api.get<Stock>(`stock/${productId}`);
      const stockData = response.data;

      const products = [...cart];
      const productOnCart = products.find(product => product.id === productId);

      if(productOnCart){
        if(stockData.amount > productOnCart.amount){
          productOnCart.amount++;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
          setCart(products);
        }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else{
        const productData = await api.get<Product>(`products/${productId}`);
        const product = productData.data;

        if(stockData.amount > 1){
          product.amount = 1;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, product]));
          setCart([
            ...cart,
            product
          ]);
        }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(product => product.id === productId);

      if(productIndex > -1){
        const newCart = cart.filter(product => product.id !== productId);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        setCart(newCart);
      } else {
        toast.error('Erro na remoção do produto');
      }
  
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const response = await api.get<Stock>(`stock/${productId}`);
      const stockData = response.data;

      const products = [...cart];
      const productOnCart = products.find(product => product.id === productId);

      if(amount <= 0){
        return;
      }

      if(productOnCart){
        if(amount <= stockData.amount){
          productOnCart.amount = amount;
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(products));
          setCart(products);
        }
        else{
          toast.error('Quantidade solicitada fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ 
        cart, 
        addProduct, 
        removeProduct, 
        updateProductAmount 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
