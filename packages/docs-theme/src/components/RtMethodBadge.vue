<script setup lang="ts">
import { computed } from 'vue';

export type RtMethodBadgeProps = {
    method: string;
};

const props = defineProps<RtMethodBadgeProps>();

const KNOWN = ['get', 'post', 'put', 'patch', 'delete'];

const classes = computed(() => {
    const method = props.method.toLowerCase();

    return ['rt-method-badge', `rt-method-badge--${KNOWN.includes(method) ? method : 'muted'}`];
});
</script>

<template>
    <span :class="classes">{{ method.toUpperCase() }}</span>
</template>
