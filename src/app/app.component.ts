import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SpinnerService } from '@orb-services';
import { ProgressSpinnerModule } from 'primeng/progressspinner';


@Component({
  imports: [ RouterModule, ProgressSpinnerModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'orbyt';
  spinner = inject(SpinnerService);
}
