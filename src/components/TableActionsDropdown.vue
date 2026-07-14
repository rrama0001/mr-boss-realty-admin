<template>
    <span class="dropdown position-static table-actions-dropdown">
        <button
            type="button"
            class="btn dropdown-toggle align-text-top"
            data-bs-toggle="dropdown"
            data-bs-boundary="viewport"
            aria-expanded="false"
            :data-bs-popper-config="popperConfig"
        >
            Actions
        </button>
        <div class="dropdown-menu dropdown-menu-end">
            <slot />
        </div>
    </span>
</template>

<script>
export default {
    name: 'TableActionsDropdown',
    computed: {
        popperConfig() {
            return JSON.stringify({
                strategy: 'fixed',
                modifiers: [
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: 'viewport',
                            padding: 8,
                        },
                    },
                    {
                        name: 'flip',
                        options: {
                            fallbackPlacements: ['bottom-end', 'top-end', 'bottom-start', 'top-start'],
                        },
                    },
                ],
            });
        },
    },
};
</script>
