import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonInput,
  IonText,
  IonAlert
} from '@ionic/react';
import { 
  arrowBack, 
  personCircleOutline, 
  mailOutline, 
  calendarOutline,
  createOutline,
  checkmarkOutline,
  closeOutline,
  logOutOutline
} from 'ionicons/icons';
import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { updateProfile, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import './MiPerfil.css';

interface DatosUsuario {
  nombre: string;
  email: string;
  fechaCreacion: string;
}

const MiPerfil: React.FC = () => {
  const history = useHistory();
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario | null>(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mostrarAlertCerrarSesion, setMostrarAlertCerrarSesion] = useState(false);
  
  const usuario = auth.currentUser;

  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  const cargarDatosUsuario = async () => {
    if (!usuario) return;

    try {
      const usuarioRef = doc(db, 'usuarios', usuario.uid);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        const data = usuarioSnap.data();
        setDatosUsuario({
          nombre: data.nombre || usuario.displayName || 'Usuario',
          email: data.email || usuario.email || '',
          fechaCreacion: data.fechaCreacion || ''
        });
        setNuevoNombre(data.nombre || usuario.displayName || '');
      }
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const iniciarEdicion = () => {
    setEditandoNombre(true);
    setError('');
  };

  const cancelarEdicion = () => {
    setEditandoNombre(false);
    setNuevoNombre(datosUsuario?.nombre || '');
    setError('');
  };

  const guardarNombre = async () => {
    if (!nuevoNombre.trim()) {
      setError('El nombre no puede estar vacío');
      return;
    }

    if (!usuario) return;

    setGuardando(true);
    setError('');

    try {
      // Actualizar en Authentication
      await updateProfile(usuario, { displayName: nuevoNombre.trim() });

      // Actualizar en Firestore
      const usuarioRef = doc(db, 'usuarios', usuario.uid);
      await updateDoc(usuarioRef, { nombre: nuevoNombre.trim() });

      // Actualizar estado local
      setDatosUsuario(prev => prev ? { ...prev, nombre: nuevoNombre.trim() } : null);
      setEditandoNombre(false);
    } catch (error) {
      console.error('Error al guardar nombre:', error);
      setError('Error al guardar. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  const cerrarSesion = async () => {
    try {
      await signOut(auth);
      history.replace('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const formatearFecha = (fechaISO: string): string => {
    if (!fechaISO) return 'No disponible';
    const fecha = new Date(fechaISO);
    return fecha.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <IonPage>
      <IonContent className="perfil-container">
        <div className="perfil-content">
          <div className="perfil-header">
            <IonIcon 
              icon={arrowBack} 
              className="perfil-back" 
              onClick={() => history.goBack()}
            />
            <h1 className="perfil-title">Mi Perfil</h1>
          </div>

          <div className="perfil-avatar-section">
            <IonIcon icon={personCircleOutline} className="perfil-avatar" />
            <h2 className="perfil-nombre-grande">{datosUsuario?.nombre}</h2>
            <p className="perfil-subtitulo">Conductor de Piii-Move!</p>
          </div>

          <div className="perfil-datos">
            <div className="perfil-campo">
              <div className="perfil-campo-icono">
                <IonIcon icon={personCircleOutline} />
              </div>
              <div className="perfil-campo-info">
                <span className="perfil-campo-label">Nombre</span>
                {editandoNombre ? (
                  <div className="perfil-campo-edicion">
                    <IonInput
                      value={nuevoNombre}
                      onIonInput={(e) => setNuevoNombre(e.detail.value!)}
                      className="perfil-input"
                      placeholder="Tu nombre"
                    />
                    <IonIcon 
                      icon={checkmarkOutline} 
                      className="perfil-btn-guardar"
                      onClick={guardarNombre}
                    />
                    <IonIcon 
                      icon={closeOutline} 
                      className="perfil-btn-cancelar"
                      onClick={cancelarEdicion}
                    />
                  </div>
                ) : (
                  <div className="perfil-campo-valor-container">
                    <span className="perfil-campo-valor">{datosUsuario?.nombre}</span>
                    <IonIcon 
                      icon={createOutline} 
                      className="perfil-btn-editar"
                      onClick={iniciarEdicion}
                    />
                  </div>
                )}
              </div>
            </div>

            {error && <IonText color="danger" className="perfil-error">{error}</IonText>}

            <div className="perfil-campo">
              <div className="perfil-campo-icono">
                <IonIcon icon={mailOutline} />
              </div>
              <div className="perfil-campo-info">
                <span className="perfil-campo-label">Correo electrónico</span>
                <span className="perfil-campo-valor">{datosUsuario?.email}</span>
              </div>
            </div>

            <div className="perfil-campo">
              <div className="perfil-campo-icono">
                <IonIcon icon={calendarOutline} />
              </div>
              <div className="perfil-campo-info">
                <span className="perfil-campo-label">Miembro desde</span>
                <span className="perfil-campo-valor">
                  {formatearFecha(datosUsuario?.fechaCreacion || '')}
                </span>
              </div>
            </div>
          </div>

          <IonButton 
            expand="block" 
            fill="outline"
            className="perfil-btn-logout"
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

export default MiPerfil;