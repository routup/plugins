<script setup lang="ts">
import DefaultTheme from 'vitepress/theme-without-fonts';
import RtFooter from './components/RtFooter.vue';

const DefaultLayout = DefaultTheme.Layout;
</script>

<template>
    <DefaultLayout>
        <template #layout-bottom>
            <RtFooter />
        </template>
    </DefaultLayout>
</template>
