import { Component, input, output, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Icon } from '@shared/icon/icon';
import { Badge } from '@shared/badge/badge';
import { Button } from '@shared/button/button';
import { Input } from '@shared/input/input';

@Component({
  selector: 'app-path-configuration-panel',
  standalone: true,
  imports: [CommonModule, Icon, Badge, Button, Input],
  templateUrl: './path-configuration-panel.html',
  styleUrl: './path-configuration-panel.css',
})
export class PathConfigurationPanel {
  // Inputs
  basePath = model.required<string>();
  outputPath = model.required<string>();
  showWarning = input<boolean>(false);
  isExpanded = input<boolean>(false);

  // Outputs
  basePathBlur = output<void>();
  outputPathBlur = output<void>();
  browseBasePath = output<void>();
  browseOutputPath = output<void>();
  expandedChange = output<boolean>();

  toggleExpanded(): void {
    this.expandedChange.emit(!this.isExpanded());
  }
}
