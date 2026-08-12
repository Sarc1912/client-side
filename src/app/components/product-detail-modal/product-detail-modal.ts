import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CurrencyPipe, RouterLink],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.css',
})
export class ProductDetailModal {
  @Input() product: any = null;
  @Input() showRequest = true;
  @Output() close = new EventEmitter<void>();

  mainImageIndex = signal(0);

  images = computed<any[]>(() => {
    const imgs = (this.product?.images ?? []).slice().sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
    if (imgs.length === 0) return [];
    return imgs.map((img: any) => ({
      ...img,
      url: this.normalizeUrl(img.url),
    }));
  });

  mainImage = computed(() => this.images()[this.mainImageIndex()] ?? null);

  setMainImage(i: number): void {
    this.mainImageIndex.set(i);
  }

  nextImage(): void {
    const len = this.images().length;
    if (len <= 1) return;
    this.mainImageIndex.update(i => (i + 1) % len);
  }

  prevImage(): void {
    const len = this.images().length;
    if (len <= 1) return;
    this.mainImageIndex.update(i => (i - 1 + len) % len);
  }

  specs = computed<any[]>(() => this.product?.specifications ?? []);

  plans = computed<any[]>(() =>
    (this.product?.financingPlans ?? []).filter((p: any) => p.isActive !== false)
  );

  normalizeUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  }

  closeModal(): void {
    this.close.emit();
  }

  stockBadge = (stock: number) =>
    stock > 5 ? 'badge-success' : stock > 0 ? 'badge-warning' : 'badge-danger';

  statusLabel = (s: string) =>
    ({ active: 'Activo', sold: 'Vendido', archived: 'Archivado' }[s] ?? s);

  statusBadge = (s: string) =>
    ({ active: 'badge-success', sold: 'badge-info', archived: 'badge-muted' }[s] ?? 'badge-muted');
}
