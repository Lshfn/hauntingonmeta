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
    target.scrollIntoView({ block: 'start' });
  }
}

window.addEventListener('hashchange', () => syncPanels(true));
faceLinks.forEach((link) => {
  link.addEventListener('click', () => {
    if (location.hash === link.hash) syncPanels(true);
  });
});
syncPanels(false);

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

const frame = document.querySelector('#documentation-player');
const playSound = document.querySelector('#play-film');
const origin = new URL(frame.src);
if (location.protocol === 'https:' || location.protocol === 'http:') {
  origin.searchParams.set('origin', location.origin);
  frame.src = origin.href;
}

let player;
let triedMuted = false;

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
        playSound.hidden = false;
        if (!triedMuted) {
          triedMuted = true;
          target.mute();
          target.playVideo();
        }
      },
      onStateChange: ({ data, target }) => {
        if (data === YT.PlayerState.PLAYING) {
          playSound.hidden = !target.isMuted();
        }
      },
      onError: () => {
        playSound.hidden = true;
      },
    },
  });
};

const youtubeApi = document.createElement('script');
youtubeApi.src = 'https://www.youtube.com/iframe_api';
youtubeApi.async = true;
document.head.append(youtubeApi);
