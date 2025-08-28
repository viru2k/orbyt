import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { DropdownModule } from 'primeng/dropdown';
import { FormsModule } from '@angular/forms';

interface Language {
  label: string;
  value: string;
  flag: string;
}

@Component({
  selector: 'orb-language-selector',
  standalone: true,
  imports: [CommonModule, DropdownModule, FormsModule],
  template: `
    <p-dropdown
      [options]="languages"
      [(ngModel)]="selectedLanguage"
      (ngModelChange)="onLanguageChange($event)"
      optionLabel="label"
      optionValue="value"
      [showClear]="false"
      styleClass="language-selector"
    >
      <ng-template pTemplate="selectedItem" let-option>
        <div class="language-item" *ngIf="option">
          <span [class]="'flag-icon ' + option.flag"></span>
          <span>{{ option.label }}</span>
        </div>
      </ng-template>
      <ng-template pTemplate="item" let-option>
        <div class="language-item">
          <span [class]="'flag-icon ' + option.flag"></span>
          <span>{{ option.label }}</span>
        </div>
      </ng-template>
    </p-dropdown>
  `,
  styleUrls: ['./orb-language-selector.component.scss']
})
export class OrbLanguageSelectorComponent implements OnInit {
  private translate = inject(TranslateService);

  languages: Language[] = [
    { label: 'Español', value: 'es', flag: 'flag-icon-es' },
    { label: 'English', value: 'en', flag: 'flag-icon-us' }
  ];

  selectedLanguage: string = this.translate.currentLang || this.translate.defaultLang || 'es';

  onLanguageChange(language: string): void {
    this.translate.use(language);
    localStorage.setItem('selectedLanguage', language);
  }

  ngOnInit(): void {
    // Load saved language preference
    const savedLanguage = localStorage.getItem('selectedLanguage');
    if (savedLanguage && this.languages.find(lang => lang.value === savedLanguage)) {
      this.selectedLanguage = savedLanguage;
      this.translate.use(savedLanguage);
    }
  }
}