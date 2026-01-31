import { 
  IonContent, 
  IonPage, 
  IonInput, 
  IonButton, 
  IonText,
  IonInputPasswordToggle,
  IonIcon
} from '@ionic/react';
import { arrowBack } from 'ionicons/icons';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import './Registro.css';

const Registro: React.FC = () => {
  const history = useHistory();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const registrarse = async () => {
    // Validaciones
    if (!nombre || !email || !password || !confirmarPassword) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (password !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCargando(true);
    setError('');

    try {
      // Crear usuario en Authentication
      const credenciales = await createUserWithEmailAndPassword(auth, email, password);
      const usuario = credenciales.user;

      // Actualizar nombre en Authentication
      await updateProfile(usuario, { displayName: nombre });

      // Crear perfil en Firestore
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        nombre: nombre,
        email: email,
        fechaCreacion: new Date().toISOString(),
        codigoQR: usuario.uid // Usamos el UID como código QR único
      });

      history.replace('/dashboard');
    } catch (err: any) {
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Ya existe una cuenta con este correo');
          break;
        case 'auth/invalid-email':
          setError('El correo no es válido');
          break;
        case 'auth/weak-password':
          setError('La contraseña es demasiado débil');
          break;
        default:
          setError('Error al crear la cuenta. Inténtalo de nuevo');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <IonPage>
      <IonContent className="registro-container">
        <div className="registro-content">
          <div className="registro-header">
            <IonIcon 
              icon={arrowBack} 
              className="registro-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="registro-title">Crear Cuenta</h1>
          </div>
          
          <p className="registro-subtitle">Únete a Piii-Move!</p>

          <div className="registro-form">
            <IonInput
              type="text"
              placeholder="Nombre completo"
              value={nombre}
              onIonInput={(e) => setNombre(e.detail.value!)}
              className="registro-input"
              fill="outline"
            />

            <IonInput
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onIonInput={(e) => setEmail(e.detail.value!)}
              className="registro-input"
              fill="outline"
            />

            <IonInput
              type="password"
              placeholder="Contraseña"
              value={password}
              onIonInput={(e) => setPassword(e.detail.value!)}
              className="registro-input"
              fill="outline"
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            <IonInput
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmarPassword}
              onIonInput={(e) => setConfirmarPassword(e.detail.value!)}
              className="registro-input"
              fill="outline"
            >
              <IonInputPasswordToggle slot="end" />
            </IonInput>

            {error && <IonText color="danger" className="registro-error">{error}</IonText>}

            <IonButton 
              expand="block" 
              onClick={registrarse}
              disabled={cargando}
              className="registro-button"
            >
              {cargando ? 'Creando cuenta...' : 'Registrarse'}
            </IonButton>

            <IonText 
              className="registro-link" 
              onClick={() => history.push('/login')}
            >
              ¿Ya tienes cuenta? Inicia sesión
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Registro;