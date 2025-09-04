# zdata-client Usage Examples

Este arquivo contém exemplos práticos de como usar as novas funcionalidades do zdata-client v1.1.0.

## 1. Uso Básico com Tipos Genéricos

```typescript
import { ZDataClient } from "zdata-client";

interface User {
  name: string;
  email: string;
  role: "admin" | "user";
}

const client = new ZDataClient({
  baseUrl: "https://api.example.com",
  workspaceId: "workspace-123",
});

// Autenticação
await client.login({
  email: "user@example.com",
  password: "password",
});

// Operações type-safe
const newUser = await client.createRecord<User>("users", {
  name: "João Silva",
  email: "joao@example.com",
  role: "user",
  // ✅ TypeScript garante que você não inclua id, created_at, updated_at
});

console.log(newUser.id); // ✅ Disponível automaticamente
console.log(newUser.created_at); // ✅ Disponível automaticamente
console.log(newUser.name); // ✅ Disponível e tipado
```

## 2. Cliente Personalizado para Payments

```typescript
import {
  BaseDataSourceClient,
  type CreateEntity,
  type EntityWithBase,
} from "zdata-client";

interface Payment {
  amount: number;
  description: string;
  userId: string;
  status: "pending" | "completed" | "failed";
  currency: string;
}

class CustomPaymentClient extends BaseDataSourceClient<Payment> {
  constructor(config: ApiConfig) {
    super(config, "pagamentos");
  }

  // Métodos simplificados como você solicitou
  findPayment = (id: string): Promise<EntityWithBase<Payment>> =>
    this.findById(id);

  deletePayment = (id: string): Promise<void> => this.delete(id);

  insertPayment = (
    data: CreateEntity<Payment>
  ): Promise<EntityWithBase<Payment>> => this.create(data);

  updatePayment = (
    id: string,
    data: Partial<CreateEntity<Payment>>
  ): Promise<EntityWithBase<Payment>> => this.update(id, data);

  findPayments = (
    params: Pick<FindRecordsParams, "search" | "page" | "limit"> = {}
  ) => this.find(params);

  // Lógica de negócio personalizada
  async findPaymentsByUser(userId: string) {
    return this.find({ search: `userId:${userId}` });
  }

  async findPendingPayments() {
    return this.find({ search: "status:pending" });
  }

  async markAsCompleted(id: string) {
    return this.update(id, { status: "completed" });
  }

  async getTotalAmountByUser(userId: string): Promise<number> {
    const payments = await this.findPaymentsByUser(userId);
    return payments.records.reduce(
      (total, payment) => total + payment.amount,
      0
    );
  }
}
```

## 3. Usando o Cliente Personalizado

```typescript
const config = {
  baseUrl: "https://api.example.com",
  workspaceId: "workspace-123",
};

const paymentClient = new CustomPaymentClient(config);

// Login uma vez, funciona para todas as operações
await paymentClient.login({
  email: "admin@example.com",
  password: "senha123",
});

// Criar um pagamento (sem precisar especificar id, created_at, updated_at)
const payment = await paymentClient.insertPayment({
  amount: 150.0,
  description: "Pagamento de assinatura mensal",
  userId: "user-456",
  status: "pending",
  currency: "BRL",
});

console.log("Pagamento criado:", payment.id, payment.created_at);

// Buscar pagamentos
const userPayments = await paymentClient.findPaymentsByUser("user-456");
console.log(`Usuário tem ${userPayments.records.length} pagamentos`);

// Buscar pagamentos pendentes
const pendingPayments = await paymentClient.findPendingPayments();
console.log(`${pendingPayments.records.length} pagamentos pendentes`);

// Calcular total
const totalAmount = await paymentClient.getTotalAmountByUser("user-456");
console.log(`Total gasto pelo usuário: R$ ${totalAmount}`);

// Marcar como concluído
await paymentClient.markAsCompleted(payment.id);
console.log("Pagamento marcado como concluído");

// Buscar com paginação
const allPayments = await paymentClient.findPayments({
  page: 1,
  limit: 10,
  search: "assinatura",
});
```

## 4. Cliente Simples para Casos Básicos

```typescript
import { DataSourceClient } from "zdata-client";

interface Product {
  name: string;
  price: number;
  category: string;
  available: boolean;
}

// Para casos simples, use DataSourceClient diretamente
const productClient = new DataSourceClient<Product>(config, "products");

// Operações básicas com type safety
const newProduct = await productClient.create({
  name: "Smartphone XYZ",
  price: 899.99,
  category: "Electronics",
  available: true,
});

const products = await productClient.find({ page: 1, limit: 20 });
const product = await productClient.findById("product-123");
await productClient.update("product-123", { price: 799.99 });
await productClient.delete("product-123");
```

## 5. Demonstração dos Tipos

```typescript
import { CreateEntity, EntityWithBase, BaseEntity } from "zdata-client";

interface Order {
  customerId: string;
  items: string[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered";
}

// Tipo para criação (sem campos de base)
type OrderInput = CreateEntity<Order>;
// Resultado: { customerId: string; items: string[]; total: number; status: string; }

// Tipo de retorno (com campos de base)
type OrderOutput = EntityWithBase<Order>;
// Resultado: Order & { id: string; created_at: string; updated_at: string; }

// Usar na prática
const orderData: OrderInput = {
  customerId: "customer-789",
  items: ["item-1", "item-2"],
  total: 199.99,
  status: "pending",
  // ❌ Erro do TypeScript se tentar incluir id, created_at, updated_at
};

const client = new ZDataClient(config);
const savedOrder: OrderOutput = await client.createRecord<Order>(
  "orders",
  orderData
);

// Agora savedOrder tem todos os campos including id, created_at, updated_at
console.log(savedOrder.id); // ✅ string
console.log(savedOrder.created_at); // ✅ string
console.log(savedOrder.total); // ✅ number
```

## 6. Múltiplos Clientes Especializados

```typescript
// Você pode ter múltiplos clientes especializados
class UserClient extends BaseDataSourceClient<User> {
  constructor(config: ApiConfig) {
    super(config, "users");
  }

  async findAdmins() {
    return this.find({ search: "role:admin" });
  }

  async promoteToAdmin(userId: string) {
    return this.update(userId, { role: "admin" });
  }
}

class ProductClient extends BaseDataSourceClient<Product> {
  constructor(config: ApiConfig) {
    super(config, "products");
  }

  async findByCategory(category: string) {
    return this.find({ search: `category:${category}` });
  }

  async markAsUnavailable(productId: string) {
    return this.update(productId, { available: false });
  }
}

// Uso
const userClient = new UserClient(config);
const productClient = new ProductClient(config);
const paymentClient = new CustomPaymentClient(config);

// Todos compartilham a mesma autenticação
await userClient.login({ email: "admin@example.com", password: "senha" });

// Agora pode usar todos os clientes
const admins = await userClient.findAdmins();
const electronics = await productClient.findByCategory("Electronics");
const pendingPayments = await paymentClient.findPendingPayments();
```

## 7. Vantagens da Nova Abordagem

### Antes (sem tipos genéricos):

```typescript
const payment = (await client.createRecord("pagamentos", data)) as Payment &
  BaseEntity;
//                                                            ^^^^^^^^^^^^^^^^^^^^^^
//                                                            Cast manual necessário
```

### Agora (com tipos genéricos):

```typescript
const payment = await client.createRecord<Payment>("pagamentos", data);
//                           ^^^^^^^^^^^^^
//                           Tipo inferido automaticamente
```

### Antes (métodos genéricos):

```typescript
const payment = (await client.findRecordById("pagamentos", id)) as Payment &
  BaseEntity;
```

### Agora (métodos especializados):

```typescript
const payment = await paymentClient.findPayment(id);
//                                  ^^^^^^^^^^^
//                                  Método especializado, type-safe
```

## 8. Benefícios dos Tipos Base

```typescript
// ✅ TypeScript previne erros comuns
const client = new CustomPaymentClient(config);

// ❌ Isso causaria erro em tempo de compilação
await client.insertPayment({
  id: "payment-123", // ❌ Erro: não deveria fornecer id
  created_at: "2024-01-01", // ❌ Erro: não deveria fornecer created_at
  amount: 100,
  description: "Test",
  userId: "user-123",
  status: "pending",
  currency: "USD",
});

// ✅ Isso funciona perfeitamente
const payment = await client.insertPayment({
  amount: 100,
  description: "Test payment",
  userId: "user-123",
  status: "pending",
  currency: "USD",
});

// payment automaticamente terá id, created_at, updated_at
console.log(payment.id); // ✅ Disponível
console.log(payment.created_at); // ✅ Disponível
```

## Conclusão

As novas funcionalidades proporcionam:

1. **Type Safety Completa**: TypeScript garante que você use os tipos corretos
2. **Separação Clara**: Distingue entre dados de entrada vs. dados de retorno
3. **Métodos Especializados**: Criação de clientes específicos por recurso
4. **Reutilização de Código**: Base classes que podem ser estendidas
5. **Melhor DX**: Intellisense e autocompletar funcionam perfeitamente
6. **Prevenção de Erros**: Impossível incluir campos que não devem ser fornecidos na criação
