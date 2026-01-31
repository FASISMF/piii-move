import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonText,
  IonIcon
} from '@ionic/react';
import { arrowBack, mailOutline } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import './RecuperarPassword.css';

const RecuperarPassword: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);

  const enviarRecuperacion = async () => {
    if (!email) {
      setError('Por favor, introduce tu correo electrónico');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setEnviado(true);
    } catch (err: any) {
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No existe una cuenta con este correo');
          break;
        case 'auth/invalid-email':
          setError('El correo no es válido');
          break;
        default:
          setError('Error al enviar el correo. Inténtalo de nuevo');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="recuperar-container">
        <div className="recuperar-content">
          <div className="recuperar-header">
            <IonIcon 
              icon={arrowBack} 
              className="recuperar-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="recuperar-title">Recuperar Contraseña</h1>
          </div>

          {!enviado ? (
            <>
              <p className="recuperar-subtitle">
                Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>

              <div className="recuperar-form">
                <IonInput
                  type="email"
                  placeholder="Correo electrónico"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value!)}
                  className="recuperar-input"
                  fill="outline"
                />

                {error && <IonText color="danger" className="recuperar-error">{error}</IonText>}

                <IonButton 
                  expand="block" 
                  onClick={enviarRecuperacion}
                  disabled={cargando}
                  className="recuperar-button"
                >
                  {cargando ? 'Enviando...' : 'Enviar enlace'}
                </IonButton>
              </div>
            </>
          ) : (
            <div className="recuperar-exito">
              <IonIcon icon={mailOutline} className="recuperar-exito-icon" />
              <h2>¡Correo enviado!</h2>
              <p>
                Hemos enviado un enlace de recuperación a <strong>{email}</strong>. 
                Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <IonButton 
                expand="block" 
                onClick={() => history.replace('/login')}
                className="recuperar-button"
              >
                Volver al inicio de sesión
              </IonButton>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default RecuperarPassword;