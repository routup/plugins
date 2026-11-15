<script setup lang="ts">
import { computed } from 'vue';

export type RtButtonProps = {
    href: string;
    variant?: 'primary' | 'ghost';
    external?: boolean;
};

const props = withDefaults(defineProps<RtButtonProps>(), { variant: 'primary', external: false });

const classes = computed(() => ['rt-button', `rt-button--${props.variant}`]);
</script>

<template>
    <a
        :class="classes"
        :href="href"
        :target="external ? '_blank' : undefined"
        :rel="external ? 'noopener' : undefined"
    >
        <slot />
    </a>
</template>
