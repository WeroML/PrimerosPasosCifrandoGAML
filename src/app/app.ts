import { Component, computed, signal, effect } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Tipos de algoritmos y acciones disponibles
type Algorithm = 'caesar' | 'atbash';
type Action = 'encrypt' | 'decrypt';

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
    // Controles para cada letra del alfabeto personalizado
    customAlphabet: new FormArray<FormControl<string>>([this.createLetterControl()]),
    // Desplazamiento para César (clave)
    shift: new FormControl<number>(3, { nonNullable: true, validators: [Validators.required] }),
    // Mensaje de entrada
    message: new FormControl('', { nonNullable: true }),
  });

  copied = signal(false);
  currentYear = new Date().getFullYear();

  /* ─── RESULTADO ─── */
  result = signal('');

  constructor() {

    // Suscribirse a cambios del formulario para recalcular el resultado
    this.form.valueChanges.subscribe(() => {
      this.computeResult();
    });
  }

  /* ─── Ayudantes del alfabeto ─── */
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

    // Tomar las letras del array, se normaliza a mayúsculas y se filtran
    const letters = this.customAlphabetArray.controls
      .map(c => c.value.toUpperCase())
      .filter(v => v.length === 1);

    // Si el alfabeto personalizado queda vacío, usar el por defecto
    return letters.length > 0 ? letters : DEFAULT_ALPHABET;
  }

  //Función que se ejecuta cada vez que se ingresa una letra en el alfabeto personalizado
  onCustomLetterInput(index: number): void {
    const control = this.customAlphabetArray.at(index);
    // Forzar mayúscula y un solo carácter en el control
    if (control.value.length > 1) {
      control.setValue(control.value.charAt(0).toUpperCase(), { emitEvent: false });
    } else {
      control.setValue(control.value.toUpperCase(), { emitEvent: false });
    }

    // Si estamos escribiendo en la última casilla y acaba de recibir un carácter,
    // añadir una nueva casilla vacía para permitir más letras
    if (index === this.customAlphabetArray.length - 1 && control.value.length === 1) {
      this.customAlphabetArray.push(this.createLetterControl());
    }

    // Recalcular salida al cambiar el alfabeto
    this.computeResult();
  }

  //Función para eliminar una letra del alfabeto personalizado pero siempre dejando al menos una casilla
  removeCustomLetter(index: number): void {
    if (this.customAlphabetArray.length > 1) {
      this.customAlphabetArray.removeAt(index);
      this.computeResult();
    }
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

    // Si no hay mensaje o el alfabeto está vacío, resultado vacío
    if (!message || n === 0) {
      this.result.set('');
      return;
    }

    let output = '';

    // Procesar cada carácter del mensaje
    for (const char of message) {
      const upper = char.toUpperCase();
      const idx = alphabet.indexOf(upper);

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
      // Preservar mayúscula/minúscula del carácter original
      output += char === char.toLowerCase() ? newChar.toLowerCase() : newChar;
    }

    // Actualizar señal con el resultado final
    this.result.set(output);
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

  /* ─── Mostrar alfabeto activo ─── */
  get displayAlphabet(): string[] {
    return this.getActiveAlphabet();
  }
}
