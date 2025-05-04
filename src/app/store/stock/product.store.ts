import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { ProductsService, CreateProductDto, UpdateProductDto, ProductResponseDto } from '@orb-api/index';
import { tapResponse } from '@ngrx/operators';
import { catchError, EMPTY, exhaustMap, of, tap } from 'rxjs';
import { Store } from '@ngrx/store';
import { linkToGlobalState } from '../component-state.reducer';

export interface ProductState {
  list: ProductResponseDto[];
  loading: boolean;
  error: string | null;
}

const INITIAL_STATE: ProductState = {
  list: [],
  loading: false,
  error: null
};

@Injectable({ providedIn: 'root' })
export class ProductStore extends ComponentStore<ProductState> {
  constructor(private productsService: ProductsService,     private readonly globalStore: Store) {
    super(INITIAL_STATE);
      linkToGlobalState(this.state$, 'ProductStore', this.globalStore);
  }

  /* ---------- selectors ---------- */
  readonly products$ = this.select((s) => s.list);
  readonly loading$  = this.select((s) => s.loading);
  readonly error$    = this.select((s) => s.error);

  /* ---------- updaters ---------- */
  private setLoading  = this.updater((s, l: boolean) => ({ ...s, loading: l }));
  private setError    = this.updater((s, e: string | null) => ({ ...s, error: e }));
  private setProducts = this.updater((s, p: ProductResponseDto[]) => ({ ...s, list: p }));

  /* ---------- effects ---------- */
  /** GET /products */
  readonly load = this.effect<void>((trigger$) =>
    trigger$.pipe(
      tap(() => this.setLoading(true)),
      exhaustMap(() =>
        this.productsService.productControllerFindAll().pipe(
          tapResponse(
            (resp) => this.setProducts(resp),
            (err:any)   => this.setError(err?.message ?? 'Error cargando productos')
          ),
          catchError(() => EMPTY),
          tap(() => this.setLoading(false))
        )
      )
    )
  );

  /** POST /products */
  readonly create = this.effect<CreateProductDto>((dto$) =>
    dto$.pipe(
      exhaustMap((dto) =>
        this.productsService.productControllerCreate(dto).pipe(
          tapResponse(() => this.load(), (err:any) => this.setError(err?.message)),
          catchError(() => EMPTY)
        )
      )
    )
  );

  /** PUT /products/:id */
  readonly update = this.effect<{ id: number; dto: UpdateProductDto }>((stream$) =>
    stream$.pipe(
      exhaustMap(({ id, dto }) =>
        this.productsService.productControllerUpdate(id, dto).pipe(
          tapResponse(() => this.load(), (err:any) => this.setError(err?.message)),
          catchError(() => EMPTY)
        )
      )
    )
  );

  /** DELETE /products/:id */
  readonly remove = this.effect<number>((id$) =>
    id$.pipe(
      exhaustMap((id) =>
        this.productsService.productControllerRemove(id).pipe(
          tapResponse(() => this.load(), (err:any) => this.setError(err?.message)),
          catchError(() => EMPTY)
        )
      )
    )
  );
}
