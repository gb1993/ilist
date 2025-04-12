import { ListaDeListas } from "@/components/ListaDeListas";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">iListas</h1>
      <div className="max-w-4xl mx-auto">
        <ListaDeListas />
      </div>
    </main>
  );
}
