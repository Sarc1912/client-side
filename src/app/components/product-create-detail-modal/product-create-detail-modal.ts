import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIconComponent } from '@ng-icons/core';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-product-create-detail-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIconComponent
  ],
  templateUrl: './product-create-detail-modal.html',
  styleUrl: './product-create-detail-modal.css',
})
export class ProductCreateDetailModal implements OnInit {
  @Input() product: any = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<any>();

  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef); // Inyectamos el detector de cambios

  specifications: { specKey: string; specValue: string }[] = [];
  isSubmitting = false;
  isLoading = false;

  ngOnInit() {
    if (this.product?.id) {
      this.loadExistingSpecifications();
    } else {
      this.addSpecificationRow();
    }
  }

  loadExistingSpecifications() {
    this.isLoading = true;

    this.api.get<any[]>(`product-specifications/product/${this.product.id}`).subscribe({
      next: (specs) => {
        if (specs && specs.length > 0) {
          this.specifications = specs.map(s => ({
            specKey: s.specKey,
            specValue: s.specValue
          }));
        } else {
          this.addSpecificationRow();
        }
        this.isLoading = false;
        this.cdr.detectChanges(); // Fuerza a Angular a repintar la vista inmediatamente al recibir los datos
      },
      error: (err) => {
        console.error('Error al cargar especificaciones', err);
        this.addSpecificationRow();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addSpecificationRow() {
    this.specifications.push({ specKey: '', specValue: '' });
  }

  removeSpecificationRow(index: number) {
    if (this.specifications.length > 1) {
      this.specifications.splice(index, 1);
    } else {
      this.specifications[0] = { specKey: '', specValue: '' };
    }
  }

  saveSpecifications() {
    const validSpecs = this.specifications.filter(
      s => s.specKey.trim() !== '' && s.specValue.trim() !== ''
    );

    if (validSpecs.length === 0) {
      alert('Por favor, ingresa al menos una especificación válida.');
      return;
    }

    this.isSubmitting = true;

    this.save.emit({
      productId: this.product?.id,
      specifications: validSpecs
    });

    setTimeout(() => {
      this.isSubmitting = false;
      this.close.emit();
    }, 400);
  }
}