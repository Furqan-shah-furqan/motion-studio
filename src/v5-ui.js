/* V5 UI: one dropdown language throughout the editor, including dynamic panels. */
(function () {
  let openMenu = null;
  let scheduled = false;

  function closeMenu() {
    if (!openMenu) return;
    openMenu.button.setAttribute('aria-expanded', 'false');
    openMenu.menu.remove();
    openMenu = null;
  }

  function syncButton(select, button) {
    const selected = select.selectedOptions[0];
    button.textContent = selected?.textContent?.trim() || 'Choose…';
    button.disabled = select.disabled;
  }

  function openSelect(select, button) {
    closeMenu();
    const menu = document.createElement('div');
    menu.className = 'dd-menu v5-select-menu';
    menu.setAttribute('role', 'listbox');
    const options = Array.from(select.options);
    options.forEach(option => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'dd-opt' + (option.selected ? ' on' : '');
      row.disabled = option.disabled;
      row.textContent = option.textContent;
      row.setAttribute('role', 'option');
      row.setAttribute('aria-selected', String(option.selected));
      row.onclick = () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        syncButton(select, button);
        closeMenu();
        button.focus();
      };
      menu.appendChild(row);
    });
    document.body.appendChild(menu);
    const bounds = button.getBoundingClientRect();
    const width = Math.min(380, Math.max(bounds.width, 220));
    const height = Math.min(menu.scrollHeight, window.innerHeight - 24);
    const below = bounds.bottom + height + 8 < window.innerHeight;
    menu.style.width = width + 'px';
    menu.style.left = Math.max(12, Math.min(bounds.left, window.innerWidth - width - 12)) + 'px';
    menu.style.top = (below ? bounds.bottom + 6 : Math.max(12, bounds.top - height - 6)) + 'px';
    menu.style.maxHeight = 'min(320px, calc(100dvh - 24px))';
    button.setAttribute('aria-expanded', 'true');
    openMenu = { menu, button };
    (menu.querySelector('[aria-selected="true"]') || menu.querySelector('button'))?.focus();
  }

  function enhanceSelects() {
    document.querySelectorAll('select:not([data-v5-enhanced])').forEach(select => {
      if (select.multiple || select.closest('.v5-select-wrap')) return;
      select.dataset.v5Enhanced = 'true';
      const wrap = document.createElement('span');
      wrap.className = 'v5-select-wrap';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v5-select-button';
      button.setAttribute('aria-haspopup', 'listbox');
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', select.getAttribute('aria-label') || select.id || 'Select option');
      select.before(wrap);
      wrap.append(select, button);
      syncButton(select, button);
      button.onclick = () => openMenu?.button === button ? closeMenu() : openSelect(select, button);
      button.onkeydown = event => { if (event.key === 'Escape') closeMenu(); };
      select.addEventListener('change', () => syncButton(select, button));
      new MutationObserver(() => syncButton(select, button)).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
    });
  }

  document.addEventListener('pointerdown', event => {
    if (openMenu && !openMenu.menu.contains(event.target) && !openMenu.button.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', event => { if (!openMenu?.menu.contains(event.target)) closeMenu(); }, true);
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => { scheduled = false; enhanceSelects(); });
  });
  observer.observe(document.body, { childList: true, subtree: true });
  enhanceSelects();

  document.getElementById('rail-add').addEventListener('click', () => {
    selectTabByLabel('Add all assets');
    if (document.body.classList.contains('narrow-ui')) setView('edit');
    document.getElementById('vault-files')?.focus();
  });
  document.getElementById('generate-btn').addEventListener('click', generateV5);
})();
