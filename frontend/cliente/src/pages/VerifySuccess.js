export default function VerifySuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-green-100">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold text-green-700 mb-4">
          ✅ Correo verificado
        </h1>
        <p className="text-gray-600 mb-6">
          Tu cuenta fue verificada correctamente. Ahora puedes iniciar sesión.
        </p>
        <a
          href="/"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
        >
          Ir al Login
        </a>
      </div>
    </div>
  );
}
