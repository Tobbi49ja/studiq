<script>
  import { theme } from '$lib/stores/theme';
  import { token } from '$lib/stores/auth';
  import { onMount } from 'svelte';

  const features = [
    { icon: '📤', title: 'Upload Notes', text: 'Drop your notes or paste text. Studiq reads, summarises and extracts key topics instantly.' },
    { icon: '🧠', title: 'AI Quiz Engine', text: 'Auto-generates WAEC/JAMB level MCQs from your content. Difficulty adjusts as you improve.' },
    { icon: '📊', title: 'Progress Tracking', text: 'See your weak areas, track mastery per subject and follow a personalised study plan.' },
    { icon: '⚡', title: 'Concept Explainer', text: "Don't understand something? Ask Studiq AI and get a simple clear explanation instantly." },
    { icon: '🃏', title: 'Flashcards', text: 'Auto-generated flashcards from your notes for quick revision sessions before exam day.' },
    { icon: '🎯', title: 'Study Plans', text: 'AI builds a personalised weekly study schedule based on your weak areas and exam date.' }
  ];

  const stats = [
    { value: '6+', label: 'Subjects Supported' },
    { value: 'AI', label: 'AI-Powered' },
    { value: 'Free', label: 'Free to Use' }
  ];

  const contact = [
    { icon: '📧', label: 'Email', value: 'samueltobi040@gmail.com', href: 'mailto:samueltobi040@gmail.com' },
    { icon: '🐦', label: 'Twitter', value: '@devtobbi', href: 'https://twitter.com/devtobbi' },
    { icon: '🌐', label: 'Portfolio', value: 'tobbi-portfolio.onrender.com', href: 'https://tobbi-portfolio.onrender.com/' }
  ];

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
  });

  function toggleTheme() {
    theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }
</script>

<svelte:head>
  <title>Studiq — Study Smarter with AI</title>
</svelte:head>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label="Studiq home">
      <img src="/logo/studiq-logo.png" alt="Studiq" class="brand-logo" onerror={(e) => (e.target.style.display = 'none')} />
    </a>

    <div class="nav-links">
      <a href="#about" onclick={(e) => { e.preventDefault(); scrollTo('about'); }}>Features</a>
      <a href="#about-us" onclick={(e) => { e.preventDefault(); scrollTo('about-us'); }}>About</a>
      <a href="#contact" onclick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Contact</a>
    </div>

    <div class="nav-actions">
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {$theme === 'dark' ? '☀️' : '🌙'}
      </button>
      {#if $token}
        <a href="/" class="solid-btn">Go to Dashboard →</a>
      {:else}
        <a href="/login" class="ghost-btn">Login</a>
        <a href="/register" class="solid-btn">Get Started →</a>
      {/if}
    </div>
  </div>
</nav>

<main>
  <!-- SECTION 1 — Hero -->
  <section class="hero">
    <h1 class="hero-title">Study Smarter with AI</h1>
    <p class="hero-sub">Studiq helps WAEC &amp; JAMB students upload notes, generate quizzes, track progress and master every topic.</p>
    <div class="hero-cta">
      {#if $token}
        <a class="cta-solid" href="/">Go to Dashboard →</a>
        <button class="cta-ghost" onclick={() => scrollTo('about')}>Learn More</button>
      {:else}
        <a class="cta-solid" href="/register">Get Started →</a>
        <button class="cta-ghost" onclick={() => scrollTo('about')}>Learn More</button>
      {/if}
    </div>
  </section>

  <!-- SECTION 2 — Features -->
  <section id="about" class="section">
    <h2 class="section-title">Everything you need to ace your exams</h2>
    <p class="section-sub">Powerful AI tools for WAEC &amp; JAMB preparation</p>
    <div class="feature-grid">
      {#each features as f}
        <div class="feature-card">
          <div class="feature-icon">{f.icon}</div>
          <h3 class="feature-title">{f.title}</h3>
          <p class="feature-text">{f.text}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- SECTION 3 — About -->
  <section id="about-us" class="section about">
    <div class="about-col">
      <h2 class="section-title">Built for Nigerian Students</h2>
      <p class="about-text">Studiq was built for the AI BuildFest 2026 Track 3 challenge. It is a free AI-powered study companion designed to help secondary school and university students in Nigeria study more effectively, understand difficult concepts, and track their academic progress in real time.</p>
    </div>
    <div class="about-stats">
      {#each stats as s}
        <div class="about-stat">
          <div class="about-value">{s.value}</div>
          <div class="about-label">{s.label}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- SECTION 4 — Contact -->
  <section id="contact" class="section">
    <div class="contact-card">
      <h2 class="section-title">Get in Touch</h2>
      <p class="section-sub">Questions, feedback or partnership inquiries</p>
      <div class="contact-list">
        {#each contact as c}
          <a class="contact-item" href={c.href} target={c.href.startsWith('mailto') ? '' : '_blank'} rel="noopener">
            <span class="contact-icon">{c.icon}</span>
            <span class="contact-label">{c.label}:</span>
            <span class="contact-value">{c.value}</span>
          </a>
        {/each}
      </div>
    </div>
  </section>
</main>

<!-- SECTION 5 — Footer -->
<footer class="footer">
  <div class="footer-brand">
    <img src="/logo/studiq-logo.png" alt="Studiq" class="footer-logo" onerror={(e) => (e.target.style.display = 'none')} />
  </div>
  <div class="footer-line">
    <span>Built by </span>
    <a href="https://tobbi-portfolio.onrender.com/" target="_blank" rel="noopener" class="tobbi-link">tobbi →</a>
  </div>
</footer>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 40;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
  }
  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 14px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
  }
  .brand-logo {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  :global([data-theme="dark"]) .brand-logo {
    filter: brightness(0) invert(1) brightness(1.4) saturate(0.6);
  }
  .nav-links {
    display: flex;
    gap: 24px;
  }
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    transition: color 0.15s;
  }
  .nav-links a:hover { color: var(--text); }
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .theme-toggle {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    font-size: 16px;
    cursor: pointer;
  }
  .ghost-btn,
  .solid-btn {
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    padding: 9px 18px;
    border-radius: 10px;
    transition: opacity 0.15s;
  }
  .ghost-btn {
    color: var(--text);
    border: 1px solid var(--border);
    background: transparent;
  }
  .solid-btn {
    color: #fff;
    background: var(--blue);
  }
  .ghost-btn:hover, .solid-btn:hover { opacity: 0.85; }

  main { background: var(--bg); }

  /* Hero */
  .hero {
    min-height: calc(100vh - 67px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 48px 24px;
  }
  .hero-title {
    font-size: 48px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--text);
    margin: 0 0 16px;
  }
  .hero-sub {
    font-size: 18px;
    color: var(--muted);
    max-width: 560px;
    line-height: 1.6;
    margin: 0 0 32px;
  }
  .hero-cta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .cta-solid,
  .cta-ghost {
    font-size: 15px;
    font-weight: 700;
    padding: 13px 26px;
    border-radius: 12px;
    text-decoration: none;
    cursor: pointer;
  }
  .cta-solid { background: var(--blue); color: #fff; }
  .cta-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }

  /* Sections */
  .section {
    max-width: 1280px;
    margin: 0 auto;
    padding: 64px 24px;
  }
  .section-title {
    font-size: 32px;
    font-weight: 800;
    color: var(--text);
    text-align: center;
    margin: 0 0 8px;
  }
  .section-sub {
    font-size: 15px;
    color: var(--muted);
    text-align: center;
    margin: 0 0 40px;
  }
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
  }
  .feature-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 28px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .feature-card:hover {
    border-color: var(--blue);
    transform: translateY(-3px);
  }
  .feature-icon { font-size: 30px; margin-bottom: 14px; }
  .feature-title {
    font-size: 17px;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 8px;
  }
  .feature-text {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
  }

  /* About */
  .about {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
  }
  .about .section-title { text-align: left; }
  .about-text {
    font-size: 16px;
    line-height: 1.7;
    color: var(--muted);
    margin: 0;
  }
  .about-stats {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .about-stat {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px 24px;
  }
  .about-value {
    font-size: 26px;
    font-weight: 800;
    color: var(--blue);
  }
  .about-label {
    font-size: 14px;
    color: var(--muted);
    margin-top: 2px;
  }

  /* Contact */
  .contact-card {
    max-width: 620px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px 40px 48px;
  }
  .contact-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 24px;
  }
  .contact-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    font-size: 14px;
    transition: border-color 0.15s;
  }
  .contact-item:hover { border-color: var(--blue); }
  .contact-icon { font-size: 18px; }
  .contact-label { font-weight: 600; color: var(--muted); }
  .contact-value { color: var(--text); word-break: break-word; }

  /* Footer */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px;
    border-top: 1px solid var(--border);
    background: var(--bg);
  }
  .footer-brand {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .footer-logo {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
    display: block;
  }
  :global([data-theme="dark"]) .footer-logo {
    filter: brightness(0) invert(1) brightness(1.4) saturate(0.6);
  }
  .footer-line {
    font-size: 13px;
    color: var(--muted);
  }
  .tobbi-link {
    font-size: 14px;
    font-weight: 700;
    color: var(--green);
    text-decoration: none;
    margin-left: 4px;
  }

  @media (max-width: 1024px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr); }
  }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .hero-title { font-size: 34px; }
    .hero-sub { font-size: 16px; }
    .feature-grid { grid-template-columns: 1fr; }
    .about { grid-template-columns: 1fr; gap: 32px; }
    .section { padding: 48px 20px; }
    .nav-inner { padding: 12px 16px; }
  }

  @media (max-width: 425px) {
    .ghost-btn { display: none; }
    .hero-title { font-size: 28px; }
    .contact-card { padding: 28px 20px; }
    .footer { flex-direction: column; gap: 10px; text-align: center; }
  }
</style>