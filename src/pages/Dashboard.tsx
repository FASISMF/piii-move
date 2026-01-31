import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonAlert
} from '@ionic/react';
import { 
  qrCodeOutline, 
  scanOutline, 
  chatbubblesOutline, 
  personOutline,
  logOutOutline
} from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const history = useHistory();
  const [mostrarAlertCerrarSesion, setMostrarAlertCerrarSesion] = useState(false);
  const usuario = auth.currentUser;

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      history.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const opciones = [
    {
      titulo: 'Escanear QR',
      descripcion: 'Escanea el código de otro conductor',
      icono: scanOutline,
      ruta: '/escaner-qr',
      color: '#4CAF50'
    },
    {
      titulo: 'Mi Código QR',
      descripcion: 'Muestra tu código para que te escaneen',
      icono: qrCodeOutline,
      ruta: '/mi-codigo-qr',
      color: '#2196F3'
    },
    {
      titulo: 'Conversaciones',
      descripcion: 'Historial de mensajes',
      icono: chatbubblesOutline,
      ruta: '/historial-conversaciones',
      color: '#9C27B0'
    },
    {
      titulo: 'Mi Perfil',
      descripcion: 'Configura tu cuenta',
      icono: personOutline,
      ruta: '/mi-perfil',
      color: '#FF9800'
    }
  ];

  return (
    <IonPage>
      <IonContent className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1 className="dashboard-saludo">
              ¡Hola, {usuario?.displayName || 'Conductor'}!
            </h1>
            <p className="dashboard-subtitulo">¿Qué quieres hacer hoy?</p>
          </div>

          <div className="dashboard-grid">
            {opciones.map((opcion, index) => (
              <div 
                key={index}
                className="dashboard-card"
                onClick={() => history.push(opcion.ruta)}
              >
                <div 
                  className="dashboard-card-icon" 
                  style={{ backgroundColor: opcion.color }}
                >
                  <IonIcon icon={opcion.icono} />
                </div>
                <h3 className="dashboard-card-titulo">{opcion.titulo}</h3>
                <p className="dashboard-card-descripcion">{opcion.descripcion}</p>
              </div>
            ))}
          </div>

          <IonButton 
            expand="block" 
            fill="outline"
            className="dashboard-logout"
            onClick={() => setMostrarAlertCerrarSesion(true)}
          >
            <IonIcon icon={logOutOutline} slot="start" />
            Cerrar Sesión
          </IonButton>
        </div>

        <IonAlert
          isOpen={mostrarAlertCerrarSesion}
          onDidDismiss={() => setMostrarAlertCerrarSesion(false)}
          header="Cerrar Sesión"
          message="¿Estás seguro de que quieres salir?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Sí, salir',
              handler: cerrarSesion
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;