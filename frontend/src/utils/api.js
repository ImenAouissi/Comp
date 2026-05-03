const BASE = '/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
    },
  };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${BASE}${path}`, opts);
  } catch (networkErr) {
    throw new Error('Impossible de contacter le serveur. Vérifiez que le backend tourne sur le port 4000.');
  }

  // Read body as text first — never call .json() directly (throws on empty body)
  const text = await res.text();

  if (!text || text.trim() === '') {
    if (res.ok) return { success: true };
    throw new Error(`Erreur ${res.status}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    if (!res.ok) throw new Error(`Erreur serveur ${res.status}`);
    return { success: true };
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      if (!path.includes('login')) window.location.href = '/login';
    }
    throw new Error(data.error || `Erreur ${res.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login:         (email, password) => request('POST',  '/auth/login', { email, password }),
  me:            ()                => request('GET',   '/auth/me'),
  updateProfile: (data)            => request('PATCH', '/auth/profile', data),

  // Dashboard
  getStats: () => request('GET', '/dashboard/stats'),

  // Residents
  getResidents:   ()           => request('GET',    '/residents'),
  getResident:    (id)         => request('GET',    `/residents/${id}`),
  createResident: (data)       => request('POST',   '/residents', data),
  updateResident: (id, data)   => request('PATCH',  `/residents/${id}`, data),
  updateProgress: (id, pct)    => request('PATCH',  `/residents/${id}/progress`, { progress: pct }),
  deleteResident: (id)         => request('DELETE', `/residents/${id}`),
  marquerSortie:  (id, date)   => request('PATCH',  `/residents/${id}/sortie`, { date_sortie: date }),

  // Sessions
  getSessions:     (rid)       => request('GET',   `/sessions${rid ? `?resident_id=${rid}` : ''}`),
  createSession:   (data)      => request('POST',  '/sessions', data),
  updateSession:   (id, data)  => request('PATCH',  `/sessions/${id}`, data),
  completeSession: (id, notes, repas) => request('PATCH', `/sessions/${id}/complete`, { notes, repas }),
  deleteSession:   (id)        => request('DELETE',`/sessions/${id}`),

  // IoT / Biometrics
  getBiometrics: (rid, hours)  => request('GET',   `/iot/biometrics/${rid}?hours=${hours || 24}`),
  getAlerts:     ()            => request('GET',   '/iot/alerts'),
  resolveAlert:  (id)          => request('PATCH', `/iot/alerts/${id}/resolve`),

  // Formations
  getFormations:   ()          => request('GET',   '/formations'),
  createFormation: (data)      => request('POST',  '/formations', data),
  updateFormation: (id, data)  => request('PATCH', `/formations/${id}`, data),

  // Staff
  getStaff:        ()          => request('GET',   '/staff'),
  createStaff:     (data)      => request('POST',  '/staff', data),
  deactivateStaff: (id)        => request('PATCH', `/staff/${id}/deactivate`),

  // Notifications
  getNotifications: ()         => request('GET',   '/notifications'),
  markRead:         (id)       => request('PATCH', `/notifications/${id}/read`),
  markAllRead:      ()         => request('PATCH', '/notifications/read-all'),

  // Calendar
  getCalendarWeek:    (date)  => request('GET', `/calendar/week${date ? `?date=${date}` : ''}`),
  getUpcomingSessions:()      => request('GET', '/calendar/upcoming'),

  // Messages
  getMessages:        ()      => request('GET', '/messages'),
  getSentMessages:    ()      => request('GET', '/messages/sent'),
  sendMessage:        (data)  => request('POST','/messages', data),
  markMessageRead:    (id)    => request('PATCH',`/messages/${id}/read`),

  // Search
  search: (q) => request('GET', `/search?q=${encodeURIComponent(q)}`),

  // Reports
  getReportsSummary:  ()     => request('GET', '/reports/summary'),
  exportResidents:    ()     => request('GET', '/reports/export/residents'),
  exportSessions:     ()     => request('GET', '/reports/export/sessions'),

  // Activity logs
  getLogs: (params='')       => request('GET', `/logs${params ? '?'+params : ''}`),

  // Registrations (public + admin)
  submitRegistration:  (data)        => request('POST',  '/registrations', data),
  getRegistrations:    (status='all')=> request('GET',   `/registrations?status=${status}`),
  approveRegistration: (id, data)    => request('PATCH', `/registrations/${id}/approve`, data),
  rejectRegistration:  (id, data)    => request('PATCH', `/registrations/${id}/reject`, data),
  deleteRegistration:  (id)          => request('DELETE',`/registrations/${id}`),

  // Email API
  get:  (path)         => request('GET',  path),
  post: (path, data)   => request('POST', path, data),
  getEmailStatus:      ()            => request('GET',  '/email/status'),
  sendTestEmail:       (email)       => request('POST', '/email/test',    { email }),
  sendAlertEmail:      (alertId)     => request('POST', `/email/alert/${alertId}`),
  sendReportEmail:     (email)       => request('POST', '/email/report',  { email }),
  resendInscriptionEmail: (id, action, raison) => request('POST', `/email/inscription/${id}`, { action, raison }),
};
