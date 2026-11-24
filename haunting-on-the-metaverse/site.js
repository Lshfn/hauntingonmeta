const viewer = document.querySelector('.viewer');
const viewerImage = viewer.querySelector('img');
let lastFrame;

if (typeof viewer.showModal === 'function') {
  document.querySelectorAll('[data-lightbox]').forEach((frame) => {
    frame.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      event.preventDefault();
      lastFrame = frame;
      viewerImage.src = frame.href;
      viewerImage.alt = frame.querySelector('img').alt;
      viewer.showModal();
    });
  });

  viewer.querySelector('button').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    viewerImage.removeAttribute('src');
    lastFrame.focus();
  });
}

const filmPreview = document.querySelector('[data-video]');
filmPreview.addEventListener('click', (event) => {
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  event.preventDefault();
  const player = document.createElement('iframe');
  player.src = 'https://www.youtube-nocookie.com/embed/eX5gVjBaq1g?autoplay=1';
  player.title = 'Haunting on the Metaverse video documentation';
  player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  player.allowFullscreen = true;
  player.referrerPolicy = 'strict-origin-when-cross-origin';
  filmPreview.replaceWith(player);
  player.focus();
});
