import { Injectable } from '@angular/core';
import { Observable, combineLatest, map, catchError, of } from 'rxjs';

// API Services
import { ServiceItemsService } from '../../api/services/service-items.service';
import { ProductsService } from '../../api/services/products.service';

// DTOs
import { ItemSelectorResponseDto } from '../../api/models/item-selector-response-dto';
import { ProductResponseDto } from '../../api/models/product-response-dto';

// Types
export interface ServiceItem {
  id: number;
  name: string;
  price: number;
  type: 'service' | 'product';
  description?: string;
  status: string;
  category?: string;
}

export interface ServiceSearchOptions {
  query?: string;
  type?: 'service' | 'product' | 'all';
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ServiceManagementService {

  constructor(
    private serviceItemsService: ServiceItemsService,
    private productsService: ProductsService
  ) {}

  /**
   * Obtener todos los items (servicios + productos) para selección
   */
  getAllItems(): Observable<ItemSelectorResponseDto[]> {
    return this.serviceItemsService.serviceItemsControllerGetItems().pipe(
      catchError(error => {
        console.error('Error loading service items:', error);
        return of([]);
      })
    );
  }

  /**
   * Buscar items con filtros avanzados
   */
  searchItems(options: ServiceSearchOptions = {}): Observable<ServiceItem[]> {
    return this.getAllItems().pipe(
      map(items => {
        let filtered = items;

        // Filter by query (name search)
        if (options.query?.trim()) {
          const query = options.query.toLowerCase().trim();
          filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            (item.description && item.description.toLowerCase().includes(query))
          );
        }

        // Filter by type
        if (options.type && options.type !== 'all') {
          filtered = filtered.filter(item => item.type === options.type);
        }

        // Filter by price range
        if (options.minPrice !== undefined) {
          filtered = filtered.filter(item => item.price >= options.minPrice!);
        }
        if (options.maxPrice !== undefined) {
          filtered = filtered.filter(item => item.price <= options.maxPrice!);
        }

        // Convert to ServiceItem format
        return filtered.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type as 'service' | 'product',
          description: item.description,
          status: 'active', // Default since ItemSelectorResponseDto doesn't have status
          category: item.category
        }));
      }),
      catchError(error => {
        console.error('Error searching items:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtener solo servicios
   */
  getServices(searchQuery?: string): Observable<ServiceItem[]> {
    return this.searchItems({
      type: 'service',
      query: searchQuery
    });
  }

  /**
   * Obtener solo productos como items de servicio
   */
  getProductsAsServiceItems(searchQuery?: string): Observable<ServiceItem[]> {
    return this.searchItems({
      type: 'product',
      query: searchQuery
    });
  }

  /**
   * Obtener estadísticas de servicios e items
   */
  getServiceStats(): Observable<{
    totalItems: number;
    totalServices: number;
    totalProducts: number;
    averageServicePrice: number;
    averageProductPrice: number;
    totalValue: number;
  }> {
    return this.getAllItems().pipe(
      map(items => {
        const services = items.filter(item => item.type === 'service');
        const products = items.filter(item => item.type === 'product');

        const averageServicePrice = services.length > 0
          ? services.reduce((sum, s) => sum + s.price, 0) / services.length
          : 0;

        const averageProductPrice = products.length > 0
          ? products.reduce((sum, p) => sum + p.price, 0) / products.length
          : 0;

        const totalValue = items.reduce((sum, item) => sum + item.price, 0);

        return {
          totalItems: items.length,
          totalServices: services.length,
          totalProducts: products.length,
          averageServicePrice,
          averageProductPrice,
          totalValue
        };
      }),
      catchError(error => {
        console.error('Error calculating service stats:', error);
        return of({
          totalItems: 0,
          totalServices: 0,
          totalProducts: 0,
          averageServicePrice: 0,
          averageProductPrice: 0,
          totalValue: 0
        });
      })
    );
  }

  /**
   * Obtener items más caros
   */
  getTopPricedItems(limit: number = 10): Observable<ServiceItem[]> {
    return this.getAllItems().pipe(
      map(items => {
        return items
          .sort((a, b) => b.price - a.price)
          .slice(0, limit)
          .map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            type: item.type as 'service' | 'product',
            description: item.description,
            status: 'active',
            category: item.category
          }));
      })
    );
  }

  /**
   * Obtener items por rango de precio
   */
  getItemsByPriceRange(minPrice: number, maxPrice: number): Observable<ServiceItem[]> {
    return this.searchItems({
      minPrice,
      maxPrice
    });
  }

  /**
   * Obtener sugerencias para autocompletado
   */
  getItemSuggestions(query: string, limit: number = 5): Observable<ServiceItem[]> {
    if (!query.trim()) {
      return of([]);
    }

    return this.searchItems({
      query: query.trim()
    }).pipe(
      map(items => items.slice(0, limit))
    );
  }

  /**
   * Obtener item por ID
   */
  getItemById(id: number): Observable<ServiceItem | null> {
    return this.getAllItems().pipe(
      map(items => {
        const item = items.find(item => item.id === id);
        if (!item) return null;

        return {
          id: item.id,
          name: item.name,
          price: item.price,
          type: item.type as 'service' | 'product',
          description: item.description,
          status: 'active',
          category: item.category
        };
      }),
      catchError(error => {
        console.error(`Error getting item ${id}:`, error);
        return of(null);
      })
    );
  }

  /**
   * Validar si un item existe
   */
  itemExists(id: number): Observable<boolean> {
    return this.getItemById(id).pipe(
      map(item => item !== null)
    );
  }
}