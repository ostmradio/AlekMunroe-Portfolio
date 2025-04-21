window.addEventListener('DOMContentLoaded', function() {
  const root = document.documentElement;
  const color1 = getRandomColor();
  const color2 = getRandomColor();
  const color3 = getRandomColor();
  
  root.style.setProperty('--color1', color1);
  root.style.setProperty('--color2', color2);
  root.style.setProperty('--color3', color3);
});

function getRandomColor() {
  const colors = [
    '#FFBCD9', // Pink
    '#FFD700', // Gold
    '#FF6EC7', // Hot Pink
    '#FFB6C1', // Light Pink
    '#FF82AB', // Orchid Pink
    '#87CEEB', // Sky Blue
    '#00BFFF', // Deep Sky Blue
    '#00FFFF', // Cyan
  ];

  return colors[Math.floor(Math.random() * colors.length)];
}
