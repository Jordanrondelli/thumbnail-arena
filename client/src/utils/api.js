const BASE = '/api';

function headers(password) {
  const h = { 'Content-Type': 'application/json' };
  if (password) h['x-admin-password'] = password;
  return h;
}

export async function authenticate(password) {
  const res = await fetch(`${BASE}/auth`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error('Mot de passe incorrect');
  return res.json();
}

export async function getThumbnails(password) {
  const res = await fetch(`${BASE}/thumbnails`, { headers: headers(password) });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

export async function uploadThumbnails(files, password) {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  const res = await fetch(`${BASE}/thumbnails`, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: form,
  });
  if (!res.ok) throw new Error('Erreur upload');
  return res.json();
}

export async function deleteThumbnail(id, password) {
  const res = await fetch(`${BASE}/thumbnails/${id}`, {
    method: 'DELETE',
    headers: headers(password),
  });
  return res.json();
}

export async function getConfig() {
  const res = await fetch(`${BASE}/config`);
  return res.json();
}

export async function activateTest(password) {
  const res = await fetch(`${BASE}/config/activate`, {
    method: 'POST',
    headers: headers(password),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error);
  }
  return res.json();
}

export async function deactivateTest(password) {
  const res = await fetch(`${BASE}/config/deactivate`, {
    method: 'POST',
    headers: headers(password),
  });
  return res.json();
}

export async function resetData(password) {
  const res = await fetch(`${BASE}/config/reset`, {
    method: 'POST',
    headers: headers(password),
  });
  return res.json();
}

export async function getSessionPairs() {
  const res = await fetch(`${BASE}/session/pairs`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error);
  }
  return res.json();
}

export async function submitDuels(sessionId, duels) {
  const res = await fetch(`${BASE}/session/${sessionId}/duels`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ duels }),
  });
  return res.json();
}

export async function submitMemory(sessionId, recognized) {
  const res = await fetch(`${BASE}/session/${sessionId}/memory`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ recognized }),
  });
  return res.json();
}

export async function getResults(password) {
  const res = await fetch(`${BASE}/results`, { headers: headers(password) });
  if (!res.ok) throw new Error('Erreur');
  return res.json();
}

export async function getHeatmap(thumbId, password) {
  const res = await fetch(`${BASE}/results/heatmap/${thumbId}`, { headers: headers(password) });
  return res.json();
}
