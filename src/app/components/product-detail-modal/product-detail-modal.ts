import { Component, Input, Output, EventEmitter } from '@angular/core';
@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.css',
})
export class ProductDetailModal {
  @Input() product: any = null; // <--- Agrega esto
  @Output() close = new EventEmitter<void>();
}
