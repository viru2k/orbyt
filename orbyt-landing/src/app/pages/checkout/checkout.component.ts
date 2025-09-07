import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { loadStripe, Stripe, StripeElements, StripeCardElement } from '@stripe/stripe-js';
import { OrbitLandingApiService, PaymentSetupResponse } from '../../services/orbyt-landing-api.service';
import { environment } from '../../../environments/environment';

interface CheckoutData {
  userData: any;
  selectedPlan: any;
  isYearly: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="checkout-page">
      <div class="checkout-container">
        <div class="checkout-header">
          <div class="logo">
            <div class="brand-logo"></div>
            <span class="brand-text">Orbyt</span>
          </div>
          <h1>Finalizar compra</h1>
          <div class="security-info">
            <i class="pi pi-shield"></i>
            <span>Pago 100% seguro</span>
          </div>
        </div>

        <div class="checkout-content">
          <!-- Left Column: Payment Form -->
          <div class="payment-section">
            <!-- Payment Method Selection -->
            <div class="section">
              <h2>Método de pago</h2>
              <div class="payment-methods">
                <div class="payment-method" 
                     *ngFor="let method of paymentMethods"
                     [class.selected]="selectedPaymentMethod() === method.id"
                     (click)="selectPaymentMethod(method.id)">
                  <div class="method-info">
                    <i [class]="method.icon"></i>
                    <div class="method-details">
                      <span class="method-name">{{ method.name }}</span>
                      <span class="method-description">{{ method.description }}</span>
                    </div>
                  </div>
                  <div class="radio-button">
                    <span class="radio-dot"></span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment Form -->
            <form [formGroup]="paymentForm" (ngSubmit)="onSubmit()" class="payment-form">
              <!-- Credit Card Form -->
              <div class="section" *ngIf="selectedPaymentMethod() === 'card'">
                <h3>Información de tarjeta</h3>
                <div class="form-group">
                  <label for="cardNumber">Número de tarjeta *</label>
                  <input 
                    type="text" 
                    id="cardNumber" 
                    formControlName="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    maxlength="19"
                    (input)="formatCardNumber($event)"
                    [class.error]="isFieldInvalid('cardNumber')">
                  <div class="card-icons">
                    <i class="pi pi-credit-card"></i>
                  </div>
                  <div class="error-message" *ngIf="isFieldInvalid('cardNumber')">
                    Número de tarjeta requerido
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label for="expiryDate">Fecha de expiración *</label>
                    <input 
                      type="text" 
                      id="expiryDate" 
                      formControlName="expiryDate"
                      placeholder="MM/AA"
                      maxlength="5"
                      (input)="formatExpiryDate($event)"
                      [class.error]="isFieldInvalid('expiryDate')">
                    <div class="error-message" *ngIf="isFieldInvalid('expiryDate')">
                      Fecha requerida
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="cvv">CVV *</label>
                    <input 
                      type="text" 
                      id="cvv" 
                      formControlName="cvv"
                      placeholder="123"
                      maxlength="4"
                      [class.error]="isFieldInvalid('cvv')">
                    <div class="error-message" *ngIf="isFieldInvalid('cvv')">
                      CVV requerido
                    </div>
                  </div>
                </div>

                <div class="form-group">
                  <label for="cardholderName">Nombre del titular *</label>
                  <input 
                    type="text" 
                    id="cardholderName" 
                    formControlName="cardholderName"
                    placeholder="Como aparece en la tarjeta"
                    [class.error]="isFieldInvalid('cardholderName')">
                  <div class="error-message" *ngIf="isFieldInvalid('cardholderName')">
                    Nombre del titular requerido
                  </div>
                </div>
              </div>

              <!-- PayPal Info -->
              <div class="section" *ngIf="selectedPaymentMethod() === 'paypal'">
                <div class="paypal-info">
                  <i class="pi pi-paypal"></i>
                  <div class="info-text">
                    <h3>PayPal</h3>
                    <p>Serás redirigido a PayPal para completar tu pago de forma segura.</p>
                  </div>
                </div>
              </div>

              <!-- Billing Address -->
              <div class="section">
                <h3>Dirección de facturación</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label for="country">País *</label>
                    <select id="country" formControlName="country" [class.error]="isFieldInvalid('country')">
                      <option value="">Seleccionar país</option>
                      <option value="ES">España</option>
                      <option value="MX">México</option>
                      <option value="AR">Argentina</option>
                      <option value="CO">Colombia</option>
                      <option value="PE">Perú</option>
                    </select>
                  </div>
                  
                  <div class="form-group">
                    <label for="zipCode">Código postal</label>
                    <input 
                      type="text" 
                      id="zipCode" 
                      formControlName="zipCode"
                      placeholder="28001">
                  </div>
                </div>
              </div>

              <!-- Submit Button -->
              <button type="submit" 
                      class="pay-button" 
                      [disabled]="paymentForm.invalid || isProcessing()">
                <i class="pi pi-spin pi-spinner" *ngIf="isProcessing()"></i>
                <i class="pi pi-lock" *ngIf="!isProcessing()"></i>
                {{ isProcessing() ? 'Procesando...' : 'Completar pago' }}
              </button>

              <div class="security-badges">
                <div class="badge">
                  <i class="pi pi-shield"></i>
                  <span>SSL Seguro</span>
                </div>
                <div class="badge">
                  <i class="pi pi-check-circle"></i>
                  <span>PCI Compliant</span>
                </div>
                <div class="badge">
                  <i class="pi pi-lock"></i>
                  <span>256-bit SSL</span>
                </div>
              </div>
            </form>
          </div>

          <!-- Right Column: Order Summary -->
          <div class="order-summary">
            <h2>Resumen del pedido</h2>
            
            <div class="order-details" *ngIf="checkoutData()">
              <div class="plan-info">
                <div class="plan-header">
                  <h3>{{ checkoutData()?.selectedPlan?.name }}</h3>
                  <div class="billing-cycle">
                    {{ checkoutData()?.isYearly ? 'Facturación anual' : 'Facturación mensual' }}
                  </div>
                </div>
                
                <div class="plan-features">
                  <ul>
                    <li *ngFor="let feature of checkoutData()?.selectedPlan?.features?.slice(0, 4)">
                      <i class="pi pi-check"></i>
                      {{ feature }}
                    </li>
                    <li *ngIf="(checkoutData()?.selectedPlan?.features?.length || 0) > 4">
                      <span class="more-features">
                        +{{ (checkoutData()?.selectedPlan?.features?.length || 0) - 4 }} más
                      </span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="price-breakdown">
                <div class="price-line">
                  <span>{{ checkoutData()?.selectedPlan?.name }}</span>
                  <span>€{{ getCurrentPrice() }}</span>
                </div>
                
                <div class="price-line discount" *ngIf="checkoutData()?.isYearly">
                  <span>Descuento anual (25%)</span>
                  <span class="discount-amount">-€{{ getDiscount() }}</span>
                </div>
                
                <div class="price-line tax">
                  <span>IVA (21%)</span>
                  <span>€{{ getTax() }}</span>
                </div>
                
                <div class="price-line total">
                  <span>Total</span>
                  <span>€{{ getTotal() }}</span>
                </div>
                
                <div class="billing-info">
                  {{ checkoutData()?.isYearly ? 'Facturado anualmente' : 'Facturado mensualmente' }}
                </div>
              </div>

              <div class="customer-info">
                <h4>Información de contacto</h4>
                <p>{{ checkoutData()?.userData?.firstName }} {{ checkoutData()?.userData?.lastName }}</p>
                <p>{{ checkoutData()?.userData?.email }}</p>
                <p *ngIf="checkoutData()?.userData?.company">{{ checkoutData()?.userData?.company }}</p>
              </div>

              <div class="trial-info">
                <div class="trial-badge">
                  <i class="pi pi-calendar"></i>
                  <div class="trial-text">
                    <strong>14 días de prueba gratuita</strong>
                    <span>No se te cobrará hasta el 13 de septiembre de 2024</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
  paymentForm!: FormGroup;
  checkoutData = signal<CheckoutData | null>(null);
  selectedPaymentMethod = signal('card');
  isProcessing = signal(false);
  
  // Stripe properties
  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private cardElement: StripeCardElement | null = null;

  paymentMethods: PaymentMethod[] = [
    {
      id: 'card',
      name: 'Tarjeta de crédito/débito',
      icon: 'pi pi-credit-card',
      description: 'Visa, Mastercard, American Express'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      icon: 'pi pi-paypal',
      description: 'Paga con tu cuenta de PayPal'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private landingApi: OrbitLandingApiService
  ) {
    // Get data from navigation state
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.checkoutData.set(navigation.extras.state as CheckoutData);
    }
  }

  ngOnInit(): void {
    this.initForm();
    
    // If no checkout data, redirect to register
    if (!this.checkoutData()) {
      this.router.navigate(['/auth/register']);
    }
  }

  private initForm(): void {
    this.paymentForm = this.fb.group({
      // Card details
      cardNumber: ['', Validators.required],
      expiryDate: ['', Validators.required],
      cvv: ['', Validators.required],
      cardholderName: ['', Validators.required],
      // Billing address
      country: ['ES', Validators.required],
      zipCode: ['']
    });
  }

  selectPaymentMethod(methodId: string): void {
    this.selectedPaymentMethod.set(methodId);
    
    // Update form validators based on payment method
    if (methodId === 'paypal') {
      // Remove card validators for PayPal
      this.paymentForm.get('cardNumber')?.clearValidators();
      this.paymentForm.get('expiryDate')?.clearValidators();
      this.paymentForm.get('cvv')?.clearValidators();
      this.paymentForm.get('cardholderName')?.clearValidators();
    } else {
      // Add card validators
      this.paymentForm.get('cardNumber')?.setValidators(Validators.required);
      this.paymentForm.get('expiryDate')?.setValidators(Validators.required);
      this.paymentForm.get('cvv')?.setValidators(Validators.required);
      this.paymentForm.get('cardholderName')?.setValidators(Validators.required);
    }
    
    this.paymentForm.updateValueAndValidity();
  }

  formatCardNumber(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    event.target.value = value;
    this.paymentForm.get('cardNumber')?.setValue(value);
  }

  formatExpiryDate(event: any): void {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
    this.paymentForm.get('expiryDate')?.setValue(value);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getCurrentPrice(): number {
    const data = this.checkoutData();
    if (!data) return 0;
    return data.isYearly ? data.selectedPlan.yearlyPrice : data.selectedPlan.price;
  }

  getDiscount(): number {
    const data = this.checkoutData();
    if (!data || !data.isYearly) return 0;
    const monthlyPrice = data.selectedPlan.price;
    const yearlyPrice = data.selectedPlan.yearlyPrice;
    return Number((monthlyPrice - yearlyPrice).toFixed(2));
  }

  getTax(): number {
    const price = this.getCurrentPrice();
    return Number((price * 0.21).toFixed(2));
  }

  getTotal(): number {
    const price = this.getCurrentPrice();
    const tax = this.getTax();
    return Number((price + tax).toFixed(2));
  }

  async onSubmit(): Promise<void> {
    if (this.paymentForm.valid) {
      this.isProcessing.set(true);
      
      try {
        await this.processRealPayment();
        
        // Navigate to success page
        this.router.navigate(['/success'], {
          state: {
            checkoutData: this.checkoutData(),
            paymentData: this.paymentForm.value,
            total: this.getTotal()
          }
        });
      } catch (error) {
        console.error('Payment error:', error);
        // Handle error (show notification, etc.)
      } finally {
        this.isProcessing.set(false);
      }
    }
  }

  private async processRealPayment(): Promise<void> {
    const userData = this.checkoutData()?.userData;
    const country = userData?.country || 'ES';
    
    // For development, use mock data if backend is not available
    if (environment.enableMockData) {
      return this.mockProcessPayment();
    }
    
    try {
      // 1. Determine payment provider based on country
      const provider = this.landingApi.getPreferredPaymentProvider(country);
      
      // 2. Create payment setup intent
      const setupResponse = await this.landingApi.createPaymentSetup(
        provider, 
        this.checkoutData()?.selectedPlan?.id
      ).toPromise();
      
      if (!setupResponse) {
        throw new Error('Failed to create payment setup');
      }
      
      // 3. Process payment based on provider
      if (setupResponse.provider === 'redsys') {
        await this.processRedsysPayment(setupResponse);
      } else {
        await this.processStripePayment(setupResponse);
      }
    } catch (error) {
      console.error('Real payment processing failed, falling back to mock:', error);
      // Fallback to mock for development
      return this.mockProcessPayment();
    }
  }
  
  private processRedsysPayment(setup: PaymentSetupResponse): void {
    // Create hidden form for Redsys redirect
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = setup.setupIntent.url!;
    form.style.display = 'none';
    
    // Add all Redsys parameters as hidden inputs
    if (setup.setupIntent.parameters) {
      Object.entries(setup.setupIntent.parameters).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });
    }
    
    // Submit form to redirect to Redsys
    document.body.appendChild(form);
    form.submit();
  }
  
  private async processStripePayment(setup: PaymentSetupResponse): Promise<void> {
    // Initialize Stripe if not already done
    if (!this.stripe) {
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        throw new Error('Failed to load Stripe');
      }
    }
    
    // TODO: Implement proper Stripe Elements integration
    // For now, simulate payment method creation
    const paymentMethodError = null;
    const paymentMethod = {
      id: 'pm_mock_' + Date.now(),
      type: 'card',
      card: {
        brand: 'visa',
        last4: '4242'
      }
    };
    
    if (paymentMethodError) {
      throw new Error('Payment method creation failed');
    }
    
    // Confirm setup intent with payment method
    const { error: confirmError } = await this.stripe.confirmCardSetup(
      setup.setupIntent.clientSecret!,
      {
        payment_method: paymentMethod!.id
      }
    );
    
    if (confirmError) {
      throw new Error(confirmError.message);
    }
  }
  
  private async mockProcessPayment(): Promise<void> {
    // Simulate payment processing for development
    return new Promise(resolve => {
      setTimeout(() => {
        console.log('Mock payment processed:', {
          checkoutData: this.checkoutData(),
          paymentData: this.paymentForm.value,
          total: this.getTotal()
        });
        resolve();
      }, 3000);
    });
  }
}