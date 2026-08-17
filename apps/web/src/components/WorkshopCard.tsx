import { Link } from 'react-router-dom'
import type { Workshop } from '../api/workshops'
import './WorkshopCard.css'

export function WorkshopCard({ workshop }: { workshop: Workshop }) {
  return (
    <Link to={`/atelier/${workshop.id}`} className="workshop-card">
      <span className="workshop-card__name" title={workshop.name}>
        {workshop.name}
      </span>
      <div className="workshop-card__preview">
        {workshop.thumbnail ? (
          <img src={workshop.thumbnail} alt={`Aperçu du board de l'atelier ${workshop.name}`} />
        ) : (
          <span className="workshop-card__placeholder">Aucun aperçu disponible</span>
        )}
      </div>
    </Link>
  )
}
