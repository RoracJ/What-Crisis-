(() => {
  const access = window.SiteAccess;
  const form = document.getElementById('unlock-form');
  const input = document.getElementById('unlock-code');
  if (!access || !form || !input) return;

  if (access.isOpen()) {
    window.location.replace('index.html');
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = await access.submitCode(input.value);
    if (result && result.ok) {
      window.location.replace('index.html');
      return;
    }
    input.value = '';
  });
})();
