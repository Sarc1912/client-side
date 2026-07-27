import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Category } from '../../../core/models';
import { heroPlus, heroPencil, heroTrash } from '@ng-icons/heroicons/outline';
import { NgIconComponent, provideIcons } from '@ng-icons/core';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [DatePipe, FormsModule, NgIconComponent],
  providers: [provideIcons({ heroPlus, heroPencil, heroTrash })],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.css']
})
export class CategoriesComponent implements OnInit {
  categories = signal<Category[]>([]);
  filtered = signal<Category[]>([]);
  loading = signal(true);
  search = '';

  // Modal state
  isModalOpen = signal(false);
  isSubmitting = signal(false);
  editingCategory = signal<Category | null>(null);

  formData = {
    name: '',
    slug: '',
    parentId: null as number | null
  };

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading.set(true);
    this.api.get<Category[]>('categories').subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.categories.set(list);
        this.filtered.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filterCategories(): void {
    const q = this.search.toLowerCase();
    this.filtered.set(
      this.categories().filter(c => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
    );
  }

  openCreate(): void {
    this.editingCategory.set(null);
    this.formData = { name: '', slug: '', parentId: null };
    this.isModalOpen.set(true);
  }

  openEdit(category: Category): void {
    this.editingCategory.set(category);
    this.formData = {
      name: category.name,
      slug: category.slug,
      parentId: category.parentId ?? null
    };
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  // --- NUEVA LÓGICA DE SLUG ---
  onNameChange(newName: string): void {
    if (!newName) {
      this.formData.slug = '';
      return;
    }

    // Generar el slug automáticamente solo si estamos creando una nueva categoría
    if (!this.editingCategory()) {
      this.formData.slug = this.slugify(newName);
    }
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')                   // Separa acentos de las letras
      .replace(/[\u0300-\u036f]/g, '')    // Elimina los acentos
      .replace(/[^a-z0-9 -]/g, '')        // Deja solo letras, números, espacios y guiones
      .replace(/\s+/g, '-')               // Reemplaza espacios con guiones
      .replace(/-+/g, '-')                // Evita guiones duplicados consecutivos
      .trim();                            // Elimina guiones o espacios en los extremos
  }
  // -----------------------------

  saveCategory(): void {
    if (!this.formData.name || !this.formData.slug) return;

    this.isSubmitting.set(true);
    const payload = { ...this.formData };

    const req = this.editingCategory()
      ? this.api.patch<Category>(`categories/${this.editingCategory()!.id}`, payload)
      : this.api.post<Category>('categories', payload);

    req.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeModal();
        this.loadCategories();
      },
      error: (err) => {
        console.error('Error saving category', err);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;

    this.api.delete(`categories/${id}`).subscribe({
      next: () => this.loadCategories(),
      error: (err) => console.error('Error deleting category', err)
    });
  }

  getParentName(parentId?: number): string {
    if (!parentId) return '—';
    return this.categories().find(c => c.id === parentId)?.name ?? `ID: ${parentId}`;
  }
}