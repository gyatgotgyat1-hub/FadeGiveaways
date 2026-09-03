import { arm, bindAlt } from './fg.k.js';

const API = '/api';

const state = {
  sessionId: localStorage.getItem('fg_session') || '',
  nickname: '',
  adminToken: sessionStorage.getItem('fg_admin') || '',
  activeGiveawayId: null,
  pendingEmail: '',
};

const $ = (sel) => document.querySelector(sel);

async function api(path, opts = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
  };
  if (state.sessionId) headers['X-Session-Id'] = state.sessionId;
  if (state.adminToken) headers['Authorization'] = `Bearer ${state.adminToken}`;

  const res = await fetch(`${API}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function initSession() {
  const headers = {};
  if (state.sessionId) headers['X-Session-Id'] = state.sessionId;

  const res = await fetch(`${API}/session`, { headers });
  const data = await res.json();

  state.sessionId = data.sessionId;
  state.nickname = data.nickname;
  localStorage.setItem('fg_session', state.sessionId);
  $('#nickname').textContent = state.nickname;
}

function formatTimeLeft(ms) {
  if (ms <= 0) return 'ending...';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${m}m left`;
  if (m > 0) return `${m}m ${s}s left`;
  return `${s}s left`;
}

function renderGiveaways(giveaways) {
  const grid = $('#giveawayGrid');
  const empty = $('#emptyState');

  if (!giveaways.length) {
    grid.innerHTML = '';
    grid.appendChild(empty);
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  grid.innerHTML = giveaways
    .map((g, i) => {
      const left = g.duration - Date.now();
      return `
        <article class="giveaway-card" style="animation-delay:${i * 0.08}s">
          <div class="card-body">
            <h3>${esc(g.name)}</h3>
            ${g.description ? `<p class="card-desc">${esc(g.description)}</p>` : ''}
            <div class="card-meta">
              <span class="timer" data-end="${g.duration}">${formatTimeLeft(left)}</span>
              ${g.vouch ? `<span class="vouch">✦ ${esc(g.vouch)}</span>` : ''}
            </div>
          </div>
          <button class="btn-primary enter-btn" data-id="${g.id}" data-name="${esc(g.name)}">Enter Giveaway</button>
        </article>`;
    })
    .join('');

  grid.querySelectorAll('.enter-btn').forEach((btn) => {
    btn.addEventListener('click', () => openEnterModal(btn.dataset.id, btn.dataset.name));
  });
}

async function loadGiveaways() {
  try {
    const { giveaways } = await api('/giveaways');
    renderGiveaways(giveaways);
  } catch {
    renderGiveaways([]);
  }
}

function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function openEnterModal(id, name) {
  state.activeGiveawayId = id;
  state.pendingEmail = '';
  $('#enterModalTitle').textContent = name;
  $('#enterEmail').value = '';
  $('#enterNote').textContent = '';
  $('#verifyRow').classList.add('hidden');
  $('#enterModal').showModal();
}

async function submitEntry(e) {
  e.preventDefault();
  const email = $('#enterEmail').value.trim();
  state.pendingEmail = email;

  try {
    const data = await api('/enter', {
      method: 'POST',
      body: JSON.stringify({ giveawayId: state.activeGiveawayId, email }),
    });

    if (data.verified) {
      showVerified(`U have entered ${$('#enterModalTitle').textContent}`);
      $('#enterModal').close();
    } else {
      $('#enterNote').textContent = data.message;
      $('#verifyRow').classList.remove('hidden');
    }
  } catch (err) {
    $('#enterNote').textContent = err.message;
  }
}

async function refreshVerify() {
  if (!state.activeGiveawayId || !state.pendingEmail) return;

  try {
    const data = await api('/check-verify', {
      method: 'POST',
      body: JSON.stringify({
        giveawayId: state.activeGiveawayId,
        email: state.pendingEmail,
      }),
    });

    if (data.verified) {
      $('#enterModal').close();
      showVerified(`U have entered ${$('#enterModalTitle').textContent}`);
    } else {
      $('#enterNote').textContent = 'Not verified yet — check your email and click Verify Join.';
    }
  } catch (err) {
    $('#enterNote').textContent = err.message;
  }
}

function showVerified(msg) {
  $('#verifiedMessage').textContent = msg;
  $('#verifiedModal').showModal();
}

async function probeGate(k, opts = {}) {
  const overlay = $('#adminOverlay');

  if (state.adminToken && overlay && !overlay.classList.contains('hidden')) {
    if (opts.alt) closeAdmin();
    return;
  }

  if (state.adminToken && opts.alt) {
    try {
      await api('/admin/giveaways');
      openAdmin();
      return;
    } catch {
      state.adminToken = '';
      sessionStorage.removeItem('fg_admin');
    }
  }

  try {
    const payload = opts.alt ? { alt: 1, k } : { t: 4, k };
    const data = await api('/admin/unlock', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    state.adminToken = data.token;
    sessionStorage.setItem('fg_admin', data.token);
    openAdmin();
  } catch {}
}

async function validateAdminToken() {
  if (!state.adminToken) return;

  try {
    await api('/admin/giveaways');
    openAdmin();
  } catch {
    state.adminToken = '';
    sessionStorage.removeItem('fg_admin');
  }
}

function openAdmin() {
  $('#adminOverlay').classList.remove('hidden');
  loadAdminGiveaways();
}

function closeAdmin() {
  $('#adminOverlay').classList.add('hidden');
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  document.querySelectorAll('.tab-panel').forEach((p) => {
    p.classList.toggle('active', p.id === `tab-${name}`);
  });
}

async function createGiveaway(e) {
  e.preventDefault();

  try {
    await api('/admin/giveaways', {
      method: 'POST',
      body: JSON.stringify({
        name: $('#gName').value.trim(),
        description: $('#gDesc').value.trim(),
        vouch: $('#gVouch').value.trim(),
        durationMinutes: $('#gDuration').value,
        downloadLink: $('#gDownload').value.trim(),
        keysText: $('#gKeys').value,
      }),
    });

    $('#createForm').reset();
    $('#gDuration').value = '60';
    switchTab('manage');
    document.querySelector('[data-tab="manage"]').classList.add('active');
    document.querySelector('[data-tab="create"]').classList.remove('active');
    await loadAdminGiveaways();
    await loadGiveaways();
  } catch (err) {
    alert(err.message);
  }
}

async function loadAdminGiveaways() {
  if (!state.adminToken) return;

  try {
    const { giveaways } = await api('/admin/giveaways');
    const list = $('#adminGiveawayList');

    if (!giveaways.length) {
      list.innerHTML = '<p class="empty-state">No giveaways yet.</p>';
      return;
    }

    list.innerHTML = giveaways
      .map(
        (g) => `
      <div class="admin-giveaway" data-id="${g.id}">
        <div class="admin-giveaway-head" data-toggle="${g.id}">
          <h4>${esc(g.name)}</h4>
          <span class="admin-status ${g.status}">${g.status} · ${g.participants.length} entries</span>
        </div>
        <div class="admin-participants" id="parts-${g.id}">
          ${
            g.participants.length
              ? g.participants
                  .map(
                    (p) => `
              <div class="participant-row">
                <div class="participant-info">
                  <span>${esc(p.nickname)} ${p.verified ? '<span class="badge verified">verified</span>' : ''} ${p.rigged ? '<span class="badge rigged">rigged</span>' : ''}</span>
                  <span class="email">${esc(p.email)}</span>
                </div>
                ${
                  g.status === 'active'
                    ? `<button class="btn-rig" data-gid="${g.id}" data-pid="${p.id}" ${p.rigged ? 'disabled' : ''}>Rig Giveaway</button>`
                    : ''
                }
              </div>`
                  )
                  .join('')
              : '<p style="color:var(--text-muted);font-size:13px;">No participants yet.</p>'
          }
        </div>
      </div>`
      )
      .join('');

    list.querySelectorAll('[data-toggle]').forEach((head) => {
      head.addEventListener('click', () => {
        const panel = document.getElementById(`parts-${head.dataset.toggle}`);
        panel.classList.toggle('open');
      });
    });

    list.querySelectorAll('.btn-rig').forEach((btn) => {
      btn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!confirm('Rig this participant to win when the giveaway ends?')) return;

        try {
          await api('/admin/rig', {
            method: 'POST',
            body: JSON.stringify({
              giveawayId: btn.dataset.gid,
              participantId: btn.dataset.pid,
            }),
          });
          await loadAdminGiveaways();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    if (err.message.includes('Admin')) {
      state.adminToken = '';
      sessionStorage.removeItem('fg_admin');
    }
  }
}

function tickTimers() {
  document.querySelectorAll('.timer[data-end]').forEach((el) => {
    const left = Number(el.dataset.end) - Date.now();
    el.textContent = formatTimeLeft(left);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  $('#year').textContent = new Date().getFullYear();

  await initSession();
  await loadGiveaways();
  await validateAdminToken();

  arm(probeGate);
  bindAlt(probeGate);

  $('#refreshBtn').addEventListener('click', loadGiveaways);
  $('#enterForm').addEventListener('submit', submitEntry);
  $('#closeEnterModal').addEventListener('click', () => $('#enterModal').close());
  $('#refreshVerifyBtn').addEventListener('click', refreshVerify);
  $('#closeVerifiedModal').addEventListener('click', () => $('#verifiedModal').close());
  $('#closeAdmin').addEventListener('click', closeAdmin);
  $('#createForm').addEventListener('submit', createGiveaway);

  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  setInterval(tickTimers, 1000);
  setInterval(loadGiveaways, 30000);
});
