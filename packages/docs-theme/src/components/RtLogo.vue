<script setup lang="ts">
import { useId } from 'vue';

export type RtLogoProps = {
    size?: number;
};

withDefaults(defineProps<RtLogoProps>(), { size: 28 });

const gradientId = `rt-logo-${useId()}`;
const PATH = 'M12 8 H36 A14 14 0 0 1 36 36 L54 56 H40 L22 36 V56 H12 Z M22 17 H36 A5 5 0 0 1 36 27 H22 Z';
</script>

<template>
    <svg
        class="rt-logo"
        :width="size"
        :height="size"
        viewBox="0 0 64 64"
        fill="none"
        aria-hidden="true"
    >
        <defs>
            <linearGradient
                :id="gradientId"
                x1="0"
                y1="0"
                x2="64"
                y2="64"
                gradientUnits="userSpaceOnUse"
            >
                <stop
                    offset="0"
                    class="rt-logo__stop-start"
                />
                <stop
                    offset="1"
                    class="rt-logo__stop-end"
                />
            </linearGradient>
        </defs>
        <path
            :fill="`url(#${gradientId})`"
            fill-rule="evenodd"
            :d="PATH"
        />
    </svg>
</template>
