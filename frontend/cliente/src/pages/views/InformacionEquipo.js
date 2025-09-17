export default function InformacionEquipo({ montacargas }) {
  if (!montacargas) return <p>No se seleccionó ningún montacargas.</p>;

  return (
    <div>
      <p><strong>Número:</strong> {montacargas["numero"]}</p>
      <p><strong>Marca:</strong> {montacargas["Marca"]}</p>
      <p><strong>Modelo:</strong> {montacargas["Modelo"]}</p>
      <p><strong>Serie:</strong> {montacargas["Serie"]}</p>
      <p><strong>Sistema:</strong> {montacargas["Sistema"]}</p>
      <p><strong>Capacidad:</strong> {montacargas["Capacidad"]} lbs</p>

    </div>
  );
}
