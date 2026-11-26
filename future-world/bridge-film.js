(() => {
  const dialog = document.getElementById('bridge-film');
  const mount = document.getElementById('bridge-film-mount');
  const closeButton = document.getElementById('bridge-film-close');
  let activeOpener;

  for (const opener of document.querySelectorAll('.bridge-films button[data-youtube-id]')) {
    const id = opener.dataset.youtubeId;
    if (!/^[\w-]{11}$/.test(id)) continue;

    opener.hidden = false;
    opener.addEventListener('click', () => {
      if (dialog.open) return;
      activeOpener = opener;
      const title = opener.innerText.trim().replace(/^▶\s*/, '');
      const player = document.createElement('iframe');
      player.title = title;
      player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&controls=1&rel=0`;
      player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      player.allowFullscreen = true;
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      dialog.setAttribute('aria-label', title);
      mount.replaceChildren(player);
      dialog.showModal();
    });
  }

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    mount.replaceChildren();
    activeOpener?.focus({preventScroll: true});
    activeOpener = undefined;
  });
  document.addEventListener('study-view-changing', () => {
    if (dialog.open) dialog.close();
  });
})();
