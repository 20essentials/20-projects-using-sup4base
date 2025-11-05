export const ItemLoader = () => {
  return (
    <aside className='container-loader'>
      {Array.from({ length: 15 }, (_, i) => (
        <div key={i} className='aro' style={{ '--s': i }}></div>
      ))}
    </aside>
  );
};
