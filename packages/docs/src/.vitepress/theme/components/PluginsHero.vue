<script setup lang="ts"></script>

<template>
    <section class="rt-hero">
        <div class="rt-hero-inner">
            <p class="rt-hero-eyebrow">
                routup ecosystem
            </p>
            <h1 class="rt-hero-title">
                <span class="rt-hero-title-grad">Plugins</span> for routup
            </h1>
            <p class="rt-hero-tagline">
                A small, focused set of plugins for the
                <a
                    href="https://routup.dev"
                    class="rt-hero-link"
                >routup</a> HTTP router —
                request parsing, decorators, rate limiting, OpenAPI generation, metrics, i18n.
                Each ships independently, follows the same Web-Standards conventions, and weighs
                only what it needs to.
            </p>
            <div class="rt-hero-actions">
                <a
                    class="rt-btn rt-btn-primary"
                    href="#all-plugins"
                >Browse all plugins</a>
                <a
                    class="rt-btn rt-btn-ghost"
                    href="https://github.com/routup/plugins"
                    target="_blank"
                    rel="noopener"
                >View on GitHub</a>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-hero {
    padding: 5rem 1.5rem 3rem;
    background:
        radial-gradient(1200px 600px at 100% 0%, color-mix(in oklab, var(--rt-color-primary-500) 14%, transparent), transparent),
        radial-gradient(800px 400px at 0% 100%, color-mix(in oklab, var(--rt-color-accent-500) 12%, transparent), transparent);
    text-align: center;
}

.rt-hero-inner {
    max-width: 800px;
    margin: 0 auto;
}

.rt-hero-eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.18em;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--rt-color-primary-600);
    margin: 0 0 1rem;
    font-family: ui-monospace, monospace;
}

.rt-hero-title {
    font-size: clamp(2.5rem, 5.5vw, 4rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
    margin: 0 0 1.5rem;
}
.rt-hero-title-grad {
    background: linear-gradient(120deg, var(--rt-color-primary-500), var(--rt-color-accent-500));
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
}

.rt-hero-tagline {
    font-size: 1.125rem;
    line-height: 1.65;
    color: var(--rt-color-fg-muted);
    margin: 0 auto 2rem;
}

.rt-hero-link {
    color: var(--rt-color-primary-500);
    text-decoration: none;
    font-weight: 600;
}
.rt-hero-link:hover { color: var(--rt-color-primary-600); text-decoration: underline; }

.rt-hero-actions {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.rt-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    border-radius: 0.5rem;
    font-weight: 600;
    font-size: 0.95rem;
    border: 1px solid transparent;
    transition: background-color 120ms, color 120ms, border-color 120ms;
    cursor: pointer;
    text-decoration: none !important;
}

.rt-btn-primary {
    background: var(--rt-color-primary-600);
    color: var(--rt-color-on-primary);
}
.rt-btn-primary:hover { background: var(--rt-color-primary-500); }

.rt-btn-ghost {
    background: transparent;
    color: var(--rt-color-fg);
    border-color: var(--rt-color-border);
}
.rt-btn-ghost:hover {
    background: var(--rt-color-bg-elevated);
    border-color: var(--rt-color-fg-muted);
}
</style>
