import { useEffect } from 'react';
import { ItemCart } from './ItemCart';
import { supabase } from '@/lib/supabase';
import { channel } from '@/components/11/commonChannel';

const normalizePrice = ({ price, quantity }) => {
  const priceNormalize = +price.replace(',', '.');
  return +(priceNormalize * +quantity).toFixed(2);
};

const CartModal = ({
  myRef,
  cart,
  deleteFromCart,
  addToCart,
  addToCounter,
  restToCounter,
  newTotal
}) => {
  const priceTotal = cart
    .reduce(
      (totalMoney, { price, quantity }) =>
        totalMoney + normalizePrice({ price, quantity }),
      0
    )
    .toFixed(2);

  useEffect(() => {
    async function updateTotalValue() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const { data: correctData, error } = await supabase
        .from('project_11_compras')
        .upsert(
          { usuario_id: userId, total_compra: priceTotal },
          { onConflict: 'usuario_id' }
        )
        .select();
      if (error) console.info('Error updating total');
      if (correctData) console.info('Total updated successfully');

      await channel.send({
        type: 'broadcast',
        event: 'total_updated',
        payload: { usuario_id: userId, total_compra: priceTotal }
      });
    }

    updateTotalValue();
  }, [priceTotal]);

  return (
    <section className='cart-modal' ref={myRef}>
      <div className='header'>
        <h2>TOTAL ${priceTotal}</h2>
      </div>
      {cart.map(item => (
        <ItemCart
          key={item.id}
          data={item}
          deleteFromCart={deleteFromCart}
          addToCart={addToCart}
          addToCounter={addToCounter}
          restToCounter={restToCounter}
          newTotal={newTotal}
          normalizePrice={normalizePrice}
        ></ItemCart>
      ))}
    </section>
  );
};

export default CartModal;
