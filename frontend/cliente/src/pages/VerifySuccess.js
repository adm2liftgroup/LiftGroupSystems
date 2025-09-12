// src/pages/VerifySuccess.js
export default function VerifySuccess() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-md text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          ✅ ¡Correo verificado!
        </h1>
        <p className="text-gray-700 mb-6">
          Tu cuenta fue confirmada exitosamente. Ya puedes iniciar sesión.
        </p>
        
      </div>
    </div>
  );
}
