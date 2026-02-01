import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonText
} from '@ionic/react';
import { arrowBack, flashlightOutline, flashlight } from 'ionicons/icons';
import { useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './EscanerQR.css';

const EscanerQR: React.FC = () => {
  const history = useHistory();
  const [error, setError] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [linternaActiva, setLinternaActiva] = useState(false);
  const escaneandoRef = useRef(false);

  const iniciarEscaneo = async () => {
    if (escaneandoRef.current) return;
    
    escaneandoRef.current = true;
    setEscaneando(true);
    setError('');

    const codigoSimulado = prompt('Introduce el código QR (UID del usuario):');
    
    if (codigoSimulado && codigoSimulado.trim()) {
      await verificarCodigo(codigoSimulado.trim());
    } else {
      setEscaneando(false);
      escaneandoRef.current = false;
    }
  };

  const verificarCodigo = async (codigo: string) => {
    const usuarioActual = auth.currentUser;
    
    if (usuarioActual && codigo === usuarioActual.uid) {
      setError('No puedes escanearte a ti mismo.');
      setEscaneando(false);
      escaneandoRef.current = false;
      return;
    }

    try {
      const usuarioRef = doc(db, 'usuarios', codigo);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        // Navegar usando parámetro en URL
        history.push(`/resultado-qr/${codigo}`);
      } else {
        setError('Código QR no válido. El usuario no existe.');
      }
    } catch (err) {
      setError('Error al verificar el código. Inténtalo de nuevo.');
      console.error('Error verificando código:', err);
    } finally {
      setEscaneando(false);
      escaneandoRef.current = false;
    }
  };

  const toggleLinterna = () => {
    setLinternaActiva(!linternaActiva);
  };

  return (
    <IonPage>
      <IonContent className="escaner-container">
        <div className="escaner-content">
          <div className="escaner-header">
            <IonIcon 
              icon={arrowBack} 
              className="escaner-back" 
              onClick={() => history.push('/dashboard')}
            />
            <h1 className="escaner-title">Escanear QR</h1>
            <IonIcon 
              icon={linternaActiva ? flashlight : flashlightOutline} 
              className={`escaner-flash ${linternaActiva ? 'activa' : ''}`}
              onClick={toggleLinterna}
            />
          </div>

          <div className="escaner-visor">
            <div className="escaner-marco">
              <div className="escaner-esquina escaner-esquina-tl"></div>
              <div className="escaner-esquina escaner-esquina-tr"></div>
              <div className="escaner-esquina escaner-esquina-bl"></div>
              <div className="escaner-esquina escaner-esquina-br"></div>
              {escaneando && <div className="escaner-linea"></div>}
            </div>
          </div>

          <div className="escaner-instrucciones">
            <p>Apunta la cámara hacia el código QR del otro vehículo</p>
            
            {error && <IonText color="danger" className="escaner-error">{error}</IonText>}

            <IonButton 
              expand="block" 
              onClick={iniciarEscaneo}
              disabled={escaneando}
              className="escaner-button"
            >
              {escaneando ? 'Escaneando...' : 'Iniciar Escaneo'}
            </IonButton>

            <p className="escaner-nota">
              En la versión móvil, la cámara se activará automáticamente
            </p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default EscanerQR;