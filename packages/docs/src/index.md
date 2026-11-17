---
layout: page
pageClass: rt-home
sidebar: false
aside: false
title: Routup Plugins
description: Plugins for the routup HTTP routing framework, such as body, cookie, query, decorators, swagger-ui, rate-limit, prometheus and i18n.
hero:
    eyebrow: 'routup ecosystem'
    title: 'Plugins for'
    highlight: 'routup'
    description: 'Small, focused packages. Each installs alone and follows the same Web-standard conventions.'
    actions:
        - text: 'Get started'
          link: '/guide/getting-started'
        - text: 'Browse plugins'
          link: '#plugins'
    install: 'npm install @routup/basic'
grid:
    title: 'All plugins'
---

<script setup>
import PluginsHome from './.vitepress/components/home/PluginsHome.vue';
</script>

<PluginsHome />
