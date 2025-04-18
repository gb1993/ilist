import { ListaDeListas } from "@/components/ListaDeListas";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Bem-vindo ao iListas</h1>
          <ThemeToggle />
        </div>
        <ListaDeListas />
      </div>
    </main>
  );
}
