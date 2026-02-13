import { Component, computed, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

type Algorithm = 'caesar' | 'atbash';
type Action = 'encrypt' | 'decrypt';

const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {

  /* ─── Form ─── */
  form = new FormGroup({
    algorithm: new FormControl<Algorithm>('caesar', { nonNullable: true }),
    action: new FormControl<Action>('encrypt', { nonNullable: true }),
    useCustomAlphabet: new FormControl(false, { nonNullable: true }),
    customAlphabet: new FormArray<FormControl<string>>([this.createLetterControl()]),
    shift: new FormControl<number>(3, { nonNullable: true, validators: [Validators.required] }),
    message: new FormControl('', { nonNullable: true }),
  });

  /* ─── Signals ─── */
  copied = signal(false);
  currentYear = new Date().getFullYear();

  /* ─── Computed result (reactive via signal) ─── */
  result = signal('');

  constructor() {
    // React to any form change
    effect(() => {
      // This effect will re-run whenever the form changes
    });

    this.form.valueChanges.subscribe(() => {
      this.computeResult();
    });
  }

  /* ─── Alphabet helpers ─── */
  get customAlphabetArray(): FormArray<FormControl<string>> {
    return this.form.controls.customAlphabet;
  }

  private createLetterControl(): FormControl<string> {
    return new FormControl('', { nonNullable: true });
  }

  private getActiveAlphabet(): string[] {
    if (!this.form.controls.useCustomAlphabet.value) {
      return DEFAULT_ALPHABET;
    }
    const letters = this.customAlphabetArray.controls
      .map(c => c.value.toUpperCase())
      .filter(v => v.length === 1);
    return letters.length > 0 ? letters : DEFAULT_ALPHABET;
  }

  onCustomLetterInput(index: number): void {
    const control = this.customAlphabetArray.at(index);
    // Force uppercase and single char
    if (control.value.length > 1) {
      control.setValue(control.value.charAt(0).toUpperCase(), { emitEvent: false });
    } else {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
    }

    // If typing in last input, add a new empty one
    if (index === this.customAlphabetArray.length - 1 && control.value.length === 1) {
      this.customAlphabetArray.push(this.createLetterControl());
    }

    this.computeResult();
  }

  removeCustomLetter(index: number): void {
    if (this.customAlphabetArray.length > 1) {
      this.customAlphabetArray.removeAt(index);
      this.computeResult();
    }
  }

  /* ─── Algorithm toggle ─── */
  toggleAction(): void {
    const current = this.form.controls.action.value;
    this.form.controls.action.setValue(current === 'encrypt' ? 'decrypt' : 'encrypt');
  }

  /* ─── Core Cipher Logic ─── */
  private computeResult(): void {
    const { algorithm, action, shift, message } = this.form.getRawValue();
    const alphabet = this.getActiveAlphabet();
    const n = alphabet.length;

    if (!message || n === 0) {
      this.result.set('');
      return;
    }

    let output = '';

    for (const char of message) {
      const upper = char.toUpperCase();
      const idx = alphabet.indexOf(upper);

      if (idx === -1) {
        // Character not in alphabet → preserve as-is
        output += char;
        continue;
      }

      let newIdx: number;

      if (algorithm === 'caesar') {
        const s = shift ?? 3;
        if (action === 'encrypt') {
          newIdx = ((idx + s) % n + n) % n;
        } else {
          newIdx = ((idx - s) % n + n) % n;
        }
      } else {
        // Atbash: mirror the index → (N-1) - index
        newIdx = (n - 1) - idx;
      }

      const newChar = alphabet[newIdx];
      // Preserve original case
      output += char === char.toLowerCase() ? newChar.toLowerCase() : newChar;
    }

    this.result.set(output);
  }

  /* ─── Copy to clipboard ─── */
  async copyResult(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.result());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = this.result();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  /* ─── Get display alphabet (for visual) ─── */
  get displayAlphabet(): string[] {
    return this.getActiveAlphabet();
  }
}
