import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'orb-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="orb-chart-container" [style.height]="height + 'px'">
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styleUrls: ['./orb-chart.component.scss']
})
export class OrbChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas', { static: true }) chartCanvas!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'line';
  @Input() data: any = {};
  @Input() options: any = {};
  @Input() height: number = 300;
  @Input() width: string | number = '100%';

  private chart: Chart | null = null;

  ngAfterViewInit() {
    this.initChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  private initChart() {
    if (this.chart) {
      this.chart.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const defaultOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            padding: 20,
            usePointStyle: true,
            color: '#64748b'
          }
        }
      }
    };

    const config: ChartConfiguration = {
      type: this.type,
      data: this.data,
      options: {
        ...defaultOptions,
        ...this.options
      }
    };

    this.chart = new Chart(ctx, config);
  }

  updateChart(data: any, options?: any) {
    if (this.chart) {
      this.chart.data = data;
      if (options) {
        this.chart.options = { ...this.chart.options, ...options };
      }
      this.chart.update();
    }
  }
}