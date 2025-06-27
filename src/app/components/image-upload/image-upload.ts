import { Component, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.html',
  styleUrl: './image-upload.css',
  // Add this provider to hook it into Angular's forms API
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUpload),
      multi: true,
    },
  ],
})
// Implement the interface
export class ImageUpload implements ControlValueAccessor {
  public previewUrl = signal<string | ArrayBuffer | null>(null);
  public selectedFileName = signal<string | null>(null);
  public isDragging = signal(false);
  public isDisabled = signal(false);

  // --- Functions required by ControlValueAccessor ---
  onChange: (value: File | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(obj: any): void {
    // This method is called by the forms module to set the value.
    // We don't need to implement it for this use case.
  }

  registerOnChange(fn: (value: File | null) => void): void {
    this.onChange = fn; // Save the callback function
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }
  // --- End of ControlValueAccessor methods ---

  private readonly validFileTypes = [
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
  ];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
    this.onTouched(); // Notify that the control has been touched
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
    this.onTouched(); // Notify that the control has been touched
  }

  removeImage(): void {
    this.previewUrl.set(null);
    this.selectedFileName.set(null);
    this.onChange(null); // IMPORTANT: Notify the form that the value is now null
    this.onTouched();
  }

  private processFile(file: File): void {
    if (this.validFileTypes.includes(file.type)) {
      this.selectedFileName.set(file.name);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl.set(e.target.result);
      };
      reader.readAsDataURL(file);
      this.onChange(file); // IMPORTANT: Pass the new file object to the form
    } else {
      alert('Invalid file type. Please select a PNG, JPG, GIF, or SVG.');
      this.onChange(null); // Notify form of invalid state if needed
    }
  }
}
