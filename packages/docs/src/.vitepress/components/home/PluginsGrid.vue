<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { computed } from 'vue';

import { data as groups } from '../../data/plugins.data';

type GridFrontmatter = {
    title: string;
};

const { frontmatter } = useData();

const grid = computed(() => frontmatter.value.grid as GridFrontmatter);

function splitPackage(name: string) {
    const index = name.indexOf('/') + 1;

    return { scope: name.slice(0, index), name: name.slice(index) };
}
</script>

<template>
    <RtSection id="plugins">
        <RtHeading :title="grid.title" />
        <div
            v-for="item in groups"
            :key="item.group"
            class="plugins-grid__group"
        >
            <h3 class="plugins-grid__title">
                {{ item.group }}
            </h3>
            <ul class="plugins-grid__list">
                <li
                    v-for="plugin in item.plugins"
                    :key="plugin.package"
                >
                    <RtCard
                        class="plugins-grid__card"
                        :href="withBase(plugin.url)"
                    >
                        <code><span>{{ splitPackage(plugin.package).scope }}</span>{{ splitPackage(plugin.package).name }}</code>
                        <p>{{ plugin.summary }}</p>
                    </RtCard>
                </li>
            </ul>
        </div>
    </RtSection>
</template>

<style scoped>
.plugins-grid__group {
    margin-top: 48px;
}

.plugins-grid__title {
    margin: 0;
    padding: 0;
    border: 0;
    color: var(--rt-color-fg-muted);
    font-family: var(--rt-font-mono);
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
}

.plugins-grid__list {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    margin: 16px 0 0;
    padding: 0;
    list-style: none;
}

@media (min-width: 520px) {
    .plugins-grid__list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (min-width: 820px) {
    .plugins-grid__list {
        grid-template-columns: repeat(3, minmax(0, 1fr));
    }
}

@media (min-width: 1080px) {
    .plugins-grid__list {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}

.plugins-grid__card {
    gap: 6px;
    padding: 18px;
}

.plugins-grid__card code {
    font-size: 13.5px;
    font-weight: 500;
    overflow-wrap: anywhere;
}

.plugins-grid__card code span {
    color: var(--rt-color-fg-muted);
    font-weight: 400;
}

.plugins-grid__card p {
    font-size: 14px;
}
</style>
