import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-traduction',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './traduction.component.html',
  styleUrls: ['./traduction.component.css']
})
export class TraductionComponent {
  jsonData: any = null;
  translatedData: any = {};
  originalTranslations: any = {};
  sourceLang = 'fr';
  targetLang = 'en';
hover: boolean = false;

  onFileUpload(event: any) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      this.jsonData = JSON.parse(reader.result as string);
      this.translatedData = {};
      this.originalTranslations = {};
    };
    reader.readAsText(file);
  }

 getKey(): string[] {
  if (!this.jsonData) return [];

  const keys: string[] = [];

  for (const key in this.jsonData) {
    const value = this.jsonData[key];
    if (typeof value === 'object' && value !== null) {
      for (const subKey in value) {
        keys.push(`${key}.${subKey}`);
      }
    } else {
      keys.push(key);
    }
  }

  return keys;
}


  getValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;

  for (const key of keys) {
    if (current && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }

  return typeof current === 'string' ? current : '';
}


  async translate() {
    if (!this.jsonData) return;

    for (const key of this.getKey()) {
      const originalText = this.getValue(this.jsonData, key);
      if (typeof originalText !== 'string') continue;

      try {
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(originalText)}&langpair=${this.sourceLang}|${this.targetLang}`
        );
        const data = await response.json();
        this.translatedData[key] = data.responseData.translatedText || originalText;
        this.originalTranslations[key] = data.responseData.translatedText || originalText;
      } catch (error) {
        console.error("Erreur de traduction", error);
        this.translatedData[key] = originalText;
        this.originalTranslations[key] = originalText;
      }
    }
  }

  exportJSON() {
    const nestedObject = this.getKey().reduce((acc, key) => {
      const keys = key.split('.');
      let current = acc;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) current[keys[i]] = {};
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = this.translatedData[key];
      return acc;
    }, {} as any);

    const blob = new Blob([JSON.stringify(nestedObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traduction_${this.targetLang}.json`;
    a.click();
  }

  getTranslationStatus(key: string): string {
    if (!this.translatedData[key]) return 'À faire';
    return this.translatedData[key] === this.originalTranslations[key] ? 'Validé' : 'Modifié';
  }

  getStatusClass(key: string): string {
    if (!this.translatedData[key]) return 'bg-secondary';
    return this.translatedData[key] === this.originalTranslations[key] ? 'bg-success' : 'bg-warning';
  }
}