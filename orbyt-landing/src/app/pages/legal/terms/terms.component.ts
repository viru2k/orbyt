import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="legal-page">
      <div class="container">
        <div class="legal-header">
          <nav class="legal-nav">
            <a routerLink="/legal/terms" routerLinkActive="active">Términos de Servicio</a>
            <a routerLink="/legal/privacy" routerLinkActive="active">Política de Privacidad</a>
            <a routerLink="/legal/cookies" routerLinkActive="active">Política de Cookies</a>
          </nav>
        </div>

        <div class="legal-content">
          <header class="legal-title">
            <h1>Términos y Condiciones de Servicio</h1>
            <p class="last-updated">Última actualización: {{ lastUpdated }}</p>
          </header>

          <div class="legal-sections">
            <section class="legal-section">
              <h2>1. Aceptación de los Términos</h2>
              <p>
                Al acceder y utilizar la plataforma ORBYT (el "Servicio"), usted acepta cumplir y estar sujeto 
                a estos Términos y Condiciones de Servicio ("Términos"). Si no está de acuerdo con todos los 
                términos y condiciones de este acuerdo, no debe utilizar este servicio.
              </p>
              <p>
                Estos términos se aplican a todos los visitantes, usuarios y otros que accedan o utilicen el servicio.
              </p>
            </section>

            <section class="legal-section">
              <h2>2. Descripción del Servicio</h2>
              <p>
                ORBYT es una plataforma SaaS (Software as a Service) diseñada para la gestión integral de 
                negocios profesionales, incluyendo pero no limitado a:
              </p>
              <ul>
                <li>Gestión de citas y agendas</li>
                <li>Sistema de facturación</li>
                <li>CRM y gestión de clientes</li>
                <li>Control de inventario</li>
                <li>Análisis y reportes</li>
                <li>Herramientas de comunicación</li>
              </ul>
            </section>

            <section class="legal-section">
              <h2>3. Registro y Cuenta de Usuario</h2>
              <h3>3.1 Requisitos de Registro</h3>
              <p>
                Para utilizar el Servicio, debe crear una cuenta proporcionando información precisa, 
                actual y completa según se solicita en el formulario de registro.
              </p>
              
              <h3>3.2 Responsabilidad de la Cuenta</h3>
              <p>
                Usted es responsable de mantener la confidencialidad de su cuenta y contraseña, 
                y de todas las actividades que ocurran bajo su cuenta.
              </p>
              
              <h3>3.3 Uso Autorizado</h3>
              <p>
                Su cuenta es para su uso personal o empresarial exclusivo. No puede compartir, 
                vender, transferir o permitir que otros accedan a su cuenta.
              </p>
            </section>

            <section class="legal-section">
              <h2>4. Planes de Suscripción y Facturación</h2>
              <h3>4.1 Planes Disponibles</h3>
              <p>
                ORBYT ofrece diferentes planes de suscripción con características y limitaciones específicas. 
                Los detalles de cada plan están disponibles en nuestra página de precios.
              </p>
              
              <h3>4.2 Periodo de Prueba</h3>
              <p>
                Ofrecemos un periodo de prueba gratuito de 14 días para nuevos usuarios. 
                Durante este periodo, tendrá acceso completo a las funcionalidades del plan Professional.
              </p>
              
              <h3>4.3 Facturación y Pagos</h3>
              <ul>
                <li>Los pagos se procesarán mensual o anualmente según su plan elegido</li>
                <li>Los precios están en euros (EUR) e incluyen los impuestos aplicables</li>
                <li>Los pagos se cobran por adelantado al inicio de cada periodo de facturación</li>
                <li>Aceptamos tarjetas de crédito/débito y transferencias bancarias</li>
              </ul>
              
              <h3>4.4 Cambios de Plan</h3>
              <p>
                Puede actualizar o degradar su plan en cualquier momento desde su panel de control. 
                Los cambios entrarán en vigor en el siguiente ciclo de facturación.
              </p>
            </section>

            <section class="legal-section">
              <h2>5. Uso Aceptable</h2>
              <h3>5.1 Usos Permitidos</h3>
              <p>
                El Servicio debe utilizarse únicamente para propósitos legales y de acuerdo con estos Términos.
              </p>
              
              <h3>5.2 Usos Prohibidos</h3>
              <p>No debe usar el Servicio para:</p>
              <ul>
                <li>Actividades ilegales o que violen cualquier ley aplicable</li>
                <li>Enviar spam, malware o contenido malicioso</li>
                <li>Interferir con la seguridad del Servicio</li>
                <li>Intentar acceder a sistemas o datos no autorizados</li>
                <li>Realizar ingeniería inversa del software</li>
                <li>Revender el servicio sin autorización escrita</li>
              </ul>
            </section>

            <section class="legal-section">
              <h2>6. Protección de Datos y Privacidad</h2>
              <p>
                El tratamiento de sus datos personales se rige por nuestra 
                <a routerLink="/legal/privacy" class="legal-link">Política de Privacidad</a>, 
                que forma parte integral de estos términos.
              </p>
              <p>
                Cumplimos con el Reglamento General de Protección de Datos (GDPR) de la Unión Europea 
                y la Ley Orgánica de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD) de España.
              </p>
            </section>

            <section class="legal-section">
              <h2>7. Propiedad Intelectual</h2>
              <h3>7.1 Derechos de ORBYT</h3>
              <p>
                El Servicio y todo su contenido, características y funcionalidades son propiedad 
                de ORBYT y están protegidos por derechos de autor, marcas comerciales y otras leyes.
              </p>
              
              <h3>7.2 Sus Datos</h3>
              <p>
                Usted mantiene todos los derechos sobre los datos que carga en la plataforma. 
                Le otorgamos una licencia limitada para usar nuestro Servicio para procesar sus datos.
              </p>
              
              <h3>7.3 Licencia de Uso</h3>
              <p>
                Le otorgamos una licencia limitada, no exclusiva, no transferible y revocable 
                para usar el Servicio según estos términos.
              </p>
            </section>

            <section class="legal-section">
              <h2>8. Cancelación y Terminación</h2>
              <h3>8.1 Cancelación por el Usuario</h3>
              <p>
                Puede cancelar su suscripción en cualquier momento desde su panel de control. 
                La cancelación será efectiva al final del periodo de facturación actual.
              </p>
              
              <h3>8.2 Terminación por Violación</h3>
              <p>
                Nos reservamos el derecho de suspender o terminar su cuenta si viola estos términos 
                o utiliza el Servicio de manera no autorizada.
              </p>
              
              <h3>8.3 Efecto de la Terminación</h3>
              <p>
                Al terminar su cuenta, perderá el acceso al Servicio y a todos los datos almacenados. 
                Puede exportar sus datos antes de la cancelación.
              </p>
            </section>

            <section class="legal-section">
              <h2>9. Limitación de Responsabilidad</h2>
              <p>
                ORBYT proporciona el servicio "tal como está" y no garantiza que será ininterrumpido, 
                libre de errores o completamente seguro.
              </p>
              <p>
                En ningún caso ORBYT será responsable por daños indirectos, incidentales, especiales, 
                consecuentes o punitivos, incluyendo pero no limitado a pérdida de beneficios, datos o uso.
              </p>
              <p>
                Nuestra responsabilidad total hacia usted por cualquier reclamación no excederá 
                la cantidad pagada por usted durante los 12 meses anteriores.
              </p>
            </section>

            <section class="legal-section">
              <h2>10. Indemnización</h2>
              <p>
                Usted acepta indemnizar y mantener indemne a ORBYT de cualquier reclamación, 
                daño, pérdida o gasto (incluyendo honorarios legales) que surjan de:
              </p>
              <ul>
                <li>Su uso del Servicio</li>
                <li>Su violación de estos términos</li>
                <li>Su violación de derechos de terceros</li>
                <li>Su contenido o datos</li>
              </ul>
            </section>

            <section class="legal-section">
              <h2>11. Cambios en los Términos</h2>
              <p>
                Nos reservamos el derecho de modificar estos términos en cualquier momento. 
                Le notificaremos sobre cambios importantes por email o a través del Servicio.
              </p>
              <p>
                Su uso continuado del Servicio después de los cambios constituye su aceptación 
                de los nuevos términos.
              </p>
            </section>

            <section class="legal-section">
              <h2>12. Ley Aplicable y Jurisdicción</h2>
              <p>
                Estos términos se regirán e interpretarán de acuerdo con las leyes de España.
              </p>
              <p>
                Cualquier disputa que surja en relación con estos términos será sometida 
                a la jurisdicción exclusiva de los tribunales de Madrid, España.
              </p>
            </section>

            <section class="legal-section">
              <h2>13. Información de Contacto</h2>
              <p>
                Si tiene preguntas sobre estos Términos y Condiciones, puede contactarnos en:
              </p>
              <div class="contact-info">
                <p><strong>Email:</strong> legal@orbyt.es</p>
                <p><strong>Teléfono:</strong> +34 900 123 456</p>
                <p><strong>Dirección:</strong> 
                  Calle de la Innovación, 123<br>
                  28001 Madrid, España
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['../legal.component.scss']
})
export class TermsComponent {
  lastUpdated = '7 de septiembre de 2024';
}