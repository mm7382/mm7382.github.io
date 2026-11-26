(() => {
  const opener = document.getElementById('bridge-film-open');
  const dialog = document.getElementById('bridge-film');
  const mount = document.getElementById('bridge-film-mount');
  const closeButton = document.getElementById('bridge-film-close');
  const id = opener.dataset.youtubeId;
  if (!/^[\w-]{11}$/.test(id)) return;

  opener.hidden = false;
  opener.addEventListener('click', () => {
    if (dialog.open) return;
    const player = document.createElement('iframe');
    player.title = '她也停了下來';
    player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&controls=1&rel=0`;
    player.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    player.allowFullscreen = true;
    player.referrerPolicy = 'strict-origin-when-cross-origin';
    mount.append(player);
    dialog.showModal();
  });

  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    mount.replaceChildren();
    opener.focus({preventScroll: true});
  });
  document.addEventListener('study-view-changing', () => {
    if (dialog.open) dialog.close();
  });
})();
