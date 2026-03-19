import { Injectable, signal, computed } from '@angular/core';
import { TRANSLATIONS, LanguageCode } from '../i18n/translations';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  // Estado actual del idioma
  currentLang = signal<LanguageCode>('en');

  // Signal computada: cambia automáticamente todo el diccionario cuando cambia el idioma
  t = computed(() => TRANSLATIONS[this.currentLang()]);

  constructor() {
    const savedLang = (localStorage.getItem('appLanguage') as LanguageCode) || 'en';
    this.currentLang.set(savedLang);
  }

  setLanguage(lang: LanguageCode) {
    this.currentLang.set(lang);
    localStorage.setItem('appLanguage', lang);
  }

  toggleLanguage() {
    const nextLang = this.currentLang() === 'en' ? 'es' : 'en';
    this.setLanguage(nextLang);
  }
}
