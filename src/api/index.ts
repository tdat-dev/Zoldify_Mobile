import type { components } from './schema';

/**
 * Lớp tiện dụng nằm trên schema.d.ts sinh tự động.
 *
 * KHÔNG sửa schema.d.ts bằng tay — chạy `npm run gen:api` để sinh lại từ
 * openapi.json của backend. File này mới là nơi đặt tên cho dễ dùng.
 *
 * Giữ giống hệt src/api/index.ts bên web để hai bên nói cùng một ngôn ngữ.
 */

type Schemas = components['schemas'];

/** Lớp vỏ mà TransformInterceptor của backend bọc quanh mọi response. */
export interface ApiResponse<T> {
  statusCode: number;
  message?: string;
  data: T;
}

/** Khuôn danh sách có phân trang dùng chung cho mọi endpoint trả danh sách. */
export interface Paginated<T> {
  meta: Schemas['PaginationMetaDto'];
  result: T[];
}

export type User = Schemas['User'];
export type Product = Schemas['Product'];
export type Category = Schemas['Category'];
export type CategoryListItem = Schemas['CategoryListItemDto'];
export type Order = Schemas['Order'];
export type OrderItem = Schemas['OrderItem'];
export type Cart = Schemas['Cart'];
export type Payment = Schemas['Payment'];
export type Escrow = Schemas['Escrow'];
export type WalletTransaction = Schemas['WalletTransaction'];
export type Withdrawal = Schemas['Withdrawal'];
export type Notification = Schemas['Notification'];
export type Conversation = Schemas['Conversation'];
export type Message = Schemas['Message'];
export type Review = Schemas['Review'];
export type Shop = Schemas['Shop'];
export type Address = Schemas['Address'];

export type LoginUserDto = Schemas['LoginUserDto'];
export type RegisterUserDto = Schemas['RegisterUserDto'];
export type LoginResponse = Schemas['LoginResponseDto'];
export type AuthUser = Schemas['AuthUserDto'];
export type MessageResponse = Schemas['MessageResponseDto'];

export type CreateProductDto = Schemas['CreateProductDto'];
export type CreateOrderDto = Schemas['CreateOrderDto'];
export type CreateCartDto = Schemas['CreateCartDto'];
