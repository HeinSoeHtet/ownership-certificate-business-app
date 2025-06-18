import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  imports: [],
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css',
})
export class ImageUpload {
  // Component state is now managed by writable signals.
  public previewUrl = signal<string | ArrayBuffer | null>(null);
  public selectedFileName = signal<string | null>(null);
  public isDragging = signal(false);

  private readonly validFileTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
  ];

  // --- Drag and Drop Event Handlers ---

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true); // Update signal value
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false); // Update signal value
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false); // Update signal value

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  // --- File Selection Handler ---

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  removeImage(): void {
    // Reset signals to their initial state.
    this.previewUrl.set(null);
    this.selectedFileName.set(null);
  }

  private processFile(file: File): void {
    if (this.validFileTypes.includes(file.type)) {
      this.selectedFileName.set(file.name); // Update signal value
      const reader = new FileReader();

      reader.onload = (e: any) => {
        // This is the key change for zoneless:
        // Simply update the signal's value. Angular's template will react automatically.
        this.previewUrl.set(e.target.result);
      };

      reader.readAsDataURL(file);
    } else {
      alert('Invalid file type. Please select a PNG, JPG, GIF, or SVG.');
    }
  }
}
