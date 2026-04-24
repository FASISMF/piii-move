import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonText,
  IonSpinner,
  IonActionSheet,
  useIonViewWillEnter
} from '@ionic/react';
import { 
  arrowBack, 
  personCircleOutline, 
  chatbubbleOutline, 
  checkmarkCircleOutline,
  musicalNotesOutline,
  volumeHighOutline
} from 'ionicons/icons';
import { useState, useRef, useCallback } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import './ResultadoQR.css';

interface UsuarioEscaneado {
  uid: string;
  nombre: string;
  email?: string;
}

interface RouteParams {
  usuarioId: string;
}

interface SonidoClaxon {
  id: string;
  nombre: string;
  archivo: string;
}

const SONIDOS_CLAXON: SonidoClaxon[] = [
  { id: 'claxon1', nombre: 'Claxon Clásico', archivo: '/assets/sounds/claxon1.mp3' },
  { id: 'claxon2', nombre: 'Bocina Larga', archivo: '/assets/sounds/claxon2.mp3' },
  { id: 'claxon3', nombre: 'Bocina Musical', archivo: '/assets/sounds/claxon3.mp3' },
  { id: 'claxon4', nombre: 'Bocina Camión', archivo: '/assets/sounds/claxon4.mp3' },
  { id: 'claxon4', nombre: 'Bocina Barco', archivo: '/assets/sounds/claxon5.mp3' },
];

const ResultadoQR: React.FC = () => {
  const history = useHistory();
  const { usuarioId } = useParams<RouteParams>();
  
  const [usuarioEscaneado, setUsuarioEscaneado] = useState<UsuarioEscaneado | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navegando, setNavegando] = useState(false);
  const [pulsando, setPulsando] = useState(false);
  const [mostrarSonidos, setMostrarSonidos] = useState(false);
  const [sonidoSeleccionado, setSonidoSeleccionado] = useState<SonidoClaxon>(SONIDOS_CLAXON[0]);
  
  const conversacionIdRef = useRef<string | null>(null);
  const operacionEnCurso = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const usuarioActual = auth.currentUser;

  // Función para cargar usuario
  const cargarUsuario = useCallback(async () => {
    if (!usuarioId) {
      history.replace('/escaner-qr');
      return;
    }

    setCargandoUsuario(true);
    setMensajeEnviado(false);
    setError(null);
    setNavegando(false);
    setEnviando(false);
    setUsuarioEscaneado(null);
    conversacionIdRef.current = null;
    operacionEnCurso.current = false;

    try {
      const usuarioRef = doc(db, 'usuarios', usuarioId);
      const usuarioSnap = await getDoc(usuarioRef);

      if (usuarioSnap.exists()) {
        const data = usuarioSnap.data();
        setUsuarioEscaneado({
          uid: usuarioId,
          nombre: data.nombre || 'Usuario',
          email: data.email || ''
        });
      } else {
        setError('Usuario no encontrado');
        setTimeout(() => history.replace('/escaner-qr'), 2000);
      }
    } catch (err) {
      console.error('Error cargando usuario:', err);
      setError('Error al cargar datos del usuario');
    } finally {
      setCargandoUsuario(false);
    }
  }, [usuarioId, history]);

  useIonViewWillEnter(() => {
    cargarUsuario();
  });

  // Reproducir sonido de claxon
  const reproducirSonido = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(sonidoSeleccionado.archivo);
    audioRef.current.play().catch(err => console.log('Error reproduciendo sonido:', err));
  };

  // Buscar conversación existente
  const buscarConversacionExistente = async (): Promise<string | null> => {
    if (!usuarioActual || !usuarioEscaneado) return null;

    try {
      const conversacionesRef = collection(db, 'conversaciones');
      const q = query(
        conversacionesRef,
        where('participantes', 'array-contains', usuarioActual.uid)
      );

      const snapshot = await getDocs(q);
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        if (data.participantes.includes(usuarioEscaneado.uid)) {
          return docSnap.id;
        }
      }

      return null;
    } catch (err) {
      console.error('Error buscando conversación:', err);
      return null;
    }
  };

  // Crear nueva conversación
  const crearConversacion = async (): Promise<string | null> => {
    if (!usuarioActual || !usuarioEscaneado) return null;

    try {
      const nuevaConversacion = await addDoc(collection(db, 'conversaciones'), {
        participantes: [usuarioActual.uid, usuarioEscaneado.uid],
        creadoEn: new Date().toISOString(),
        ultimoMensaje: '',
        ultimoMensajeFecha: new Date().toISOString()
      });

      return nuevaConversacion.id;
    } catch (err) {
      console.error('Error creando conversación:', err);
      return null;
    }
  };

  // Obtener o crear conversación
  const obtenerOCrearConversacion = async (): Promise<string | null> => {
    let conversacionId = conversacionIdRef.current;
    
    if (!conversacionId) {
      conversacionId = await buscarConversacionExistente();
    }
    
    if (!conversacionId) {
      conversacionId = await crearConversacion();
    }

    if (conversacionId) {
      conversacionIdRef.current = conversacionId;
    }

    return conversacionId;
  };

  const enviarAviso = async () => {
    if (!usuarioActual || !usuarioEscaneado || operacionEnCurso.current) return;

    // Efecto visual y sonido
    setPulsando(true);
    reproducirSonido();
    setTimeout(() => setPulsando(false), 300);

    operacionEnCurso.current = true;
    setEnviando(true);
    setError(null);

    try {
      const conversacionId = await obtenerOCrearConversacion();

      if (!conversacionId) {
        throw new Error('No se pudo crear la conversación');
      }

      const mensajeTexto = '🚗 ¡PIIII! ¡Te he enviado un aviso desde Piii-Move!';
      
      await addDoc(collection(db, 'mensajes'), {
        conversacionId: conversacionId,
        emisorId: usuarioActual.uid,
        receptorId: usuarioEscaneado.uid,
        texto: mensajeTexto,
        tipo: 'aviso',
        fechaEnvio: new Date().toISOString(),
        leido: false
      });

      const conversacionRef = doc(db, 'conversaciones', conversacionId);
      await updateDoc(conversacionRef, {
        ultimoMensaje: mensajeTexto,
        ultimoMensajeFecha: new Date().toISOString()
      });

      setMensajeEnviado(true);
    } catch (err) {
      console.error('Error al enviar aviso:', err);
      setError('Error al enviar el aviso. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
      operacionEnCurso.current = false;
    }
  };

  const iniciarChat = async () => {
    if (!usuarioActual || !usuarioEscaneado || operacionEnCurso.current || navegando) {
      return;
    }

    operacionEnCurso.current = true;
    setNavegando(true);
    setError(null);

    try {
      const conversacionId = await obtenerOCrearConversacion();

      if (!conversacionId) {
        throw new Error('No se pudo obtener la conversación');
      }

      history.push(`/chat/${conversacionId}/${usuarioEscaneado.uid}`);
      
    } catch (err) {
      console.error('Error al iniciar chat:', err);
      setError('Error al iniciar el chat. Inténtalo de nuevo.');
      setNavegando(false);
      operacionEnCurso.current = false;
    }
  };

  // Pantalla de carga
  if (cargandoUsuario || navegando) {
    return (
      <IonPage>
        <IonContent className="resultado-container">
          <div className="resultado-loading">
            <IonSpinner name="crescent" color="primary" />
            <p>{navegando ? 'Abriendo chat...' : 'Cargando...'}</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Error o usuario no encontrado
  if (!usuarioEscaneado) {
    return (
      <IonPage>
        <IonContent className="resultado-container">
          <div className="resultado-loading">
            <IonText color="danger">{error || 'Usuario no encontrado'}</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent className="resultado-container">
        <div className="resultado-content">
          <div className="resultado-header">
            <IonIcon 
              icon={arrowBack} 
              className="resultado-back" 
              onClick={() => history.push('/escaner-qr')}
            />
            <h1 className="resultado-title">Usuario Detectado</h1>
          </div>

          <div className="resultado-usuario">
            <IonIcon icon={personCircleOutline} className="resultado-avatar" />
            <h2 className="resultado-nombre">{usuarioEscaneado.nombre}</h2>
            <IonText color="medium">Conductor de Piii-Move!</IonText>
          </div>

          {error && (
            <div className="resultado-error">
              <IonText color="danger">{error}</IonText>
            </div>
          )}

          {!mensajeEnviado ? (
            <div className="resultado-acciones">
              {/* Selector de sonido */}
              <div className="sonido-selector" onClick={() => setMostrarSonidos(true)}>
                <IonIcon icon={musicalNotesOutline} />
                <span>{sonidoSeleccionado.nombre}</span>
                <small>Toca para cambiar</small>
              </div>

              {/* Botón Claxon Circular */}
              <div className="claxon-container">
                <button 
                  className={`claxon-button ${pulsando ? 'pulsando' : ''} ${enviando ? 'enviando' : ''}`}
                  onClick={enviarAviso}
                  disabled={enviando}
                >
                  <div className="claxon-inner">
                    {enviando ? (
                      <IonSpinner name="crescent" className="claxon-spinner" />
                    ) : (
                      <>
                        <IonIcon icon={volumeHighOutline} className="claxon-icon" />
                        <span className="claxon-text">PIII!</span>
                      </>
                    )}
                  </div>
                </button>
                <p className="claxon-hint">Pulsa para avisar</p>
              </div>

              <IonButton 
                expand="block" 
                fill="outline"
                onClick={iniciarChat}
                disabled={enviando}
                className="resultado-btn-chat"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                Iniciar Conversación
              </IonButton>
            </div>
          ) : (
            <div className="resultado-exito">
              <IonIcon icon={checkmarkCircleOutline} className="resultado-exito-icon" />
              <h3>¡Aviso enviado!</h3>
              <p>El conductor ha recibido tu notificación</p>
              
              <IonButton 
                expand="block" 
                onClick={iniciarChat}
                className="resultado-btn-chat-exito"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                Continuar al Chat
              </IonButton>

              <IonButton 
                expand="block" 
                fill="outline"
                onClick={() => history.push('/dashboard')}
                className="resultado-btn-volver"
              >
                Volver al Inicio
              </IonButton>
            </div>
          )}
        </div>

        {/* Action Sheet para seleccionar sonido */}
        <IonActionSheet
          isOpen={mostrarSonidos}
          onDidDismiss={() => setMostrarSonidos(false)}
          header="Selecciona un sonido"
          buttons={[
            ...SONIDOS_CLAXON.map(sonido => ({
              text: sonido.nombre,
              icon: sonido.id === sonidoSeleccionado.id ? checkmarkCircleOutline : musicalNotesOutline,
              handler: () => {
                setSonidoSeleccionado(sonido);
                // Previsualizar sonido
                const audio = new Audio(sonido.archivo);
                audio.play().catch(err => console.log('Error:', err));
              }
            })),
            {
              text: 'Cancelar',
              role: 'cancel'
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default ResultadoQR;