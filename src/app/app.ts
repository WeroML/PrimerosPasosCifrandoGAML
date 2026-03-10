import { Component, computed, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Tipos de algoritmos y acciones disponibles
type Algorithm = 'caesar' | 'atbash';
type Action = 'encrypt' | 'decrypt';

// Resultado de un intento de descifrado por fuerza bruta
interface BruteForceResult {
  shift: number;
  text: string;
  score: number;
}

// Alfabeto por defecto (A..Z) como arreglo de caracteres
const DEFAULT_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {

  /* Creación de los elementos del formulario */
  form = new FormGroup({
    // Selector del algoritmo
    algorithm: new FormControl<Algorithm>('caesar', { nonNullable: true }),
    // Cifrar o descifrar
    action: new FormControl<Action>('encrypt', { nonNullable: true }),
    // Alfabeto personalizado: activar o no
    useCustomAlphabet: new FormControl(false, { nonNullable: true }),
    // Texto continuo del alfabeto personalizado (se lee carácter por carácter)
    customAlphabetInput: new FormControl('', { nonNullable: true }),
    // Desplazamiento para César (clave)
    shift: new FormControl<number>(3, { nonNullable: true, validators: [Validators.required] }),
    // Mensaje de entrada
    message: new FormControl('', { nonNullable: true }),
  });

  copied = signal(false);
  currentYear = new Date().getFullYear();

  /* ─── RESULTADO ─── */
  result = signal('');

  /* ─── FUERZA BRUTA ─── */
  bruteForceResults = signal<BruteForceResult[]>([]);
  showBruteForce = signal(false);

  constructor() {

    // Suscribirse a cambios del formulario para recalcular el resultado
    this.form.valueChanges.subscribe(() => {
      this.normalizeCustomAlphabetInput();
      this.computeResult();
      // Limpiar resultados de fuerza bruta al cambiar el mensaje o configuración
      this.showBruteForce.set(false);
      this.bruteForceResults.set([]);
    });
  }

  /* ─── Ayudantes del alfabeto ─── */
  private normalizeCustomAlphabetInput(): void {
    const raw = this.form.controls.customAlphabetInput.value;
    const normalized = raw.replace(/\s/g, '');
    if (normalized !== raw) {
      this.form.controls.customAlphabetInput.setValue(normalized, { emitEvent: false });
    }
  }

  private hasEffectiveCustomAlphabet(): boolean {
    if (!this.form.controls.useCustomAlphabet.value) {
      return false;
    }
    return this.form.controls.customAlphabetInput.value.replace(/\s/g, '').length > 0;
  }

  private getActiveAlphabet(): string[] {
    if (!this.form.controls.useCustomAlphabet.value) {
      return DEFAULT_ALPHABET;
    }

    // Leer carácter por carácter desde el textfield personalizado
    const letters = this.form.controls.customAlphabetInput.value
      .replace(/\s/g, '')
      .split('')
      .filter(v => v.length === 1);

    // Si el alfabeto personalizado queda vacío, usar el por defecto
    return letters.length > 0 ? letters : DEFAULT_ALPHABET;
  }

  /* ─── Toggle para encriptar o desencriptar ─── */
  toggleAction(): void {
    const current = this.form.controls.action.value;
    this.form.controls.action.setValue(current === 'encrypt' ? 'decrypt' : 'encrypt');
  }

  /* ─── Lógica del cifrado ─── */
  private computeResult(): void {
    // Extraer valores actuales del formulario
    const { algorithm, action, shift, message } = this.form.getRawValue();
    const alphabet = this.getActiveAlphabet();
    const n = alphabet.length;
    const useExactCustomAlphabet = this.hasEffectiveCustomAlphabet();

    // Si no hay mensaje o el alfabeto está vacío, resultado vacío
    if (!message || n === 0) {
      this.result.set('');
      return;
    }

    let output = '';

    // Procesar cada carácter del mensaje
    for (const char of message) {
      const idx = useExactCustomAlphabet
        ? alphabet.indexOf(char)
        : alphabet.indexOf(char.toUpperCase());

      if (idx === -1) {
        // Si el carácter no está en el alfabeto, se deja igual 
        output += char;
        continue;
      }

      let newIdx: number;

      if (algorithm === 'caesar') {
        // Desplazamiento de caracter para César
        const s = shift ?? 3;
        if (action === 'encrypt') {
          newIdx = ((idx + s) % n + n) % n;
        } else {
          newIdx = ((idx - s) % n + n) % n;
        }
      } else {
        // Atbash
        newIdx = (n - 1) - idx;
      }

      const newChar = alphabet[newIdx];
      if (useExactCustomAlphabet) {
        output += newChar;
      } else {
        // Preservar mayúscula/minúscula del carácter original (solo alfabeto por defecto)
        output += char === char.toLowerCase() ? newChar.toLowerCase() : newChar;
      }
    }

    // Actualizar señal con el resultado final
    this.result.set(output);
  }

  /* ─── Puntuación por frecuencia de letras (heurística) ─── */
  private scoreText(text: string): number {
    // Frecuencias aproximadas del español
    const frequencies: Record<string, number> = {
      'a': 12.5, 'e': 13.6, 'o': 8.6, 's': 7.9,
      'i': 6.2, 'n': 6.7, 'r': 6.8, 'l': 4.9
    };
    let score = 0;
    const lower = text.toLowerCase();

    for (const char of lower) {
      if (frequencies[char]) score += frequencies[char];
    }

    // Puntos extra para entornos de redes/sistemas
    if (lower.includes('ssh'))      score += 100;
    if (lower.includes('servidor')) score += 100;

    return score;
  }

  /* ─── Descifrado en masa: prueba todos los desplazamientos ─── */
  runBruteForce(): void {
    const message = this.form.controls.message.value;
    const alphabet = this.getActiveAlphabet();
    const n = alphabet.length;
    const useExactCustomAlphabet = this.hasEffectiveCustomAlphabet();

    if (!message || n === 0) {
      this.bruteForceResults.set([]);
      return;
    }

    const results: BruteForceResult[] = [];

    for (let s = 0; s < n; s++) {
      let output = '';

      for (const char of message) {
        const idx = useExactCustomAlphabet
          ? alphabet.indexOf(char)
          : alphabet.indexOf(char.toUpperCase());

        if (idx === -1) {
          // Carácter fuera del alfabeto: se conserva tal cual
          output += char;
          continue;
        }

        // Descifrado César: (idx - s + n) % n
        const newIdx = ((idx - s) % n + n) % n;
        const newChar = alphabet[newIdx];
        if (useExactCustomAlphabet) {
          output += newChar;
        } else {
          output += char === char.toLowerCase() ? newChar.toLowerCase() : newChar;
        }
      }

      results.push({ shift: s, text: output, score: this.scoreText(output) });
    }

    // Ordenar de mayor a menor puntuación
    results.sort((a, b) => b.score - a.score);
    this.bruteForceResults.set(results);
    this.showBruteForce.set(true);
  }

  /* ─── Copiar al portapapeles─── */
  async copyResult(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.result());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
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

  /* ─── Aplicar el desplazamiento ganador al formulario principal ─── */
  applyBruteShift(shift: number): void {
    this.form.controls.algorithm.setValue('caesar');
    this.form.controls.action.setValue('decrypt');
    this.form.controls.shift.setValue(shift);
  }

  /* ─── Mostrar alfabeto activo ─── */
  get displayAlphabet(): string[] {
    return this.getActiveAlphabet();
  }
}
