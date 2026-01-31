import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonText
} from '@ionic/react';
import { arrowBack, flashlightOutline, flashlight } from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import './EscanerQR.css';

const EscanerQR: React.FC = () => {
  const history = useHistory();
  const [error, setError] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [linternaActiva, setLinternaActiva] = useState(false);

  // Simulación de escaneo para desarrollo web
  // En producción con Capacitor, usaríamos el plugin real
  const iniciarEscaneo = async () => {
    setEscaneando(true);
    setError('');

    // En desarrollo web, simulamos con un prompt
    // En producción, esto usará la cámara real
    const codigoSimulado = prompt('Introduce el código QR (UID del usuario):');
    
    if (codigoSimulado) {
      await verificarCodigo(codigoSimulado);
    } else {
      setEscaneando(false);
    }
  };

  const verificarCodigo = async (codigo: string) => {
    try {
      // Buscar usuario en Firestore
      const usuarioRef = doc(db, 'usuarios', codigo);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        const datosUsuario = usuarioSnap.data();
        // Redirigir a ResultadoQR con los datos
        history.push('/resultado-qr', { 
          usuario: {
            uid: codigo,
            ...datosUsuario
          }
        });
      } else {
        setError('Código QR no válido. El usuario no existe.');
      }
    } catch (err) {
      setError('Error al verificar el código. Inténtalo de nuevo.');
      console.error('Error verificando código:', err);
    } finally {
      setEscaneando(false);
    }
  };

  const toggleLinterna = () => {
    setLinternaActiva(!linternaActiva);
    // En producción, aquí activaríamos la linterna real
  };

  return (
    <IonPage>
      <IonContent className="escaner-container">
        <div className="escaner-content">
          <div className="escaner-header">
            <IonIcon 
              icon={arrowBack} 
              className="escaner-back" 
              onClick={() => history.goBack()}
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