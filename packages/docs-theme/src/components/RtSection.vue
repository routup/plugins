<script setup lang="ts">
import { computed } from 'vue';

export type RtSectionSurface = 'default' | 'tinted' | 'dark' | 'aurora';

export type RtSectionProps = {
    surface?: RtSectionSurface;
    id?: string;
};

const props = withDefaults(defineProps<RtSectionProps>(), { surface: 'default', id: undefined });

const classes = computed(() => ['rt-section', `rt-section--${props.surface}`]);
</script>

<template>
    <section
        :id="id"
        :class="classes"
    >
        <div
            v-if="surface === 'aurora'"
            class="rt-section__aurora"
            aria-hidden="true"
        >
            <span class="rt-section__blob rt-section__blob--a" />
            <span class="rt-section__blob rt-section__blob--b" />
            <span class="rt-section__blob rt-section__blob--c" />
            <span class="rt-section__grid" />
        </div>
        <div class="rt-container">
            <slot />
        </div>
    </section>
</template>
