document.addEventListener('DOMContentLoaded', () => {
  const productCards = document.querySelectorAll('.product-card');

  productCards.forEach(card => {
    const colorDots = card.querySelectorAll('.color-dot');

    colorDots.forEach(dot => {
      dot.addEventListener('click', () => {
        // Remover clase 'active' de todos los puntos de ESTA tarjeta
        colorDots.forEach(d => d.classList.remove('active'));
        
        // Añadir a la seleccionada
        dot.classList.add('active');
        
        // Opcional: Aquí podrías cambiar la imagen del producto 
        // si tuvieras una ruta para cada color
        const productName = card.querySelector('.name').textContent;
        console.log(`Cambiado color en: ${productName}`);
      });
    });
  });

  // Botón See All
  document.querySelector('.btn-ghost').addEventListener('click', () => {
    alert('Redirigiendo a catálogo completo...');
  });
});