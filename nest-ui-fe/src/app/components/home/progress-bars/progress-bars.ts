import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-bars',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './progress-bars.html',
  styleUrl: './progress-bars.css',
})
export class ProgressBars {
  isProcessing = input<boolean>(false);
  processingProgress = input<number>(0);
  isGeneratingPDF = input<boolean>(false);
  pdfProgress = input<number>(0);
}
