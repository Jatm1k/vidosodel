/**
 * PrimeVue preset built on Aura, retuned to the Vidosodel palette:
 * amber primary (tally light) and graphite-blue surfaces.
 */
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const VidosodelPreset = definePreset(Aura, {
  primitive: {
    borderRadius: { none: '0', xs: '3px', sm: '5px', md: '7px', lg: '10px', xl: '14px' },
  },
  semantic: {
    primary: {
      50: '#fef8ec', 100: '#fcecc9', 200: '#f9d98e', 300: '#f5c55c', 400: '#f0b03c',
      500: '#e39a1f', 600: '#c47a14', 700: '#9c5b13', 800: '#7e4916', 900: '#673c16', 950: '#3b1f08',
    },
    focusRing: { width: '2px', style: 'solid', color: '{primary.400}', offset: '2px' },
    colorScheme: {
      dark: {
        surface: {
          0: '#ffffff', 50: '#e9ebef', 100: '#cfd3db', 200: '#a9b0bd', 300: '#8a92a1', 400: '#737b8a',
          500: '#5a6271', 600: '#424958', 700: '#363c48', 800: '#2d323c', 900: '#252932', 950: '#1c1f25',
        },
        primary: {
          color: '{primary.400}', contrastColor: '#241a05', hoverColor: '{primary.300}', activeColor: '{primary.500}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: '{primary.200}', focusColor: '{primary.100}',
        },
        formField: {
          background: '{surface.950}', disabledBackground: '{surface.800}', borderColor: '{surface.700}',
          hoverBorderColor: '{surface.600}', color: '{surface.50}', placeholderColor: '{surface.400}',
        },
        content: { background: '{surface.900}', borderColor: '{surface.700}', color: '{surface.50}' },
        overlay: {
          popover: { background: '{surface.900}', borderColor: '{surface.700}' },
          modal: { background: '{surface.900}', borderColor: '{surface.700}' },
          select: { background: '{surface.900}', borderColor: '{surface.700}' },
        },
      },
    },
  },
})
