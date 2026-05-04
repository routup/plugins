<script setup lang="ts">
interface PluginCategory {
    name: string;
    summary: string;
    plugins: Array<{
        name: string;
        href: string;
        accent: string;
        summary: string;
        bullets: string[];
    }>;
}

const categories: PluginCategory[] = [
    {
        name: 'Bundles',
        summary: 'One install, the things almost every API needs.',
        plugins: [
            {
                name: '@routup/basic',
                href: '/basic/',
                accent: '#7c3aed',
                summary: 'Body, cookie, and query parsing in one router.use() call.',
                bullets: ['Wraps body + cookie + query', 'Re-exports each helper', 'Pairs with decorators'],
            },
        ],
    },
    {
        name: 'Request & response',
        summary: 'Parse what comes in. Serialize what goes out.',
        plugins: [
            {
                name: '@routup/body',
                href: '/body/',
                accent: '#10b981',
                summary: 'JSON, URL-encoded, raw, text, blobs, and decompressed streams.',
                bullets: ['Size limits per type', 'Transparent gzip/brotli', 'Cached on event.store'],
            },
            {
                name: '@routup/cookie',
                href: '/cookie/',
                accent: '#06b6d4',
                summary: 'Cookie parsing + Set-Cookie serialization with all attributes.',
                bullets: ['Full SameSite / Secure / HttpOnly support', 'setRequestCookies for middleware', 'unsetResponseCookie helper'],
            },
            {
                name: '@routup/query',
                href: '/query/',
                accent: '#3b82f6',
                summary: 'Query-string parsing into a typed map, including nested keys.',
                bullets: ['?foo[bar]=1 nesting', 'Cached parse', 'Tree-shakeable helpers'],
            },
            {
                name: '@routup/assets',
                href: '/assets/',
                accent: '#f59e0b',
                summary: 'Static-file serving with cache-control, fallback, and SPA support.',
                bullets: ['SPA fallback', 'Pre-scanned metadata', 'Per-pattern ignores'],
            },
        ],
    },
    {
        name: 'Routing patterns',
        summary: 'Different ways to define handlers.',
        plugins: [
            {
                name: '@routup/decorators',
                href: '/decorators/',
                accent: '#8b5cf6',
                summary: 'Class-based controllers with TypeScript decorators.',
                bullets: ['@DController + method decorators', 'Parameter injection', 'OpenAPI metadata source for @routup/swagger'],
            },
        ],
    },
    {
        name: 'API documentation',
        summary: 'Generate and serve OpenAPI documents.',
        plugins: [
            {
                name: '@routup/swagger',
                href: '/swagger/',
                accent: '#22c55e',
                summary: 'Generator (V2 + V3) plus Swagger UI mountable on any path. Bundles the @trapi/metadata preset that decodes routup decorators.',
                bullets: ['OpenAPI v2 + v3', 'Reads decorator metadata', 'Inline Swagger UI'],
            },
        ],
    },
    {
        name: 'Operations',
        summary: 'Throttle, observe, translate.',
        plugins: [
            {
                name: '@routup/rate-limit',
                href: '/rate-limit/',
                accent: '#ef4444',
                summary: 'Per-client request quotas with pluggable stores.',
                bullets: ['Sliding window', 'Custom keyGenerator / skip', 'In-memory default store'],
            },
            {
                name: '@routup/rate-limit-redis',
                href: '/rate-limit-redis/',
                accent: '#dc2626',
                summary: 'Redis-backed Store for distributed rate-limiting.',
                bullets: ['Shared counters across pods', 'ioredis connection or string', 'Drop-in store replacement'],
            },
            {
                name: '@routup/prometheus',
                href: '/prometheus/',
                accent: '#f97316',
                summary: 'HTTP metrics + a /metrics scrape endpoint for Prometheus.',
                bullets: ['Built-in uptime + requestDuration', 'prom-client default registry', 'Custom metrics auto-exported'],
            },
            {
                name: '@routup/i18n',
                href: '/i18n/',
                accent: '#0ea5e9',
                summary: 'Per-request locale resolution and a translator helper, built on ilingo.',
                bullets: ['ilingo Store interface', 'Accept-Language detection', 'Interpolation + plural support'],
            },
        ],
    },
];
</script>

<template>
    <section
        id="all-plugins"
        class="rt-grid"
    >
        <div class="rt-grid-inner">
            <div
                v-for="cat in categories"
                :key="cat.name"
                class="rt-grid-section"
            >
                <h2 class="rt-grid-section-title">
                    {{ cat.name }}
                </h2>
                <p class="rt-grid-section-sub">
                    {{ cat.summary }}
                </p>
                <div class="rt-grid-cards">
                    <a
                        v-for="p in cat.plugins"
                        :key="p.name"
                        :href="p.href"
                        class="rt-grid-card"
                        :style="{ '--accent': p.accent }"
                    >
                        <h3 class="rt-grid-card-name">{{ p.name }}</h3>
                        <p class="rt-grid-card-summary">{{ p.summary }}</p>
                        <ul class="rt-grid-card-bullets">
                            <li
                                v-for="b in p.bullets"
                                :key="b"
                            >{{ b }}</li>
                        </ul>
                        <span class="rt-grid-card-cta">Read docs →</span>
                    </a>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
.rt-grid {
    padding: 4rem 1.5rem 5rem;
    background: var(--rt-color-bg);
}
.rt-grid-inner {
    max-width: 1152px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 3.5rem;
}

.rt-grid-section-title {
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 0.5rem;
}
.rt-grid-section-sub {
    color: var(--rt-color-fg-muted);
    margin: 0 0 1.5rem;
    font-size: 1rem;
    line-height: 1.5;
}

.rt-grid-cards {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
}
@media (min-width: 640px) { .rt-grid-cards { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 960px) { .rt-grid-cards { grid-template-columns: repeat(3, 1fr); } }

.rt-grid-card {
    --accent: var(--rt-color-primary-500);
    display: flex;
    flex-direction: column;
    padding: 1.5rem;
    border: 1px solid var(--rt-color-border);
    border-top: 3px solid var(--accent);
    border-radius: 0.75rem;
    background: var(--rt-color-bg);
    text-decoration: none !important;
    color: inherit;
    transition: transform 120ms, border-color 120ms;
}
.rt-grid-card:hover {
    transform: translateY(-2px);
    border-color: var(--accent);
}

.rt-grid-card-name {
    font-size: 1.0625rem;
    font-weight: 700;
    margin: 0 0 0.5rem;
    font-family: ui-monospace, monospace;
}

.rt-grid-card-summary {
    font-size: 0.9375rem;
    color: var(--rt-color-fg-muted);
    margin: 0 0 1rem;
    line-height: 1.5;
}

.rt-grid-card-bullets {
    list-style: none;
    padding: 0;
    margin: 0 0 1.25rem;
    flex: 1;
}
.rt-grid-card-bullets li {
    padding: 0.375rem 0;
    font-size: 0.875rem;
    color: var(--rt-color-fg);
    border-bottom: 1px solid var(--rt-color-border-muted);
}
.rt-grid-card-bullets li:last-child { border-bottom: none; }
.rt-grid-card-bullets li::before {
    content: '✓';
    margin-right: 0.5rem;
    color: var(--accent);
    font-weight: 700;
}

.rt-grid-card-cta {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--accent);
}
</style>
