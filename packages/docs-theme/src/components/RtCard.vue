<script setup lang="ts">
import { computed } from 'vue';
import { isExternalLink } from '../links';

export type RtCardProps = {
    href?: string;
};

const props = withDefaults(defineProps<RtCardProps>(), { href: undefined });

const external = computed(() => !!props.href && isExternalLink(props.href));
</script>

<template>
    <a
        v-if="href"
        class="rt-card rt-card--link"
        :href="href"
        :target="external ? '_blank' : undefined"
        :rel="external ? 'noopener' : undefined"
    >
        <slot />
    </a>
    <div
        v-else
        class="rt-card"
    >
        <slot />
    </div>
</template>
