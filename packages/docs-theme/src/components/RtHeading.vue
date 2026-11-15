<script setup lang="ts">
import { computed } from 'vue';

export type RtHeadingProps = {
    title: string;
    eyebrow?: string;
    lede?: string;
    align?: 'start' | 'center';
    level?: 1 | 2;
};

const props = withDefaults(defineProps<RtHeadingProps>(), {
    eyebrow: undefined,
    lede: undefined,
    align: 'start',
    level: 2,
});

const classes = computed(() => ['rt-heading', `rt-heading--${props.align}`]);
const tag = computed(() => `h${props.level}`);
</script>

<template>
    <div :class="classes">
        <span
            v-if="eyebrow"
            class="rt-heading__eyebrow"
        >{{ eyebrow }}</span>
        <component
            :is="tag"
            :class="`rt-heading__title rt-heading__title--h${level}`"
        >
            {{ title }}
        </component>
        <p
            v-if="lede"
            class="rt-heading__lede"
        >
            {{ lede }}
        </p>
    </div>
</template>
