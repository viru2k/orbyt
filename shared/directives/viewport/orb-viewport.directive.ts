import { ViewportService } from './../../../src/app/services/core/viewport/viewport.service';
import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  inject,
  OnDestroy,
  effect,
  EffectRef
} from '@angular/core';


@Directive({
  selector: '[orbViewport]',
  standalone: true
})
export class OrbViewportDirective implements OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private viewportService = inject(ViewportService);
  private effectRef: EffectRef | null = null;
  private isVisible = false;

  @Input() set orbViewport(condition: 'mobile' | 'desktop') {
    // Limpia cualquier efecto anterior
    this.effectRef?.destroy();

    // Crea nuevo efecto
    this.effectRef = effect(() => {
      const matches =
        condition === 'mobile'
          ? this.viewportService.isMobile()
          : this.viewportService.isDesktop();

      if (matches && !this.isVisible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      } else if (!matches && this.isVisible) {
        this.viewContainer.clear();
        this.isVisible = false;
      }
    });
  }

  ngOnDestroy() {
    this.effectRef?.destroy();
  }
}
