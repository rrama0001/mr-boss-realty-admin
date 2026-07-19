<template>
    <div class="ai-settings-section">
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">AI Configuration</h3>
            </div>
            <div class="card-body">
                <div v-if="loading" class="alert alert-info">Loading settings...</div>

                <form v-else @submit.prevent="saveSettings">
                    <div class="mb-3">
                        <label class="form-label">Model</label>
                        <select v-model="form.model" class="form-select">
                            <option value="gpt-4o-mini">gpt-4o-mini</option>
                            <option value="gpt-4o">gpt-4o</option>
                            <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Temperature (0–1)</label>
                        <input
                            v-model.number="form.temperature"
                            type="number"
                            step="0.1"
                            min="0"
                            max="1"
                            class="form-control"
                        />
                    </div>

                    <div class="mb-3">
                        <LabelWithInfo
                            label="AI Prompt"
                            help="Be careful changing this prompt. It shapes how Mr. Boss AI answers website visitors."
                        />
                        <textarea v-model="form.prompt" rows="14" class="form-control"></textarea>
                    </div>

                    <button type="submit" class="btn btn-primary">Save Settings</button>
                    <span v-if="saved" class="text-success ms-3">Saved!</span>
                </form>

                <div class="ai-settings-test">
                    <div class="ai-settings-test__header">
                        <h4 class="ai-settings-test__title">Test AI Reply</h4>
                        <button
                            v-if="chatMessages.length"
                            type="button"
                            class="btn btn-sm btn-ghost-secondary"
                            @click="clearChat"
                        >
                            Clear chat
                        </button>
                    </div>

                    <div class="ai-chat-card">
                        <div class="ai-chat-card__body d-flex flex-column">
                            <div ref="chatTranscript" class="ai-chat-transcript">
                                <div v-if="!chatMessages.length && !testing" class="ai-chat-empty">
                                    <span class="text-secondary">Send a message to test how the AI responds.</span>
                                </div>

                                <div
                                    v-for="(msg, index) in chatMessages"
                                    :key="index"
                                    class="ai-chat-message"
                                    :class="msg.role === 'user' ? 'ai-chat-message--user' : 'ai-chat-message--assistant'"
                                >
                                    <div class="ai-chat-message__bubble">
                                        <div class="ai-chat-message__label">
                                            {{ msg.role === 'user' ? 'You' : 'AI' }}
                                        </div>
                                        <div class="ai-chat-message__text">{{ msg.content }}</div>
                                    </div>
                                </div>

                                <div v-if="testing" class="ai-chat-message ai-chat-message--assistant">
                                    <div class="ai-chat-message__bubble ai-chat-message__bubble--typing">
                                        <div class="ai-chat-message__label">AI</div>
                                        <div class="ai-chat-typing">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <form class="ai-chat-composer" @submit.prevent="sendMessage">
                                <div class="ai-chat-composer__row">
                                    <textarea
                                        ref="chatInput"
                                        v-model="draftMessage"
                                        rows="2"
                                        class="form-control ai-chat-composer__input"
                                        placeholder="Type your test message..."
                                        :disabled="testing"
                                        @keydown.enter.exact.prevent="sendMessage"
                                    ></textarea>
                                    <button
                                        type="submit"
                                        class="btn btn-primary ai-chat-composer__send"
                                        :disabled="testing || !draftMessage.trim()"
                                    >
                                        Send
                                    </button>
                                </div>
                                <p class="text-secondary small mb-0 ai-chat-composer__hint">
                                    Press Enter to send, Shift+Enter for a new line
                                </p>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import axios from 'axios';
import LabelWithInfo from '@/components/LabelWithInfo.vue';

export default {
    name: 'AiSettings',
    components: { LabelWithInfo },
    data() {
        return {
            loading: true,
            saved: false,
            testing: false,
            draftMessage: '',
            chatMessages: [],
            testSessionId: `admin-test-${Date.now()}`,
            form: {
                model: 'gpt-4o-mini',
                prompt:
                    "You are Mr. Boss Realty's helpful real estate assistant. Answer concisely and politely using only company database information.",
                temperature: 0.3,
            },
        };
    },
    async mounted() {
        await this.loadSettings();
    },
    methods: {
        async loadSettings() {
            try {
                const res = await axios.get(`${import.meta.env.VITE_API_URL}/ai-settings`);
                if (res.data) this.form = res.data;
            } catch (err) {
                console.error('Failed to load AI settings:', err);
            } finally {
                this.loading = false;
            }
        },

        async saveSettings() {
            try {
                this.saved = false;
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai-settings`, this.form);
                this.form = res.data;
                this.saved = true;
                setTimeout(() => (this.saved = false), 2000);
            } catch (err) {
                alert('Failed to save settings.');
                console.error(err);
            }
        },

        async sendMessage() {
            const message = this.draftMessage.trim();
            if (!message || this.testing) return;

            this.chatMessages.push({ role: 'user', content: message });
            this.draftMessage = '';
            this.testing = true;
            this.scrollChatToBottom();

            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}/ai/reply`, {
                    message,
                    source: 'admin-test',
                    senderId: this.testSessionId,
                });
                this.chatMessages.push({ role: 'assistant', content: res.data.reply });
            } catch (err) {
                console.error(err);
                this.chatMessages.push({
                    role: 'assistant',
                    content: 'Failed to generate reply. Please try again.',
                });
            } finally {
                this.testing = false;
                this.scrollChatToBottom();
                this.$nextTick(() => this.$refs.chatInput?.focus());
            }
        },

        clearChat() {
            this.chatMessages = [];
            this.draftMessage = '';
            this.testSessionId = `admin-test-${Date.now()}`;
        },

        scrollChatToBottom() {
            this.$nextTick(() => {
                const el = this.$refs.chatTranscript;
                if (el) {
                    el.scrollTop = el.scrollHeight;
                }
            });
        },
    },
};
</script>

<style scoped>
.ai-settings-test {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid rgba(15, 23, 42, 0.08);
}

.ai-settings-test__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.ai-settings-test__title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
}

.ai-chat-card {
    overflow: hidden;
    border: 1px solid rgba(15, 23, 42, 0.08);
    border-radius: 0.5rem;
}

.ai-chat-card__body {
    background: #fff;
}

.ai-chat-transcript {
    flex: 1;
    min-height: 280px;
    max-height: 420px;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    background: #f8fafc;
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.ai-chat-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 240px;
    text-align: center;
}

.ai-chat-message {
    display: flex;
    margin-bottom: 0.875rem;
}

.ai-chat-message--user {
    justify-content: flex-end;
}

.ai-chat-message--assistant {
    justify-content: flex-start;
}

.ai-chat-message__bubble {
    max-width: 85%;
    padding: 0.625rem 0.875rem;
    border-radius: 0.875rem;
    background: #fff;
    border: 1px solid rgba(15, 23, 42, 0.08);
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.ai-chat-message--user .ai-chat-message__bubble {
    background: #1877f2;
    border-color: #1877f2;
    color: #fff;
    border-bottom-right-radius: 0.25rem;
}

.ai-chat-message--assistant .ai-chat-message__bubble {
    border-bottom-left-radius: 0.25rem;
}

.ai-chat-message__label {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    opacity: 0.72;
    margin-bottom: 0.25rem;
}

.ai-chat-message__text {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.45;
}

.ai-chat-composer {
    padding: 1rem 1.25rem;
    background: #fff;
}

.ai-chat-composer__row {
    display: flex;
    align-items: stretch;
    gap: 0.75rem;
}

.ai-chat-composer__input {
    flex: 1;
    min-width: 0;
    min-height: 3.25rem;
    resize: none;
    border-radius: 0.75rem;
}

.ai-chat-composer__send {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 5.5rem;
    padding-inline: 1.25rem;
    border-radius: 0.75rem;
}

.ai-chat-composer__hint {
    margin-top: 0.5rem;
}

.ai-chat-typing {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    min-height: 1.25rem;
}

.ai-chat-typing span {
    width: 0.4375rem;
    height: 0.4375rem;
    border-radius: 50%;
    background: #94a3b8;
    animation: ai-chat-typing 1.2s infinite ease-in-out;
}

.ai-chat-typing span:nth-child(2) {
    animation-delay: 0.15s;
}

.ai-chat-typing span:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes ai-chat-typing {
    0%,
    80%,
    100% {
        opacity: 0.35;
        transform: translateY(0);
    }

    40% {
        opacity: 1;
        transform: translateY(-2px);
    }
}

@media (max-width: 575.98px) {
    .ai-chat-composer__row {
        flex-direction: column;
        align-items: stretch;
    }

    .ai-chat-composer__send {
        width: 100%;
        min-height: 2.75rem;
    }
}
</style>
