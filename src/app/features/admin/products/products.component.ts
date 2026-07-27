import { Component, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../core/models';
import { heroPlus } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-products',
  imports: [CurrencyPipe, FormsModule, NgIconComponent],
  providers: [provideIcons({ heroPlus })],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  loading = signal(true);
  search = '';
  statusFilter = '';

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.api.get<Product[]>('products').subscribe({
      next: (data) => { const list = Array.isArray(data) ? data : []; this.products.set(list); this.filtered.set(list); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  filterProducts(): void {
    const q = this.search.toLowerCase();
    this.filtered.set(
      this.products()
        .filter(p => !q || p.title.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q))
        .filter(p => !this.statusFilter || p.status === this.statusFilter)
    );
  }

  archive(product: Product): void {
    this.api.patch(`products/${product.id}`, { status: 'archived' }).subscribe(() => {
      this.products.update(list => list.map(p => p.id === product.id ? { ...p, status: 'archived' as any } : p));
      this.filterProducts();
    });
  }

  openCreate(): void { /* TODO: modal */ }

  statusBadge = (s: string) => ({ active: 'badge-success', sold: 'badge-info', archived: 'badge-muted' }[s] ?? 'badge-muted');
}
