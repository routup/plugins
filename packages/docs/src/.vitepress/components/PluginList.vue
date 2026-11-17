<script setup lang="ts">
import { withBase } from 'vitepress';

import { data as groups } from '../data/plugins.data';
</script>

<template>
    <template
        v-for="item in groups"
        :key="item.group"
    >
        <p><strong>{{ item.group }}</strong></p>
        <ul>
            <li
                v-for="plugin in item.plugins"
                :key="plugin.package"
            >
                <a :href="withBase(plugin.url)"><code>{{ plugin.package }}</code></a>: {{ plugin.summary }}
            </li>
        </ul>
    </template>
</template>
