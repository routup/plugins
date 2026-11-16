<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';

type HeroAction = {
    text: string;
    link: string;
};

type HeroFrontmatter = {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    actions: HeroAction[];
    install: string;
};

const { frontmatter } = useData();

const hero = computed(() => frontmatter.value.hero as HeroFrontmatter);
</script>

<template>
    <RtSection
        surface="dark"
        class="plugins-hero"
    >
        <div class="plugins-hero__body">
            <span class="plugins-hero__eyebrow">{{ hero.eyebrow }}</span>
            <h1 class="plugins-hero__title">
                {{ hero.title }} <span class="plugins-hero__highlight">{{ hero.highlight }}</span>
            </h1>
            <p class="plugins-hero__lede">
                {{ hero.description }}
            </p>
            <div class="plugins-hero__actions">
                <RtButton
                    v-for="(action, index) in hero.actions"
                    :key="action.link"
                    :href="action.link"
                    :variant="index === 0 ? 'primary' : 'ghost'"
                >
                    {{ action.text }}
                </RtButton>
            </div>
            <RtCodePanel
                class="plugins-hero__install"
                :code="hero.install"
            />
        </div>
    </RtSection>
</template>

<style scoped>
.plugins-hero {
    padding: calc(var(--rt-nav-offset, 0px) + 72px) 0 80px;
}

.plugins-hero::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: var(--rt-border-on-dark-strong);
    content: '';
}

.plugins-hero__body {
    display: grid;
    justify-items: start;
    max-width: 720px;
}

.plugins-hero__eyebrow {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 5px 12px;
    border: 1px solid var(--rt-border-on-dark-strong);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.02);
    color: var(--rt-on-dark-muted);
    font-family: var(--rt-font-mono);
    font-size: 12px;
    letter-spacing: 0.02em;
}

.plugins-hero__title {
    margin: 22px 0 0;
    padding: 0;
    border: 0;
    color: var(--rt-on-dark);
    font-size: clamp(40px, 6.4vw, 72px);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.035em;
}

.plugins-hero__highlight {
    background: var(--rt-gradient-brand);
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
}

.plugins-hero__lede {
    max-width: 34em;
    margin: 22px 0 0;
    color: var(--rt-on-dark-muted);
    font-size: clamp(16px, 1.5vw, 18px);
    line-height: 1.6;
}

.plugins-hero__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 30px;
}

.plugins-hero__install {
    width: 100%;
    max-width: 440px;
    margin-top: 28px;
}

@media (max-width: 719px) {
    .plugins-hero {
        padding: calc(var(--rt-nav-offset, 0px) + 56px) 0 64px;
    }
}
</style>
