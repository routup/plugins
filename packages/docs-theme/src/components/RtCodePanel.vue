<script setup lang="ts">
import { computed, ref, useId } from 'vue';

export type RtCodeTab = {
    label: string;
    code: string;
};

export type RtCodePanelProps = {
    title?: string;
    code?: string;
    tabs?: RtCodeTab[];
    active?: number;
};

const props = withDefaults(defineProps<RtCodePanelProps>(), {
    title: undefined,
    code: undefined,
    tabs: undefined,
    active: 0,
});

defineSlots<{ footer?: () => unknown }>();

const id = useId();
const current = ref(props.active);

const hasTabs = computed(() => !!props.tabs && props.tabs.length > 0);

const lines = computed(() => {
    const source = hasTabs.value ?
        props.tabs?.[current.value]?.code ?? '' :
        props.code ?? '';

    // A trailing newline (YAML block scalars end with one) would add an empty numbered line.
    return source.replace(/\n$/, '').split('\n');
});

function tabId(index: number) {
    return `${id}-tab-${index}`;
}
</script>

<template>
    <div class="rt-code-panel">
        <div
            v-if="hasTabs"
            class="rt-code-panel__tabs"
            role="tablist"
        >
            <button
                v-for="(tab, index) in tabs"
                :id="tabId(index)"
                :key="index"
                type="button"
                role="tab"
                class="rt-code-panel__tab"
                :aria-selected="index === current"
                :aria-controls="`${id}-code`"
                @click="current = index"
            >
                <span
                    class="rt-code-panel__step"
                    aria-hidden="true"
                >{{ index + 1 }}</span>{{ tab.label }}
            </button>
            <span
                v-if="title"
                class="rt-code-panel__file"
            >{{ title }}</span>
        </div>
        <div
            v-else-if="title"
            class="rt-code-panel__bar"
        >
            {{ title }}
        </div>
        <pre
            :id="`${id}-code`"
            class="rt-code-panel__code"
            :role="hasTabs ? 'tabpanel' : undefined"
            :aria-labelledby="hasTabs ? tabId(current) : undefined"
        ><code><span
            v-for="(line, index) in lines"
            :key="index"
            class="rt-code-panel__line"
        >{{ line || ' ' }}</span></code></pre>
        <div
            v-if="$slots.footer"
            class="rt-code-panel__foot"
        >
            <slot name="footer" />
        </div>
    </div>
</template>
