const panels = Array.from(document.querySelectorAll('.panel'));
const faceLinks = Array.from(document.querySelectorAll('[data-face]'));

function syncPanels(moveFocus) {
  const id = location.hash.slice(1);
  const target = document.getElementById(id);
  const selected = target?.closest('.panel');
  panels.forEach((panel) => {
    panel.hidden = panel !== selected;
  });
  faceLinks.forEach((link) => {
    if (link.dataset.face === selected?.id) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
  if (selected) {
    if (moveFocus && target === selected) {
      selected.querySelector('h2').focus({ preventScroll: true });
    }
    if (selected.id !== 'project' || !matchMedia('(min-width: 821px)').matches) {
      target.scrollIntoView({ block: 'start' });
    }
  }
}

window.addEventListener('hashchange', () => syncPanels(true));
faceLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    if (location.hash !== link.hash) return;
    if (link.hash === '#project') {
      event.preventDefault();
      dismissAbout();
    } else {
      syncPanels(true);
    }
  });
});
syncPanels(false);

function dismissAbout() {
  location.hash = 'top';
  document.querySelector('#pyramid').focus({ preventScroll: true });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && location.hash === '#project') dismissAbout();
});

const viewer = document.querySelector('.viewer');
const viewerImage = viewer.querySelector('img');
const galleryControls = viewer.querySelector('.viewer-controls');
const galleryCount = viewer.querySelector('.viewer-count');
let lastFrame;
let photos = [];
let currentPhoto = 0;

function showPhoto() {
  const photo = photos[currentPhoto];
  viewerImage.src = photo.href;
  viewerImage.alt = photo.querySelector('img').alt;
  galleryCount.textContent = `${currentPhoto + 1} / ${photos.length}`;
}

function stepPhoto(step) {
  currentPhoto = (currentPhoto + step + photos.length) % photos.length;
  showPhoto();
}

if (typeof viewer.showModal === 'function') {
  document.querySelectorAll('[data-lightbox]').forEach((frame) => {
    frame.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      lastFrame = frame;
      photos = Array.from(frame.closest('.room, .installation-grid').querySelectorAll('[data-lightbox]'));
      currentPhoto = photos.indexOf(frame);
      galleryControls.hidden = photos.length < 2;
      showPhoto();
      viewer.showModal();
    });
  });

  galleryControls.querySelectorAll('[data-gallery-step]').forEach((button) => {
    button.addEventListener('click', () => stepPhoto(Number(button.dataset.galleryStep)));
  });
  viewer.addEventListener('keydown', (event) => {
    if (photos.length < 2 || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    stepPhoto(event.key === 'ArrowLeft' ? -1 : 1);
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => {
    if (event.target === viewer) viewer.close();
  });
  viewer.addEventListener('close', () => {
    viewerImage.removeAttribute('src');
    lastFrame.focus();
  });
}

const frame = document.querySelector('#documentation-player');
const playSound = document.querySelector('#play-film');
const origin = new URL(frame.src);
if (location.protocol === 'https:' || location.protocol === 'http:') {
  origin.searchParams.set('origin', location.origin);
  frame.src = origin.href;
}

let player;
let triedMuted = false;

function showSoundControl(show) {
  playSound.hidden = !show;
  playSound.parentElement.hidden = !show;
}

playSound.addEventListener('click', () => {
  player.unMute();
  player.playVideo();
});

window.onYouTubeIframeAPIReady = () => {
  player = new YT.Player(frame.id, {
    events: {
      onReady: ({ target }) => {
        target.unMute();
        target.playVideo();
      },
      onAutoplayBlocked: ({ target }) => {
        showSoundControl(true);
        if (!triedMuted) {
          triedMuted = true;
          target.mute();
          target.playVideo();
        }
      },
      onStateChange: ({ data, target }) => {
        if (data === YT.PlayerState.PLAYING) {
          showSoundControl(target.isMuted());
        }
      },
      onError: () => {
        showSoundControl(false);
      },
    },
  });
};

const youtubeApi = document.createElement('script');
youtubeApi.src = 'https://www.youtube.com/iframe_api';
youtubeApi.async = true;
document.head.append(youtubeApi);
