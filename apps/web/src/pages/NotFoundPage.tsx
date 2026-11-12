import { Link } from 'react-router';
import { Notice } from '../components/States';

export function NotFoundPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <Notice title="Página no encontrada" action={<Link to="/" className="btn btn-solid">Ir al inicio</Link>}>
        El enlace puede estar mal escrito o la página ya no existe.
      </Notice>
    </div>
  );
}
