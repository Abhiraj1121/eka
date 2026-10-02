document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════
  // API BASE — points at the deployed Flask backend on Render when the
  // frontend is hosted elsewhere (e.g. GitHub Pages). On localhost/127.0.0.1
  // it automatically falls back to relative paths, so local testing always
  // hits your local Flask server instead of the possibly-broken Render one.
  // ══════════════════════════════
  const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(location.hostname);
  const API_BASE = IS_LOCAL ? '' : 'https://eka-fhsv.onrender.com';

  // ══════════════════════════════
  // ICON LIBRARY (inline SVG — no emoji anywhere in the UI)
  // ══════════════════════════════
  const ICONS = {
    sparkle:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z"/></svg>',
    bot:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="9" width="18" height="11" rx="2"/><circle cx="8.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/><circle cx="15.5" cy="14.5" r="1.2" fill="currentColor" stroke="none"/><path d="M12 9V5"/><circle cx="12" cy="3.5" r="1.5"/><path d="M5 13H3v4h2M19 13h2v4h-2"/></svg>',
    globe:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 0 20M12 2a15.3 15.3 0 0 0 0 20"/></svg>',
    folder:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
    check:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>',
    cross:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    mute:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>',
    unmute:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>',
    sun:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    moon:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
    mic:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>',
    thumbsUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>',
    thumbsDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3z"/><path d="M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>',
    copy:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>',
    wave:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11.5V6a2 2 0 0 0-4 0v-.5"/><path d="M14 5.5V4a2 2 0 0 0-4 0v9"/><path d="M10 9.5a2 2 0 0 0-4 0v3.5c0 4 3 8 7 8s7-3 7-7v-2"/></svg>',
    image:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
    edit:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></svg>',
    regenerate:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>',
    chevronDown:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="6 9 12 15 18 9"/></svg>',
    stopSquare:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>',
  };
  const SOURCE_BADGES = {
    web:       { icon: ICONS.globe,  label: 'Web + AI' },
    cached:    { icon: ICONS.folder, label: 'Cached' },
    ai:        { icon: ICONS.bot,    label: 'AI' },
    generated: { icon: ICONS.image,  label: 'Generated' },
    avatar:    { icon: ICONS.image,  label: 'Avatar' },
    code:      { icon: ICONS.bot,    label: 'Code' },
    diagram:   { icon: ICONS.bot,    label: 'Diagram' },
    document:  { icon: ICONS.folder, label: 'Document' },
  };
  // ══════════════════════════════
  // LAUNCH SCREEN
  // ══════════════════════════════
  (function initLaunchScreen() {
    const launch = document.getElementById('launchScreen');
    if (!launch) return;
    const MIN_MS = 2800;
    const start = Date.now();
    const dismiss = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => {
        launch.classList.add('hide');
        setTimeout(() => launch.remove(), 1150);
      }, wait);
    };
    if (document.readyState === 'complete') dismiss();
    else window.addEventListener('load', dismiss, { once: true });
    // Safety net in case load never fires (e.g. cached/instant paint)
    setTimeout(dismiss, 4300);
  })();

  // ── DOM REFS ──
  const chat             = document.getElementById('chat');
  const msg              = document.getElementById('msg');
  const send             = document.getElementById('send');
  const mic              = document.getElementById('mic');
  const micStatus        = document.getElementById('mic-status');
  const muteToggle       = document.getElementById('muteToggle');
  const voiceOnlyToggle  = document.getElementById('voiceOnlyToggle');
  const languageToggle   = document.getElementById('languageToggle');
  const webToggle        = document.getElementById('webToggle');
  const imageToggle      = document.getElementById('imageToggle');
  const settingImage     = document.getElementById('settingImage');
  const themeToggle      = document.getElementById('themeToggle');
  const speakingAnim     = document.getElementById('speakingAnimation');
  const wakeMicButton    = document.getElementById('wakeMicButton');
  const clearChatBtn     = document.getElementById('clearChat');
  const sidebarToggle    = document.getElementById('sidebarToggle');
  const sidebar          = document.getElementById('sidebar');
  const openSettingsBtn  = document.getElementById('openSettings');
  const userCardBtn      = document.getElementById('userCardBtn');
  const settingsOverlay  = document.getElementById('settingsOverlay');
  const settingsClose    = document.getElementById('settingsClose');
  const userOverlay      = document.getElementById('userOverlay');
  const userClose        = document.getElementById('userClose');
  const settingMute      = document.getElementById('settingMute');
  const settingWeb       = document.getElementById('settingWeb');
  const settingLang      = document.getElementById('settingLang');
  const themeSwatches    = document.querySelectorAll('.theme-swatch');
  const profileName      = document.getElementById('profileName');
  const profileAbout     = document.getElementById('profileAbout');
  const saveProfileBtn   = document.getElementById('saveProfile');
  const profileStatus    = document.getElementById('profileStatus');
  const userAvatarBig    = document.getElementById('userAvatarBig');
  const userAvatarSmall  = document.getElementById('userAvatarSmall');
  const sidebarUserName  = document.getElementById('sidebarUserName');
  const sidebarUserEmail = document.getElementById('sidebarUserEmail');
  const avatarUploadZone = document.getElementById('avatarUploadZone');
  const avatarFileInput  = document.getElementById('avatarFileInput');
  const avatarRemoveBtn  = document.getElementById('avatarRemoveBtn');
  // Settings-panel profile tab mirrors the same account data with its own IDs
  // (two DOM nodes can't share an id) — kept in sync with the sidebar/profile
  // modal by loadProfile()/every save handler below.
  const settingsAvatarZone   = document.getElementById('settingsAvatarZone');
  const settingsAvatarBig    = document.getElementById('settingsAvatarBig');
  const settingsAvatarInput  = document.getElementById('settingsAvatarInput');
  const settingsAvatarRemove = document.getElementById('settingsAvatarRemove');
  const settingsProfileName  = document.getElementById('settingsProfileName');
  const settingsProfileAbout = document.getElementById('settingsProfileAbout');
  const settingsProfileSave  = document.getElementById('settingsProfileSave');
  const settingsProfileStatus= document.getElementById('settingsProfileStatus');
  const photoInput       = document.getElementById('photoInput');
  const attachBtn        = document.getElementById('attachBtn');
  const attachPreview    = document.getElementById('attachPreview');
  const attachThumb      = document.getElementById('attachThumb');
  const attachRemove     = document.getElementById('attachRemove');
  const sessionsList     = document.getElementById('sessionsList');
  const sessionsEmpty    = document.getElementById('sessionsEmpty');
  const newSessionBtn    = document.getElementById('newSessionBtn');
  const sessionCountEl   = document.getElementById('sessionCount');
  const clearAllSessions = document.getElementById('clearAllSessions');
  const exportAllSessions= document.getElementById('exportAllSessions');
  const resetAppBtn      = document.getElementById('resetAppBtn');
  const settingFontSize  = document.getElementById('settingFontSize');
  const settingDensity   = document.getElementById('settingDensity');
  const settingReduceMotion = document.getElementById('settingReduceMotion');
  const settingSoundFx   = document.getElementById('settingSoundFx');
  const settingEnterSend = document.getElementById('settingEnterSend');

  // ── STATE ──
  let chatHistory      = [];
  let isMuted          = localStorage.getItem('eka-voice') !== 'on';   // voice is OFF until the user turns it on
  let voiceOnly        = false;
  let webSearchEnabled = false;
  let imageGenEnabled  = false;
  let recognition      = null;
  let isThinking       = false;
  let attachedImage    = null; // base64 string
  let currentSessionId = null;

  // ══════════════════════════════
  // PREFERENCES (localStorage) — AI mode, paid model, response style, etc.
  // ══════════════════════════════
  const PREFS_KEY = 'eka-prefs';
  const PREF_DEFAULTS = { mode:'free', paidModel:'', style:'balanced', creativity:'balanced',
                          historyLimit:16, customInstructions:'', searchResults:5, showSources:true };
  let prefs = { ...PREF_DEFAULTS };
  try { prefs = { ...PREF_DEFAULTS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }; } catch {}
  if (!['free','paid'].includes(prefs.mode)) prefs.mode = 'free';
  if (prefs.mode === 'paid' && !prefs.paidModel) prefs.mode = 'free';
  function savePrefs() { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch {} }
  function setPref(key, value) { prefs[key] = value; savePrefs(); }

  // ══════════════════════════════
  // LIVE BACKGROUNDS — canvas effects tinted from the active theme's CSS variables.
  // Modes: auto (theme default) · dust · aurora · orbs · stars · rain · waves · fireflies · bubbles · none
  // Pauses when the tab is hidden; draws one still frame when "Reduce motion" is on.
  // ══════════════════════════════
  const liveBg = (function initLiveBg() {
    const canvas = document.getElementById('bgCanvas');
    const BG_KEY = 'eka-bg';
    const VALID = ['auto','dust','aurora','orbs','stars','rain','waves','fireflies','bubbles','none'];
    if (!canvas) return { set() {}, refresh() {}, get pref() { return 'none'; } };
    const ctx = canvas.getContext('2d');
    let pref = localStorage.getItem(BG_KEY);
    if (!VALID.includes(pref)) pref = 'auto';
    let W = 0, H = 0, mode = 'dust', raf = 0, last = 0, clock = 0, S = null, sprite = null;
    let C = { gold: [201,168,76], bright: [232,200,106], alt: [201,100,76], light: false };

    const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    function parseColor(str) {
      str = (str || '').trim();
      let m = str.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (m) { let h = m[1]; if (h.length === 3) h = h.split('').map(x => x + x).join(''); return [0,2,4].map(i => parseInt(h.slice(i, i + 2), 16)); }
      m = str.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
      return m ? [+m[1], +m[2], +m[3]] : null;
    }
    function hueShift(c, deg) {
      let [r, g, b] = c.map(v => v / 255);
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
      let h = 0, s = 0;
      if (d) {
        s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
        h *= 60;
      }
      h = (h + deg + 360) % 360;
      const f = (n) => { const k = (n + h / 30) % 12; return l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
      return [f(0), f(8), f(4)].map(v => Math.round(v * 255));
    }
    function computeColors() {
      try {
        const cs = getComputedStyle(document.body);
        const gold = parseColor(cs.getPropertyValue('--gold')), bright = parseColor(cs.getPropertyValue('--gold-bright')), ink = parseColor(cs.getPropertyValue('--ink'));
        if (gold) C.gold = gold;
        C.bright = bright || C.gold;
        C.alt = hueShift(C.gold, 48);
        C.light = ink ? (0.299 * ink[0] + 0.587 * ink[1] + 0.114 * ink[2]) / 255 > 0.6 : false;
      } catch {}
      // glow sprite for fireflies
      sprite = document.createElement('canvas'); sprite.width = sprite.height = 64;
      const sc = sprite.getContext('2d'), g = sc.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, rgba(C.bright, 1)); g.addColorStop(0.25, rgba(C.gold, 0.55)); g.addColorStop(1, rgba(C.gold, 0));
      sc.fillStyle = g; sc.fillRect(0, 0, 64, 64);
    }
    const small = () => W < 700;
    const rnd = (a, b) => a + Math.random() * (b - a);
    const comp = (on) => { ctx.globalCompositeOperation = on && !C.light ? 'lighter' : 'source-over'; };
    function vignette() {
      if (C.light) return;
      const vg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    }

    const fx = {
      dust: {
        init() { S = Array.from({ length: small() ? 45 : 80 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(0.3, 1.5), a: rnd(0.05, 0.38), vx: rnd(-0.125, 0.125), vy: rnd(-0.09, 0.09), alt: Math.random() < 0.4 })); },
        draw(t, dt) {
          vignette();
          for (const p of S) {
            p.x += p.vx * dt; p.y += p.vy * dt;
            if (p.x < 0) p.x = W; if (p.x > W) p.x = 0; if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
            ctx.fillStyle = rgba(p.alt ? C.bright : C.gold, C.light ? p.a * 1.4 : p.a); ctx.fill();
          }
        },
      },
      aurora: {
        init() { S = [ { y: 0.30, amp: 55, f: 0.0032, sp: 0.00032, h: 230, c: 'gold' }, { y: 0.45, amp: 70, f: 0.0026, sp: -0.00026, h: 260, c: 'alt' }, { y: 0.58, amp: 45, f: 0.0041, sp: 0.00041, h: 200, c: 'bright' } ]; },
        draw(t) {
          vignette(); comp(true);
          const step = small() ? 16 : 10, a = C.light ? 0.13 : 0.2;
          for (const b of S) {
            const col = b.c === 'gold' ? C.gold : b.c === 'alt' ? C.alt : C.bright, y0 = b.y * H, top = [];
            for (let x = 0; x <= W + step; x += step) top.push([x, y0 + Math.sin(x * b.f + t * b.sp * 1000) * b.amp + Math.sin(x * b.f * 2.3 - t * b.sp * 700) * b.amp * 0.4]);
            ctx.beginPath(); top.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
            for (let i = top.length - 1; i >= 0; i--) ctx.lineTo(top[i][0], top[i][1] + b.h + Math.sin(top[i][0] * 0.004 + t * 0.0004) * 30);
            ctx.closePath();
            const g = ctx.createLinearGradient(0, y0 - b.amp, 0, y0 + b.h + b.amp);
            g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.35, rgba(col, a)); g.addColorStop(0.7, rgba(C.alt, a * 0.45)); g.addColorStop(1, rgba(col, 0));
            ctx.fillStyle = g; ctx.fill();
          }
          comp(false);
        },
      },
      orbs: {
        init() { S = Array.from({ length: small() ? 4 : 6 }, (_, i) => ({ sx: rnd(0.00008, 0.00022), sy: rnd(0.00008, 0.0002), px: rnd(0, 6.28), py: rnd(0, 6.28), r: rnd(0.22, 0.4), col: i % 3 === 0 ? 'alt' : i % 3 === 1 ? 'gold' : 'bright' })); },
        draw(t) {
          vignette(); comp(true);
          for (const o of S) {
            const x = W * (0.5 + 0.4 * Math.sin(t * o.sx * 1000 + o.px)), y = H * (0.5 + 0.38 * Math.sin(t * o.sy * 1000 + o.py)), r = Math.max(W, H) * o.r;
            const col = o.col === 'alt' ? C.alt : o.col === 'gold' ? C.gold : C.bright, g = ctx.createRadialGradient(x, y, 0, x, y, r);
            g.addColorStop(0, rgba(col, C.light ? 0.2 : 0.24)); g.addColorStop(1, rgba(col, 0));
            ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
          }
          comp(false);
        },
      },
      stars: {
        init() { S = Array.from({ length: small() ? 110 : 220 }, () => ({ x: rnd(-W, W), y: rnd(-H, H), z: rnd(1, W), pz: 0 })); S.forEach(s => { s.pz = s.z; }); },
        draw(t, dt) {
          vignette();
          const speed = (small() ? 2.2 : 3) * dt, cx = W / 2, cy = H / 2, col = C.light ? C.gold : C.bright;
          ctx.lineCap = 'round';
          for (const s of S) {
            s.pz = s.z; s.z -= speed;
            if (s.z < 1) { s.x = rnd(-W, W); s.y = rnd(-H, H); s.z = s.pz = W; }
            const k = W * 0.5, px = (s.x / s.z) * k + cx, py = (s.y / s.z) * k + cy, ox = (s.x / s.pz) * k + cx, oy = (s.y / s.pz) * k + cy;
            if (px < -20 || px > W + 20 || py < -20 || py > H + 20) continue;
            const f = 1 - s.z / W;
            ctx.strokeStyle = rgba(col, Math.min(1, 0.15 + f * 0.9)); ctx.lineWidth = 0.4 + f * 2;
            ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(px, py); ctx.stroke();
          }
        },
      },
      rain: {
        init() {
          const gap = small() ? 22 : 18, glyphs = '01<>/{}=+*$#%&';
          S = { gap, len: small() ? 9 : 14, glyphs, cols: Array.from({ length: Math.ceil(W / gap) }, (_, i) => ({ x: i * gap + 4, y: rnd(-H, H), v: rnd(0.9, 2.6), ch: Array.from({ length: 16 }, () => glyphs[Math.floor(Math.random() * glyphs.length)]) })) };
        },
        draw(t, dt) {
          vignette(); ctx.font = '14px "JetBrains Mono", monospace';
          const lh = 16, base = C.light ? 0.5 : 0.62;
          for (const c of S.cols) {
            c.y += c.v * dt * 1.4;
            if (c.y - S.len * lh > H) { c.y = rnd(-200, 0); c.v = rnd(0.9, 2.6); }
            if (Math.random() < 0.05) c.ch[Math.floor(Math.random() * c.ch.length)] = S.glyphs[Math.floor(Math.random() * S.glyphs.length)];
            for (let i = 0; i < S.len; i++) {
              const y = c.y - i * lh; if (y < -lh || y > H + lh) continue;
              ctx.fillStyle = i === 0 ? rgba(C.bright, base + 0.3) : rgba(C.gold, base * (1 - i / S.len) * 0.55);
              ctx.fillText(c.ch[i % c.ch.length], c.x, y);
            }
          }
        },
      },
      waves: {
        init() { S = Array.from({ length: 4 }, (_, i) => ({ y: 0.72 + i * 0.065, amp: 16 + i * 8, f: 0.0045 - i * 0.0007, sp: (i % 2 ? -1 : 1) * (0.0006 + i * 0.00015), col: i % 2 ? 'alt' : 'gold' })); },
        draw(t) {
          vignette(); const step = small() ? 14 : 8;
          S.forEach((w, i) => {
            const col = w.col === 'alt' ? C.alt : C.gold;
            ctx.beginPath(); ctx.moveTo(0, H);
            for (let x = 0; x <= W + step; x += step) ctx.lineTo(x, w.y * H + Math.sin(x * w.f + t * w.sp * 1000) * w.amp + Math.sin(x * w.f * 1.9 + t * w.sp * 600) * w.amp * 0.35);
            ctx.lineTo(W, H); ctx.closePath();
            ctx.fillStyle = rgba(col, (C.light ? 0.1 : 0.07) + i * 0.025); ctx.fill();
          });
        },
      },
      fireflies: {
        init() { S = Array.from({ length: small() ? 22 : 40 }, () => ({ x: rnd(0, W), y: rnd(0, H), vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25), s: rnd(10, 26), ph: rnd(0, 6.28), sp: rnd(0.0008, 0.002) })); },
        draw(t, dt) {
          vignette(); comp(true);
          for (const f of S) {
            f.vx += rnd(-0.02, 0.02) * dt; f.vy += rnd(-0.02, 0.02) * dt;
            f.vx = Math.max(-0.45, Math.min(0.45, f.vx)); f.vy = Math.max(-0.45, Math.min(0.45, f.vy));
            f.x += f.vx * dt; f.y += f.vy * dt;
            if (f.x < -20) f.x = W + 20; if (f.x > W + 20) f.x = -20; if (f.y < -20) f.y = H + 20; if (f.y > H + 20) f.y = -20;
            const glow = 0.5 + 0.5 * Math.sin(t * f.sp * 1000 + f.ph);
            ctx.globalAlpha = (C.light ? 0.35 : 0.2) + glow * (C.light ? 0.45 : 0.7);
            if (sprite) ctx.drawImage(sprite, f.x - f.s, f.y - f.s, f.s * 2, f.s * 2);
          }
          ctx.globalAlpha = 1; comp(false);
        },
      },
      bubbles: {
        init() { S = Array.from({ length: small() ? 16 : 28 }, () => ({ x: rnd(0, W), y: rnd(0, H), r: rnd(4, 26), v: rnd(0.2, 0.8), sw: rnd(8, 18), ph: rnd(0, 6.28), sp: rnd(0.0006, 0.0014) })); },
        draw(t, dt) {
          vignette();
          for (const b of S) {
            b.y -= b.v * dt;
            if (b.y < -b.r * 2) { b.y = H + b.r * 2; b.x = rnd(0, W); }
            const x = b.x + Math.sin(t * b.sp * 1000 + b.ph) * b.sw;
            ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, 6.2832);
            ctx.fillStyle = rgba(C.gold, C.light ? 0.06 : 0.035); ctx.fill();
            ctx.strokeStyle = rgba(C.bright, C.light ? 0.38 : 0.3); ctx.lineWidth = 1.2; ctx.stroke();
            ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.25, 3.4, 4.9);
            ctx.strokeStyle = rgba(C.bright, 0.5); ctx.stroke();
          }
        },
      },
    };

    const resolveMode = () => pref === 'auto' ? (document.body.classList.contains('grid') ? 'none' : 'dust') : pref;
    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; if (fx[mode]) { fx[mode].init(); if (!raf) paintStill(); } }
    function paintStill() { if (!fx[mode]) { ctx.clearRect(0, 0, W, H); return; } ctx.clearRect(0, 0, W, H); fx[mode].draw(6000, 1); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; }
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dtMs = Math.min(50, now - (last || now)); last = now; clock += dtMs;
      ctx.clearRect(0, 0, W, H);
      fx[mode].draw(clock, dtMs / 16.67);
    }
    function start() {
      stop(); mode = resolveMode(); last = 0;
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight;
      if (!fx[mode]) { ctx.clearRect(0, 0, W, H); return; }
      fx[mode].init();
      if (document.body.classList.contains('reduce-motion') || document.hidden) { paintStill(); return; }
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 120); });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
    computeColors(); start();
    return {
      set(v) { if (!VALID.includes(v)) return; pref = v; try { localStorage.setItem(BG_KEY, v); } catch {} start(); },
      refresh() { computeColors(); start(); },
      get pref() { return pref; },
    };
  })();

  // ══════════════════════════════
  // DEFINITIVE SIDEBAR FIX
  // Root cause of persistent bug:
  // Both 'click' AND 'touchend' were bound, causing double-fire on mobile.
  // Solution: use ONLY 'click' for everything. On touch devices,
  // touchend triggers click naturally. Never bind both on the same element.
  // ══════════════════════════════
  let sidebarOverlay = null;
  let sidebarJustOpened = false;

  function openSidebar() {
    sidebar.classList.add('open');
    if (!sidebarOverlay) {
      sidebarOverlay = document.createElement('div');
      sidebarOverlay.className = 'sidebar-overlay';
      document.body.appendChild(sidebarOverlay);
      sidebarOverlay.addEventListener('click', (e) => {
        if (sidebarJustOpened) return;
        if (e.target === sidebarOverlay) closeSidebar();
      });
    }
    sidebarJustOpened = true;
    sidebarOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    setTimeout(() => { sidebarJustOpened = false; }, 400);
  }

  function closeSidebar() {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    sidebarOverlay?.classList.remove('show');
    document.body.style.overflow = '';
  }

  // ── Sidebar toggle — CLICK ONLY ──
  sidebarToggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
  });

  // ── Stop sidebar's OWN clicks from reaching the overlay ──
  sidebar.addEventListener('click', (e) => { e.stopPropagation(); });

  // ══════════════════════════════
  // BYOK — Bring Your Own OpenRouter Key
  // Stored client-side only (localStorage). Sent as Authorization: Bearer <key>
  // on every /api/chat call. The key is REQUIRED — the backend has no server key of its own.
  // ══════════════════════════════
  const BYOK_STORAGE_KEY = 'eka-openrouter-key';
  function getUserApiKey() { return (localStorage.getItem(BYOK_STORAGE_KEY) || '').trim(); }
  function setUserApiKey(key) { localStorage.setItem(BYOK_STORAGE_KEY, key.trim()); }
  function clearUserApiKey() { localStorage.removeItem(BYOK_STORAGE_KEY); }
  function authHeaders() {
    const h = {};
    const key = getUserApiKey();
    if (key) h['Authorization'] = `Bearer ${key}`;
    if (prefs.mode === 'paid') {           // Paid mode: backend only ever uses YOUR key + this model
      h['X-Eka-Mode'] = 'paid';
      if (prefs.paidModel) h['X-Eka-Model'] = prefs.paidModel;
    }
    return h;
  }

  const settingApiKey  = document.getElementById('settingApiKey');
  const apiKeySave     = document.getElementById('apiKeySave');
  const apiKeyClear    = document.getElementById('apiKeyClear');
  const apiKeyStatus   = document.getElementById('apiKeyStatus');

  function refreshApiKeyStatus() {
    const key = getUserApiKey();
    if (apiKeyStatus) {
      apiKeyStatus.textContent = key
        ? `Using your key (••••${key.slice(-4)})`
        : 'No key saved — EKA can’t reply until you add one.';
    }
  }

  apiKeySave?.addEventListener('click', () => {
    const val = (settingApiKey?.value || '').trim();
    if (!val) { showToast('Enter a key first', ICONS.bot); return; }
    setUserApiKey(val);
    settingApiKey.value = '';
    refreshApiKeyStatus();
    showToast('API key saved locally', ICONS.bot);
    hideKeyGate();
    syncKeyBanner();
  });

  apiKeyClear?.addEventListener('click', () => {
    clearUserApiKey();
    if (settingApiKey) settingApiKey.value = '';
    refreshApiKeyStatus();
    if (prefs.mode === 'paid') { setPref('mode', 'free'); renderModeUI(); showToast('Key removed — switched back to Free mode', ICONS.bot); }
    else showToast('API key removed', ICONS.bot);
    closeModal(settingsOverlay);
    bannerHidden = false;
    showKeyGate('Add a key to keep chatting.');
  });

  // ══════════════════════════════
  // REQUIRED KEY GATE — BYOK is compulsory (Free and Paid). Until a key is saved the
  // app shows this blocking screen and nothing is sent to the server.
  // ══════════════════════════════
  const keyGateOverlay = document.getElementById('keyGateOverlay');
  const keyGateInput   = document.getElementById('keyGateInput');
  const keyGateSave    = document.getElementById('keyGateSave');
  const keyGateStatus  = document.getElementById('keyGateStatus');
  let keyGateBusy = false;

  const apiKeyBanner      = document.getElementById('apiKeyBanner');
  const apiKeyBannerBtn   = document.getElementById('apiKeyBannerBtn');
  const apiKeyBannerClose = document.getElementById('apiKeyBannerClose');
  const keyGateClose      = document.getElementById('keyGateClose');
  const GATE_DISMISSED_KEY = 'eka-keygate-dismissed';
  let bannerHidden = false;     // the banner's own ✕ hides it for this visit only

  // Red reminder: visible whenever there's no key (unless the key screen itself is open, or ✕'d this visit).
  function syncKeyBanner() {
    const show = !getUserApiKey() && !bannerHidden && !keyGateOverlay?.classList.contains('open');
    apiKeyBanner?.classList.toggle('show', show);
  }
  function showKeyGate(message) {
    keyGateOverlay?.classList.add('open');
    if (keyGateStatus) keyGateStatus.textContent = message || '';
    syncKeyBanner();
    setTimeout(() => keyGateInput?.focus(), 50);
  }
  function hideKeyGate() { keyGateOverlay?.classList.remove('open'); if (keyGateInput) keyGateInput.value = ''; syncKeyBanner(); }
  // ✕ / backdrop / Esc: let the user look around first. The red banner stays as the reminder,
  // and trying to chat without a key brings this screen straight back.
  function dismissKeyGate() {
    if (!keyGateOverlay?.classList.contains('open')) return;
    try { localStorage.setItem(GATE_DISMISSED_KEY, '1'); } catch {}
    bannerHidden = false;
    hideKeyGate();
    if (!getUserApiKey()) showToast('You can add your key any time from the red banner', ICONS.bot);
  }
  function hasKey() { return !!getUserApiKey(); }

  async function saveKeyFromGate() {
    if (keyGateBusy) return;
    const val = (keyGateInput?.value || '').trim();
    if (val.length < 20) { if (keyGateStatus) keyGateStatus.textContent = 'That looks too short — paste the full key (starts with sk-or-).'; return; }
    keyGateBusy = true; keyGateSave.disabled = true;
    if (keyGateStatus) keyGateStatus.textContent = 'Checking your key…';
    const slow = setTimeout(() => { if (keyGateStatus) keyGateStatus.textContent = 'Checking… the server may be waking up (up to a minute on the first visit).'; }, 4000);
    let verdict = 'unknown';   // 'ok' | 'bad' | 'unknown' (couldn't reach the server — don't block the user)
    try {
      const d = await fetch(`${API_BASE}/api/key-info`, { headers: { 'Authorization': `Bearer ${val}` } }).then(r => r.json());
      if (d && d.ok) verdict = 'ok';
      else if (d && d.error && /reject|invalid|revoked/i.test(d.error)) { verdict = 'bad'; if (keyGateStatus) keyGateStatus.textContent = d.error; }
    } catch { /* offline / server asleep */ }
    clearTimeout(slow); keyGateBusy = false; keyGateSave.disabled = false;
    if (verdict === 'bad') return;
    setUserApiKey(val); refreshApiKeyStatus(); hideKeyGate();
    showToast(verdict === 'ok' ? 'Key verified — you’re all set' : 'Key saved (couldn’t verify yet)', ICONS.check);
    maybeOnboardName();
  }
  keyGateClose?.addEventListener('click', dismissKeyGate);
  keyGateOverlay?.addEventListener('click', (e) => { if (e.target === keyGateOverlay) dismissKeyGate(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && keyGateOverlay?.classList.contains('open')) dismissKeyGate(); });
  apiKeyBannerBtn?.addEventListener('click', () => showKeyGate());
  apiKeyBannerClose?.addEventListener('click', () => { bannerHidden = true; syncKeyBanner(); });
  keyGateSave?.addEventListener('click', saveKeyFromGate);
  keyGateInput?.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); saveKeyFromGate(); } });

  // ══════════════════════════════
  // AI MODE (Free / Paid) + chat settings
  // Free  = the free OpenRouter models (the existing waterfall), on YOUR key.
  // Paid  = a separate set of stronger/faster models on YOUR key, billed by OpenRouter.
  //         BYOK is compulsory in both modes — the backend has no key of its own.
  // ══════════════════════════════
  const modeFreeBtn     = document.getElementById('modeFree');
  const modePaidBtn     = document.getElementById('modePaid');
  const modeDesc        = document.getElementById('modeDesc');
  const paidModelSel    = document.getElementById('paidModelSelect');
  const paidModelCustom = document.getElementById('paidModelCustom');
  const paidModelNote   = document.getElementById('paidModelNote');
  const freeModelsNote  = document.getElementById('freeModelsNote');
  const paidOverlay     = document.getElementById('paidOverlay');
  const paidConfirm     = document.getElementById('paidConfirm');
  const paidCancel      = document.getElementById('paidCancel');
  const paidClose       = document.getElementById('paidClose');
  const modelLabelEl    = document.getElementById('modelLabel');
  const apiKeyCheckBtn  = document.getElementById('apiKeyCheck');

  const MODEL_ID_RE = /^[A-Za-z0-9_.\-]+\/[A-Za-z0-9_.\-:~]+$/;
  const CUSTOM_OPT  = '__custom__';
  let paidModelsLoaded = false, paidModelsLoading = false;
  let paidModelData = {};
  const shortModel = (id) => ((id || '?').split('/')[1] || id).split(':')[0];

  function renderModeUI() {
    const paid = prefs.mode === 'paid';
    modeFreeBtn?.classList.toggle('active', !paid);
    modePaidBtn?.classList.toggle('active', paid);
    modeFreeBtn?.setAttribute('aria-pressed', String(!paid));
    modePaidBtn?.setAttribute('aria-pressed', String(paid));
    document.body.classList.toggle('mode-paid', paid);
    if (modeDesc) modeDesc.textContent = paid
      ? `Paid mode is ON — ${prefs.paidModel || 'no model chosen'}. Billed to your OpenRouter account.`
      : 'Free mode — free OpenRouter models on your key. No cost, but they can be slower or rate-limited.';
    if (modelLabelEl) modelLabelEl.textContent = paid
      ? `PAID · ${shortModel(prefs.paidModel).toUpperCase()} · Active`
      : 'FREE · NEMOTRON 3 · Active';
  }

  function applyModelSelectUI() {
    if (!paidModelSel) return;
    const custom = paidModelSel.value === CUSTOM_OPT;
    if (paidModelCustom) paidModelCustom.style.display = custom ? 'block' : 'none';
    if (paidModelNote && !custom) {
      const m = paidModelData[paidModelSel.value];
      paidModelNote.textContent = (m && m.in != null && m.out != null)
        ? `$${m.in} in / $${m.out} out per 1M tokens — billed by OpenRouter.` : '';
    }
  }

  async function loadPaidModels(force = false) {
    if (!paidModelSel || paidModelsLoading || (paidModelsLoaded && !force)) return;
    paidModelsLoading = true;
    if (paidModelNote) paidModelNote.textContent = 'Loading models… (the server may need a few seconds to wake up)';
    let data = {};
    try { data = await fetch(`${API_BASE}/api/models`).then(r => r.json()); } catch { /* offline / server asleep — a custom model ID still works */ }
    paidModelsLoading = false;
    const models = Array.isArray(data.models) ? data.models : [];
    if (freeModelsNote && Array.isArray(data.free) && data.free.length)
      freeModelsNote.textContent = 'Free mode tries these in order: ' + data.free.map(m => m.name).join(' → ') + '.';
    paidModelData = {}; models.forEach(m => { paidModelData[m.id] = m; });
    const TIERS = [['fast', '⚡ Fast & cheap'], ['balanced', '⚖ Balanced'], ['best', '★ Best quality']];
    const optHtml = (m) => {
      const price = (m.in != null && m.out != null) ? `  ·  $${m.in}/$${m.out}` : '';
      return `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name || m.id)}${price}</option>`;
    };
    let html = TIERS.map(([t, label]) => {
      const grp = models.filter(m => m.tier === t);
      return grp.length ? `<optgroup label="${label}">${grp.map(optHtml).join('')}</optgroup>` : '';
    }).join('');
    const loose = models.filter(m => !TIERS.some(([t]) => t === m.tier));
    html += loose.map(optHtml).join('');
    html += `<option value="${CUSTOM_OPT}">Custom model ID…</option>`;
    paidModelSel.innerHTML = html;
    paidModelsLoaded = models.length > 0;

    const fallbackId = data.recommended || (models[0] && models[0].id) || '';
    if (prefs.paidModel && paidModelData[prefs.paidModel]) paidModelSel.value = prefs.paidModel;
    else if (prefs.paidModel) { paidModelSel.value = CUSTOM_OPT; if (paidModelCustom) paidModelCustom.value = prefs.paidModel; }
    else if (fallbackId) { paidModelSel.value = fallbackId; setPref('paidModel', fallbackId); }
    else paidModelSel.value = CUSTOM_OPT;
    if (!models.length && paidModelNote) paidModelNote.textContent = "Couldn't load the model list — type a model ID (provider/model-name).";
    applyModelSelectUI();
    renderModeUI();
  }

  async function enablePaid() {
    await loadPaidModels();
    if (!MODEL_ID_RE.test(prefs.paidModel || '')) {
      showToast('Choose a paid model first', ICONS.cross);
      paidModelCustom?.focus();
      return;
    }
    setPref('mode', 'paid');
    renderModeUI();
    showToast(`Paid mode on — ${shortModel(prefs.paidModel)}`, ICONS.bot);
  }
  function openSettingsSection(sec) { document.querySelector(`.settings-nav-item[data-section="${sec}"]`)?.click(); }

  modeFreeBtn?.addEventListener('click', () => {
    if (prefs.mode === 'free') return;
    setPref('mode', 'free'); renderModeUI(); showToast('Free mode on', ICONS.bot);
  });
  modePaidBtn?.addEventListener('click', () => {
    if (prefs.mode === 'paid') return;
    if (!hasKey()) { closeModal(settingsOverlay); showKeyGate('Add your OpenRouter key to use Paid mode.'); return; }
    openModal(paidOverlay);          // warning: this bills the user's OpenRouter account
  });
  paidCancel?.addEventListener('click', () => closeModal(paidOverlay));
  paidClose?.addEventListener('click',  () => closeModal(paidOverlay));
  paidOverlay?.addEventListener('click', (e) => { if (e.target === paidOverlay) closeModal(paidOverlay); });
  paidConfirm?.addEventListener('click', () => { closeModal(paidOverlay); enablePaid(); });

  paidModelSel?.addEventListener('change', () => {
    if (paidModelSel.value !== CUSTOM_OPT) { setPref('paidModel', paidModelSel.value); renderModeUI(); }
    applyModelSelectUI();
    if (paidModelSel.value === CUSTOM_OPT) paidModelCustom?.focus();
  });
  paidModelCustom?.addEventListener('input', () => {
    const v = paidModelCustom.value.trim();
    if (MODEL_ID_RE.test(v)) { setPref('paidModel', v); if (paidModelNote) paidModelNote.textContent = 'Custom model set. Check its price on openrouter.ai/models.'; renderModeUI(); }
    else if (paidModelNote) paidModelNote.textContent = v ? 'Format: provider/model-name' : '';
  });
  document.querySelector('.settings-nav-item[data-section="sec-mode"]')?.addEventListener('click', () => loadPaidModels());

  // Verify the saved key + show OpenRouter usage
  apiKeyCheckBtn?.addEventListener('click', async () => {
    const key = getUserApiKey();
    if (!key) { showToast('Save a key first', ICONS.cross); return; }
    if (apiKeyStatus) apiKeyStatus.textContent = 'Checking…';
    try {
      const d = await fetch(`${API_BASE}/api/key-info`, { headers: { 'Authorization': `Bearer ${key}` } }).then(r => r.json());
      if (!d.ok) { if (apiKeyStatus) apiKeyStatus.textContent = d.error || 'Could not verify the key.'; return; }
      const used = typeof d.usage === 'number' ? `$${d.usage.toFixed(4)} used` : 'valid';
      const left = typeof d.limit_remaining === 'number' ? ` · $${d.limit_remaining.toFixed(2)} left on this key's limit`
                 : (d.limit === null ? ' · no spending limit set on this key' : '');
      if (apiKeyStatus) apiKeyStatus.textContent = `Key OK — ${used}${left}${d.is_free_tier ? ' · free-tier account' : ''}`;
    } catch { if (apiKeyStatus) apiKeyStatus.textContent = 'Could not reach the server — try again in a moment.'; }
  });

  // ── Chat & web settings ──
  const settingStyle       = document.getElementById('settingStyle');
  const settingCreativity  = document.getElementById('settingCreativity');
  const settingHistory     = document.getElementById('settingHistory');
  const settingCustom      = document.getElementById('settingCustom');
  const customCount        = document.getElementById('customCount');
  const settingSearchN     = document.getElementById('settingSearchN');
  const settingShowSources = document.getElementById('settingShowSources');
  const importSessionsBtn  = document.getElementById('importSessions');
  const importSessionsInput= document.getElementById('importSessionsInput');

  function syncSettingsUI() {
    if (settingStyle)       settingStyle.value = prefs.style;
    if (settingCreativity)  settingCreativity.value = prefs.creativity;
    if (settingHistory)     settingHistory.value = String(prefs.historyLimit);
    if (settingCustom)      { settingCustom.value = prefs.customInstructions; if (customCount) customCount.textContent = `${settingCustom.value.length} / 500`; }
    if (settingSearchN)     settingSearchN.value = String(prefs.searchResults);
    if (settingShowSources) settingShowSources.checked = !!prefs.showSources;
    renderModeUI();
    if (prefs.mode === 'paid') loadPaidModels();
  }
  settingStyle?.addEventListener('change',      () => setPref('style', settingStyle.value));
  settingCreativity?.addEventListener('change', () => setPref('creativity', settingCreativity.value));
  settingHistory?.addEventListener('change',    () => setPref('historyLimit', parseInt(settingHistory.value, 10) || 16));
  settingSearchN?.addEventListener('change',    () => setPref('searchResults', parseInt(settingSearchN.value, 10) || 5));
  settingShowSources?.addEventListener('change',() => setPref('showSources', settingShowSources.checked));
  let customTimer = null;
  settingCustom?.addEventListener('input', () => {
    if (customCount) customCount.textContent = `${settingCustom.value.length} / 500`;
    clearTimeout(customTimer);
    customTimer = setTimeout(() => setPref('customInstructions', settingCustom.value.slice(0, 500)), 300);
  });

  // ── Import chat history (counterpart of Export) ──
  importSessionsBtn?.addEventListener('click', () => importSessionsInput?.click());
  importSessionsInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!Array.isArray(data)) throw new Error('not a list');
        const valid = data.filter(x => x && typeof x.id === 'string' && Array.isArray(x.history) &&
            x.history.every(m => m && typeof m.content === 'string' && ['user', 'assistant'].includes(m.role)))
          .map(x => ({ id: x.id, title: String(x.title || 'Imported chat').slice(0, 60), date: Number(x.date) || Date.now(), history: x.history }));
        if (!valid.length) throw new Error('no chats');
        const existing = getAllSessions();
        const have = new Set(existing.map(s => s.id));
        const fresh = valid.filter(v => !have.has(v.id));
        saveAllSessions([...fresh, ...existing].slice(0, 30));
        renderSessionList(); updateSessionCount();
        showToast(fresh.length ? `Imported ${fresh.length} chat${fresh.length > 1 ? 's' : ''}` : 'Nothing new to import', ICONS.check);
      } catch { showToast("That file isn't a valid EKA history export", ICONS.cross); }
    };
    reader.readAsText(file);
    importSessionsInput.value = '';
  });


  userCardBtn?.addEventListener('click', () => { openModal(userOverlay); });
  clearChatBtn?.addEventListener('click', () => { startNewSession(); });
  newSessionBtn?.addEventListener('click', () => { saveCurrentSession(); startNewSession(); });

  document.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { sendMessage(c.dataset.q); });
  });

  // ── Sidebar action buttons ──
  openSettingsBtn?.addEventListener('click', () => {
    settingMute.checked = !isMuted;
    if (settingBg) settingBg.value = liveBg.pref;
    settingWeb.checked  = webSearchEnabled;
    if (settingImage) settingImage.checked = imageGenEnabled;
    settingLang.value   = languageToggle.value;
    updateSessionCount();
    refreshApiKeyStatus();
    syncSettingsUI();
    openModal(settingsOverlay);
  });

  // ══════════════════════════════
  // MODALS
  // ══════════════════════════════
  function openModal(el) { el.classList.add('open'); }
  function closeModal(el) { el.classList.remove('open'); }

  settingsClose?.addEventListener('click', () => closeModal(settingsOverlay));
  userClose?.addEventListener('click',     () => closeModal(userOverlay));
  settingsOverlay?.addEventListener('click', (e) => { if (e.target === settingsOverlay) closeModal(settingsOverlay); });
  userOverlay?.addEventListener('click',    (e) => { if (e.target === userOverlay) closeModal(userOverlay); });

  // ══════════════════════════════
  // SETTINGS — nav rail switching + sliding indicator + ripple
  // ══════════════════════════════
  (function initSettingsNav() {
    const nav = document.getElementById('settingsNav');
    const indicator = document.getElementById('settingsNavIndicator');
    if (!nav || !indicator) return;
    const items = [...nav.querySelectorAll('.settings-nav-item')];
    const panels = [...document.querySelectorAll('.settings-panel')];

    function moveIndicator(el) {
      const mobile = window.matchMedia('(max-width:720px)').matches;
      if (mobile) {
        indicator.style.transform = `translateX(${el.offsetLeft}px)`;
        indicator.style.width = el.offsetWidth + 'px';
      } else {
        indicator.style.transform = `translateY(${el.offsetTop}px)`;
        indicator.style.height = el.offsetHeight + 'px';
        indicator.style.width = '';
      }
    }

    function activate(item, scroll = true) {
      items.forEach(i => i.classList.toggle('active', i === item));
      panels.forEach(p => p.classList.toggle('active', p.dataset.panel === item.dataset.section));
      moveIndicator(item);
      if (scroll) item.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    items.forEach(item => item.addEventListener('click', () => activate(item)));
    window.addEventListener('resize', () => {
      const active = items.find(i => i.classList.contains('active'));
      if (active) moveIndicator(active);
    });

    // Position indicator once the modal becomes visible (needs real layout
    // dimensions). It starts at opacity:0 in CSS and only fades in via the
    // .ready class here — since the modal itself animates in (~280ms), this
    // avoids ever showing the box mid-flight while ancestor sizing settles.
    const settingsObs = new MutationObserver(() => {
      if (settingsOverlay?.classList.contains('open')) {
        const active = items.find(i => i.classList.contains('active')) || items[0];
        requestAnimationFrame(() => { moveIndicator(active); indicator.classList.add('ready'); });
      } else {
        indicator.classList.remove('ready');
      }
    });
    if (settingsOverlay) settingsObs.observe(settingsOverlay, { attributes: true, attributeFilter: ['class'] });
  })();

  // Fluid ripple feedback on tappable settings controls
  document.querySelectorAll('.theme-swatch, .danger-btn, .save-btn, .auth-btn, .icon-btn, .settings-nav-item, .toggle-switch').forEach(el => {
    el.addEventListener('click', (e) => {
      if (document.body.classList.contains('reduce-motion')) return;
      const rect = el.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const ripple = document.createElement('span');
      ripple.className = 'settings-ripple';
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top  = (e.clientY - rect.top - size / 2) + 'px';
      el.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove());
    });
  });

  // ══════════════════════════════
  // THEMES
  // ══════════════════════════════
  const THEMES = ['dark','light','purple','grid','pinkpurple','greenwhite','material','ocean','sunset','forest','crimson','aurora','midnight','sky','peach','lavender'];
  const LIGHT_THEMES = ['light','greenwhite','sky','peach','lavender'];
  function playMaterialTransform(originEl) {
    if (document.body.classList.contains('reduce-motion')) return;
    const overlay = document.createElement('div');
    overlay.className = 'material-transform-overlay';
    if (originEl) {
      const r = originEl.getBoundingClientRect();
      const ox = ((r.left + r.width / 2) / window.innerWidth) * 100;
      const oy = ((r.top + r.height / 2) / window.innerHeight) * 100;
      overlay.style.setProperty('--mat-ox', ox + '%');
      overlay.style.setProperty('--mat-oy', oy + '%');
    }
    overlay.innerHTML = `<div class="mat-icon">${ICONS.sparkle}</div>`;
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 680);
  }
  function applyTheme(theme, originEl) {
    const prev = THEMES.find(t => document.body.classList.contains(t));
    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
    localStorage.setItem('eka-theme', theme);
    themeSwatches.forEach(s => s.classList.toggle('active', s.dataset.theme === theme));
    updateThemeIcon(LIGHT_THEMES.includes(theme));
    liveBg.refresh();   // re-tint the live background to the new theme colours
    if (theme === 'material' && prev !== 'material') playMaterialTransform(originEl);
  }
  applyTheme(localStorage.getItem('eka-theme') || 'dark');
  themeSwatches.forEach(s => s.addEventListener('click', (e) => applyTheme(s.dataset.theme, e.currentTarget)));
  const settingBg = document.getElementById('settingBg');
  if (settingBg) {
    settingBg.value = liveBg.pref;
    settingBg.addEventListener('change', () => {
      liveBg.set(settingBg.value);
      showToast('Background: ' + (settingBg.options?.[settingBg.selectedIndex]?.text || settingBg.value), ICONS.sparkle);
    });
  }
  themeToggle?.addEventListener('click', () => {
    const curr = LIGHT_THEMES.some(t => document.body.classList.contains(t)) ? 'light' : 'dark';
    applyTheme(curr === 'light' ? 'dark' : 'light');
    showToast(curr === 'light' ? 'Dark mode' : 'Light mode', curr === 'light' ? ICONS.moon : ICONS.sun);
  });
  function updateThemeIcon(light) {
    const icon = document.getElementById('themeIcon'); if (!icon) return;
    icon.innerHTML = light
      ? `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>`
      : `<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>`;
  }

  // ══════════════════════════════
  // USER PROFILE — local only. Name, "about" and photo live in this browser's localStorage
  // (no account, nothing to lose when the server sleeps). The name + about are sent with
  // every chat request so the AI can address you personally.
  // Two copies of the form exist (profile modal + Settings > Profile tab) — every
  // read/write touches both.
  // ══════════════════════════════
  const PROFILE_KEY = 'eka-profile';
  let currentUser = null; // {display_name, about, avatar}

  function readProfile() {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}');
      return {
        display_name: typeof p.display_name === 'string' ? p.display_name.slice(0, 32) : '',
        about:        typeof p.about === 'string' ? p.about.slice(0, 60) : '',
        avatar:       (typeof p.avatar === 'string' && p.avatar.startsWith('data:image/')) ? p.avatar : null,
      };
    } catch { return { display_name: '', about: '', avatar: null }; }
  }
  function writeProfile(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); return true; }
    catch { return false; }
  }

  function renderProfile(user) {
    currentUser = user;
    const name = (user.display_name || '').trim();
    const initial = name ? name[0].toUpperCase() : '?';
    const avatarHtml = user.avatar ? `<img src="${user.avatar}" alt="avatar" />` : initial;

    if (userAvatarBig)   userAvatarBig.innerHTML = avatarHtml;
    if (userAvatarSmall) userAvatarSmall.innerHTML = avatarHtml;
    if (settingsAvatarBig) settingsAvatarBig.innerHTML = avatarHtml;

    if (sidebarUserName)  sidebarUserName.textContent = name || 'Set your name';
    if (sidebarUserEmail) sidebarUserEmail.textContent = user.about || 'Tap to edit profile';

    if (profileName)  profileName.value  = user.display_name || '';
    if (profileAbout) profileAbout.value = user.about || '';
    if (avatarRemoveBtn) avatarRemoveBtn.style.display = user.avatar ? 'block' : 'none';

    if (settingsProfileName)  settingsProfileName.value  = user.display_name || '';
    if (settingsProfileAbout) settingsProfileAbout.value = user.about || '';
    if (settingsAvatarRemove) settingsAvatarRemove.style.display = user.avatar ? 'block' : 'none';

    updateEmptyStateText(); // refresh greeting now that we know the name
  }

  function saveProfileFields(name, about, statusEl) {
    name = (name || '').trim();
    if (!name) { const m = 'Please enter your name.'; if (statusEl) statusEl.textContent = m; showToast(m, ICONS.cross); return; }
    const next = { ...(currentUser || readProfile()), display_name: name.slice(0, 32), about: (about || '').trim().slice(0, 60) };
    if (!writeProfile(next)) { showToast('Could not save — browser storage is full or blocked', ICONS.cross); return; }
    renderProfile(next);
    if (statusEl) { statusEl.textContent = 'Saved ✓'; setTimeout(() => { statusEl.textContent = ''; }, 2000); }
    showToast('Profile saved', ICONS.check);
  }

  function uploadAvatar(dataUrl, statusEl) {
    const next = { ...(currentUser || readProfile()), avatar: dataUrl || null };
    if (!writeProfile(next)) { const m = 'Photo too large for browser storage'; if (statusEl) statusEl.textContent = m; showToast(m, ICONS.cross); return; }
    renderProfile(next);
  }

  // Photos are center-cropped to a 256px square JPEG so they stay tiny (~20-40 KB) in localStorage.
  function readFileAsAvatar(file, onDone) {
    if (!file || !file.type.startsWith('image/')) { showToast('Please choose an image file', ICONS.cross); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const size = 256, c = document.createElement('canvas');
        c.width = c.height = size;
        const side = Math.min(img.width, img.height);
        c.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        onDone(c.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => showToast('Could not read that image', ICONS.cross);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  // Sidebar/profile-modal avatar upload
  avatarUploadZone?.addEventListener('click', () => avatarFileInput.click());
  avatarFileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    readFileAsAvatar(file, (data) => uploadAvatar(data, profileStatus));
    avatarFileInput.value = '';
  });
  avatarRemoveBtn?.addEventListener('click', () => uploadAvatar(null, profileStatus));
  saveProfileBtn?.addEventListener('click', () => {
    saveProfileFields(profileName.value, profileAbout?.value || '', profileStatus);
  });

  // Settings > Profile tab — separate DOM nodes, same profile
  settingsAvatarZone?.addEventListener('click', () => settingsAvatarInput.click());
  settingsAvatarInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    readFileAsAvatar(file, (data) => uploadAvatar(data, settingsProfileStatus));
    settingsAvatarInput.value = '';
  });
  settingsAvatarRemove?.addEventListener('click', () => uploadAvatar(null, settingsProfileStatus));
  settingsProfileSave?.addEventListener('click', () => {
    saveProfileFields(settingsProfileName.value, settingsProfileAbout?.value || '', settingsProfileStatus);
  });
  // (the initial renderProfile() call lives in the INIT block at the bottom — it needs emptyStateText)

  // ══════════════════════════════
  // SETTINGS CONTROLS
  // ══════════════════════════════
  // Voice: OFF by default. "settingMute" is now the "EKA speaks replies aloud" switch (checked = voice ON).
  const ICON_VOICE_ON  = '<svg id="muteIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
  const ICON_VOICE_OFF = '<svg id="muteIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  function renderVoiceUI() {
    const on = !isMuted;
    if (muteToggle) {
      muteToggle.classList.toggle('active', on);
      muteToggle.setAttribute('aria-pressed', String(on));
      muteToggle.title = on ? 'Voice replies: on (tap to mute)' : 'Voice replies: off (tap to let EKA speak)';
      muteToggle.innerHTML = on ? ICON_VOICE_ON : ICON_VOICE_OFF;
    }
    if (settingMute) settingMute.checked = on;
  }
  function setVoiceEnabled(on, { toast = true } = {}) {
    isMuted = !on;
    try { localStorage.setItem('eka-voice', on ? 'on' : 'off'); } catch {}
    if (!on) { try { speechSynthesis.cancel(); } catch {} if (speakingAnim) speakingAnim.style.display = 'none'; }
    renderVoiceUI();
    if (toast) showToast(on ? 'EKA will speak replies' : 'Voice off — EKA stays silent', on ? ICONS.unmute : ICONS.mute);
  }
  settingMute?.addEventListener('change', () => setVoiceEnabled(settingMute.checked));
  settingWeb?.addEventListener('change',  () => { webSearchEnabled = settingWeb.checked; webToggle?.classList.toggle('active', webSearchEnabled); showToast(webSearchEnabled ? 'Web search on' : 'Web search off', ICONS.globe); });
  settingImage?.addEventListener('change', () => {
    imageGenEnabled = settingImage.checked;
    imageToggle?.classList.toggle('active', imageGenEnabled);
    imageToggle?.setAttribute('aria-pressed', imageGenEnabled);
    if (imageToggle) imageToggle.title = imageGenEnabled ? 'Image Generation (ON)' : 'Image Generation (OFF)';
    if (msg) msg.placeholder = imageGenEnabled ? 'Describe the image to generate…' : 'Ask EKA anything…';
    showToast(imageGenEnabled ? 'Image generation on — describe what to create' : 'Image generation off', ICONS.image);
  });
  settingLang?.addEventListener('change', () => { if (languageToggle) languageToggle.value = settingLang.value; });
  clearAllSessions?.addEventListener('click', () => { if (confirm('Delete all saved chat history?')) { clearAllChatSessions(); showToast('All history cleared', ICONS.check); updateSessionCount(); } });
  muteToggle?.addEventListener('click', () => setVoiceEnabled(isMuted));
  webToggle?.addEventListener('click', () => { webSearchEnabled = !webSearchEnabled; webToggle.classList.toggle('active', webSearchEnabled); webToggle.setAttribute('aria-pressed', webSearchEnabled); if (settingWeb) settingWeb.checked = webSearchEnabled; showToast(webSearchEnabled ? 'Web search on' : 'Web search off', ICONS.globe); });
  imageToggle?.addEventListener('click', () => {
    imageGenEnabled = !imageGenEnabled;
    imageToggle.classList.toggle('active', imageGenEnabled);
    imageToggle.setAttribute('aria-pressed', imageGenEnabled);
    imageToggle.title = imageGenEnabled ? 'Image Generation (ON)' : 'Image Generation (OFF)';
    if (settingImage) settingImage.checked = imageGenEnabled;
    if (msg) msg.placeholder = imageGenEnabled ? 'Describe the image to generate…' : 'Ask EKA anything…';
    showToast(imageGenEnabled ? 'Image generation on — describe what to create' : 'Image generation off', ICONS.image);
  });
  voiceOnlyToggle?.addEventListener('click', () => { voiceOnly = !voiceOnly; document.body.classList.toggle('voice-only', voiceOnly); voiceOnlyToggle.classList.toggle('active', voiceOnly); if (voiceOnly) { wakeMicButton.style.display='flex'; if (isMuted) setVoiceEnabled(true, { toast:false }); speak("Hello, I'm EKA. Tap the mic."); } else { wakeMicButton.style.display='none'; msg.focus(); } showToast(voiceOnly ? 'Voice-only on' : 'Voice-only off', ICONS.mic); });

  // ── Appearance: font size / density / reduced motion ──
  const FONT_SIZES = ['font-sm','font-md','font-lg'];
  function applyFontSize(size) {
    document.body.classList.remove(...FONT_SIZES);
    document.body.classList.add(size);
    localStorage.setItem('eka-font-size', size);
    if (settingFontSize) settingFontSize.value = size;
  }
  settingFontSize?.addEventListener('change', () => applyFontSize(settingFontSize.value));
  applyFontSize(localStorage.getItem('eka-font-size') || 'font-md');

  function applyDensity(val) {
    document.body.classList.toggle('density-compact', val === 'density-compact');
    localStorage.setItem('eka-density', val);
    if (settingDensity) settingDensity.value = val;
  }
  settingDensity?.addEventListener('change', () => applyDensity(settingDensity.value));
  applyDensity(localStorage.getItem('eka-density') || 'cozy');

  function applyReduceMotion(on) {
    document.body.classList.toggle('reduce-motion', on);
    localStorage.setItem('eka-reduce-motion', on ? '1' : '0');
    liveBg.refresh();
    if (settingReduceMotion) settingReduceMotion.checked = on;
  }
  settingReduceMotion?.addEventListener('change', () => applyReduceMotion(settingReduceMotion.checked));
  applyReduceMotion(localStorage.getItem('eka-reduce-motion') === '1');

  // ── Sound effects ──
  let soundFxEnabled = localStorage.getItem('eka-soundfx') === '1';
  if (settingSoundFx) settingSoundFx.checked = soundFxEnabled;
  function playFx(freq = 660, dur = 0.06) {
    if (!soundFxEnabled) return;
    try {
      const ctx = window.__ekaAudioCtx || (window.__ekaAudioCtx = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.frequency.value = freq; osc.type = 'sine';
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(); osc.stop(ctx.currentTime + dur);
    } catch {}
  }
  settingSoundFx?.addEventListener('change', () => {
    soundFxEnabled = settingSoundFx.checked;
    localStorage.setItem('eka-soundfx', soundFxEnabled ? '1' : '0');
    showToast(soundFxEnabled ? 'Sound effects on' : 'Sound effects off', ICONS.check);
    if (soundFxEnabled) playFx();
  });

  // ── Enter to send ──
  let enterToSend = localStorage.getItem('eka-enter-send') !== '0';
  if (settingEnterSend) settingEnterSend.checked = enterToSend;
  settingEnterSend?.addEventListener('change', () => {
    enterToSend = settingEnterSend.checked;
    localStorage.setItem('eka-enter-send', enterToSend ? '1' : '0');
    showToast(enterToSend ? 'Enter sends messages' : 'Enter adds new line', ICONS.check);
  });

  // ── Export chat history ──
  exportAllSessions?.addEventListener('click', () => {
    const sessions = getAllSessions();
    if (!sessions.length) { showToast('No chat history to export', ICONS.cross); return; }
    const blob = new Blob([JSON.stringify(sessions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `eka-chat-history-${Date.now()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    showToast('Chat history exported', ICONS.check);
  });

  // ── Reset app to defaults ──
  resetAppBtn?.addEventListener('click', () => {
    if (!confirm('Reset EKA to default settings? This clears theme, preferences, AI mode and your profile, but keeps saved chat history and your API key.')) return;
    ['eka-theme','eka-font-size','eka-density','eka-reduce-motion','eka-soundfx','eka-enter-send','eka-prefs','eka-profile','eka-onboarded','eka-voice','eka-bg','eka-keygate-dismissed'].forEach(k => localStorage.removeItem(k));
    showToast('App reset — reloading…', ICONS.check);
    setTimeout(() => location.reload(), 600);
  });

  // ══════════════════════════════
  // PHOTO ATTACH
  // ══════════════════════════════
  attachBtn?.addEventListener('click', () => photoInput.click());
  photoInput?.addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      attachedImage = ev.target.result;
      attachThumb.src = attachedImage;
      attachPreview.style.display = 'flex';
      attachBtn.classList.add('has-file');
    };
    reader.readAsDataURL(file);
    photoInput.value = '';
  });
  attachRemove?.addEventListener('click', () => {
    attachedImage = null;
    attachPreview.style.display = 'none';
    attachBtn.classList.remove('has-file');
  });

  // ══════════════════════════════
  // CHAT SESSIONS (localStorage)
  // ══════════════════════════════
  function genId() { return 'ses_' + Date.now(); }

  function getAllSessions() {
    try { return JSON.parse(localStorage.getItem('eka-sessions') || '[]'); }
    catch { return []; }
  }

  function saveAllSessions(sessions) {
    localStorage.setItem('eka-sessions', JSON.stringify(sessions));
  }

  function clearAllChatSessions() {
    localStorage.removeItem('eka-sessions');
    renderSessionList();
  }

  function saveCurrentSession() {
    if (!chatHistory.length) return;
    const sessions = getAllSessions();
    const firstMsg  = chatHistory.find(m => m.role === 'user')?.content || 'New chat';
    const title     = firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '…' : '');
    const existing  = sessions.findIndex(s => s.id === currentSessionId);
    const session   = { id: currentSessionId || genId(), title, date: Date.now(), history: chatHistory };
    if (existing >= 0) sessions[existing] = session;
    else sessions.unshift(session);
    saveAllSessions(sessions.slice(0, 30)); // keep max 30 sessions
    renderSessionList();
  }

  function clearChatBubbles() {
    if (activeReveal) { clearInterval(activeReveal.timer); activeReveal = null; }
    if (isThinking && currentAbort) { silentStop = true; currentAbort.abort(); }
    setSendMode(false);
    chat.querySelectorAll('.bubble-row, #typingIndicator').forEach(el => el.remove());
  }

  function loadSession(id) {
    const sessions = getAllSessions();
    const session  = sessions.find(s => s.id === id);
    if (!session) return;
    saveCurrentSession();
    currentSessionId = session.id;
    chatHistory = session.history || [];
    clearChatBubbles();
    chatHistory.forEach((m, i) => {
      if (m.role === 'user')      addBubble(m.content, 'user', '', false, null, i);
      else if (m.role === 'assistant') addBubble(m.content, 'bot', 'ai', false, null, i);
    });
    if (chatHistory.length === 0) showEmptyState(); else hideEmptyState();
    renderSessionList();
    closeSidebar();
  }

  function startNewSession() {
    saveCurrentSession();
    currentSessionId = genId();
    chatHistory = [];
    clearChatBubbles();
    showEmptyState();
    renderSessionList();
  }

  function deleteSession(id, e) {
    e.stopPropagation();
    const sessions = getAllSessions().filter(s => s.id !== id);
    saveAllSessions(sessions);
    if (id === currentSessionId) startNewSession();
    else renderSessionList();
  }

  function renderSessionList() {
    sessionsList.innerHTML = '';
    const sessions = getAllSessions();
    sessionsEmpty.style.display = sessions.length ? 'none' : 'block';
    sessions.forEach(s => {
      const item = document.createElement('div');
      item.className = 'session-item' + (s.id === currentSessionId ? ' active' : '');
      const date = new Date(s.date).toLocaleDateString([], { month:'short', day:'numeric' });
      item.innerHTML = `<span class="session-title">${s.title}</span><span class="session-date">${date}</span><button class="session-del" title="Delete">${ICONS.cross}</button>`;
      item.addEventListener('click', () => loadSession(s.id));
      item.querySelector('.session-del').addEventListener('click', (e) => deleteSession(s.id, e));
      sessionsList.appendChild(item);
    });
    updateSessionCount();
  }

  function updateSessionCount() {
    const n = getAllSessions().length;
    if (sessionCountEl) sessionCountEl.textContent = `${n} session${n !== 1 ? 's' : ''}`;
  }

  // Auto-save every message
  function autosave() { saveCurrentSession(); }

  // ══════════════════════════════
  // BUBBLE with action bar
  // ══════════════════════════════
  // ══════════════════════════════
  // CODE BLOCK ENHANCEMENT — adds a copy button + language label
  // to every <pre><code> block produced by marked.js
  // ══════════════════════════════
  function enhanceCodeBlocks(container) {
    const blocks = container.querySelectorAll('pre');
    blocks.forEach(pre => {
      if (pre.parentElement.classList.contains('code-block-wrap')) return; // already enhanced
      const codeEl = pre.querySelector('code');
      const langMatch = codeEl?.className?.match(/language-(\w+)/);
      const lang = langMatch ? langMatch[1] : 'text';

      const wrap = document.createElement('div');
      wrap.className = 'code-block-wrap';
      pre.parentNode.insertBefore(wrap, pre);

      const header = document.createElement('div');
      header.className = 'code-block-header';

      const label = document.createElement('span');
      label.className = 'code-lang-label';
      label.textContent = lang;
      header.appendChild(label);

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'copy-code-btn';
      copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`;
      copyBtn.addEventListener('click', () => {
        const codeText = codeEl ? codeEl.innerText : pre.innerText;
        navigator.clipboard?.writeText(codeText).then(() => {
          copyBtn.innerHTML = `${ICONS.check}<span>Copied</span>`;
          copyBtn.classList.add('copied');
          playFx?.(880, 0.05);
          setTimeout(() => { copyBtn.innerHTML = `${ICONS.copy}<span>Copy</span>`; copyBtn.classList.remove('copied'); }, 1500);
        });
      });
      header.appendChild(copyBtn);

      wrap.appendChild(header);
      wrap.appendChild(pre);
    });
  }

  // Wrap any rendered <table> in a horizontally scrollable container so wide
  // tables never stretch the chat bubble past the column — matches the code-block
  // overflow pattern above instead of letting the bubble grow or clip content.
  function wrapTables(container) {
    container.querySelectorAll('table').forEach(table => {
      if (table.parentElement.classList.contains('table-scroll')) return; // already wrapped
      const wrap = document.createElement('div');
      wrap.className = 'table-scroll';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  function addBubble(text, who = 'bot', source = '', animate = false, imgData = null, idx = null, extras = null) {
    if (voiceOnly) return;

    const row = document.createElement('div');
    row.className = `bubble-row ${who}`;
    if (idx !== null) row.dataset.msgIndex = idx;

    const bubble = document.createElement('div');
    bubble.className = `bubble ${who}`;

    // Image (for user photo attachments)
    if (imgData) {
      const img = document.createElement('img');
      img.src = imgData; img.className = 'bubble-img'; img.alt = 'attached image';
      bubble.appendChild(img);
    }

    const content = document.createElement('div');
    content.className = 'ai-text';
    bubble.appendChild(content);

    const finalize = () => {
      if (typeof extras === 'function') extras(bubble);
      if (source) {
        const meta = document.createElement('div'); meta.className = 'meta';
        const badge = document.createElement('span'); badge.className = 'meta-badge';
        const b = SOURCE_BADGES[source];
        badge.innerHTML = b ? `${b.icon}<span>${b.label}</span>` : source;
        meta.appendChild(badge);
        meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })));
        bubble.appendChild(meta);
      }
    };

    if (animate && who === 'bot' && !document.body.classList.contains('reduce-motion')) {
      // ChatGPT-style reveal: text arrives in small word-clusters per tick
      // instead of a strict one-character crawl — a few words appear, then the
      // rest of that burst lands together, which reads as faster/livelier while
      // still feeling like a live response rather than an instant dump.
      const words = text.split(/(\s+)/); // keep whitespace tokens so spacing is preserved
      let wi = 0;
      let timer = null;
      const complete = (partial) => {
        clearInterval(timer);
        const shown = partial ? words.slice(0, wi).join('') : text;
        if (partial && !shown.trim()) {
          // stopped before a single word appeared — drop the empty reply entirely
          row.remove();
          if (idx !== null && idx === chatHistory.length - 1 && chatHistory[idx]?.role === 'assistant') chatHistory.pop();
          autosave();
        } else {
          content.innerHTML = typeof marked !== 'undefined' ? marked.parse(shown) : shown;
          enhanceCodeBlocks(content);
          wrapTables(content);
          finalize();
          if (partial && idx !== null && chatHistory[idx]?.role === 'assistant') {
            chatHistory[idx].content = shown.trim();   // history keeps only what the user actually saw
            autosave();
          }
        }
        if (activeReveal && activeReveal.timer === timer) activeReveal = null;
        if (!isThinking) setSendMode(false);
      };
      timer = setInterval(() => {
        if (wi < words.length) {
          // reveal 2–4 word-tokens per tick, randomized slightly for a natural cadence
          wi += 2 + Math.floor(Math.random() * 3);
          const chunk = words.slice(0, wi).join('');
          content.innerHTML = typeof marked !== 'undefined' ? marked.parse(chunk) : chunk;
          chat.scrollTop = chat.scrollHeight;
        } else {
          complete(false);
        }
      }, 35);
      activeReveal = { timer, stop: () => complete(true) };
      setSendMode(true);
    } else {
      content.innerHTML = typeof marked !== 'undefined' ? marked.parse(text) : text;
      enhanceCodeBlocks(content);
      wrapTables(content);
      finalize();
    }

    row.appendChild(bubble);

    // Action bar: copy + thumbs (only for bot), copy for user
    const actions = document.createElement('div');
    actions.className = 'bubble-actions';

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'bact-btn'; copyBtn.title = 'Copy'; copyBtn.innerHTML = ICONS.copy;
    copyBtn.addEventListener('click', () => {
      navigator.clipboard?.writeText(text).then(() => {
        copyBtn.innerHTML = ICONS.check; copyBtn.classList.add('copied');
        setTimeout(() => { copyBtn.innerHTML = ICONS.copy; copyBtn.classList.remove('copied'); }, 1500);
      });
    });
    actions.appendChild(copyBtn);

    if (who === 'user' && idx !== null) {
      const editBtn = document.createElement('button');
      editBtn.className = 'bact-btn'; editBtn.title = 'Edit message'; editBtn.innerHTML = ICONS.edit;
      editBtn.addEventListener('click', () => startEdit(row, idx, text));
      actions.appendChild(editBtn);
    }

    if (who === 'bot') {
      if (idx !== null && source) {
        const regenBtn = document.createElement('button');
        regenBtn.className = 'bact-btn'; regenBtn.title = 'Regenerate response'; regenBtn.innerHTML = ICONS.regenerate;
        regenBtn.addEventListener('click', () => regenerateFrom(row, idx));
        actions.appendChild(regenBtn);
      }

      const speakBtn = document.createElement('button');
      speakBtn.className = 'bact-btn'; speakBtn.title = 'Read aloud'; speakBtn.innerHTML = ICONS.wave;
      speakBtn.addEventListener('click', () => toggleSpeakBubble(speakBtn, text));
      actions.appendChild(speakBtn);

      const likeBtn = document.createElement('button');
      likeBtn.className = 'bact-btn'; likeBtn.title = 'Good response'; likeBtn.innerHTML = ICONS.thumbsUp;
      likeBtn.addEventListener('click', () => {
        likeBtn.classList.toggle('liked');
        dislikeBtn.classList.remove('disliked');
        showToast(likeBtn.classList.contains('liked') ? 'Thanks for the feedback!' : '', ICONS.thumbsUp);
      });

      const dislikeBtn = document.createElement('button');
      dislikeBtn.className = 'bact-btn'; dislikeBtn.title = 'Bad response'; dislikeBtn.innerHTML = ICONS.thumbsDown;
      dislikeBtn.addEventListener('click', () => {
        dislikeBtn.classList.toggle('disliked');
        likeBtn.classList.remove('liked');
        showToast(dislikeBtn.classList.contains('disliked') ? 'Feedback noted, will improve!' : '', ICONS.thumbsDown);
      });

      actions.appendChild(likeBtn);
      actions.appendChild(dislikeBtn);
    }

    row.appendChild(actions);
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  // ══════════════════════════════
  // EDIT last message — rewrite + resubmit, discarding everything after it
  // ══════════════════════════════
  function startEdit(row, idx, originalText) {
    if (isThinking) return;
    const bubble  = row.querySelector('.bubble');
    const content = bubble.querySelector('.ai-text');
    const actions = row.querySelector('.bubble-actions');
    const prevHTML = content.innerHTML;

    content.innerHTML = '';
    const ta = document.createElement('textarea');
    ta.className = 'edit-textarea';
    ta.value = originalText;
    content.appendChild(ta);
    ta.focus();
    ta.setSelectionRange(ta.value.length, ta.value.length);
    const autoGrow = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };
    autoGrow();
    ta.addEventListener('input', autoGrow);

    const editBar = document.createElement('div');
    editBar.className = 'edit-actions';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button'; cancelBtn.className = 'edit-cancel-btn'; cancelBtn.textContent = 'Cancel';
    const saveBtn = document.createElement('button');
    saveBtn.type = 'button'; saveBtn.className = 'edit-save-btn'; saveBtn.textContent = 'Save & Submit';
    editBar.appendChild(cancelBtn);
    editBar.appendChild(saveBtn);
    bubble.appendChild(editBar);
    if (actions) actions.style.display = 'none';

    const cleanup = () => { editBar.remove(); if (actions) actions.style.display = ''; };

    cancelBtn.addEventListener('click', () => { content.innerHTML = prevHTML; cleanup(); });
    saveBtn.addEventListener('click', () => {
      const newText = ta.value.trim();
      if (!newText) return;
      chatHistory.length = idx;              // drop this message + everything after it
      let sib = row;
      while (sib) { const next = sib.nextElementSibling; sib.remove(); sib = next; }
      sendMessage(newText);
    });
    ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveBtn.click(); }
      if (e.key === 'Escape') cancelBtn.click();
    });
  }

  // ══════════════════════════════
  // REGENERATE — drop this bot reply + anything after, re-ask the same question
  // ══════════════════════════════
  function regenerateFrom(row, idx) {
    if (isThinking) return;
    chatHistory.length = idx;
    let sib = row;
    while (sib) { const next = sib.nextElementSibling; sib.remove(); sib = next; }
    fetchAndRenderReply();
  }

  function addImageBubble(dataUrl, prompt) {
    if (voiceOnly) return;

    const row = document.createElement('div'); row.className = 'bubble-row bot';
    const bubble = document.createElement('div'); bubble.className = 'bubble bot';

    const img = document.createElement('img');
    img.src = dataUrl; img.className = 'bubble-img generated-img'; img.alt = prompt;
    img.loading = 'lazy';
    img.addEventListener('click', () => window.open(dataUrl, '_blank'));
    bubble.appendChild(img);

    const caption = document.createElement('div');
    caption.className = 'ai-text image-caption';
    caption.textContent = prompt;
    bubble.appendChild(caption);

    const meta = document.createElement('div'); meta.className = 'meta';
    const badge = document.createElement('span'); badge.className = 'meta-badge';
    const b = SOURCE_BADGES.generated;
    badge.innerHTML = `${b.icon}<span>${b.label}</span>`;
    meta.appendChild(badge);
    meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })));
    bubble.appendChild(meta);

    row.appendChild(bubble);

    const actions = document.createElement('div'); actions.className = 'bubble-actions';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'bact-btn'; dlBtn.title = 'Download image'; dlBtn.innerHTML = ICONS.download;
    dlBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = dataUrl; a.download = `eka-image-${Date.now()}.jpg`;
      document.body.appendChild(a); a.click(); a.remove();
    });
    actions.appendChild(dlBtn);
    row.appendChild(actions);

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  // ══════════════════════════════
  // MODULE 1 — Avatar tool bubble
  // Renders a DiceBear SVG avatar (fetched by <img src>, no base64 needed since
  // it's already a lightweight vector URL) inline as a bot chat bubble.
  // ══════════════════════════════
  function addAvatarBubble(url, seed, style) {
    if (voiceOnly) return;

    const row = document.createElement('div'); row.className = 'bubble-row bot';
    const bubble = document.createElement('div'); bubble.className = 'bubble bot';

    const img = document.createElement('img');
    img.src = url; img.className = 'bubble-img generated-img avatar-img';
    img.alt = `${style} avatar for "${seed}"`; img.loading = 'lazy';
    img.addEventListener('click', () => window.open(url, '_blank'));
    bubble.appendChild(img);

    const caption = document.createElement('div');
    caption.className = 'ai-text image-caption';
    caption.textContent = `${style} avatar — "${seed}"`;
    bubble.appendChild(caption);

    const meta = document.createElement('div'); meta.className = 'meta';
    const badge = document.createElement('span'); badge.className = 'meta-badge';
    const b = SOURCE_BADGES.avatar;
    badge.innerHTML = `${b.icon}<span>${b.label}</span>`;
    meta.appendChild(badge);
    meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })));
    bubble.appendChild(meta);

    row.appendChild(bubble);

    const actions = document.createElement('div'); actions.className = 'bubble-actions';
    const dlBtn = document.createElement('button');
    dlBtn.className = 'bact-btn'; dlBtn.title = 'Download avatar (SVG)'; dlBtn.innerHTML = ICONS.download;
    dlBtn.addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = url; a.download = `eka-avatar-${seed}-${Date.now()}.svg`;
      document.body.appendChild(a); a.click(); a.remove();
    });
    actions.appendChild(dlBtn);
    row.appendChild(actions);

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  // Calls the generic tool dispatcher for the avatar tool and renders the result.
  // seed: text to derive the avatar from (e.g. a name); style: DiceBear style name.
  // ══════════════════════════════
  // MODULE 6 — Unified tool-result renderer
  // Used by the auto-router path (/api/chat responses with source:'tool') so
  // tool output renders identically whether triggered by slash-command or by
  // natural-language auto-routing. Mirrors each run*Tool's success branch.
  // ══════════════════════════════
  async function renderToolResult(toolName, data) {
    switch (toolName) {
      case 'generate_avatar': {
        addAvatarBubble(data.url, data.seed, data.style);
        chatHistory.push({ role: 'assistant', content: `[Generated a ${data.style} avatar for: ${data.seed}]` });
        break;
      }
      case 'generate_code': {
        const { code, language: lang, filename, verification } = data;
        const statusLine = verification.passed
          ? `✅ Static check passed — ${verification.detail}`
          : `⚠️ Static check flagged an issue — ${verification.detail}`;
        const md = `\`\`\`${lang}\n${code}\n\`\`\`\n\n${statusLine}\n\n*Note: this is a syntax/structure check only — the code was not executed.*`;
        addBubble(md, 'bot', 'code', false, null, chatHistory.length);
        chatHistory.push({ role: 'assistant', content: md });
        const lastRow = chat.querySelector('.bubble-row.bot:last-of-type');
        const actions = lastRow?.querySelector('.bubble-actions');
        if (actions) {
          const dlBtn = document.createElement('button');
          dlBtn.className = 'bact-btn'; dlBtn.title = `Download ${filename}`; dlBtn.innerHTML = ICONS.download;
          dlBtn.addEventListener('click', () => {
            const blob = new Blob([code], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
          });
          actions.appendChild(dlBtn);
        }
        break;
      }
      case 'generate_diagram': {
        const { mermaid: mermaidCode, prompt, verification } = data;
        await addDiagramBubble(mermaidCode, prompt, verification);
        chatHistory.push({ role: 'assistant', content: `[Generated a diagram for: ${prompt}]\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`` });
        break;
      }
      case 'generate_document': {
        const { markdown, title, doc_type, actual_format, fallback_reason, filename, file_b64, mime } = data;
        let preamble = `**${title}** _(${doc_type || 'document'})_`;
        if (fallback_reason) preamble += `\n\n> ⚠️ ${fallback_reason}`;
        const md = `${preamble}\n\n---\n\n${markdown}`;
        addBubble(md, 'bot', 'document', false, null, chatHistory.length);
        chatHistory.push({ role: 'assistant', content: `[Generated a ${doc_type || ''} document: ${title}]\n\n${markdown}` });
        const lastRow = chat.querySelector('.bubble-row.bot:last-of-type');
        const actions = lastRow?.querySelector('.bubble-actions');
        if (actions) {
          const dlBtn = document.createElement('button');
          dlBtn.className = 'bact-btn'; dlBtn.title = `Download ${filename}`;
          dlBtn.innerHTML = `${ICONS.download}<span style="margin-left:4px;font-size:11px">${(actual_format || 'md').toUpperCase()}</span>`;
          dlBtn.addEventListener('click', () => {
            const blob = b64ToBlob(file_b64, mime);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename;
            document.body.appendChild(a); a.click(); a.remove();
            URL.revokeObjectURL(url);
          });
          actions.appendChild(dlBtn);
        }
        break;
      }
      case 'generate_image': {
        addImageBubble(data.image, data.prompt);
        chatHistory.push({ role: 'assistant', content: `[Generated an image for: ${data.prompt}]` });
        break;
      }
      default:
        addBubble(`Received an unrecognized tool result (${toolName}).`, 'bot');
    }
    autosave();
  }

  async function runAvatarTool(seed, style = 'bottts') {
    addTyping(); isThinking = true; setStatus('thinking');
    try {
      const res = await apiFetch(`${API_BASE}/api/tool/generate_avatar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, style })
      }).then(r => r.json());

      removeTyping(); isThinking = false; setStatus('ready');

      if (res.ok) {
        addAvatarBubble(res.data.url, res.data.seed, res.data.style);
        chatHistory.push({ role: 'assistant', content: `[Generated a ${res.data.style} avatar for: ${res.data.seed}]` });
        autosave();
      } else {
        addBubble(res.error || 'Avatar generation failed — please try again.', 'bot');
      }
    } catch (err) {
      if (handleAbort(err)) return;
      removeTyping(); isThinking = false; setStatus('ready');
      console.error('avatar generation failed:', err);
      addBubble('Something went wrong generating that avatar. Please try again.', 'bot');
    }
  }

  // ══════════════════════════════
  // MODULE 2 — Code Writer & Static Verification
  // Renders the generated code as a normal markdown bubble (so it gets the
  // existing copy-button/syntax-block treatment for free), then appends a
  // Download button + a verification status line.
  // ══════════════════════════════
  // ══════════════════════════════
  // MODULE 3 — Diagram Generator (Mermaid.js)
  // Renders actual SVG diagrams client-side via mermaid.render(), not raw code text.
  // ══════════════════════════════
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict' });
  }
  let mermaidRenderCounter = 0;

  async function addDiagramBubble(mermaidCode, promptText, verification) {
    if (voiceOnly) return;

    const row = document.createElement('div'); row.className = 'bubble-row bot';
    const bubble = document.createElement('div'); bubble.className = 'bubble bot';

    const diagWrap = document.createElement('div');
    diagWrap.className = 'diagram-wrap';
    diagWrap.style.cssText = 'background:#fff;border-radius:10px;padding:12px;overflow:auto';
    bubble.appendChild(diagWrap);

    if (typeof mermaid === 'undefined') {
      diagWrap.textContent = 'Diagram renderer failed to load.';
    } else {
      try {
        const id = `mmd-${Date.now()}-${mermaidRenderCounter++}`;
        const { svg } = await mermaid.render(id, mermaidCode);
        diagWrap.innerHTML = svg;
      } catch (renderErr) {
        diagWrap.innerHTML = '';
        const fallback = document.createElement('pre');
        fallback.textContent = mermaidCode;
        diagWrap.style.background = '';
        diagWrap.appendChild(fallback);
        const warn = document.createElement('div');
        warn.className = 'ai-text';
        warn.style.cssText = 'color:var(--danger,#e55);margin-top:6px;font-size:13px';
        warn.textContent = `⚠️ Mermaid couldn't render this diagram (${renderErr.message || 'syntax error'}). Raw syntax shown above.`;
        bubble.appendChild(warn);
      }
    }

    const caption = document.createElement('div');
    caption.className = 'ai-text image-caption';
    caption.textContent = promptText;
    bubble.appendChild(caption);

    if (verification && !verification.passed) {
      const vWarn = document.createElement('div');
      vWarn.className = 'ai-text';
      vWarn.style.cssText = 'color:var(--warn,#e5a53e);font-size:13px;margin-top:2px';
      vWarn.textContent = `⚠️ ${verification.detail}`;
      bubble.appendChild(vWarn);
    }

    const meta = document.createElement('div'); meta.className = 'meta';
    const badge = document.createElement('span'); badge.className = 'meta-badge';
    const b = SOURCE_BADGES.diagram;
    badge.innerHTML = `${b.icon}<span>${b.label}</span>`;
    meta.appendChild(badge);
    meta.appendChild(document.createTextNode(new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })));
    bubble.appendChild(meta);

    row.appendChild(bubble);

    const actions = document.createElement('div'); actions.className = 'bubble-actions';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'bact-btn'; copyBtn.title = 'Copy Mermaid syntax'; copyBtn.innerHTML = ICONS.copy;
    copyBtn.addEventListener('click', () => navigator.clipboard?.writeText(mermaidCode));
    actions.appendChild(copyBtn);

    const dlBtn = document.createElement('button');
    dlBtn.className = 'bact-btn'; dlBtn.title = 'Download .mmd file'; dlBtn.innerHTML = ICONS.download;
    dlBtn.addEventListener('click', () => {
      const blob = new Blob([mermaidCode], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `eka-diagram-${Date.now()}.mmd`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
    actions.appendChild(dlBtn);
    row.appendChild(actions);

    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;
  }

  // ══════════════════════════════
  // MODULE 5 — Document Generator (md / docx / pdf)
  // Renders the Markdown content as a normal formatted bubble (preview), then
  // attaches a prominent Download button that decodes the base64 file client-side.
  // ══════════════════════════════
  function b64ToBlob(b64, mime) {
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function runDocumentTool(topic, docType = 'report', format = 'md') {
    addTyping(); isThinking = true; setStatus('thinking');
    try {
      const res = await apiFetch(`${API_BASE}/api/tool/generate_document`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ topic, doc_type: docType, format })
      }).then(r => r.json());

      removeTyping(); isThinking = false; setStatus('ready');

      if (!res.ok) {
        addBubble(res.error || 'Document generation failed — please try again.', 'bot');
        return;
      }

      const { markdown, title, actual_format, requested_format, fallback_reason, filename, file_b64, mime } = res.data;
      let preamble = `**${title}** _(${docType})_`;
      if (fallback_reason) preamble += `\n\n> ⚠️ ${fallback_reason}`;
      const md = `${preamble}\n\n---\n\n${markdown}`;

      addBubble(md, 'bot', 'document', false, null, chatHistory.length);
      chatHistory.push({ role: 'assistant', content: `[Generated a ${docType} document: ${title}]\n\n${markdown}` });

      const lastRow = chat.querySelector('.bubble-row.bot:last-of-type');
      const actions = lastRow?.querySelector('.bubble-actions');
      if (actions) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'bact-btn'; dlBtn.title = `Download ${filename}`;
        dlBtn.innerHTML = `${ICONS.download}<span style="margin-left:4px;font-size:11px">${actual_format.toUpperCase()}</span>`;
        dlBtn.addEventListener('click', () => {
          const blob = b64ToBlob(file_b64, mime);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
        });
        actions.appendChild(dlBtn);
      }

      autosave();
    } catch (err) {
      if (handleAbort(err)) return;
      removeTyping(); isThinking = false; setStatus('ready');
      console.error('document generation failed:', err);
      addBubble('Something went wrong generating that document. Please try again.', 'bot');
    }
  }

  async function runDiagramTool(promptText) {
    addTyping(); isThinking = true; setStatus('thinking');
    try {
      const res = await apiFetch(`${API_BASE}/api/tool/generate_diagram`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ prompt: promptText })
      }).then(r => r.json());

      removeTyping(); isThinking = false; setStatus('ready');

      if (!res.ok) {
        addBubble(res.error || 'Diagram generation failed — please try again.', 'bot');
        return;
      }

      const { mermaid: mermaidCode, prompt, verification } = res.data;
      await addDiagramBubble(mermaidCode, prompt, verification);
      chatHistory.push({ role: 'assistant', content: `[Generated a diagram for: ${prompt}]\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`` });
      autosave();
    } catch (err) {
      if (handleAbort(err)) return;
      removeTyping(); isThinking = false; setStatus('ready');
      console.error('diagram generation failed:', err);
      addBubble('Something went wrong generating that diagram. Please try again.', 'bot');
    }
  }

  async function runCodeTool(promptText, language = 'python') {
    addTyping(); isThinking = true; setStatus('thinking');
    try {
      const res = await apiFetch(`${API_BASE}/api/tool/generate_code`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ prompt: promptText, language })
      }).then(r => r.json());

      removeTyping(); isThinking = false; setStatus('ready');

      if (!res.ok) {
        addBubble(res.error || 'Code generation failed — please try again.', 'bot');
        return;
      }

      const { code, language: lang, extension, filename, verification } = res.data;
      const statusLine = verification.passed
        ? `✅ Static check passed — ${verification.detail}`
        : `⚠️ Static check flagged an issue — ${verification.detail}`;
      const md = `\`\`\`${lang}\n${code}\n\`\`\`\n\n${statusLine}\n\n*Note: this is a syntax/structure check only — the code was not executed.*`;

      addBubble(md, 'bot', 'code', false, null, chatHistory.length);
      chatHistory.push({ role: 'assistant', content: md });

      // Attach a download button to the action bar of the bubble just added
      const lastRow = chat.querySelector('.bubble-row.bot:last-of-type');
      const actions = lastRow?.querySelector('.bubble-actions');
      if (actions) {
        const dlBtn = document.createElement('button');
        dlBtn.className = 'bact-btn'; dlBtn.title = `Download ${filename}`; dlBtn.innerHTML = ICONS.download;
        dlBtn.addEventListener('click', () => {
          const blob = new Blob([code], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url; a.download = filename;
          document.body.appendChild(a); a.click(); a.remove();
          URL.revokeObjectURL(url);
        });
        actions.appendChild(dlBtn);
      }

      autosave();
    } catch (err) {
      if (handleAbort(err)) return;
      removeTyping(); isThinking = false; setStatus('ready');
      console.error('code generation failed:', err);
      addBubble('Something went wrong generating that code. Please try again.', 'bot');
    }
  }

  // Rotating status phrases shown while EKA is "thinking" — cycles through
  // increasingly playful/patient copy, and settles on the last one if a reply
  // is taking a genuinely long time.
  const THINKING_PHRASES = ['EKA is thinking', "Let's make magic happen", 'Working on it', 'Still thinking', 'Responding in background'];
  let thinkingPhraseTimer = null;

  function startPhraseRotation(labelEl, phrases, intervalMs = 3200) {
    let i = 0;
    clearInterval(thinkingPhraseTimer);
    thinkingPhraseTimer = setInterval(() => {
      if (i >= phrases.length - 1) { clearInterval(thinkingPhraseTimer); thinkingPhraseTimer = null; return; }
      i++;
      labelEl.classList.add('think-fade-out');
      setTimeout(() => {
        if (!labelEl.isConnected) return;
        labelEl.textContent = phrases[i];
        labelEl.classList.remove('think-fade-out');
      }, 220);
    }, intervalMs);
  }

  function addTyping() {
    setSendMode(true);
    if (voiceOnly) return;
    const t = document.createElement('div'); t.className = 'bubble bot typing'; t.id = 'typingIndicator';
    t.innerHTML = `<div class="think-wave"><span class="think-bar"></span><span class="think-bar"></span><span class="think-bar"></span><span class="think-bar"></span><span class="think-bar"></span></div><span class="think-label">${THINKING_PHRASES[0]}</span>`;
    chat.appendChild(t); chat.scrollTop = chat.scrollHeight;
    startPhraseRotation(t.querySelector('.think-label'), THINKING_PHRASES);
  }
  function removeTyping() {
    if (!activeReveal) setSendMode(false);
    document.getElementById('typingIndicator')?.remove();
    clearInterval(thinkingPhraseTimer); thinkingPhraseTimer = null;
  }

  // Same shell as addTyping, but with a distinct "painting" visual and copy
  // used specifically while an image is being generated.
  const IMAGEGEN_PHRASES = ['Sketching your image', 'Mixing colors', 'Adding light and shadow', 'Almost ready'];
  function addImageGenTyping() {
    setSendMode(true);
    if (voiceOnly) return;
    const t = document.createElement('div'); t.className = 'bubble bot img-generating'; t.id = 'typingIndicator';
    t.innerHTML = `<div class="imggen-frame"><div class="imggen-shimmer"></div><svg class="imggen-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="1.6" fill="currentColor" stroke="none"/><path d="M21 15l-5-5-9 9"/></svg></div><span class="think-label">${IMAGEGEN_PHRASES[0]}</span>`;
    chat.appendChild(t); chat.scrollTop = chat.scrollHeight;
    startPhraseRotation(t.querySelector('.think-label'), IMAGEGEN_PHRASES, 2400);
  }

  // ══════════════════════════════
  // STATUS
  // ══════════════════════════════
  function setStatus(state) {
    const dot = document.querySelector('.hstatus-dot');
    const label = document.querySelector('.header-status');
    if (!dot || !label) return;
    dot.className = 'hstatus-dot' + (state !== 'ready' ? ` ${state}` : '');
    const map = { ready:'Ready', thinking:'Thinking…', speaking:'Speaking…' };
    label.innerHTML = ''; label.appendChild(dot);
    label.appendChild(document.createTextNode(' ' + (map[state] || 'Ready')));
  }

  // ══════════════════════════════
  // STOP RESPONSE — the send button turns into a Stop button while EKA is working
  // (waiting on the model, or revealing the reply). Esc does the same.
  //   • waiting  → the in-flight request is aborted and its reply discarded
  //   • revealing→ the text stops where it is (and history keeps only what was shown)
  // ══════════════════════════════
  const SEND_ICON_HTML = send.innerHTML;
  const STOP_ICON_HTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>';
  let currentAbort = null;
  let silentStop = false;
  let activeReveal = null;

  function setSendMode(stop) {
    const isStop = send.classList.contains('stop');
    if (stop === isStop) return;
    send.classList.toggle('stop', stop);
    send.innerHTML = stop ? STOP_ICON_HTML : SEND_ICON_HTML;
    send.title = stop ? 'Stop response (Esc)' : 'Send';
    send.setAttribute('aria-label', stop ? 'Stop response' : 'Send message');
  }

  function apiFetch(url, opts = {}) {
    if (!hasKey() && /\/api\/(chat|tool\/(generate_code|generate_document|generate_diagram))/.test(url)) {
      showKeyGate(); silentStop = true;
      const e = new Error('no key'); e.name = 'AbortError';
      return Promise.reject(e);                       // handled quietly by handleAbort()
    }
    currentAbort = new AbortController();
    return fetch(url, { ...opts, signal: currentAbort.signal }).then(r => { if (r && r.status === 401) showKeyGate('OpenRouter key needed.'); return r; });
  }

  function addStoppedNote() {
    const n = document.createElement('div');
    n.className = 'bubble-row note-row';
    n.textContent = 'Response stopped';
    chat.appendChild(n);
    chat.scrollTop = chat.scrollHeight;
  }

  function stopGeneration(silent = false) {
    try { speechSynthesis.cancel(); } catch {}
    if (speakingAnim) speakingAnim.style.display = 'none';
    if (activeReveal) activeReveal.stop();
    if (isThinking && currentAbort) { silentStop = silent; currentAbort.abort(); }
  }

  // Call first in every request catch-block: true = it was a user abort and is fully handled.
  function handleAbort(err) {
    if (!err || err.name !== 'AbortError') return false;
    removeTyping(); isThinking = false; setStatus('ready');
    if (!silentStop) addStoppedNote();
    silentStop = false;
    return true;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.querySelector('.modal-overlay.open')) return;
    if (isThinking || activeReveal || ('speechSynthesis' in window && speechSynthesis.speaking)) stopGeneration();
  });

  // Rich extras under a web-search answer: source links, or a note when the web couldn't be reached.
  function webExtras(res) {
    return (bubble) => {
      if (res.web_failed) {
        const n = document.createElement('div');
        n.className = 'web-note';
        n.textContent = "Web search couldn't fetch results just now, so this answer comes from the AI's own knowledge.";
        bubble.appendChild(n);
      }
      if (prefs.showSources && Array.isArray(res.web_sources) && res.web_sources.length) {
        const box = document.createElement('div');
        box.className = 'web-sources';
        const lab = document.createElement('span'); lab.className = 'ws-label'; lab.textContent = 'Sources';
        box.appendChild(lab);
        res.web_sources.slice(0, 5).forEach(src => {
          if (!/^https?:\/\//i.test(src.url || '')) return;      // never render javascript:/data: links
          const a = document.createElement('a');
          a.href = src.url; a.target = '_blank'; a.rel = 'noopener noreferrer';
          a.textContent = (src.title || src.url).slice(0, 80); a.title = src.url;
          box.appendChild(a);
        });
        if (box.children.length > 1) bubble.appendChild(box);
      }
    };
  }

  // ══════════════════════════════
  // SEND MESSAGE
  // ══════════════════════════════
  // Shared: calls /api/chat using the current chatHistory (last entry must be
  // the user's message) and renders the reply. Used by normal sends AND regenerate.
  async function fetchAndRenderReply(imageToSend = null) {
    const lastUser = [...chatHistory].reverse().find(m => m.role === 'user');
    const messageText = lastUser ? lastUser.content : '';

    addTyping(); isThinking = true; setStatus('thinking');
    try {
      // history excludes the message being sent (the backend appends it itself) — no duplicate, fewer tokens
      const prior = (chatHistory.length && chatHistory[chatHistory.length - 1].role === 'user') ? chatHistory.slice(0, -1) : chatHistory;
      const body = {
        message: messageText || 'Please analyse this image.', history: prior, wiki: webSearchEnabled,
        user_name: currentUser?.display_name || '', user_about: currentUser?.about || '',
        style: prefs.style, creativity: prefs.creativity, history_limit: prefs.historyLimit,
        search_results: prefs.searchResults, custom_instructions: prefs.customInstructions,
      };
      if (imageToSend) body.image = imageToSend;

      const res = await apiFetch(`${API_BASE}/api/chat`, {
        method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body: JSON.stringify(body)
      }).then(r => r.json());

      removeTyping(); isThinking = false;
      if (res.needs_key) { setStatus('ready'); showKeyGate(); return; }

      // ── Auto-routed tool result (Module 6) ──
      if (res.source === 'tool' && res.tool_data) {
        setStatus('ready');
        await renderToolResult(res.tool, res.tool_data);
        return;
      }

      const srcLabel = res.source === 'web+ai' ? 'web' : res.source === 'local' ? 'cached' : 'ai';
      chatHistory.push({ role:'assistant', content: res.reply });

      setTimeout(() => {
        addBubble(res.reply, 'bot', srcLabel, true, null, chatHistory.length - 1, webExtras(res));
        setStatus('speaking');
        speak(stripForSpeech(res.reply), () => setStatus('ready'));
        autosave();
      }, 200);
    } catch (err) {
      if (handleAbort(err)) return;
      removeTyping(); isThinking = false; setStatus('ready');
      console.error('fetchAndRenderReply failed:', err);
      addBubble('Something went wrong. Please try again.', 'bot');
    }
  }

  async function sendMessage(text) {
    const cleaned = text.trim();
    if (!cleaned && !attachedImage) return;
    if (isThinking) return;
    if (!hasKey()) { showKeyGate(); return; }       // BYOK is compulsory
    playFx(720, 0.05);
    hideEmptyState();

    // ── Document tool trigger: "/doc <format> <topic>" ──
    // e.g. "/doc pdf project report on Q3 sales" — format defaults to md if omitted/unrecognized.
    const docMatch = cleaned.match(/^\/doc\s+(.+)$/i);
    if (docMatch) {
      const knownFormats = ['md', 'docx', 'pdf'];
      const words = docMatch[1].trim().split(/\s+/);
      let format = 'md', topicWords = words;
      if (words.length > 1 && knownFormats.includes(words[0].toLowerCase())) {
        format = words[0].toLowerCase();
        topicWords = words.slice(1);
      }
      const topic = topicWords.join(' ');
      chatHistory.push({ role: 'user', content: cleaned });
      addBubble(cleaned, 'user', '', false, null, chatHistory.length - 1);
      msg.value = '';
      await runDocumentTool(topic, 'report', format);
      return;
    }

    // ── Diagram tool trigger: "/diagram <description>" ──
    const diagramMatch = cleaned.match(/^\/diagram\s+(.+)$/i);
    if (diagramMatch) {
      const description = diagramMatch[1].trim();
      chatHistory.push({ role: 'user', content: cleaned });
      addBubble(cleaned, 'user', '', false, null, chatHistory.length - 1);
      msg.value = '';
      await runDiagramTool(description);
      return;
    }

    // ── Code tool trigger: "/code <language> <task description>" ──
    // e.g. "/code python write a function to reverse a linked list"
    // If the first word isn't a recognized language, defaults to python and
    // treats the whole remainder as the task.
    const codeMatch = cleaned.match(/^\/code\s+(.+)$/i);
    if (codeMatch) {
      const knownLangs = ['python','javascript','typescript','bash','shell','html','css','java','c','cpp','c++','go','rust','sql','json','yaml','ruby','php','swift','kotlin'];
      const words = codeMatch[1].trim().split(/\s+/);
      let language = 'python', taskWords = words;
      if (words.length > 1 && knownLangs.includes(words[0].toLowerCase())) {
        language = words[0].toLowerCase();
        taskWords = words.slice(1);
      }
      const task = taskWords.join(' ');
      chatHistory.push({ role: 'user', content: cleaned });
      addBubble(cleaned, 'user', '', false, null, chatHistory.length - 1);
      msg.value = '';
      await runCodeTool(task, language);
      return;
    }

    // ── Avatar tool trigger: "/avatar <seed> [style]" ──
    // e.g. "/avatar Rohan" or "/avatar Rohan pixel-art"
    const avatarMatch = cleaned.match(/^\/avatar\s+(.+)$/i);
    if (avatarMatch) {
      const parts = avatarMatch[1].trim().split(/\s+/);
      const knownStyles = ['bottts','avataaars','adventurer','pixel-art','identicon','thumbs','fun-emoji','lorelei','notionists','shapes'];
      let style = 'bottts';
      if (parts.length > 1 && knownStyles.includes(parts[parts.length - 1].toLowerCase())) {
        style = parts.pop().toLowerCase();
      }
      const seed = parts.join(' ');
      chatHistory.push({ role: 'user', content: cleaned });
      addBubble(cleaned, 'user', '', false, null, chatHistory.length - 1);
      msg.value = '';
      await runAvatarTool(seed, style);
      return;
    }

    // ── Image generation mode: the typed text is a prompt, not a chat message ──
    if (imageGenEnabled && !attachedImage) {
      chatHistory.push({ role: 'user', content: cleaned });
      addBubble(cleaned, 'user', '', false, null, chatHistory.length - 1);
      msg.value = '';
      addImageGenTyping(); isThinking = true; setStatus('thinking');

      try {
        const res = await apiFetch(`${API_BASE}/api/image`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: cleaned })
        }).then(r => r.json());

        removeTyping(); isThinking = false; setStatus('ready');

        if (res.image) {
          addImageBubble(res.image, cleaned);
          chatHistory.push({ role: 'assistant', content: `[Generated an image for: ${cleaned}]` });
          autosave();
        } else {
          addBubble(res.error || 'Image generation failed — please try again.', 'bot');
        }
      } catch (err) {
        if (handleAbort(err)) return;
        removeTyping(); isThinking = false; setStatus('ready');
        console.error('image generation failed:', err);
        addBubble('Something went wrong generating that image. Please try again.', 'bot');
      }
      return;
    }

    const imageToSend = attachedImage;
    if (attachedImage) { attachedImage = null; attachPreview.style.display = 'none'; attachBtn.classList.remove('has-file'); }

    chatHistory.push({ role:'user', content: cleaned || '[image attached]' });
    addBubble(cleaned || '', 'user', '', false, imageToSend, chatHistory.length - 1);
    msg.value = '';
    await fetchAndRenderReply(imageToSend);
  }

  // ══════════════════════════════
  // LANGUAGE MAP — app language code → BCP-47 locale for TTS/STT
  // ══════════════════════════════
  const LANG_LOCALE = {
    en: 'en-IN', hi: 'hi-IN', bn: 'bn-IN', ta: 'ta-IN', te: 'te-IN',
    mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN', pa: 'pa-IN',
    ur: 'ur-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP',
    zh: 'zh-CN', ar: 'ar-SA', ru: 'ru-RU', pt: 'pt-PT',
  };
  function detectSpokenLocale(text) {
    if (/[\u0900-\u097F]/.test(text)) return 'hi-IN';
    if (/[\u0980-\u09FF]/.test(text)) return 'bn-IN';
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta-IN';
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te-IN';
    if (/[\u0A80-\u0AFF]/.test(text)) return 'gu-IN';
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn-IN';
    if (/[\u0D00-\u0D7F]/.test(text)) return 'ml-IN';
    if (/[\u0A00-\u0A7F]/.test(text)) return 'pa-IN';
    if (/[\u0600-\u06FF]/.test(text)) return 'ur-IN';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh-CN';
    if (/[\u3040-\u30FF]/.test(text)) return 'ja-JP';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru-RU';
    return 'en-IN';
  }

  // ══════════════════════════════
  // TTS — uses waveform animation
  // ══════════════════════════════
  // Low-level synth call — always speaks (ignores mute), used by the manual
  // per-message speak button. `speak()` below wraps this with the mute check
  // used for auto-play after a reply.
  function synthesizeSpeech(text, { onStart = null, onEnd = null } = {}) {
    if (!text || !('speechSynthesis' in window)) { onEnd?.(); return; }
    speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0; utter.pitch = 1.05;
    const sel = languageToggle.value;
    utter.lang = sel !== 'auto' ? (LANG_LOCALE[sel] || 'en-IN') : detectSpokenLocale(text);
    utter.onstart = () => { speakingAnim.style.display = 'flex'; onStart?.(); };
    utter.onend   = () => { speakingAnim.style.display = 'none'; if (voiceOnly) wakeMicButton.style.display = 'flex'; else msg.focus(); onEnd?.(); };
    utter.onerror = () => { speakingAnim.style.display = 'none'; onEnd?.(); };
    speechSynthesis.speak(utter);
  }
  function speak(text, onEnd = null) {
    if (!text || isMuted) { onEnd?.(); return; }
    if (activeSpeakBtn) { activeSpeakBtn.classList.remove('speaking'); activeSpeakBtn.innerHTML = ICONS.wave; activeSpeakBtn = null; }
    synthesizeSpeech(text, { onEnd });
  }

  // Strip markdown/HTML down to plain speakable text.
  function stripForSpeech(text) {
    return (text || '')
      .replace(/(\*\*|__|[\*_`])/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/[^\p{L}\p{N}\s.,!?]/gu, '')
      .trim();
  }

  // ── Manual per-message speak button — tap to play, tap again to stop ──
  let activeSpeakBtn = null;
  function stopSpeakingBubble() {
    speechSynthesis.cancel();
    speakingAnim.style.display = 'none';
    if (activeSpeakBtn) { activeSpeakBtn.classList.remove('speaking'); activeSpeakBtn.innerHTML = ICONS.wave; }
    activeSpeakBtn = null;
  }
  function toggleSpeakBubble(btn, rawText) {
    if (btn.classList.contains('speaking')) { stopSpeakingBubble(); return; }
    stopSpeakingBubble();
    const clean = stripForSpeech(rawText);
    if (!clean) { showToast("Nothing to read aloud", ICONS.wave); return; }
    btn.innerHTML = ICONS.stopSquare;
    btn.classList.add('speaking');
    activeSpeakBtn = btn;
    synthesizeSpeech(clean, {
      onEnd: () => { if (activeSpeakBtn === btn) { btn.classList.remove('speaking'); btn.innerHTML = ICONS.wave; activeSpeakBtn = null; } }
    });
  }

  // ══════════════════════════════
  // SPEECH RECOGNITION
  // ══════════════════════════════
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR(); recognition.continuous = false; recognition.interimResults = false; recognition.lang = 'en-IN';
    recognition.onstart  = () => { mic.classList.add('mic-active'); micStatus.textContent = 'Listening…'; };
    recognition.onresult = e => { micStatus.textContent = ''; sendMessage(e.results[0][0].transcript); };
    recognition.onend    = () => { mic.classList.remove('mic-active'); micStatus.textContent = ''; if (!voiceOnly) msg.focus(); };
    recognition.onerror  = () => { mic.classList.remove('mic-active'); micStatus.textContent = ''; };
    mic.addEventListener('click', () => {
      const sel = languageToggle.value;
      recognition.lang = sel !== 'auto' ? (LANG_LOCALE[sel] || 'en-IN') : 'en-IN';
      try { recognition.start(); } catch(e){}
    });
    wakeMicButton?.addEventListener('click', () => {
      wakeMicButton.style.display='none';
      const sel = languageToggle.value;
      recognition.lang = sel !== 'auto' ? (LANG_LOCALE[sel] || 'en-IN') : 'en-IN';
      try { recognition.start(); } catch(e){}
    });
  } else { mic.style.display = 'none'; }

  // ══════════════════════════════
  // TOAST
  // ══════════════════════════════
  let toastTimer = null;
  function showToast(message, icon) {
    if (!message) return;
    let t = document.getElementById('eka-toast');
    if (!t) { t = document.createElement('div'); t.id = 'eka-toast'; t.style.cssText = `position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:rgba(30,20,32,0.97);border:1px solid rgba(201,168,76,0.3);color:#C9A84C;font-family:'Rajdhani',sans-serif;font-size:13px;font-weight:500;padding:9px 20px;border-radius:99px;opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;pointer-events:none;z-index:9999;white-space:nowrap;box-shadow:0 4px 20px rgba(0,0,0,0.5);display:flex;align-items:center;gap:8px;`; document.body.appendChild(t); }
    t.innerHTML = (icon ? `<span class="toast-icon">${icon}</span>` : '') + `<span>${message}</span>`;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(12px)'; }, 2400);
  }

  // ══════════════════════════════
  // EVENT BINDINGS
  // ══════════════════════════════
  chat.addEventListener('click', (e) => { const a = e.target.closest && e.target.closest('a[href]'); if (a && /^https?:/i.test(a.href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; } });
  send.addEventListener('click', () => { if (isThinking || activeReveal) { stopGeneration(); return; } sendMessage(msg.value); });
  msg.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && enterToSend) { e.preventDefault(); sendMessage(msg.value); } });

  // Keyboard viewport fix
  if (window.visualViewport) {
    let lastH = window.visualViewport.height;
    window.visualViewport.addEventListener('resize', () => { const h = window.visualViewport.height; if (lastH - h > 80) requestAnimationFrame(() => { chat.scrollTop = chat.scrollHeight; }); lastH = h; });
    msg.addEventListener('focus', () => { setTimeout(() => { chat.scrollTop = chat.scrollHeight; }, 320); });
  }

  // ══════════════════════════════
  // EMPTY-STATE (centered logo + greeting shown only on an empty chat)
  // ══════════════════════════════
  const emptyState     = document.getElementById('emptyState');
  const emptyStateText = document.getElementById('emptyStateText');

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function updateEmptyStateText() {
    if (!emptyStateText) return;
    const name = currentUser?.display_name;
    emptyStateText.innerHTML = name
      ? `Hello <strong>${escapeHtml(name)}</strong>, how can I help you?`
      : `Hello! How can I help you today?`;
  }

  function showEmptyState() {
    updateEmptyStateText();
    if (emptyState) emptyState.style.display = 'flex';
  }

  function hideEmptyState() {
    if (emptyState) emptyState.style.display = 'none';
  }

  // ══════════════════════════════
  // SCROLL-TO-BOTTOM BUTTON
  // ══════════════════════════════
  const scrollBottomBtn = document.getElementById('scrollBottomBtn');
  if (scrollBottomBtn) {
    chat.addEventListener('scroll', () => {
      const distFromBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight;
      scrollBottomBtn.classList.toggle('show', distFromBottom > 160);
    });
    scrollBottomBtn.addEventListener('click', () => {
      chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
    });
  }

  // ══════════════════════════════
  // INIT
  // ══════════════════════════════
  // Local profile + AI mode (these need the emptyState elements above, so they run here, last)
  renderProfile(readProfile());
  renderModeUI();
  renderVoiceUI();
  // First visit: key gate first (compulsory), then ask for a name once.
  function maybeOnboardName() {
    if (currentUser.display_name || localStorage.getItem('eka-onboarded')) return;
    try { localStorage.setItem('eka-onboarded', '1'); } catch {}
    setTimeout(() => { openModal(userOverlay); profileName?.focus(); }, 600);
  }
  if (!hasKey()) {
    if (localStorage.getItem(GATE_DISMISSED_KEY)) syncKeyBanner();      // returning visitor who chose "later": just the red reminder
    else setTimeout(() => showKeyGate(), 300);                          // brand-new visitor: show the key screen once
  } else maybeOnboardName();
  syncKeyBanner();

  currentSessionId = genId();
  renderSessionList();

  if (chatHistory.length === 0) showEmptyState(); else hideEmptyState();

  msg.focus();

});
