<script>
  import { theme } from '$lib/stores/theme';
  import { token } from '$lib/stores/auth';
  import { onMount } from 'svelte';
  import Icon from '$lib/components/Icon.svelte';
  import { api } from '$lib/api/index.js';
  import gsap from 'gsap';
  import { ScrollTrigger } from 'gsap/ScrollTrigger';

  gsap.registerPlugin(ScrollTrigger);

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

  let contact = $state([
    { icon: 'ask', label: 'Email', value: 'samueltobi040@gmail.com', href: 'mailto:samueltobi040@gmail.com', type: 'email' }
  ]);

  // Contact form state
  let formData = $state({ name: '', email: '', message: '' });
  let formLoading = $state(false);
  let formSuccess = $state(false);
  let formError = $state('');

  async function loadContactSettings() {
    try {
      const { data } = await api.get('/settings');
      const c = data.data?.contact || data.data || {};
      const items = [];
      
      if (c.email) items.push({ icon: 'ask', label: 'Email', value: c.email, href: `mailto:${c.email}`, type: 'email' });
      if (c.whatsapp) {
        const waLink = c.whatsapp.startsWith('http') ? c.whatsapp : `https://wa.me/${c.whatsapp.replace(/\D/g, '')}`;
        items.push({ icon: 'sparkles', label: 'WhatsApp', value: 'WhatsApp', href: waLink, type: 'whatsapp' });
      }
      if (c.linkedin) {
        const liLink = c.linkedin.startsWith('http') ? c.linkedin : `https://linkedin.com/in/${c.linkedin}`;
        items.push({ icon: 'user', label: 'LinkedIn', value: 'LinkedIn', href: liLink, type: 'linkedin' });
      }
      if (c.twitter) {
        const twLink = c.twitter.startsWith('http') ? c.twitter : `https://twitter.com/${c.twitter.replace('@', '')}`;
        items.push({ icon: 'sparkles', label: 'Twitter / X', value: 'Twitter / X', href: twLink, type: 'twitter' });
      }
      if (c.portfolio) {
        const poLink = c.portfolio.startsWith('http') ? c.portfolio : `https://${c.portfolio}`;
        items.push({ icon: 'chart', label: 'Portfolio', value: 'Portfolio', href: poLink, type: 'portfolio' });
      }
      if (items.length) contact = items;
    } catch {
      // Use default
    }
  }

  async function submitContact(e) {
    e.preventDefault();
    formError = '';
    formLoading = true;
    
    if (!formData.name || !formData.email || !formData.message) {
      formError = 'Please fill in all fields';
      formLoading = false;
      return;
    }

    try {
      await api.post('/contact', {
        name: formData.name,
        email: formData.email,
        message: formData.message
      });
      formSuccess = true;
      formData = { name: '', email: '', message: '' };
      setTimeout(() => { formSuccess = false; }, 5000);
    } catch (err) {
      formError = err?.response?.data?.error || 'Failed to send message. Please try again.';
    } finally {
      formLoading = false;
    }
  }

  onMount(() => {
    document.documentElement.setAttribute('data-theme', $theme);
    loadContactSettings();
    
    // Scroll-triggered animations for feature cards
    gsap.fromTo('.feature-card', 
      { opacity: 0, y: 40 },
      { 
        opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.feature-grid', start: 'top 85%' }
      }
    );

    gsap.fromTo('.about-stat',
      { opacity: 0, x: 30 },
      {
        opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: '.about-stats', start: 'top 85%' }
      }
    );

    gsap.fromTo('.contact-card',
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '.contact-card', start: 'top 85%' }
      }
    );

    // Handle hash navigation
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
    <div class="contact-grid">
      <!-- Left: Form -->
      <div class="contact-card">
        <h2 class="section-title text-left">Get in Touch</h2>
        <p class="section-sub text-left">Have questions or feedback? Send us a message.</p>
        
        {#if formSuccess}
          <div class="form-success">
            <Icon name="check" size={18} />
            <span>Message sent successfully! We'll get back to you soon.</span>
          </div>
        {:else}
          <form onsubmit={submitContact} class="contact-form">
            <div class="form-row">
              <div class="form-field">
                <label for="contact-name">Your Name</label>
                <input id="contact-name" type="text" bind:value={formData.name} placeholder="John Doe" required />
              </div>
              <div class="form-field">
                <label for="contact-email">Email Address</label>
                <input id="contact-email" type="email" bind:value={formData.email} placeholder="you@example.com" required />
              </div>
            </div>
            <div class="form-field">
              <label for="contact-message">Message</label>
              <textarea id="contact-message" bind:value={formData.message} placeholder="Tell us what's on your mind..." rows="4" required></textarea>
            </div>
            {#if formError}
              <div class="form-error">{formError}</div>
            {/if}
            <button type="submit" class="btn-primary submit-btn" disabled={formLoading}>
              {#if formLoading}
                <span class="spinner"></span> Sending...
              {:else}
                Send Message
              {/if}
            </button>
          </form>
        {/if}
      </div>

      <!-- Right: Social Links -->
      <div class="contact-social">
        <h3 class="social-title">Connect With Us</h3>
        <p class="social-sub">Reach out on any of these platforms</p>
        <div class="social-list">
          {#each contact as c}
            <a class="social-item" href={c.href} target={c.href.startsWith('mailto') ? '' : '_blank'} rel="noopener" title={c.label}>
              <span class="social-icon"><Icon name={c.icon} size={20} /></span>
              <span class="social-label">{c.label}</span>
              <span class="social-arrow">→</span>
            </a>
          {/each}
        </div>
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
  .contact-grid {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 32px;
    max-width: 1100px;
    margin: 0 auto;
  }

  .contact-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 40px;
  }

  .contact-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 24px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .form-field label {
    font-size: 12.5px;
    font-weight: 600;
    color: var(--muted);
  }

  .form-field input,
  .form-field textarea {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    color: var(--text);
    font-size: 14px;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }

  .form-field input:focus,
  .form-field textarea:focus {
    outline: none;
    border-color: var(--blue);
    box-shadow: 0 0 0 3px var(--blue-light);
  }

  .form-field textarea {
    resize: vertical;
    min-height: 100px;
  }

  .submit-btn {
    padding: 14px 24px;
    font-size: 14px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .form-success {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px;
    background: var(--green-light);
    color: var(--green);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-top: 24px;
  }

  .form-error {
    font-size: 13px;
    color: var(--red);
    font-weight: 500;
  }

  /* Social Links */
  .contact-social {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 40px;
    background: linear-gradient(135deg, var(--card), color-mix(in srgb, var(--card) 95%, var(--blue)));
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }

  .social-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .social-sub {
    font-size: 14px;
    color: var(--muted);
    margin: 0;
  }

  .social-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
  }

  .social-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    color: var(--text);
    font-size: 14px;
    font-weight: 600;
    transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;
  }

  .social-item:hover {
    border-color: var(--blue);
    transform: translateX(4px);
    box-shadow: 0 4px 12px -4px rgba(79, 70, 229, 0.15);
  }

  .social-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--blue-light);
    color: var(--blue);
    border-radius: 8px;
    flex-shrink: 0;
  }

  .social-label {
    flex: 1;
  }

  .social-arrow {
    color: var(--muted);
    transition: transform 0.15s;
  }

  .social-item:hover .social-arrow {
    transform: translateX(4px);
    color: var(--blue);
  }

  @media (max-width: 1024px) {
    .feature-grid { grid-template-columns: repeat(2, 1fr); }
    .contact-grid { grid-template-columns: 1fr; }
  }

  @media (max-width: 768px) {
    .nav-links { display: none; }
    .hero-title { font-size: 40px; }
    .hero-sub { font-size: 15px; }
    .feature-grid { grid-template-columns: 1fr; }
    .about { grid-template-columns: 1fr; gap: 36px; }
    .section { padding: 56px 20px; }
    .nav-inner { padding: 14px 16px; }
    .contact-card, .contact-social { padding: 28px; }
    .form-row { grid-template-columns: 1fr; }
  }

  @media (max-width: 425px) {
    .ghost-btn { display: none; }
    .hero-title { font-size: 32px; }
    .footer { flex-direction: column; gap: 16px; text-align: center; }
    .contact-card, .contact-social { padding: 24px 20px; }
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