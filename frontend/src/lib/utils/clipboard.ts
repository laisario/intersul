import { showSuccess, showError } from '$lib/utils/toast.js';

export async function copyToClipboard(text: string, successMessage = 'Copiado!'): Promise<void> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    showSuccess(successMessage);
  } catch {
    showError('Não foi possível copiar. Tente novamente.');
  }
}
