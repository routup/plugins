<script setup lang="ts">
import { useData, withBase } from 'vitepress';
import { computed } from 'vue';
import { resolveFooter } from '../footer';
import { isExternalLink } from '../links';
import RtLogo from './RtLogo.vue';

const { site, theme } = useData();

const footer = computed(() => resolveFooter(theme.value));
const gridStyle = computed(() => ({ '--rt-footer-columns': footer.value?.columns.length ?? 0 }));

function toHref(link: string) {
    return isExternalLink(link) ? link : withBase(link);
}
</script>

<template>
    <footer
        v-if="footer"
        class="rt-footer"
    >
        <div class="rt-container">
            <div
                class="rt-footer__grid"
                :style="gridStyle"
            >
                <div class="rt-footer__brand">
                    <a
                        class="rt-footer__home"
                        :href="withBase('/')"
                    >
                        <RtLogo :size="26" />
                        <span>{{ site.title }}</span>
                    </a>
                    <p class="rt-footer__tagline">
                        {{ footer.tagline }}
                    </p>
                </div>
                <nav
                    v-for="column in footer.columns"
                    :key="column.title"
                    class="rt-footer__column"
                    :aria-label="column.title"
                >
                    <h2 class="rt-footer__title">
                        {{ column.title }}
                    </h2>
                    <ul class="rt-footer__links">
                        <li
                            v-for="item in column.links"
                            :key="item.link"
                        >
                            <a
                                :href="toHref(item.link)"
                                :target="isExternalLink(item.link) ? '_blank' : undefined"
                                :rel="isExternalLink(item.link) ? 'noopener' : undefined"
                            >{{ item.text }}</a>
                        </li>
                    </ul>
                </nav>
            </div>
            <div
                v-if="footer.note"
                class="rt-footer__bottom"
            >
                <span>{{ footer.note }}</span>
            </div>
        </div>
    </footer>
</template>
