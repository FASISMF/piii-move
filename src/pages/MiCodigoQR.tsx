import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton
} from '@ionic/react';
import { arrowBack, sunnyOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { auth } from '../services/firebase';
import './MiCodigoQR.css';

const MiCodigoQR: React.FC = () => {
  const history = useHistory();
  const [brilloAlto, setBrilloAlto] = useState(false);
  const usuario = auth.currentUser;

  const toggleBrillo = () => {
    setBrilloAlto(!brilloAlto);
  };

  return (
    <IonPage>
      <IonContent className={`miqr-container ${brilloAlto ? 'brillo-alto' : ''}`}>
        <div className="miqr-content">
          <div className="miqr-header">
            <IonIcon 
              icon={arrowBack} 
              className="miqr-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="miqr-title">Mi Código QR</h1>
            <IonIcon 
              icon={sunnyOutline} 
              className={`miqr-brillo ${brilloAlto ? 'activo' : ''}`}
              onClick={toggleBrillo}
            />
          </div>

          <div className="miqr-info">
            <p>Muestra este código para que otros conductores puedan contactarte</p>
          </div>

          <div className="miqr-codigo-container">
            <div className="miqr-codigo">
              {usuario ? (
                <QRCodeSVG 
                  value={usuario.uid}
                  size={220}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                />
              ) : (
                <p>Cargando...</p>
              )}
            </div>
            <h2 className="miqr-nombre">{usuario?.displayName || 'Usuario'}</h2>
            <p className="miqr-subtitulo">Piii-Move!</p>
          </div>

          <div className="miqr-instrucciones">
            <h3>¿Cómo usar tu código?</h3>
            <ol>
              <li>Coloca el código QR en un lugar visible de tu vehículo</li>
              <li>Otros conductores podrán escanearlo con la app</li>
              <li>Recibirás notificaciones cuando alguien te contacte</li>
            </ol>
          </div>

          <IonButton 
            expand="block" 
            fill="outline"
            onClick={() => history.replace('/dashboard')}
            className="miqr-btn-volver"
          >
            Volver al Inicio
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default MiCodigoQR;