import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

interface SuccessData {
  checkoutData: any;
  paymentData: any;
  total: number;
}

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="success-page">
      <div class="success-container">
        <div class="success-content">
          <!-- Success Icon -->
          <div class="success-icon">
            <i class="pi pi-check-circle"></i>
          </div>

          <!-- Success Message -->
          <div class="success-message">
            <h1>¡Bienvenido a Orbyt!</h1>
            <p>Tu cuenta ha sido creada exitosamente y tu suscripción está activa.</p>
          </div>

          <!-- Order Details -->
          <div class="order-details" *ngIf="successData()">
            <div class="order-summary-card">
              <h2>Resumen de tu suscripción</h2>
              
              <div class="subscription-info">
                <div class="plan-details">
                  <div class="plan-header">
                    <h3>{{ successData()?.checkoutData?.selectedPlan?.name }}</h3>
                    <div class="plan-price">
                      €{{ getCurrentPrice() }}
                      {{ successData()?.checkoutData?.isYearly ? '/año' : '/mes' }}
                    </div>
                  </div>
                  <div class="billing-type">
                    {{ successData()?.checkoutData?.isYearly ? 'Facturación anual' : 'Facturación mensual' }}
                  </div>
                </div>

                <div class="customer-details">
                  <h4>Información de cuenta</h4>
                  <p><strong>Nombre:</strong> {{ getCustomerName() }}</p>
                  <p><strong>Email:</strong> {{ successData()?.checkoutData?.userData?.email }}</p>
                  <p *ngIf="successData()?.checkoutData?.userData?.company">
                    <strong>Empresa:</strong> {{ successData()?.checkoutData?.userData?.company }}
                  </p>
                </div>

                <div class="payment-details">
                  <h4>Detalles del pago</h4>
                  <p><strong>Total pagado:</strong> €{{ successData()?.total }}</p>
                  <p><strong>Método de pago:</strong> Tarjeta terminada en ****1234</p>
                  <p><strong>Fecha:</strong> {{ getCurrentDate() }}</p>
                </div>
              </div>
            </div>

            <!-- Trial Information -->
            <div class="trial-info-card">
              <div class="trial-header">
                <i class="pi pi-calendar"></i>
                <h3>Tu prueba gratuita de 14 días</h3>
              </div>
              <div class="trial-details">
                <p>Tu prueba gratuita comenzó hoy y termina el <strong>{{ getTrialEndDate() }}</strong>.</p>
                <p>Durante este período tendrás acceso completo a todas las funciones de tu plan {{ successData()?.checkoutData?.selectedPlan?.name }}.</p>
                <div class="trial-features">
                  <h4>Lo que puedes hacer ahora:</h4>
                  <ul>
                    <li><i class="pi pi-check"></i> Acceder a tu dashboard personal</li>
                    <li><i class="pi pi-check"></i> Configurar tu perfil y empresa</li>
                    <li><i class="pi pi-check"></i> Comenzar a agregar clientes</li>
                    <li><i class="pi pi-check"></i> Crear tu primera factura</li>
                    <li><i class="pi pi-check"></i> Explorar todas las funciones</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Next Steps -->
            <div class="next-steps-card">
              <h3>Próximos pasos</h3>
              <div class="steps-grid">
                <div class="step">
                  <div class="step-number">1</div>
                  <div class="step-content">
                    <h4>Confirma tu email</h4>
                    <p>Revisa tu bandeja de entrada y confirma tu dirección de email para activar todas las funciones.</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">2</div>
                  <div class="step-content">
                    <h4>Configura tu perfil</h4>
                    <p>Personaliza tu perfil y la información de tu empresa para comenzar.</p>
                  </div>
                </div>
                <div class="step">
                  <div class="step-number">3</div>
                  <div class="step-content">
                    <h4>Explora Orbyt</h4>
                    <p>Descubre todas las funciones y comienza a gestionar tu negocio de manera más eficiente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons">
            <button class="primary-button" (click)="goToDashboard()">
              <i class="pi pi-arrow-right"></i>
              Ir a mi Dashboard
            </button>
            <button class="secondary-button" (click)="downloadReceipt()">
              <i class="pi pi-download"></i>
              Descargar Recibo
            </button>
          </div>

          <!-- Support Information -->
          <div class="support-info">
            <h4>¿Necesitas ayuda?</h4>
            <p>Nuestro equipo de soporte está disponible para ayudarte a comenzar.</p>
            <div class="support-links">
              <a href="#" class="support-link">
                <i class="pi pi-book"></i>
                Guía de inicio
              </a>
              <a href="#" class="support-link">
                <i class="pi pi-question-circle"></i>
                Centro de ayuda
              </a>
              <a href="#" class="support-link">
                <i class="pi pi-envelope"></i>
                Contactar soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./success.component.scss']
})
export class SuccessComponent implements OnInit {
  successData = signal<SuccessData | null>(null);

  constructor(private router: Router) {
    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.successData.set(navigation.extras.state as SuccessData);
    }
  }

  ngOnInit(): void {
    // If no success data, redirect to home
    if (!this.successData()) {
      this.router.navigate(['/']);
    }
  }

  getCurrentPrice(): number {
    const data = this.successData();
    if (!data) return 0;
    return data.checkoutData.isYearly 
      ? data.checkoutData.selectedPlan.yearlyPrice 
      : data.checkoutData.selectedPlan.price;
  }

  getCustomerName(): string {
    const data = this.successData();
    if (!data) return '';
    const userData = data.checkoutData.userData;
    return `${userData.firstName} ${userData.lastName}`;
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  getTrialEndDate(): string {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 14);
    return endDate.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goToDashboard(): void {
    // In a real app, this would redirect to the main application    
    alert('En una aplicación real, esto te redirigiría al dashboard principal de Orbyt.');
  }

  downloadReceipt(): void {
    // Mock receipt download    
    alert('Descargando recibo... (funcionalidad simulada)');
  }
}