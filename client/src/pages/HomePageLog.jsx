import { Link } from "react-router-dom";

function HomePageLog() {
  return (
  <section className=" flex justify-center items-center">
    <header className="bg-zinc-800 p-10">
      <h1 className="text-5xl py-2 font-bold">Reserva de canchas deportivas</h1>
      <p className="text-md text-slate-400">
        Juega hoy en los recintos mas exclusivos de la ciudad. Reserva tu cancha ahora.
      </p>

      <Link
        className="flex justify-center items-center bg-zinc-500 text-white px-4 py-2 rounded-md mt-4 inline-block"
        to="/reserva"
      >
        Hacer una reserva
      </Link>
    </header>
  </section>
  );
}

export default HomePageLog;
