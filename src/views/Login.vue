<template>
    <div class="card card-md">
        <div class="card-body">
            <div class="text-center mb-4">
                <img :src="logoUrl" :alt="appName" class="login-page-logo mx-auto mb-2" />
                <p class="text-secondary mb-0 auth-brand-tagline">{{ appTagline }}</p>
            </div>

            <h2 class="h2 text-center mb-4">Login</h2>

            <div v-if="errorMessage" class="alert alert-warning" role="alert">
                {{ errorMessage }}
            </div>

            <button
                type="button"
                class="btn w-100 google-login-btn"
                :disabled="isLoading"
                @click="loginWithGoogle"
            >
                <template v-if="!isLoading">
                    <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" />
                    <span>Continue with Google</span>
                </template>
                <template v-else>
                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span>Signing in...</span>
                </template>
            </button>
        </div>
    </div>
</template>

<script>
import { appName, appTagline } from '@/config/app'
import logoUrl from '@/assets/images/mr-boss-realty-logo.png'

export default {
    name: 'Login',
    data() {
        return {
            logoUrl,
            appName,
            appTagline,
            isLoading: false,
            errorMessage: '',
        }
    },
    mounted() {
        const urlParams = new URLSearchParams(window.location.search)
        const error = urlParams.get('error')

        if (error === 'pending') {
            this.errorMessage =
                'Your account is pending admin approval. Please contact your administrator.'
        } else if (error === 'unauthorized') {
            this.errorMessage = 'Login failed. Please try again.'
        }
    },
    methods: {
        loginWithGoogle() {
            this.isLoading = true

            const backendUrl = import.meta.env.VITE_API_URL

            if (!backendUrl) {
                this.errorMessage = 'Backend URL not configured. Please contact admin.'
                this.isLoading = false
                return
            }

            setTimeout(() => {
                window.location.href = `${backendUrl}/auth/google`
            }, 300)
        },
    },
}
</script>

<style scoped>
.login-page-logo {
    width: auto;
    height: 43px;
}

.google-login-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.625rem;
}

.google-login-btn img {
    width: 20px;
    height: 20px;
}
</style>
