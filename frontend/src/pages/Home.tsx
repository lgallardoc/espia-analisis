import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Sistema de Análisis</h1>
      <Link 
        to="/analysis" 
        className="btn btn-primary"
      >
        Ir al Análisis
      </Link>
    </div>
  );
}
