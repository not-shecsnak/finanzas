import { CardForm } from "@/components/card-form";

export default function NuevaTarjeta() {
  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nueva tarjeta</h1>
      <CardForm />
    </main>
  );
}
