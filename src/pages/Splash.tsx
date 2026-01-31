import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Splash.css';

const Splash: React.FC = () => {
  const history = useHistory();

  useEffect(() => {
    // Escucha el estado de autenticación
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setTimeout(() => {
        if (user) {
          // Usuario logueado → Dashboard
          history.replace('/dashboard');
        } else {
          // No hay sesión → Login
          history.replace('/login');
        }
      }, 2000); // 2 segundos para mostrar el splash
    });

    return () => unsubscribe();
  }, [history]);

  return (
    <IonPage>
      <IonContent className="splash-container">
        <div className="splash-content">
          <h1 className="splash-title">Piii-Move!</h1>
          <p className="splash-subtitle">Comunica. Conecta. Conduce.</p>
          <IonSpinner name="crescent" className="splash-spinner" />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Splash;