export default function Inicio() {
  return (
    <div className="flex min-h-screen bg-gray-100"> 
      {/* Barra lateral */}
      <aside className="w-64 bg-gray-800 text-gray-100 p-4">
        <h2 className="text-xl font-bold mb-6">Menú</h2>
        <ul className="space-y-4">
          <li className="hover:bg-gray-700 p-2 rounded cursor-pointer">
            📂 Montacargas
          </li>
        </ul>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6 bg-gray-50 text-gray-900">
        <h1 className="text-2xl font-bold mb-4">Bienvenido</h1>
      </main>
    </div>
  );
}
