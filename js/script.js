const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

const spaceFacts = [
  'Venus rotates so slowly that a single day there lasts longer than an entire Venusian year.',
  'A teaspoon of neutron star material would weigh about a billion tons on Earth.',
  'NASA\'s Voyager 1 spacecraft is the farthest human-made object from our planet.',
  'Saturn\'s rings are made mostly of water ice ranging from dust-sized particles to mountains.',
  'The International Space Station orbits Earth roughly every 90 minutes.',
  'Mars is home to Olympus Mons, the tallest volcano in the solar system at nearly 22 kilometers high.'
];

let galleryEl;
let fetchButton;
let containerEl;
let modalController;
let defaultButtonText = '';

document.addEventListener('DOMContentLoaded', init);

function init() {
  galleryEl = document.getElementById('gallery');
  fetchButton = document.getElementById('getImageBtn');
  containerEl = document.querySelector('.container');

  if (!galleryEl || !fetchButton || !containerEl) {
    console.warn('Required elements for the gallery are missing.');
    return;
  }

  defaultButtonText = fetchButton.textContent || 'Fetch Space Images';

  injectRandomFact();
  modalController = createModal();

  fetchButton.addEventListener('click', handleFetchClick);
}

function injectRandomFact() {
  const factSection = document.createElement('section');
  factSection.className = 'space-fact';
  factSection.innerHTML = [
    '<h2 class="space-fact__heading">Did You Know?</h2>',
    '<p class="space-fact__text"></p>'
  ].join('');

  const referenceNode = galleryEl;
  containerEl.insertBefore(factSection, referenceNode);

  const factText = factSection.querySelector('.space-fact__text');
  factText.textContent = getRandomFact();
}

function getRandomFact() {
  if (!spaceFacts.length) {
    return 'There is always something new to learn about our universe.';
  }

  const index = Math.floor(Math.random() * spaceFacts.length);
  return spaceFacts[index];
}

async function handleFetchClick() {
  if (!galleryEl || !fetchButton) {
    return;
  }

  showLoader();
  fetchButton.disabled = true;
  fetchButton.textContent = 'Loading...';

  try {
    const response = await fetch(apodData);

    if (!response.ok) {
      throw new Error('Request failed.');
    }

    const data = await response.json();

    if (!Array.isArray(data) || !data.length) {
      showEmptyState();
      return;
    }

    renderGallery(data);
  } catch (error) {
    console.error('Unable to load NASA APOD data:', error);
    showErrorState();
  } finally {
    fetchButton.disabled = false;
    fetchButton.textContent = defaultButtonText;
  }
}

function showLoader() {
  galleryEl.innerHTML = '<div class="loader-message">Loading space photos...</div>';
}

function showEmptyState() {
  galleryEl.innerHTML = '<div class="empty-message">No space images available right now. Please try again later.</div>';
}

function showErrorState() {
  galleryEl.innerHTML = '<div class="error-message">We could not reach Mission Control. Please try again soon.</div>';
}

function renderGallery(items) {
  if (!galleryEl) {
    return;
  }

  galleryEl.innerHTML = '';

  const fragment = document.createDocumentFragment();

  items.forEach((item) => {
    const card = createGalleryItem(item);
    fragment.appendChild(card);
  });

  galleryEl.appendChild(fragment);
}

function createGalleryItem(item) {
  const card = document.createElement('article');
  card.className = 'gallery-item';
  card.setAttribute('tabindex', '0');
  card.setAttribute('role', 'button');
  card.setAttribute('aria-label', buildAriaLabel(item));

  const mediaWrapper = document.createElement('div');
  mediaWrapper.className = 'gallery-media';

  const isVideo = item.media_type === 'video';

  if (isVideo) {
    mediaWrapper.classList.add('is-video');

    if (item.thumbnail_url) {
      const thumbImg = document.createElement('img');
      thumbImg.src = item.thumbnail_url;
      thumbImg.alt = buildAltText(item, true);
      thumbImg.loading = 'lazy';
      mediaWrapper.appendChild(thumbImg);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.innerHTML = '<span class="video-icon">&#9654;</span><span>Watch video</span>';
      mediaWrapper.appendChild(placeholder);
    }

    const badge = document.createElement('span');
    badge.className = 'media-badge';
    badge.textContent = 'Video';
    mediaWrapper.appendChild(badge);
  } else {
    const image = document.createElement('img');
    image.src = item.url;
    image.alt = buildAltText(item);
    image.loading = 'lazy';
    mediaWrapper.appendChild(image);
  }

  const details = document.createElement('div');
  details.className = 'gallery-details';

  const titleEl = document.createElement('h3');
  titleEl.className = 'gallery-title';
  titleEl.textContent = item.title || 'Untitled Space Image';

  const dateEl = document.createElement('p');
  dateEl.className = 'gallery-date';
  dateEl.textContent = formatDate(item.date);

  details.append(titleEl, dateEl);
  card.append(mediaWrapper, details);

  const openModal = () => {
    if (!modalController) {
      return;
    }
    modalController.show(item);
  };

  card.addEventListener('click', openModal);
  card.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openModal();
    }
  });

  return card;
}

function buildAriaLabel(item) {
  const title = item.title || 'NASA media';
  const date = formatDate(item.date);
  return 'View details for ' + title + ' from ' + date + '.';
}

function buildAltText(item, isVideoThumb) {
  const title = item.title || 'NASA Astronomy Picture of the Day';
  const date = formatDate(item.date);
  const suffix = isVideoThumb ? ' video thumbnail' : '';
  return title + ' (' + date + ')' + suffix;
}

function formatDate(value) {
  if (!value) {
    return 'Unknown date';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function createModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal hidden';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'modalTitle');

  overlay.innerHTML = [
    '<div class="modal-backdrop" data-element="backdrop"></div>',
    '<div class="modal-window">',
    '  <button type="button" class="modal-close" aria-label="Close media detail">&times;</button>',
    '  <div class="modal-media"></div>',
    '  <div class="modal-info">',
    '    <h3 class="modal-title" id="modalTitle"></h3>',
    '    <p class="modal-date"></p>',
    '    <p class="modal-text"></p>',
    '  </div>',
    '</div>'
  ].join('');

  document.body.appendChild(overlay);

  const backdrop = overlay.querySelector('[data-element="backdrop"]');
  const closeButton = overlay.querySelector('.modal-close');
  const mediaEl = overlay.querySelector('.modal-media');
  const titleEl = overlay.querySelector('.modal-title');
  const dateEl = overlay.querySelector('.modal-date');
  const textEl = overlay.querySelector('.modal-text');

  let lastFocusedElement = null;

  const close = () => {
    overlay.classList.add('hidden');
    overlay.classList.remove('open');
    document.body.classList.remove('modal-open');
    mediaEl.innerHTML = '';

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  const show = (item) => {
    lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    mediaEl.innerHTML = '';
    titleEl.textContent = item.title || 'NASA media';
    dateEl.textContent = formatDate(item.date);
    textEl.textContent = item.explanation || 'No description available.';

    const mediaNode = buildModalMedia(item);

    if (mediaNode) {
      mediaEl.appendChild(mediaNode);
    } else {
      mediaEl.innerHTML = '<p>No media available for this item.</p>';
    }

    overlay.classList.remove('hidden');
    overlay.classList.add('open');
    document.body.classList.add('modal-open');
    closeButton.focus();
  };

  closeButton.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      close();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('open')) {
      close();
    }
  });

  return { show, close };
}

function buildModalMedia(item) {
  if (item.media_type === 'video') {
    return createVideoElement(item);
  }

  return createImageElement(item);
}

function createImageElement(item) {
  const source = item.hdurl || item.url;

  if (!source) {
    const message = document.createElement('p');
    message.textContent = 'Image not available.';
    return message;
  }

  const img = document.createElement('img');
  img.src = source;
  img.alt = buildAltText(item);
  img.loading = 'lazy';
  return img;
}

function createVideoElement(item) {
  const url = item.url || '';
  const normalizedUrl = normalizeVideoUrl(url);

  if (isIframeVideo(normalizedUrl)) {
    const iframe = document.createElement('iframe');
    iframe.src = normalizedUrl;
    iframe.title = item.title || 'NASA video';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    return iframe;
  }

  if (url.endsWith('.mp4') || url.endsWith('.webm')) {
    const video = document.createElement('video');
    video.src = url;
    video.title = item.title || 'NASA video';
    video.controls = true;
    video.playsInline = true;
    return video;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'modal-link-wrapper';

  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = 'Open video in a new tab';

  wrapper.appendChild(link);
  return wrapper;
}

function normalizeVideoUrl(url) {
  if (!url) {
    return '';
  }

  if (url.includes('youtube.com/watch')) {
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get('v');
      if (id) {
        return 'https://www.youtube.com/embed/' + id;
      }
    } catch (error) {
      return url;
    }
  }

  if (url.includes('youtu.be/')) {
    const parts = url.split('youtu.be/');
    if (parts[1]) {
      const id = parts[1].split(/[?&]/)[0];
      if (id) {
        return 'https://www.youtube.com/embed/' + id;
      }
    }
  }

  if (url.includes('vimeo.com/')) {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match && match[1]) {
      return 'https://player.vimeo.com/video/' + match[1];
    }
  }

  return url;
}

function isIframeVideo(url) {
  return /youtube\.com\/embed|player\.vimeo\.com/.test(url);
}

