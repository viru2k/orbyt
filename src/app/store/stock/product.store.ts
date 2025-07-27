import { Injectable, inject } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { exhaustMap, tap } from 'rxjs';
import { ProductsService, ProductResponseDto, CreateProductDto, UpdateProductDto } from '@orb-api/index';
import { NotificationService } from '@orb-services';
import { NotificationSeverity } from '@orb-models';
import { tapResponse } from '@ngrx/operators';
import { linkToGlobalState } from '../component-state.reducer';
import { Store } from '@ngrx/store';

export interface ProductState {
  products: ProductResponseDto[];
  loading: boolean;
  error: any | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

@Injectable({ providedIn: 'root' })
export class ProductStore extends ComponentStore<ProductState> {
  private readonly productsService = inject(ProductsService);
  private readonly notificationService = inject(NotificationService);

  constructor(    private readonly globalStore: Store) {
    super(initialState);
        linkToGlobalState(this.state$, 'ProductStore', this.globalStore);
  }

  // Selectores
  readonly products$ = this.select((state) => state.products);
  readonly loading$ = this.select((state) => state.loading);

  readonly selectProductsWithMappedData = this.select(
    this.products$,
    (products) => products.map(product => {
        let statusText = product.status.charAt(0).toUpperCase() + product.status.slice(1);
        let statusClass = `status-${product.status}`;

        return {
            ...product,
            statusText,
            statusClass,
            ownerName: product.owner?.fullName || 'N/A'
        };
    })
  );

  // Updaters
  private readonly setLoading = this.updater((state, loading: boolean) => ({ ...state, loading }));
  private readonly setProducts = this.updater((state, products: ProductResponseDto[]) => ({ ...state, products, loading: false }));
  private readonly addProduct = this.updater((state, product: ProductResponseDto) => ({ ...state, products: [...state.products, product], loading: false }));
  private readonly updateProduct = this.updater((state, product: ProductResponseDto) => ({
    ...state,
    products: state.products.map(p => p.id === product.id ? product : p),
    loading: false
  }));
  private readonly removeProduct = this.updater((state, productId: number) => ({
    ...state,
    products: state.products.filter(p => p.id !== productId),
    loading: false
  }));
  private readonly setError = this.updater((state, error: any) => ({ ...state, error, loading: false }));

  // Effects
  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.productsService.productControllerFindAll().pipe(
          tapResponse(
            (products: Array<ProductResponseDto>) => this.setProducts(products),
            (error: any) => this.setError(error)
          )
        )
      )
    )
  );
  
  readonly create = this.effect<CreateProductDto>((productDto$) =>
    productDto$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((productDto) =>
        this.productsService.productControllerCreate(productDto).pipe(
          tapResponse(
            (newProduct: ProductResponseDto) => {
              this.addProduct(newProduct);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Producto creado con éxito.');
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al crear el producto.');
            }
          )
        )
      )
    )
  );

  readonly update = this.effect<{ id: number; dto: UpdateProductDto }>((params$) =>
    params$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(({ id, dto }) =>
        this.productsService.productControllerUpdate(id, dto).pipe(
          tapResponse(
            (updatedProduct: ProductResponseDto) => {
              this.updateProduct(updatedProduct);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Producto actualizado con éxito.');
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al actualizar el producto.');
            }
          )
        )
      )
    )
  );

  readonly remove = this.effect<number>((productId$) =>
    productId$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap((id) =>
        this.productsService.productControllerRemove(id).pipe(
          tapResponse(
            () => {
              this.removeProduct(id);
              this.notificationService.showSuccess(NotificationSeverity.Success, 'Producto eliminado con éxito.');
            },
            (error: any) => {
              this.setError(error);
              this.notificationService.showError(NotificationSeverity.Error, 'Error al eliminar el producto.');
            }
          )
        )
      )
    )
  );
}
