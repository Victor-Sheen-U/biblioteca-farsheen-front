import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent, LucideIconName } from '../icon/icon.component';

@Component({
  selector: 'app-a11y-toggle-card',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './a11y-toggle-card.component.html',
  styleUrl: './a11y-toggle-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class A11yToggleCardComponent {
  readonly icon = input.required<LucideIconName>();
  readonly label = input.required<string>();
  readonly stateText = input<string>('');
  readonly active = input<boolean>(false);

  readonly toggled = output<void>();

  onToggle(): void {
    this.toggled.emit();
  }
}
