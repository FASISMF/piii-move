import { 
  IonContent, 
  IonPage, 
  IonIcon,
  IonButton,
  IonText,
  IonSpinner,
  useIonViewWillEnter  // ← AÑADIR ESTE IMPORT
} from '@ionic/react';
import { arrowBack, personCircleOutline, alertCircleOutline, chatbubbleOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { useState, useRef, useCallback } from 'react';  // ← QUITAR useEffect de aquí
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

const ResultadoQR: React.FC = () => {
  const history = useHistory();
  const { usuarioId } = useParams<RouteParams>();
  
  const [usuarioEscaneado, setUsuarioEscaneado] = useState<UsuarioEscaneado | null>(null);
  const [cargandoUsuario, setCargandoUsuario] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [navegando, setNavegando] = useState(false);
  
  const conversacionIdRef = useRef<string | null>(null);
  const operacionEnCurso = useRef(false);

  const usuarioActual = auth.currentUser;

  // Log para debug (puedes quitar después)
  console.log('=== RENDER ResultadoQR ===');
  console.log('usuarioId (URL):', usuarioId);
  console.log('navegando state:', navegando);
  console.log('cargandoUsuario state:', cargandoUsuario);

  // Función para cargar usuario
  const cargarUsuario = useCallback(async () => {
    if (!usuarioId) {
      history.replace('/escaner-qr');
      return;
    }

    console.log('=== CARGANDO USUARIO ===');

    // Resetear TODOS los estados
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

  // USAR useIonViewWillEnter en lugar de useEffect
  // Este hook se ejecuta CADA VEZ que la vista se muestra
  useIonViewWillEnter(() => {
    console.log('=== ION VIEW WILL ENTER ===');
    cargarUsuario();
  });

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

    operacionEnCurso.current = true;
    setEnviando(true);
    setError(null);

    try {
      const conversacionId = await obtenerOCrearConversacion();

      if (!conversacionId) {
        throw new Error('No se pudo crear la conversación');
      }

      const mensajeTexto = '¡Hola! Te he enviado un aviso desde Piii-Move!';
      
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
    console.log('=== INICIAR CHAT ===');
    console.log('operacionEnCurso:', operacionEnCurso.current);
    console.log('navegando:', navegando);

    if (!usuarioActual || !usuarioEscaneado || operacionEnCurso.current || navegando) {
      console.log('BLOQUEADO');
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

      console.log('Navegando a chat:', conversacionId);
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
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ marginTop: '15px', color: '#666' }}>
              {navegando ? 'Abriendo chat...' : 'Cargando...'}
            </p>
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
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
            <div style={{ textAlign: 'center', marginBottom: '15px', padding: '10px' }}>
              <IonText color="danger">{error}</IonText>
            </div>
          )}

          {!mensajeEnviado ? (
            <div className="resultado-acciones">
              <IonButton 
                expand="block" 
                size="large"
                onClick={enviarAviso}
                disabled={enviando}
                className="resultado-btn-avisar"
              >
                {enviando ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '10px', width: '20px', height: '20px' }} />
                    Enviando...
                  </>
                ) : (
                  <>
                    <IonIcon icon={alertCircleOutline} slot="start" />
                    Avisar
                  </>
                )}
              </IonButton>

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
      </IonContent>
    </IonPage>
  );
};

export default ResultadoQR;