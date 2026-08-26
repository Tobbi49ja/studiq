<script>
  import { theme } from '$lib/stores/theme';
  import { token } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';

  const features = [
    { icon: 'upload', title: 'Upload Notes', text: 'Drop your notes or paste text. Studiq reads, summarises and extracts key topics instantly.' },
    { icon: 'quiz', title: 'AI Quiz Engine', text: 'Auto-generates WAEC/JAMB level MCQs from your content. Difficulty adjusts as you improve.' },
    { icon: 'performance', title: 'Progress Tracking', text: 'See your weak areas, track mastery per subject and follow a personalised study plan.' },
    { icon: 'ask', title: 'Concept Explainer', text: "Don't understand something? Ask Studiq AI and get a simple clear explanation instantly." },
    { icon: 'flashcards', title: 'Flashcards', text: 'Auto-generated flashcards from your notes for quick revision sessions before exam day.' },
    { icon: 'settings', title: 'Study Plans', text: 'AI builds a personalised weekly study schedule based on your weak areas and exam date.' }
  ];

  const stats = [
    { value: '6+', label: 'Subjects Supported' },
    { value: 'AI', label: 'AI-Powered' },
    { value: 'Free', label: 'Free to Use' }
  ];

  const contact = [
    { icon: 'ask', label: 'Email', value: 'samueltobi040@gmail.com', href: 'mailto:samueltobi040@gmail.com' },
    { icon: 'performance', label: 'Twitter', value: '@devtobbi', href: 'https://twitter.com/devtobbi' },
    { icon: 'chart', label: 'Portfolio', value: 'tobbi-portfolio.onrender.com', href: 'https://tobbi-portfolio.onrender.com/' }
  ];

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
    // Handle hash navigation (e.g., from footer links)
    const hash = window.location.hash.slice(1);
    if (hash) {
      setTimeout(() => scrollTo(hash), 100);
    }
  });

  function toggleTheme() {
    theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      const navHeight = 70;
      const top = el.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function handleLogoError(e) {
    e.target.style.display = 'none';
  }
</script>

<svelte:head>
  <title>Studiq — Study Smarter with AI</title>
</svelte:head>

<nav class="nav">
  <div class="nav-inner">
    <a href="/" class="brand" aria-label="Studiq home">
      <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} />
    </a>

    <div class="nav-links">
      <a href="#about" onclick={(e) => { e.preventDefault(); scrollTo('about'); }}>Features</a>
      <a href="#about-us" onclick={(e) => { e.preventDefault(); scrollTo('about-us'); }}>About</a>
      <a href="#contact" onclick={(e) => { e.preventDefault(); scrollTo('contact'); }}>Contact</a>
    </div>

    <div class="nav-actions">
      <button class="theme-toggle" onclick={toggleTheme} aria-label="Toggle theme">
        {#if $theme === 'dark'}
          <Icon name="sun" size={16} />
        {:else}
          <Icon name="moon" size={16} />
        {/if}
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
    <div class="hero-tag">✦ Smart Learning Platform</div>
    <h1 class="hero-title">Study Smarter<br />with the power of AI</h1>
    <p class="hero-sub">Studiq helps WAEC &amp; JAMB students upload notes, auto-generate quizzes, review flashcards, track performance and master every academic topic.</p>
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
    <p class="section-sub">Powerful, state-of-the-art study tools for WAEC &amp; JAMB preparation</p>
    <div class="feature-grid">
      {#each features as f}
        <div class="feature-card">
          <div class="feature-icon-wrapper">
            <Icon name={f.icon} size={20} />
          </div>
          <h3 class="feature-title">{f.title}</h3>
          <p class="feature-text">{f.text}</p>
        </div>
      {/each}
    </div>
  </section>

  <!-- SECTION 3 — About -->
  <section id="about-us" class="section about">
    <div class="about-col">
      <div class="about-badge">ABOUT STUDIQ</div>
      <h2 class="section-title text-left">Built for Nigerian Students</h2>
      <p class="about-text">Studiq was built for the AI BuildFest 2026 challenge. It is a free, high-performance study companion designed to help secondary school and university students in Nigeria study effectively, break down difficult concepts, and track their test scores in real time.</p>
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
            <span class="contact-icon"><Icon name={c.icon} size={15} /></span>
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
    <img src="/logo/studiq-logo.png" alt="Studiq" onerror={handleLogoError} />
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
    backdrop-filter: blur(8px);
  }
  
  .nav-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  
  .brand {
    text-decoration: none;
    display: flex;
    align-items: center;
  }
  .brand img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .nav-links {
    display: flex;
    gap: 28px;
  }
  
  .nav-links a {
    color: var(--muted);
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    transition: color 0.15s;
  }
  
  .nav-links a:hover { 
    color: var(--text); 
  }
  
  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .theme-toggle {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--card);
    color: var(--text);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
  }
  
  .theme-toggle:hover {
    border-color: var(--blue);
    color: var(--blue);
  }
  
  .ghost-btn,
  .solid-btn {
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    transition: background 0.15s, opacity 0.15s;
  }
  
  .ghost-btn {
    color: var(--text);
    border: 1px solid var(--border);
    background: transparent;
  }
  
  .ghost-btn:hover {
    background: var(--card);
    border-color: var(--blue);
  }
  
  .solid-btn {
    color: #ffffff !important;
    background: var(--blue);
  }
  
  .solid-btn:hover { 
    opacity: 0.95; 
  }

  main { 
    background: var(--bg); 
  }

  /* Hero */
  .hero {
    min-height: calc(100vh - 70px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 80px 24px;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .hero-tag {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.05em;
    color: var(--blue);
    background: var(--blue-light);
    padding: 6px 12px;
    border-radius: 99px;
    margin-bottom: 24px;
    text-transform: uppercase;
  }
  
  .hero-title {
    font-size: 54px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.03em;
    color: var(--text);
    margin-bottom: 20px;
    background: linear-gradient(135deg, var(--text) 70%, var(--blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .hero-sub {
    font-size: 17px;
    color: var(--muted);
    max-width: 580px;
    line-height: 1.6;
    margin-bottom: 36px;
    font-weight: 500;
  }
  
  .hero-cta {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .cta-solid,
  .cta-ghost {
    font-size: 14px;
    font-weight: 600;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.15s;
  }
  
  .cta-solid { 
    background: var(--blue); 
    color: #ffffff; 
  }
  .cta-solid:hover {
    opacity: 0.95;
  }
  
  .cta-ghost {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }
  
  .cta-ghost:hover {
    background: var(--card);
    border-color: var(--blue);
  }

  /* Sections */
  .section {
    max-width: 1280px;
    margin: 0 auto;
    padding: 80px 24px;
  }
  
  .section-title {
    font-size: 32px;
    font-weight: 800;
    color: var(--text);
    text-align: center;
    margin-bottom: 12px;
    letter-spacing: -0.02em;
  }
  
  .section-title.text-left {
    text-align: left;
  }
  
  .section-sub {
    font-size: 15px;
    color: var(--muted);
    text-align: center;
    margin-bottom: 48px;
    font-weight: 500;
  }
  
  .feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }
  
  .feature-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 32px;
    transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s;
  }
  
  .feature-card:hover {
    border-color: var(--blue);
    transform: translateY(-4px);
    box-shadow: 0 10px 30px -10px rgba(79, 70, 229, 0.15);
  }
  
  .feature-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--blue-light);
    color: var(--blue);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }
  
  .feature-title {
    font-size: 16.5px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 10px;
  }
  
  .feature-text {
    font-size: 13.5px;
    color: var(--muted);
    line-height: 1.6;
    margin: 0;
    font-weight: 500;
  }

  /* About Us */
  .about {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 64px;
    align-items: center;
  }
  
  .about-badge {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: var(--blue);
    margin-bottom: 8px;
  }
  
  .about-text {
    font-size: 15px;
    line-height: 1.7;
    color: var(--muted);
    margin-top: 16px;
    font-weight: 500;
  }
  
  .about-stats {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .about-stat {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .about-value {
    font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: var(--blue);
    line-height: 1;
  }
  
  .about-label {
    font-size: 14px;
    color: var(--muted);
    font-weight: 600;
  }

  /* Contact */
  .contact-card {
    max-width: 680px;
    margin: 0 auto;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 48px;
  }
  
  .contact-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 32px;
  }
  
  .contact-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    text-decoration: none;
    font-size: 13.5px;
    font-weight: 500;
    transition: border-color 0.15s, background 0.15s;
  }
  
  .contact-item:hover { 
    border-color: var(--blue);
    background: var(--card);
  }
  
  .contact-icon { 
    color: var(--blue);
    display: flex;
    align-items: center;
  }
  
  .contact-label { 
    font-weight: 700; 
    color: var(--muted); 
  }
  
  .contact-value { 
    color: var(--text); 
    font-weight: 600;
  }

  /* Footer */
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32px 24px;
    border-top: 1px solid var(--border);
    background: var(--bg);
    max-width: 1280px;
    margin: 0 auto;
  }
  
  .footer-brand {
    display: flex;
    align-items: center;
  }
  .footer-brand img {
    height: 40px;
    width: 60px;
    object-fit: cover;
    border-radius: 8px;
  }
  
  .footer-line {
    font-size: 13px;
    color: var(--muted);
    font-weight: 500;
  }
  
  .tobbi-link {
    font-size: 13.5px;
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
    .hero-title { font-size: 40px; }
    .hero-sub { font-size: 15px; }
    .feature-grid { grid-template-columns: 1fr; }
    .about { grid-template-columns: 1fr; gap: 36px; }
    .section { padding: 56px 20px; }
    .nav-inner { padding: 14px 16px; }
  }

  @media (max-width: 425px) {
    .ghost-btn { display: none; }
    .hero-title { font-size: 32px; }
    .contact-card { padding: 32px 20px; }
    .footer { flex-direction: column; gap: 16px; text-align: center; }
  }
</style>