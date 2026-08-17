// ---------- State & Sound Synthesizer ----------
let soundEnabled = false;
let audioCtx = null;

function playTone(freq, type = 'sine', duration = 0.05) {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
}

// Sound toggle button setup
const soundToggle = document.getElementById('sound-toggle');
if (soundToggle) {
  soundToggle.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    soundToggle.classList.toggle('active', soundEnabled);
    soundToggle.innerHTML = soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
    if (soundEnabled) playTone(587.33, 'triangle', 0.1);
    showToast(soundEnabled ? 'Audio effects enabled! 🎵' : 'Audio muted');
  });
}

// Scanlines CRT toggle
const crtToggle = document.getElementById('crt-toggle');
if (crtToggle) {
  crtToggle.addEventListener('click', () => {
    document.body.classList.toggle('no-scanlines');
    const isOff = document.body.classList.contains('no-scanlines');
    crtToggle.classList.toggle('active', !isOff);
    showToast(isOff ? 'CRT Scanlines: OFF' : 'CRT Scanlines: ON');
  });
}

// Matrix Canvas Toggle
let matrixMode = false;
const matrixToggle = document.getElementById('matrix-toggle');
if (matrixToggle) {
  matrixToggle.addEventListener('click', () => {
    matrixMode = !matrixMode;
    matrixToggle.classList.toggle('active', matrixMode);
    showToast(matrixMode ? 'Matrix Rain Mode: ACTIVE 🟢' : 'Particle Node Mode: ACTIVE ⚡');
  });
}

// ---------- Mouse Cursor Light Glow ----------
const glow = document.getElementById('cursor-glow');
if (glow) {
  window.addEventListener('mousemove', (e) => {
    glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
  });
}

// Global Toast helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  playTone(880, 'sine', 0.08);
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// ---------- Interactive Canvas System ----------
const canvas = document.getElementById('bgcanvas');
const ctx = canvas.getContext('2d');
let w, h;
let mousePos = { x: -1000, y: -1000 };
let burstParticles = [];

function resizeCanvas() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

window.addEventListener('mousemove', (e) => {
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
});

// Click particle burst
window.addEventListener('click', (e) => {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14;
    const speed = 2 + Math.random() * 3;
    burstParticles.push({
      x: e.clientX,
      y: e.clientY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 3 + Math.random() * 3
    });
  }
});

// Particles
const chars = ['0', '1', '{', '}', '<', '>', '/', ';', '$', 'bot', 'web', 'git', '⚡'];
const palette = [{ r: 255, g: 176, b: 32 }, { r: 34, g: 211, b: 199 }, { r: 168, g: 85, b: 247 }];
let particles = [];

function initParticles() {
  particles = Array.from({ length: Math.min(80, Math.floor(w / 24)) }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.45,
    vy: 0.15 + Math.random() * 0.4,
    char: chars[Math.floor(Math.random() * chars.length)],
    alpha: 0.18 + Math.random() * 0.3,
    color: palette[Math.floor(Math.random() * palette.length)]
  }));
}
initParticles();

// Matrix mode variables
const dropSize = 16;
let columns = Math.floor(window.innerWidth / dropSize);
let drops = Array(columns).fill(1);

window.addEventListener('resize', () => {
  columns = Math.floor(window.innerWidth / dropSize);
  drops = Array(columns).fill(1);
});

function drawCanvas() {
  ctx.clearRect(0, 0, w, h);

  if (matrixMode) {
    // Matrix Rain Animation
    ctx.fillStyle = 'rgba(7, 9, 14, 0.18)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#22d3c7';
    ctx.font = `${dropSize}px IBM Plex Mono, monospace`;

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * dropSize, drops[i] * dropSize);

      if (drops[i] * dropSize > h && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  } else {
    // Particle Node Net + Mouse Interactions
    for (let i = 0; i < particles.length; i++) {
      // Connect nearby particles
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 140) {
          const op = (1 - dist / 140) * 0.14;
          ctx.strokeStyle = `rgba(${a.color.r},${a.color.g},${a.color.b},${op})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      // Connect particle to mouse cursor if close
      const mdx = particles[i].x - mousePos.x;
      const mdy = particles[i].y - mousePos.y;
      const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
      if (mdist < 160) {
        const mop = (1 - mdist / 160) * 0.35;
        ctx.strokeStyle = `rgba(${particles[i].color.r},${particles[i].color.g},${particles[i].color.b},${mop})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
      }
    }

    ctx.font = '13px IBM Plex Mono, monospace';
    particles.forEach(p => {
      ctx.fillStyle = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`;
      ctx.fillText(p.char, p.x, p.y);
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      if (p.x > w + 20) p.x = -20;
      if (p.x < -20) p.x = w + 20;
    });

    // Draw click burst particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const bp = burstParticles[i];
      ctx.fillStyle = `rgba(${bp.color.r},${bp.color.g},${bp.color.b},${bp.alpha})`;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.size, 0, Math.PI * 2);
      ctx.fill();
      bp.x += bp.vx;
      bp.y += bp.vy;
      bp.alpha -= 0.02;
      if (bp.alpha <= 0) burstParticles.splice(i, 1);
    }
  }

  requestAnimationFrame(drawCanvas);
}
drawCanvas();

// ---------- Interactive Terminal Panel ----------
const aboutCode = [
  { t: '<span class="kw">const</span> <span class="fn">dev</span> = {', d: 0 },
  { t: '  name: <span class="str">"Kanha"</span>,', d: 0 },
  { t: '  handle: <span class="str">"kanhaxi"</span>,', d: 0 },
  { t: '  specialties: [<span class="str">"Responsive Websites"</span>, <span class="str">"Telegram Bots"</span>],', d: 0 },
  { t: '  uptime: <span class="str">"99.98%"</span>,', d: 0 },
  { t: '  status: <span class="str">"Available for Hire ⚡"</span>', d: 0 },
  { t: '};', d: 0 }
];

const botCode = [
  { t: '<span class="kw">from</span> telegram.ext <span class="kw">import</span> Application', d: 0 },
  { t: '<span class="kw">async def</span> <span class="fn">start</span>(update, context):', d: 0 },
  { t: '    <span class="kw">await</span> update.message.reply_text(<span class="str">"Hey! Kanha\'s bot live 24/7 🚀"</span>)', d: 0 },
  { t: '', d: 0 },
  { t: '<span class="cm"># Webhook server connected & active</span>', d: 0 }
];

const termBody = document.getElementById('term-body');
let isTyping = false;

async function typeLines(lines) {
  if (!termBody || isTyping) return;
  isTyping = true;
  termBody.innerHTML = '';

  for (let i = 0; i < lines.length; i++) {
    const row = document.createElement('div');
    row.className = 'type-line';
    row.innerHTML = `<span class="ln">${String(i + 1).padStart(2, '0')}</span><span class="content"></span>`;
    termBody.appendChild(row);

    const content = row.querySelector('.content');
    content.innerHTML = lines[i].t;
    playTone(700 + i * 40, 'sine', 0.02);
    await new Promise(r => setTimeout(r, 60));
  }
  isTyping = false;
}

// Tab switches
const tabAbout = document.getElementById('tab-about');
const tabBot = document.getElementById('tab-bot');
const tabCli = document.getElementById('tab-cli');

if (tabAbout) {
  tabAbout.addEventListener('click', () => {
    tabAbout.classList.add('active');
    tabBot.classList.remove('active');
    if (tabCli) tabCli.classList.remove('active');
    typeLines(aboutCode);
  });
}

if (tabBot) {
  tabBot.addEventListener('click', () => {
    tabBot.classList.add('active');
    tabAbout.classList.remove('active');
    if (tabCli) tabCli.classList.remove('active');
    typeLines(botCode);
  });
}

if (tabCli) {
  tabCli.addEventListener('click', () => {
    tabCli.classList.add('active');
    tabAbout.classList.remove('active');
    tabBot.classList.remove('active');
    showCliPrompt();
  });
}

function showCliPrompt() {
  if (!termBody) return;
  termBody.innerHTML = `
    <div class="cm">// Interactive Shell CLI. Type 'help' for commands.</div>
    <div class="type-line"><span class="str">kanhaxi@portfolio</span>:<span class="fn">~</span>$ help</div>
    <div style="color:var(--muted);margin:8px 0;">Available commands: <b style="color:var(--amber)">skills</b>, <b style="color:var(--amber)">projects</b>, <b style="color:var(--amber)">matrix</b>, <b style="color:var(--amber)">ping</b>, <b style="color:var(--amber)">contact</b>, <b style="color:var(--amber)">clear</b></div>
    <div class="cli-input-row">
      <span>kanhaxi@portfolio:~$</span>
      <input type="text" id="cli-input" placeholder="type a command..." autofocus />
    </div>
  `;
  const input = document.getElementById('cli-input');
  if (input) {
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleCliCommand(input.value.trim().toLowerCase());
    });
  }
}

function handleCliCommand(cmd) {
  playTone(600, 'triangle', 0.05);
  if (cmd === 'clear') {
    showCliPrompt();
    return;
  }
  let res = '';
  if (cmd === 'help') res = 'Commands: skills, projects, matrix, ping, contact, clear';
  else if (cmd === 'skills') res = '⚡ Web Dev (HTML, CSS, JS, React, Node), Telegram Bots (Python, Webhooks, Telegram API)';
  else if (cmd === 'projects') res = '📁 Business Landing Pages, Auto-Reply Telegram Bots, Webhook Automations';
  else if (cmd === 'matrix') {
    matrixMode = !matrixMode;
    res = matrixMode ? '🟢 Matrix mode ENABLED' : '⚡ Particle mode ENABLED';
  } else if (cmd === 'ping') res = `🏓 Pong! Latency: ${Math.floor(18 + Math.random() * 12)}ms | Server Status: ONLINE`;
  else if (cmd === 'contact') res = '💬 Telegram: @kanhaxi';
  else res = `command not found: '${cmd}'. Type 'help'`;

  const inputRow = document.querySelector('.cli-input-row');
  if (inputRow) {
    const out = document.createElement('div');
    out.style.color = 'var(--mint)';
    out.style.margin = '4px 0 10px 0';
    out.textContent = `> ${res}`;
    inputRow.before(out);
    const input = document.getElementById('cli-input');
    if (input) input.value = '';
  }
}

// Initial typing
setTimeout(() => typeLines(aboutCode), 400);

// ---------- Interactive Telegram Bot Simulator ----------
const tgChatBody = document.getElementById('tg-chat-body');
const tgMsgInput = document.getElementById('tg-msg-input');
const tgSendBtn = document.getElementById('tg-send-btn');

function appendTgMessage(text, isUser = false) {
  if (!tgChatBody) return;
  const msg = document.createElement('div');
  msg.className = `tg-msg ${isUser ? 'user' : 'bot'}`;
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  msg.innerHTML = `${text}<div class="tg-msg-time">${timeStr}</div>`;
  tgChatBody.appendChild(msg);
  tgChatBody.scrollTop = tgChatBody.scrollHeight;
  playTone(isUser ? 500 : 750, 'sine', 0.04);
}

function processTgCommand(cmd) {
  appendTgMessage(cmd, true);

  setTimeout(() => {
    let reply = '';
    const lower = cmd.toLowerCase();
    if (lower.includes('/start') || lower.includes('hello') || lower.includes('hi')) {
      reply = `👋 Hey there! Welcome to <b>kanhaxi Telegram Bot Simulator</b>.<br><br>What would you like to explore?<br>• 🚀 Services<br>• ⚡ Speed Test<br>• 📋 Custom Quote<br>• 📞 Direct Contact`;
    } else if (lower.includes('service') || lower.includes('build')) {
      reply = `⚡ <b>My Core Services:</b><br>1️⃣ High-performance Websites & Portfolios<br>2️⃣ 24/7 Live Telegram Bots (Group moderation, Shop bots, Auto-replies, Webhooks)`;
    } else if (lower.includes('speed') || lower.includes('uptime')) {
      reply = `📊 <b>Bot Health Check:</b><br>• Status: 🟢 ACTIVE<br>• Latency: 22ms<br>• Server Uptime: 99.98%<br>• Response Time: &lt; 0.2s`;
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('quote')) {
      reply = `⚡ Every project is tailored to your exact needs. Use the project builder below or drop a DM to <a href="https://t.me/kanhaxi" target="_blank" style="color:var(--amber);text-decoration:underline">@kanhaxi</a> on Telegram for a custom quote!`;
    } else if (lower.includes('contact') || lower.includes('kanha')) {
      reply = `💬 Direct Telegram: <a href="https://t.me/kanhaxi" target="_blank" style="color:var(--amber);text-decoration:underline">@kanhaxi</a>. Drop me a DM anytime!`;
    } else {
      reply = `🤖 Bot received: "<i>${cmd}</i>"<br><br>Kanha can customize bots to process custom database queries, payment integrations, or webhooks!`;
    }
    appendTgMessage(reply, false);
  }, 500);
}

if (tgSendBtn && tgMsgInput) {
  tgSendBtn.addEventListener('click', () => {
    const val = tgMsgInput.value.trim();
    if (val) {
      processTgCommand(val);
      tgMsgInput.value = '';
    }
  });

  tgMsgInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const val = tgMsgInput.value.trim();
      if (val) {
        processTgCommand(val);
        tgMsgInput.value = '';
      }
    }
  });
}

// Quick Reply Telegram buttons
document.querySelectorAll('.tg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.getAttribute('data-action') || btn.textContent;
    processTgCommand(action);
  });
});

// ---------- Project Filter System ----------
const filterBtns = document.querySelectorAll('.filter-btn');
const workCards = document.querySelectorAll('.work-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const category = btn.getAttribute('data-filter');
    playTone(550, 'sine', 0.03);

    workCards.forEach(card => {
      if (category === 'all' || card.getAttribute('data-category') === category) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// ---------- Project Estimator Calculator ----------
let selectedType = 'web';
let selectedFeatures = ['responsive'];

document.querySelectorAll('#type-select .opt-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('#type-select .opt-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedType = card.getAttribute('data-type');
    calculateEstimate();
    playTone(620, 'sine', 0.03);
  });
});

document.querySelectorAll('#feature-select .opt-card').forEach(card => {
  card.addEventListener('click', () => {
    card.classList.toggle('selected');
    const feat = card.getAttribute('data-feat');
    if (card.classList.contains('selected')) {
      if (!selectedFeatures.includes(feat)) selectedFeatures.push(feat);
    } else {
      selectedFeatures = selectedFeatures.filter(f => f !== feat);
    }
    calculateEstimate();
    playTone(680, 'sine', 0.03);
  });
});

function calculateEstimate() {
  let days = selectedType === 'full' ? 5 : 3;

  selectedFeatures.forEach(f => {
    if (f === 'database') { days += 1; }
    if (f === 'hosting') { days += 0; }
    if (f === 'admin') { days += 2; }
    if (f === 'express') { days = Math.max(1, days - 2); }
  });

  const scopeEl = document.getElementById('calc-scope-val');
  const timeEl = document.getElementById('calc-time-val');
  const tgOrderBtn = document.getElementById('tg-order-link');

  const typeName = selectedType === 'web' ? 'Website' : selectedType === 'bot' ? 'Telegram Bot' : 'Web + Bot Integration';
  if (scopeEl) scopeEl.textContent = `${typeName}`;
  if (timeEl) timeEl.textContent = `~${days} Days Estimated`;

  if (tgOrderBtn) {
    const msg = encodeURIComponent(`Hey Kanha! I'd like a custom quote for a project.\nType: ${typeName}\nFeatures: ${selectedFeatures.join(', ')}\nEstimated Timeline: ${days} Days`);
    tgOrderBtn.href = `https://t.me/kanhaxi?text=${msg}`;
  }
}
calculateEstimate();

// ---------- Scroll Reveal Observer ----------
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('show');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => io.observe(el));
