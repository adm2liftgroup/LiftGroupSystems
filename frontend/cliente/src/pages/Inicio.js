export default function Inicio() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Barra lateral */}
      <aside className="w-64 bg-green-600 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Menú</h2>
        <ul className="space-y-4">
          
          <li className="hover:bg-green-700 p-2 rounded cursor-pointer">📂 Montacargas</li>
          
        </ul>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-4">Bienvenido</h1>
       
      </main>
    </div>
  );
}
