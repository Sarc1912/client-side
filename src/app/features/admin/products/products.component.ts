import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core'; // 1. Importa ChangeDetectorRef
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Product, Category } from '../../../core/models';
import { heroPlus, heroPencil, heroTrash, heroPhoto, heroEye, heroArchiveBox, heroArrowUpOnSquare } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { ProductDetailModal } from '../../../components/product-detail-modal/product-detail-modal';
import { ProductCreateDetailModal } from '../../../components/product-create-detail-modal/product-create-detail-modal';


export interface ImagePreview {
  file?: File;
  url: string;
  altText?: string;
  order?: number;
  isMain?: boolean;
  isNew?: boolean;
}

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CurrencyPipe, FormsModule, NgIconComponent, ProductDetailModal, ProductCreateDetailModal],
  providers: [provideIcons({ heroPlus, heroEye, heroPencil, heroTrash, heroPhoto, heroArchiveBox, heroArrowUpOnSquare })],
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.css']
})
export class ProductsComponent implements OnInit {
  products = signal<Product[]>([]);
  filtered = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  loading = signal(true);

  search = '';
  statusFilter = '';

  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingProduct = signal<Product | null>(null);

  isDetailModalOpen = signal(false);
  selectedProductForDetail = signal<any>(null);

  isCreateDetailModalOpen = signal(false);
  selectedProductForCreateDetail = signal<any>(null);

  formData = {
    title: '',
    categoryId: null as number | null,
    brand: '',
    basePrice: 0,
    currency: 'USD',
    stockQuantity: 1,
    status: 'active',
    images: [] as ImagePreview[]
  };

  // 2. Inyecta ChangeDetectorRef en el constructor
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.api.get<Product[]>('products').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.products.set(list);
        this.filterProducts();
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadCategories(): void {
    this.api.get<Category[]>('categories').subscribe({
      next: (data) => this.categories.set(Array.isArray(data) ? data : []),
      error: (err) => console.error('Error loading categories', err)
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

  toggleStatus(product: Product): void {
    const next = product.status === 'active' ? 'archived' : 'active';
    const action = next === 'archived' ? 'archivar' : 'activar';
    if (!confirm(`¿Estás seguro de ${action} el producto "${product.title}"?`)) return;
    this.api.patch(`products/${product.id}/status`, { status: next }).subscribe({
      next: () => {
        this.products.update(list => list.map(p => p.id === product.id ? { ...p, status: next as any } : p));
        this.filterProducts();
      },
      error: (err) => {
        console.error('Error cambiando estado del producto', err);
        alert('No se pudo cambiar el estado del producto.');
      }
    });
  }

  openCreate(): void {
    this.editingProduct.set(null);
    this.resetForm(); // Limpiamos al abrir por si quedó algo residual
    this.isModalOpen.set(true);
  }

  openEdit(product: any): void {
    this.editingProduct.set(product);
    this.formData = {
      title: product.title,
      categoryId: product.categoryId ?? null,
      brand: product.brand ?? '',
      basePrice: product.basePrice,
      currency: product.currency ?? 'USD',
      stockQuantity: product.stockQuantity,
      status: product.status,
      // Mapeamos las imágenes asegurando que la URL apunte al backend (ej. http://localhost:3000)
      images: product.images ? product.images.map((img: any) => ({
        ...img,
        url: img.url.startsWith('http') ? img.url : `http://localhost:3000${img.url.startsWith('/') ? '' : '/'}${img.url}`,
        isNew: false
      })) : []
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.formData = {
      title: '',
      categoryId: null,
      brand: '',
      basePrice: 0,
      currency: 'USD',
      stockQuantity: 1,
      status: 'active',
      images: []
    };
  }

  openDetail(product: any) {
    this.selectedProductForDetail.set(product);
    this.isDetailModalOpen.set(true);
  }

  closeDetailModal() {
    this.isDetailModalOpen.set(false);
    this.selectedProductForDetail.set(null);
  }

  openCreateDetail(product: any) {
    this.selectedProductForCreateDetail.set(product);
    this.isCreateDetailModalOpen.set(true); // <-- Esto es clave
  }

  closeCreateDetailModal() {
    this.isCreateDetailModalOpen.set(false);
    this.selectedProductForCreateDetail.set(null);
  }

  // 3. Manejar selección con FileReader y refrescar la vista al instante con detectChanges()
  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);

      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const isFirst = this.formData.images.length === 0;
          this.formData.images.push({
            file: file,
            url: e.target.result,
            altText: file.name,
            isMain: isFirst,
            order: this.formData.images.length,
            isNew: true
          });
          // Forzamos a Angular a repintar la grilla de imágenes de inmediato
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
    input.value = '';
  }

  onDropFiles(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer && event.dataTransfer.files) {
      const files = Array.from(event.dataTransfer.files);
      files.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const isFirst = this.formData.images.length === 0;
          this.formData.images.push({
            file: file,
            url: e.target.result,
            altText: file.name,
            isMain: isFirst,
            order: this.formData.images.length,
            isNew: true
          });
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      });
    }
  }

  removeImage(index: number): void {
    this.formData.images.splice(index, 1);
    const hasMain = this.formData.images.some(img => img.isMain);
    if (!hasMain && this.formData.images.length > 0) {
      this.formData.images[0].isMain = true;
    }
    this.cdr.detectChanges();
  }

  setMainImage(selectedIndex: number): void {
    this.formData.images.forEach((img, i) => img.isMain = (i === selectedIndex));
  }

  // 4. Envío de datos alineado al backend (campo 'images')
  saveProduct(): void {
    if (!this.formData.title || !this.formData.categoryId || this.formData.basePrice < 0) return;

    this.isSubmitting.set(true);

    const payload = new FormData();
    payload.append('title', this.formData.title);
    payload.append('categoryId', String(this.formData.categoryId));
    if (this.formData.brand) payload.append('brand', this.formData.brand);
    payload.append('basePrice', String(this.formData.basePrice));
    payload.append('currency', this.formData.currency);
    payload.append('stockQuantity', String(this.formData.stockQuantity));
    payload.append('status', this.formData.status);

    // LIMPIAR LA URL ANTES DE ENVIARLA AL BACKEND:
    // Quitamos 'http://localhost:3000' para que el backend reciba solo la ruta relativa (ej. /uploads/...)
    const existingImages = this.formData.images
      .filter(img => !img.isNew)
      .map(img => {
        let cleanUrl = img.url;
        if (cleanUrl.startsWith('http://localhost:3000')) {
          cleanUrl = cleanUrl.replace('http://localhost:3000', '');
        }
        return {
          url: cleanUrl,
          altText: img.altText,
          order: img.order,
          isMain: img.isMain
        };
      });

    payload.append('existingImages', JSON.stringify(existingImages));

    // Adjuntar archivos nuevos
    this.formData.images.filter(img => img.isNew && img.file).forEach((img) => {
      payload.append('images', img.file!, img.file!.name);
    });

    const req = this.editingProduct()
      ? this.api.patch<Product>(`products/${this.editingProduct()!.id}`, payload)
      : this.api.post<Product>('products', payload);

    req.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.isModalOpen.set(false);
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error saving product', err);
        this.isSubmitting.set(false);
      }
    });
  }

  // Agrega este método para manejar el guardado de especificaciones
  saveSpecifications(eventData: { productId: number; specifications: any[] }) {
    this.api.post(`product-specifications`, eventData).subscribe({
      next: () => {
        alert('Especificaciones guardadas exitosamente.');
        this.closeCreateDetailModal();
        this.loadProducts();
      },
      error: (err) => {
        console.error('Error saving specifications', err);
        alert('Hubo un error al guardar las especificaciones.');
      }
    });
  }

  statusBadge = (s: string) => ({ active: 'badge-success', sold: 'badge-info', archived: 'badge-muted' }[s] ?? 'badge-muted');
}