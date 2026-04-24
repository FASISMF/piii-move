import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonText,
  IonInputPasswordToggle
} from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import './Login.css';

const Login: React.FC = () => {
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const iniciarSesion = async () => {
    if (!email || !password) {
      setError('Por favor, completa todos los campos');
      return;
    }

    setCargando(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      history.replace('/dashboard');
    } catch (err: any) {
      // Mensajes de error en español
      switch (err.code) {
        case 'auth/user-not-found':
          setError('No existe una cuenta con este correo');
          break;
        case 'auth/wrong-password':
          setError('Contraseña incorrecta');
          break;
        case 'auth/invalid-email':
          setError('El correo no es válido');
          break;
        case 'auth/too-many-requests':
          setError('Demasiados intentos. Espera unos minutos');
          break;
        default:
          setError('Error al iniciar sesión. Inténtalo de nuevo');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="login-container">
        <div className="login-content">
          <img 
            src="/assets/logo_piii_move.png" 
            alt="Piii-Move!" 
            className="login-logo" 
          />
          <p className="login-subtitle">Inicia sesión para continuar</p>

          <div className="login-form">
            <IonInput
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value!)}
              className="login-input"
              fill="outline"
            />

            <IonInput
              type="password"
              placeholder="Contraseña"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value!)}
              className="login-input"
              fill="outline"
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            {error && <IonText color="danger" className="login-error">{error}</IonText>}

            <IonButton 
              expand="block" 
              onClick={iniciarSesion}
              disabled={cargando}
              className="login-button"
            >
              {cargando ? 'Cargando...' : 'Iniciar Sesión'}
            </IonButton>

            <div className="login-links">
              <IonText 
                className="login-link" 
                onClick={() => history.push('/registro')}
              >
                ¿No tienes cuenta? Regístrate
              </IonText>
              <IonText 
                className="login-link" 
                onClick={() => history.push('/recuperar-password')}
              >
                ¿Olvidaste tu contraseña?
              </IonText>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Login;