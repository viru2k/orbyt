

// shared/components/orb-table/orb-table.component.ts
import { Component, Input, Output, EventEmitter, ViewChild, ContentChildren, QueryList, TemplateRef, AfterContentInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // << AÑADIDO FormsModule
import { TableModule, Table, TablePageEvent, TableFilterEvent } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenuModule, Menu } from 'primeng/menu';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeTemplate, MenuItem, SortEvent, SortMeta } from 'primeng/api';
import { OrbButtonComponent } from '../orb-button/orb-button.component';
import { OrbActionItem, OrbTableFeatures, TableColumn } from '@orb-models';
import { IconField } from 'primeng/iconfield';
import { InputIcon } from 'primeng/inputicon';


@Component({
  selector: 'orb-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // << AÑADIDO FormsModule
    TableModule,
    ButtonModule,
    InputTextModule,
    MenuModule,
    TooltipModule,
    InputIcon,
    IconField
  ],
  templateUrl: './orb-table.component.html',
  styleUrls: ['./orb-table.component.scss'],
})
// Cambiada la restricción de T para permitir indexación por string
export class OrbTableComponent<T extends Record<string, any>> implements OnInit, AfterContentInit {
  // Entradas de Datos y Columnas
  @Input() value: T[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() loading: boolean = false;

  // Nuevas entradas para configuración
  @Input() tableFeatures: OrbTableFeatures = {
    showGlobalSearch: true,
    globalSearchPlaceholder: 'Buscar...',
  };
  @Input() rowActions: OrbActionItem<T>[] = [];
  @Input() tableHeaderActions: OrbActionItem[] = [];

  // Entradas existentes
  @Input() totalRecords: number = 0;
  @Input() rows: number = 10;
  @Input() first: number = 0;
  @Input() paginator: boolean = true;
  @Input() sortable: boolean = true;
  @Input() selectionMode: 'single' | 'multiple' | null = null;
  @Input() selection?: T | T[];
  @Input() dataKey: string = 'id'; // dataKey sigue siendo string, T ahora lo permite
  @Input() caption?: string;

  // Salidas de eventos
  @Output() onPageChange = new EventEmitter<TablePageEvent>();
  @Output() onSortChange = new EventEmitter<SortEvent>();
  @Output() onFilterChange = new EventEmitter<TableFilterEvent>();
  @Output() selectionChange = new EventEmitter<any>();
  @Output() onRowSelect = new EventEmitter<any>();
  @Output() onRowUnselect = new EventEmitter<any>();
   @Input() globalFilterFields: string[] = [];
 
  // Para plantillas personalizadas (inicializadas a null)
  @ContentChildren(PrimeTemplate) templates?: QueryList<PrimeTemplate>;
  headerTemplate: TemplateRef<any> | null = null;
  bodyTemplate: TemplateRef<any> | null = null;
  captionTemplate: TemplateRef<any> | null = null;
  footerTemplate: TemplateRef<any> | null = null;
  summaryTemplate: TemplateRef<any> | null = null;
  colGroupTemplate: TemplateRef<any> | null = null;
  emptyMessageTemplate: TemplateRef<any> | null = null;
  paginatorLeftTemplate: TemplateRef<any> | null = null;
  paginatorRightTemplate: TemplateRef<any> | null = null;


  // Interno para el menú de acciones de fila
  protected currentRowMenuItems: MenuItem[] = [];
  @ViewChild('rowActionMenuRef') rowActionMenu!: Menu;

  // Interno para el menú de acciones de cabecera de tabla
  protected tableHeaderMenuItems: MenuItem[] = [];
  @ViewChild('tableHeaderActionMenuRef') tableHeaderActionMenu!: Menu;

  globalFilterValue: string = ''; // Para ngModel

  ngOnInit() {
    if (this.tableHeaderActions.length > 0) {
      this.tableHeaderMenuItems = this._mapActionsToMenuItems(this.tableHeaderActions);
    }
  }

  ngAfterContentInit() {
    this.templates?.forEach((item) => {
      switch (item.getType()) {
        case 'header': this.headerTemplate = item.template; break;
        case 'body': this.bodyTemplate = item.template; break;
        case 'caption': this.captionTemplate = item.template; break;
        case 'footer': this.footerTemplate = item.template; break;
        case 'summary': this.summaryTemplate = item.template; break;
        case 'colgroup': this.colGroupTemplate = item.template; break;
        case 'emptymessage': this.emptyMessageTemplate = item.template; break;
        case 'paginatorleft': this.paginatorLeftTemplate = item.template; break;
        case 'paginatorright': this.paginatorRightTemplate = item.template; break;
      }
    });
  }

  protected _mapActionsToMenuItems(actions: OrbActionItem<T>[], rowData?: T): MenuItem[] {
    return actions
      .filter(customAction => {
        const visible = typeof customAction.visible === 'function' ? customAction.visible(rowData) : customAction.visible;
        return visible !== false;
      })
      .map(customAction => {
        const menuItem: MenuItem = {
          label: customAction.label,
          icon: customAction.icon,
          styleClass: customAction.styleClass,
          tooltip: customAction.tooltip,
          tooltipPosition: customAction.tooltipPosition,
          disabled: typeof customAction.disabled === 'function' ? customAction.disabled(rowData) : customAction.disabled,
          command: () => { // No se necesita 'event' si no se usa
            if (customAction.action) {
              customAction.action(rowData);
            }
          }
        };
        if (customAction.items && customAction.items.length > 0) {
          menuItem.items = this._mapActionsToMenuItems(customAction.items, rowData);
        }
        return menuItem;
      });
  }



  toggleRowMenu(menu: Menu, event: MouseEvent, rowData: T) {
    this.currentRowMenuItems = this._mapActionsToMenuItems(this.rowActions, rowData);
    if (this.currentRowMenuItems.length > 0) {
      menu.toggle(event);
    }
    event.stopPropagation();
  }

  toggleTableHeaderMenu(menu: Menu, event: MouseEvent) {
    if (this.tableHeaderMenuItems.length > 0) {
      menu.toggle(event);
    }
    event.stopPropagation();
  }

  isActionsColumn(col: TableColumn): boolean {
    return col.field === 'actions';
  }

  
}