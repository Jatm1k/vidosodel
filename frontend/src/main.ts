import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import ConfirmationService from 'primevue/confirmationservice'
import Tooltip from 'primevue/tooltip'

import App from './App.vue'
import { router } from './router'
import { VidosodelPreset } from './theme'
import { ru } from './locale'
import './styles/main.css'

// The UI is always dark: images are judged against a neutral dark surround.
document.documentElement.classList.add('app-dark')

createApp(App)
  .use(createPinia())
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: VidosodelPreset,
      options: { darkModeSelector: '.app-dark', cssLayer: { name: 'primevue', order: 'theme, base, primevue' } },
    },
    locale: ru,
    ripple: false,
  })
  .use(ToastService)
  .use(ConfirmationService)
  .directive('tooltip', Tooltip)
  .mount('#app')
